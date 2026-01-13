const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    DisconnectReason,
    jidDecode,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    getContentType,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const config = require('./config');
const events = require('./momy');
const { sms } = require('./lib/msg');
const { 
    connectdb,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    incrementStats,
    getStatsForNumber
} = require('./lib/database');
const { handleAntidelete } = require('./lib/antidelete');

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const pino = require('pino');
const crypto = require('crypto');
const FileType = require('file-type');
const axios = require('axios');
const bodyparser = require('body-parser');
const moment = require('moment-timezone');

const prefix = config.PREFIX;
const mode = config.MODE;
const router = express.Router();

// ==============================================================================
// 1. INITIALIZATION & DATABASE
// ==============================================================================

connectdb();

// Memory storage
const activeSockets = new Map();
const socketCreationTime = new Map();

// Store for anti-delete and messages
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Group events status storage
const groupEventsStatus = new Map();

// Utility functions
const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin == null) continue;
        admins.push(i.id);
    }
    return admins;
}

// Check existing connection
function isNumberAlreadyConnected(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    return activeSockets.has(sanitizedNumber);
}

function getConnectionStatus(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const isConnected = activeSockets.has(sanitizedNumber);
    const connectionTime = socketCreationTime.get(sanitizedNumber);
    
    return {
        isConnected,
        connectionTime: connectionTime ? new Date(connectionTime).toLocaleString() : null,
        uptime: connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 0
    };
}

// Load silatech
const silatechDir = path.join(__dirname, 'silatech');
if (!fs.existsSync(silatechDir)) {
    fs.mkdirSync(silatechDir, { recursive: true });
}

const files = fs.readdirSync(silatechDir).filter(file => file.endsWith('.js'));
console.log(`📦 Loading ${files.length} silatech...`);
for (const file of files) {
    try {
        require(path.join(silatechDir, file));
    } catch (e) {
        console.error(`❌ Failed to load silatech ${file}:`, e);
    }
}

// ==============================================================================
// 2. GROUP EVENTS HANDLER
// ==============================================================================

const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:MOMY-KIDY BOT\nORG:MOMY-KIDY BOT;\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '255789661031'}:+${config.OWNER_NUMBER || '255789661031'}\nEND:VCARD`
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    status: 1
};

// Group event handler - AUTOMATIC VERSION
const groupEvents = {
  handleGroupUpdate: async (socket, update) => {
    try {
      console.log('Group update detected:', JSON.stringify(update));
      
      if (!update || !update.id) return;
      
      const groupId = update.id;
      const action = update.action;
      const participants = Array.isArray(update.participants) ? update.participants : [update.participants];
      
      // Check if group events are enabled for this bot
      const botNumber = socket.user.id.split(':')[0];
      const userConfig = await getUserConfigFromMongoDB(botNumber);
      if (userConfig?.GROUP_EVENTS !== 'true') return;
      
      for (const participant of participants) {
        if (!participant) continue;
        
        const userJid = typeof participant === 'string' ? participant : participant.id || participant;
        const userName = userJid.split('@')[0];
        
        let message = '';
        let mentions = [userJid];
        
        if (action === 'add') {
          message = `╭━━【 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 】━━━━━━━━╮\n│ 👋 @${userName}\n│ 🎉 Welcome to the group!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
        } else if (action === 'remove') {
          message = `╭━━【 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 】━━━━━━━━╮\n│ 👋 @${userName}\n│ 👋 Farewell!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
        } else if (action === 'promote') {
          const author = update.author || '';
          if (author) mentions.push(author);
          message = `╭━━【 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n│ ⬆️ @${userName}\n│ 👑 Promoted!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
        } else if (action === 'demote') {
          const author = update.author || '';
          if (author) mentions.push(author);
          message = `╭━━【 𝐃𝐄𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n│ ⬇️ @${userName}\n│ 👑 Demoted!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
        }
        
        if (message) {
          await socket.sendMessage(groupId, { 
            text: message, 
            mentions: mentions.filter(m => m) 
          }, { quoted: fakevCard });
          console.log(`✅ Sent ${action} message for ${userName}`);
        }
      }
    } catch (err) {
      console.error('Group event error:', err.message);
    }
  }
};

// Setup group events listener
function setupGroupEventsListener(socket) {
  socket.ev.on('group-participants.update', async (update) => {
    console.log('Group participants update detected:', update);
    await groupEvents.handleGroupUpdate(socket, update);
  });
}

// ==============================================================================
// 3. SPECIFIC HANDLERS
// ==============================================================================

async function setupMessageHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        // Load user config from MongoDB
        const userConfig = await getUserConfigFromMongoDB(number);
        
        // Auto-typing based on config
        if (userConfig.AUTO_TYPING === 'true') {
            try {
                await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
            } catch (error) {
                console.error(`Failed to set typing presence:`, error);
            }
        }
        
        // Auto-recording based on config
        if (userConfig.AUTO_RECORDING === 'true') {
            try {
                await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
            } catch (error) {
                console.error(`Failed to set recording presence:`, error);
            }
        }
    });
}

async function setupCallHandlers(socket, number) {
    socket.ev.on('call', async (calls) => {
        try {
            // Load user config from MongoDB
            const userConfig = await getUserConfigFromMongoDB(number);
            if (userConfig.ANTI_CALL !== 'true') return;

            for (const call of calls) {
                if (call.status !== 'offer') continue;
                const id = call.id;
                const from = call.from;

                await socket.rejectCall(id, from);
                await socket.sendMessage(from, {
                    text: userConfig.REJECT_MSG || '🔒 CALL NOT ALLOWED 🔒'
                });
                console.log(`📞 CALL REJECTED ${number} from ${from}`);
            }
        } catch (err) {
            console.error(`Anti-call error for ${number}:`, err);
        }
    });
}

function setupAutoRestart(socket, number) {
    let restartAttempts = 0;
    const maxRestartAttempts = 3;
    
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        console.log(`Connection update for ${number}:`, { connection, lastDisconnect });
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message;
            
            console.log(`Connection closed for ${number}:`, {
                statusCode,
                errorMessage,
                isManualUnlink: statusCode === 401
            });
            
            // Manual unlink detection
            if (statusCode === 401 || errorMessage?.includes('401')) {
                console.log(`🔐 Manual unlink detected for ${number}, cleaning up...`);
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                
                // IMPORTANT: Delete session, active number and socket
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                await deleteSessionFromMongoDB(sanitizedNumber);
                await removeNumberFromMongoDB(sanitizedNumber);
                
                // Stop listening to events on this socket
                socket.ev.removeAllListeners();
                return;
            }
            
            // Skip restart for normal/expected errors
            const isNormalError = statusCode === 408 || 
                                errorMessage?.includes('QR refs attempts ended');
            
            if (isNormalError) {
                console.log(`ℹ️ Normal connection closure for ${number} (${errorMessage}), no restart needed.`);
                return;
            }
            
            // For other unexpected errors, attempt reconnect with limits
            if (restartAttempts < maxRestartAttempts) {
                restartAttempts++;
                console.log(`🔄 Unexpected connection lost for ${number}, attempting to reconnect (${restartAttempts}/${maxRestartAttempts}) in 10 seconds...`);
                
                // Remove from activeSockets before attempting reconnect
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                // Remove listeners from old socket to prevent memory leaks
                socket.ev.removeAllListeners();

                // Wait and reconnect
                await delay(10000);
                
                try {
                    const mockRes = { 
                        headersSent: false, 
                        send: () => {}, 
                        status: () => mockRes,
                        setHeader: () => {},
                        json: () => {}
                    };
                    // Try to restart the bot, which will load MongoDB session
                    await startBot(number, mockRes);
                    console.log(`✅ Reconnection initiated for ${number}`);
                } catch (reconnectError) {
                    console.error(`❌ Reconnection failed for ${number}:`, reconnectError);
                }
            } else {
                console.log(`❌ Max restart attempts reached for ${number}. Manual intervention required.`);
            }
        }
        
        // Reset counter on successful connection
        if (connection === 'open') {
            console.log(`✅ Connection established for ${number}`);
            restartAttempts = 0;
        }
    });
}

// ==============================================================================
// 4. ANTILINK HANDLER
// ==============================================================================

async function handleAntilink(conn, mek, from, sender, isAdmins, isBotAdmins, groupMetadata) {
    try {
        // Get bot number
        const botNumber = conn.user.id.split(':')[0];
        
        // Check from MongoDB config
        const userConfig = await getUserConfigFromMongoDB(botNumber);
        if (userConfig?.ANTI_LINK !== 'true') return false;

        const message = mek.message;
        const isGroup = from.endsWith('@g.us');
        
        if (!isGroup) return false;
        if (!isBotAdmins) return false; // Bot must be admin to delete messages
        if (isAdmins) return false; // Don't delete messages from admins
        
        // Check for links in message
        const linkPatterns = [
            /chat\.whatsapp\.com/i,
            /whatsapp\.com/i,
            /invite\.whatsapp\.com/i,
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
        ];
        
        let hasLink = false;
        let linkType = '';
        
        // Check text messages
        if (message.conversation) {
            for (const pattern of linkPatterns) {
                if (pattern.test(message.conversation)) {
                    hasLink = true;
                    if (pattern.toString().includes('chat.whatsapp.com')) {
                        linkType = 'whatsapp group';
                    } else if (pattern.toString().includes('whatsapp.com')) {
                        linkType = 'whatsapp';
                    } else {
                        linkType = 'external';
                    }
                    break;
                }
            }
        }
        
        // Check extended text messages
        if (message.extendedTextMessage && message.extendedTextMessage.text) {
            for (const pattern of linkPatterns) {
                if (pattern.test(message.extendedTextMessage.text)) {
                    hasLink = true;
                    if (pattern.toString().includes('chat.whatsapp.com')) {
                        linkType = 'whatsapp group';
                    } else if (pattern.toString().includes('whatsapp.com')) {
                        linkType = 'whatsapp';
                    } else {
                        linkType = 'external';
                    }
                    break;
                }
            }
        }
        
        // Check message caption
        if (message.imageMessage && message.imageMessage.caption) {
            for (const pattern of linkPatterns) {
                if (pattern.test(message.imageMessage.caption)) {
                    hasLink = true;
                    linkType = 'external';
                    break;
                }
            }
        }
        
        if (message.videoMessage && message.videoMessage.caption) {
            for (const pattern of linkPatterns) {
                if (pattern.test(message.videoMessage.caption)) {
                    hasLink = true;
                    linkType = 'external';
                    break;
                }
            }
        }
        
        if (!hasLink) return false;
        
        // Delete the message
        await conn.sendMessage(from, {
            delete: mek.key
        });
        
        // Short warning message
        const warningMessage = `⚠️ @${sender.split('@')[0]}, links not allowed!`;
        
        await conn.sendMessage(from, {
            text: warningMessage,
            mentions: [sender]
        }, { quoted: mek });
        
        console.log(`🔗 Anti-link activated - Deleted link from ${sender}`);
        
        return true;
    } catch (error) {
        console.error('Anti-link error:', error);
        return false;
    }
}

// ==============================================================================
// 5. CHANNEL FOLLOW HANDLER (IMPROVED)
// ==============================================================================

async function loadNewsletterJIDsFromRaw() {
    try {
        console.log('📰 Loading newsletter list from GitHub...');
        const res = await axios.get('https://raw.githubusercontent.com/mbwa-md/jid/refs/heads/main/newsletter_list.json', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ Loaded ${res.data.length} newsletter JIDs from GitHub`);
            return res.data;
        } else {
            console.error('❌ Invalid response format from GitHub');
            return [];
        }
    } catch (err) {
        console.error('❌ Failed to load newsletter list from GitHub:', err.message);
        return [];
    }
}

function setupNewsletterHandlers(socket) {
    let newsletterJIDs = [];
    
    async function updateNewsletterList() {
        try {
            newsletterJIDs = await loadNewsletterJIDsFromRaw();
        } catch (error) {
            console.error('Failed to update newsletter list:', error);
        }
    }
    
    // Initial load
    updateNewsletterList();
    
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message?.key) return;
        
        const jid = message.key.remoteJid;
        
        // Check if it's a newsletter
        if (newsletterJIDs.includes(jid)) {
            try {
                const messageId = message.newsletterServerId;
                if (!messageId) return;
                
                // React with random emoji
                const emojis = config.NEWSLETTER_REACTION_EMOJIS || ['⚔️', '🔥', '⚡', '💀', '🩸', '🛡️', '🎯', '💣', '🏹', '🔪', '🗡️', '🏆', '💎', '🌟', '💥', '🌪️', '☠️', '👑', '⚙️', '🔰', '💢', '💫', '🌀', '❤️', '💗', '🤍', '🖤', '👀', '😎', '✅', '😁', '🌙', '☄️', '🌠', '🌌', '💚'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                await socket.newsletterReactMessage(jid, messageId.toString(), randomEmoji);
                console.log(`✅ Reacted to newsletter ${jid} with ${randomEmoji}`);
                
            } catch (error) {
                console.error('❌ Newsletter reaction failed:', error.message);
            }
        }
    });
}

// ==============================================================================
// 6. BUTTON FUNCTION UTILITY
// ==============================================================================

function createButtons(buttons, title = "Select an option", footer = config.BOT_FOOTER) {
    return {
        text: title,
        footer: footer,
        buttons: buttons,
        headerType: 1
    };
}

function createListMessage(sections, title = "Menu", text = "Select an option", buttonText = "Choose") {
    return {
        text: text,
        footer: config.BOT_FOOTER,
        title: title,
        buttonText: buttonText,
        sections: sections
    };
}

// ==============================================================================
// 7. MAIN STARTBOT FUNCTION
// ==============================================================================

async function startBot(number, res = null) {
    let connectionLockKey;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    try {
        const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
        
        // Check if already connected
        if (isNumberAlreadyConnected(sanitizedNumber)) {
            console.log(`⏩ ${sanitizedNumber} is already connected, skipping...`);
            const status = getConnectionStatus(sanitizedNumber);
            
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'already_connected', 
                    message: 'Number is already connected and active',
                    connectionTime: status.connectionTime,
                    uptime: `${status.uptime} seconds`
                });
            }
            return;
        }
        
        // Lock to prevent simultaneous connections
        connectionLockKey = `connecting_${sanitizedNumber}`;
        if (global[connectionLockKey]) {
            console.log(`⏩ ${sanitizedNumber} is already in connection process, skipping...`);
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'connection_in_progress', 
                    message: 'Number is currently being connected'
                });
            }
            return;
        }
        global[connectionLockKey] = true;
        
        // 1. Check MongoDB session
        const existingSession = await getSessionFromMongoDB(sanitizedNumber);
        
        if (!existingSession) {
            console.log(`🧹 No MongoDB session found for ${sanitizedNumber} - requiring NEW pairing`);
            
            // Clean local files
            if (fs.existsSync(sessionDir)) {
                await fs.remove(sessionDir);
                console.log(`🗑️ Cleaned leftover local session for ${sanitizedNumber}`);
            }
        } else {
            // Restore from MongoDB
            fs.ensureDirSync(sessionDir);
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(existingSession, null, 2));
            console.log(`🔄 Restored existing session from MongoDB for ${sanitizedNumber}`);
        }
        
        // 2. Initialize socket
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            // Use pairing code if we are in a new session
            usePairingCode: !existingSession, 
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            syncFullHistory: false,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Hello' };
            }
        });
        
        // 3. Register connection
        socketCreationTime.set(sanitizedNumber, Date.now());
        activeSockets.set(sanitizedNumber, conn);
        store.bind(conn.ev);
        
        // 4. Setup handlers
        setupMessageHandlers(conn, number);
        setupCallHandlers(conn, number);
        setupGroupEventsListener(conn); // Group events
        setupAutoRestart(conn, number); // Configure autoreconnect
        
        // 5. UTILS ATTACHED TO CONN
        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };
        
        conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };
        
        // 6. PAIRING CODE GENERATION
        if (!existingSession) {
            // Only generate code if no MongoDB session exists
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await conn.requestPairingCode(sanitizedNumber);
                    console.log(`🔑 Pairing Code: ${code}`);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            code: code, 
                            status: 'new_pairing',
                            message: 'New pairing required'
                        });
                    }
                } catch (err) {
                    console.error('❌ Pairing Error:', err.message);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            error: 'Failed to generate pairing code',
                            details: err.message 
                        });
                    }
                }
            }, 3000);
        } else if (res && !res.headersSent) {
            // If session existed, send reconnection attempt status
            res.json({
                status: 'reconnecting',
                message: 'Attempting to reconnect with existing session data'
            });
        }
        
        // 7. Save session to MongoDB
        conn.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = fs.readFileSync(path.join(sessionDir, 'creds.json'), 'utf8');
            const creds = JSON.parse(fileContent);
            
            await saveSessionToMongoDB(sanitizedNumber, creds);
            console.log(`💾 Session updated in MongoDB for ${sanitizedNumber}`);
        });
        
        // 8. CONNECTION MANAGEMENT
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ Connected: ${sanitizedNumber}`);
                const userJid = jidNormalizedUser(conn.user.id);
                
                // Add to active numbers
                await addNumberToMongoDB(sanitizedNumber);
                
                // Welcome message (send only if connection is NEW)
                if (!existingSession) {
                    await conn.sendMessage(userJid, {
                        image: { url: config.IMAGE_PATH },
                        caption: `*╭━━━〔 🔐 𝙈𝙊𝙈𝙔-𝙆𝙄𝘿𝙔 🔐 〕━━━┈⊷*\n*┃🔐│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳!*\n*┃🔐│ 𝙽𝚄𝙼𝙱𝙴𝚁: ${sanitizedNumber}*\n*┃🔐│ 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳: ${new Date().toLocaleString()}*\n*┃🔐│ 𝚃𝚈𝙿𝙴 *${config.PREFIX}𝙼𝙴𝙽𝚄* 𝚃𝙾 𝙶𝙴𝚃 𝚂𝚃𝙰𝚁𝚃𝙴𝙳!*\n*┃🔐│ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 2.0.0 𝙽𝙴𝚆 𝙱𝙾𝚃*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n> © 𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝚃𝙴𝙲𝙷`
                    });
                }
                
                // Auto join group
                const groupResult = await joinGroup(conn);
                
                // Setup auto bio
                await setupAutoBio(conn);
                
                // Setup newsletter handlers
                if (config.NEWSLETTER_AUTO_FOLLOW === 'true') {
                    setupNewsletterHandlers(conn);
                }
                
                console.log(`🎉 ${sanitizedNumber} successfully connected!`);
            }
            
            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`❌ Session closed: Logged Out.`);
                    // Data deletion management is now in setupAutoRestart
                }
            }
        });
        
        // 9. ANTI-CALL with MongoDB config
        conn.ev.on('call', async (calls) => {
            try {
                const userConfig = await getUserConfigFromMongoDB(number);
                if (userConfig.ANTI_CALL !== 'true') return;
                
                for (const call of calls) {
                    if (call.status !== 'offer') continue;
                    const id = call.id;
                    const from = call.from;
                    await conn.rejectCall(id, from);
                    await conn.sendMessage(from, { 
                        text: userConfig.REJECT_MSG || config.REJECT_MSG 
                    });
                }
            } catch (err) { 
                console.error("Anti-call error:", err); 
            }
        });
        
        // 10. ANTIDELETE
        conn.ev.on('messages.update', async (updates) => {
            await handleAntidelete(conn, updates, store);
        });
        
        // ===============================================================
        // 📥 MESSAGE HANDLER (UPSERT) WITH MONGODB CONFIG
        // ===============================================================
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek.message) return;
                
                // Load user config
                const userConfig = await getUserConfigFromMongoDB(number);
                
                // Normalize Message
                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;
                
                if (mek.message.viewOnceMessageV2) {
                    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                        ? mek.message.ephemeralMessage.message 
                        : mek.message;
                }
                
                // Auto Read based on config
                if (userConfig.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]);
                }
                
                // Newsletter Reaction
                const newsletterJids = ["120363402325089913@newsletter"];
                const newsEmojis = ['⚔️', '🔥', '⚡', '💀', '🩸', '🛡️', '🎯', '💣', '🏹', '🔪', '🗡️', '🏆', '💎', '🌟', '💥', '🌪️', '☠️', '👑', '⚙️', '🔰', '💢', '💫', '🌀', '❤️', '💗', '🤍', '🖤', '👀', '😎', '✅', '😁', '🌙', '☄️', '🌠', '🌌', '💚'];
                if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                    try {
                        const serverId = mek.newsletterServerId;
                        if (serverId) {
                            const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                            await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                        }
                    } catch (e) {}
                }
                
                // Status Handling with MongoDB config
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    // Auto View
                    if (userConfig.AUTO_VIEW_STATUS === "true") await conn.readMessages([mek.key]);
                    
                    // Auto Like
                    if (userConfig.AUTO_LIKE_STATUS === "true") {
                        const jawadlike = await conn.decodeJid(conn.user.id);
                        const emojis = userConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI;
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await conn.sendMessage(mek.key.remoteJid, {
                            react: { text: randomEmoji, key: mek.key } 
                        }, { statusJidList: [mek.key.participant, jawadlike] });
                    }
                    
                    // Auto Reply
                    if (userConfig.AUTO_STATUS_REPLY === "true") {
                        const user = mek.key.participant;
                        const text = userConfig.AUTO_STATUS_MSG || config.AUTO_STATUS_MSG;
                        await conn.sendMessage(user, { 
                            text: text, 
                            react: { text: '🔐', key: mek.key } 
                        }, { quoted: mek });
                    }
                    return; 
                }
                
                // Message Serialization
                const m = sms(conn, mek);
                const type = getContentType(mek.message);
                const from = mek.key.remoteJid;
                const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
                
                // Auto-reply handler
                const lowerBody = body.toLowerCase().trim();
                if (config.AUTO_REPLY_ENABLE === 'true' && config.AUTO_REPLIES[lowerBody] && !body.startsWith(config.PREFIX)) {
                    await conn.sendMessage(from, { 
                        text: config.AUTO_REPLIES[lowerBody] 
                    }, { quoted: mek });
                    return;
                }
                
                const isCmd = body.startsWith(config.PREFIX);
                const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const q = args.join(' ');
                const text = q;
                const isGroup = from.endsWith('@g.us');
                
                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                const pushname = mek.pushName || 'User';
                
                const isMe = botNumber.includes(senderNumber);
                const isOwner = config.OWNER_NUMBER.includes(senderNumber) || isMe;
                const isCreator = isOwner;
                
                // Group Metadata
                let groupMetadata = null;
                let groupName = null;
                let participants = null;
                let groupAdmins = null;
                let isBotAdmins = null;
                let isAdmins = null;
                
                if (isGroup) {
                    try {
                        groupMetadata = await conn.groupMetadata(from);
                        groupName = groupMetadata.subject;
                        participants = await groupMetadata.participants;
                        groupAdmins = await getGroupAdmins(participants);
                        isBotAdmins = groupAdmins.includes(botNumber2);
                        isAdmins = groupAdmins.includes(sender);
                    } catch(e) {}
                }
                
                // Auto Presence based on MongoDB config
                if (userConfig.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (userConfig.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);
                
                const myquoted = fakevCard;
                
                const reply = (text) => conn.sendMessage(from, { text: text }, { quoted: myquoted });
                const l = reply;
                
                // ANTI-LINK HANDLER - Run before command processing
                if (isGroup) {
                    const antilinkResult = await handleAntilink(conn, mek, from, sender, isAdmins, isBotAdmins, groupMetadata);
                    if (antilinkResult) return; // Stop processing if link was deleted
                }
                
                // "Send" Command
                const cmdNoPrefix = body.toLowerCase().trim();
                if (["send", "sendme", "sand"].includes(cmdNoPrefix)) {
                    if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await conn.sendMessage(from, { text: "*🔒 REPLY TO STATUS PLEASE 😊*" }, { quoted: mek });
                    } else {
                        try {
                            let qMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                            let mtype = Object.keys(qMsg)[0];
                            const stream = await downloadContentFromMessage(qMsg[mtype], mtype.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                            
                            let content = {};
                            if (mtype === 'imageMessage') content = { image: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'videoMessage') content = { video: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'audioMessage') content = { audio: buffer, mimetype: 'audio/mp4', ptt: false };
                            else content = { text: qMsg[mtype].text || qMsg.conversation };
                            
                            if (content) await conn.sendMessage(from, content, { quoted: mek });
                        } catch (e) { console.error(e); }
                    }
                }
                
                // Execute silatech 
                const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
                if (isCmd) {
                    // Statistics
                    await incrementStats(sanitizedNumber, 'commandsUsed');
                    
                    const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
                    if (cmd) {
                        if (config.WORK_TYPE === 'private' && !isOwner) return;
                        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
                        
                        try {
                            cmd.function(conn, mek, m, {
                                from, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, 
                                senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, 
                                groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, 
                                reply, config, myquoted, createButtons, createListMessage,
                                getUserConfigFromMongoDB, updateUserConfigInMongoDB
                            });
                        } catch (e) {
                            console.error("[silatech ERROR] " + e);
                        }
                    }
                }
                
                // Message statistics
                await incrementStats(sanitizedNumber, 'messagesReceived');
                if (isGroup) {
                    await incrementStats(sanitizedNumber, 'groupsInteracted');
                }
                
                // Execute Events
                events.commands.map(async (command) => {
                    const ctx = { 
                        from, l, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, 
                        senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, 
                        groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, 
                        reply, config, myquoted, createButtons, createListMessage,
                        getUserConfigFromMongoDB, updateUserConfigInMongoDB
                    };
                    
                    if (body && command.on === "body") command.function(conn, mek, m, ctx);
                    else if (mek.q && command.on === "text") command.function(conn, mek, m, ctx);
                    else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") command.function(conn, mek, m, ctx);
                    else if (command.on === "sticker" && mek.type === "stickerMessage") command.function(conn, mek, m, ctx);
                });
                
            } catch (e) {
                console.error(e);
            }
        });
        
    } catch (err) {
        console.error(err);
        if (res && !res.headersSent) {
            return res.json({ 
                error: 'Internal Server Error', 
                details: err.message 
            });
        }
    } finally {
        // Release lock
        if (connectionLockKey) {
            global[connectionLockKey] = false;
        }
    }
}

// ==============================================================================
// 8. ADDITIONAL FUNCTIONS
// ==============================================================================

async function joinGroup(socket) {
    let retries = config.MAX_RETRIES || 3;
    let inviteCode = 'JlI0FDZ5RpAEbeKvzAPpFt';
    if (config.GROUP_INVITE_LINK) {
        const cleanInviteLink = config.GROUP_INVITE_LINK.split('?')[0];
        const inviteCodeMatch = cleanInviteLink.match(/chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]+)/);
        if (!inviteCodeMatch) {
            console.error('Invalid group invite link format:', config.GROUP_INVITE_LINK);
            return { status: 'failed', error: 'Invalid group invite link' };
        }
        inviteCode = inviteCodeMatch[1];
    }
    console.log(`Attempting to join group with invite code: ${inviteCode}`);

    while (retries > 0) {
        try {
            const response = await socket.groupAcceptInvite(inviteCode);
            console.log('Group join response:', JSON.stringify(response, null, 2));
            if (response?.gid) {
                console.log(`[ ✅ ] Successfully joined group with ID: ${response.gid}`);
                return { status: 'success', gid: response.gid };
            }
            throw new Error('No group ID in response');
        } catch (error) {
            retries--;
            let errorMessage = error.message || 'Unknown error';
            if (error.message.includes('not-authorized')) {
                errorMessage = 'Bot is not authorized to join (possibly banned)';
            } else if (error.message.includes('conflict')) {
                errorMessage = 'Bot is already a member of the group';
            } else if (error.message.includes('gone') || error.message.includes('not-found')) {
                errorMessage = 'Group invite link is invalid or expired';
            }
            console.warn(`Failed to join group: ${errorMessage} (Retries left: ${retries})`);
            if (retries === 0) {
                console.error('[ ❌ ] Failed to join group', { error: errorMessage });
                try {
                    const ownerNumber = config.OWNER_NUMBER;
                    await socket.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                        text: `Failed to join group with invite code ${inviteCode}: ${errorMessage}`,
                    });
                } catch (sendError) {
                    console.error(`Failed to send failure message to owner: ${sendError.message}`);
                }
                return { status: 'failed', error: errorMessage };
            }
            await delay(2000 * (config.MAX_RETRIES - retries + 1));
        }
    }
    return { status: 'failed', error: 'Max retries reached' };
}

// Setup Auto Bio
async function setupAutoBio(socket) {
    try {
        const botNumber = socket.user.id.split(':')[0];
        const userConfig = await getUserConfigFromMongoDB(botNumber);
        
        if (userConfig?.AUTO_BIO !== 'false') {
            const bios = config.BIO_LIST || [
                "🔐 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃 - 𝚈𝚘𝚞𝚛 𝚞𝚕𝚝𝚒𝚖𝚊𝚝𝚎 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝",
                "🚀 𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝙸𝙻𝙰 𝚃𝚎𝚌𝚑𝚗𝚘𝚕𝚘𝚐𝚒𝚎𝚜",
                "💫 𝙰𝚕𝚠𝚊𝚢𝚜 𝚊𝚝 𝚢𝚘𝚞𝚛 𝚜𝚎𝚛𝚟𝚒𝚌𝚎!",
                "🎯 𝙵𝚊𝚜𝚝, 𝚂𝚎𝚌𝚞𝚛𝚎 & 𝚁𝚎𝚕𝚒𝚊𝚋𝚕𝚎",
                "🤖 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 - 𝚈𝚘𝚞𝚛 𝚍𝚒𝚐𝚒𝚝𝚊𝚕 𝚊𝚜𝚜𝚒𝚜𝚝𝚊𝚗𝚝"
            ];
            
            const randomBio = bios[Math.floor(Math.random() * bios.length)];
            await socket.updateProfileStatus(randomBio);
            console.log('✅ Auto bio updated:', randomBio);
        }
    } catch (error) {
        console.error('❌ Failed to update auto bio:', error);
    }
}

// ==============================================================================
// 9. API ROUTES
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    await startBot(number, res);
});

// Route to check status
router.get('/status', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        // Return all active connections
        const activeConnections = Array.from(activeSockets.keys()).map(num => {
            const status = getConnectionStatus(num);
            return {
                number: num,
                status: 'connected',
                connectionTime: status.connectionTime,
                uptime: `${status.uptime} seconds`
            };
        });
        
        return res.json({
            totalActive: activeSockets.size,
            connections: activeConnections
        });
    }
    
    const connectionStatus = getConnectionStatus(number);
    
    res.json({
        number: number,
        isConnected: connectionStatus.isConnected,
        connectionTime: connectionStatus.connectionTime,
        uptime: `${connectionStatus.uptime} seconds`,
        message: connectionStatus.isConnected 
            ? 'Number is actively connected' 
            : 'Number is not connected'
    });
});

// Route to disconnect
router.get('/disconnect', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).json({ error: 'Number parameter is required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!activeSockets.has(sanitizedNumber)) {
        return res.status(404).json({ 
            error: 'Number not found in active connections' 
        });
    }

    try {
        const socket = activeSockets.get(sanitizedNumber);
        
        // Close connection
        await socket.ws.close();
        socket.ev.removeAllListeners();
        
        // Remove from tracking and database
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
        await removeNumberFromMongoDB(sanitizedNumber);
        await deleteSessionFromMongoDB(sanitizedNumber); // Ensure MongoDB session is also deleted
        
        console.log(`✅ Manually disconnected ${sanitizedNumber}`);
        
        res.json({ 
            status: 'success', 
            message: 'Number disconnected successfully' 
        });
        
    } catch (error) {
        console.error(`Error disconnecting ${sanitizedNumber}:`, error);
        res.status(500).json({ 
            error: 'Failed to disconnect number' 
        });
    }
});

// Route to view active numbers
router.get('/active', (req, res) => {
    res.json({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

// Ping route
router.get('/ping', (req, res) => {
    res.json({
        status: 'active',
        message: 'MOMY-KIDY is running',
        activeSessions: activeSockets.size,
        database: 'MongoDB Integrated'
    });
});

// Route to reconnect all
router.get('/connect-all', async (req, res) => {
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (numbers.length === 0) {
            return res.status(404).json({ error: 'No numbers found to connect' });
        }

        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) {
                results.push({ number, status: 'already_connected' });
                continue;
            }

            const mockRes = { 
                headersSent: false, 
                json: () => {}, 
                status: () => mockRes 
            };
            await startBot(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
            await delay(1000);
        }

        res.json({
            status: 'success',
            total: numbers.length,
            connections: results
        });
    } catch (error) {
        console.error('Connect all error:', error);
        res.status(500).json({ error: 'Failed to connect all bots' });
    }
});

// Route to reconfigure
router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).json({ error: 'Number and config are required' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid config format' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).json({ error: 'No active session found for this number' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to MongoDB
    await saveOTPToMongoDB(sanitizedNumber, otp, newConfig);

    try {
        // Send OTP
        const userJid = jidNormalizedUser(socket.user.id);
        await socket.sendMessage(userJid, {
            text: `*🔐 CONFIGURATION UPDATE*\n\nYour OTP: *${otp}*\nValid for 5 minutes\n\nUse: /verify-otp ${otp}`
        });
        
        res.json({ 
            status: 'otp_sent', 
            message: 'OTP sent to your number' 
        });
    } catch (error) {
        console.error('Failed to send OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Route to verify OTP
router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).json({ error: 'Number and OTP are required' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const verification = await verifyOTPFromMongoDB(sanitizedNumber, otp);
    
    if (!verification.valid) {
        return res.status(400).json({ error: verification.error });
    }

    try {
        await updateUserConfigInMongoDB(sanitizedNumber, verification.config);
        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await socket.sendMessage(jidNormalizedUser(socket.user.id), {
                text: `*✅ CONFIG UPDATED*\n\nYour configuration has been successfully updated!\n\nChanges saved in MongoDB.`
            });
        }
        res.json({ 
            status: 'success', 
            message: 'Config updated successfully in MongoDB' 
        });
    } catch (error) {
        console.error('Failed to update config in MongoDB:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});

// Route for statistics
router.get('/stats', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).json({ error: 'Number is required' });
    }
    
    try {
        const stats = await getStatsForNumber(number);
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const connectionStatus = getConnectionStatus(sanitizedNumber);
        
        res.json({
            number: sanitizedNumber,
            connectionStatus: connectionStatus.isConnected ? 'Connected' : 'Disconnected',
            uptime: connectionStatus.uptime,
            stats: stats
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// ==============================================================================
// 10. AUTOMATIC RECONNECTION AT STARTUP
// ==============================================================================

async function autoReconnectFromMongoDB() {
    try {
        console.log('🔁 Attempting auto-reconnect from MongoDB...');
        const numbers = await getAllNumbersFromMongoDB();
        
        if (numbers.length === 0) {
            console.log('ℹ️ No numbers found in MongoDB for auto-reconnect');
            return;
        }
        
        console.log(`📊 Found ${numbers.length} numbers in MongoDB`);
        
        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                console.log(`🔁 Reconnecting: ${number}`);
                const mockRes = { 
                    headersSent: false, 
                    json: () => {}, 
                    status: () => mockRes 
                };
                await startBot(number, mockRes);
                await delay(2000); // Wait between each reconnection
            } else {
                console.log(`✅ Already connected: ${number}`);
            }
        }
        
        console.log('✅ Auto-reconnect completed');
    } catch (error) {
        console.error('❌ autoReconnectFromMongoDB error:', error.message);
    }
}

// Start automatic reconnection after 3 seconds
setTimeout(() => {
    autoReconnectFromMongoDB();
}, 3000);

// ==============================================================================
// 11. CLEANUP ON EXIT
// ==============================================================================

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    
    // Clean local sessions
    const sessionDir = path.join(__dirname, 'session');
    if (fs.existsSync(sessionDir)) {
        fs.emptyDirSync(sessionDir);
    }
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Restart with PM2 if configured
    if (process.env.PM2_NAME) {
        const { exec } = require('child_process');
        exec(`pm2 restart ${process.env.PM2_NAME}`);
    }
});

module.exports = router;
