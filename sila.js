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
const { handleAntilink } = require('./lib/antilink'); // Antilink handler

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

// Stockage en mémoire
const activeSockets = new Map();
const socketCreationTime = new Map();

// Store pour anti-delete et messages
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});

// Fonctions utilitaires
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

// Auto follow newsletter function
async function autoFollowNewsletters(conn) {
    try {
        const newsletterURL = 'https://raw.githubusercontent.com/mbwa-md/jid/refs/heads/main/newsletter_list.json';
        const response = await axios.get(newsletterURL);
        const newsletters = response.data;
        
        console.log(`📰 𝙵𝚘𝚞𝚗𝚍 ${newsletters.length} 𝚗𝚎𝚠𝚜𝚕𝚎𝚝𝚝𝚎𝚛𝚜 𝚝𝚘 𝚏𝚘𝚕𝚕𝚘𝚠`);
        
        for (const newsletter of newsletters) {
            try {
                await conn.readMessages([{
                    remoteJid: newsletter.jid,
                    id: createSerial(16)
                }]);
                console.log(`✅ 𝙰𝚞𝚝𝚘-𝚏𝚘𝚕𝚕𝚘𝚠𝚎𝚍: ${newsletter.name || newsletter.jid}`);
                await delay(500); // Delay to avoid rate limiting
            } catch (error) {
                console.log(`⚠️ 𝙲𝚘𝚞𝚕𝚍 𝚗𝚘𝚝 𝚏𝚘𝚕𝚕𝚘𝚠 ${newsletter.jid}: ${error.message}`);
            }
        }
        
        // Also follow the specific jid you provided
        const specificJid = "120363402325089913@newsletter";
        try {
            await conn.readMessages([{
                remoteJid: specificJid,
                id: createSerial(16)
            }]);
            console.log(`✅ 𝙰𝚞𝚝𝚘-𝚏𝚘𝚕𝚕𝚘𝚠𝚎𝚍 𝚜𝚙𝚎𝚌𝚒𝚏𝚒𝚌 𝚓𝚒𝚍: ${specificJid}`);
        } catch (error) {
            console.log(`⚠️ 𝙲𝚘𝚞𝚕𝚍 𝚗𝚘𝚝 𝚏𝚘𝚕𝚕𝚘𝚠 𝚜𝚙𝚎𝚌𝚒𝚏𝚒𝚌 𝚓𝚒𝚍: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ 𝙴𝚛𝚛𝚘𝚛 𝚏𝚎𝚝𝚌𝚑𝚒𝚗𝚐 𝚗𝚎𝚠𝚜𝚕𝚎𝚝𝚝𝚎𝚛 𝚕𝚒𝚜𝚝:', error.message);
    }
}

// Telegram notification function
async function sendTelegramNotification(message) {
    try {
        if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID) {
            await axios.post(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: config.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            });
        }
    } catch (error) {
        console.error('𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝚗𝚘𝚝𝚒𝚏𝚒𝚌𝚊𝚝𝚒𝚘𝚗 𝚎𝚛𝚛𝚘𝚛:', error.message);
    }
}

// Vérification connexion existante
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
console.log(`📦 𝙻𝚘𝚊𝚍𝚒𝚗𝚐 ${files.length} 𝚜𝚒𝚕𝚊𝚝𝚎𝚌𝚑...`);
for (const file of files) {
    try {
        require(path.join(silatechDir, file));
    } catch (e) {
        console.error(`❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚕𝚘𝚊𝚍 𝚜𝚒𝚕𝚊𝚝𝚎𝚌𝚑 ${file}:`, e);
    }
}

// ==============================================================================
// 2. HANDLERS SPÉCIFIQUES
// ==============================================================================

async function setupMessageHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        // Charger config utilisateur depuis MongoDB
        const userConfig = await getUserConfigFromMongoDB(number);
        
        // Auto-typing basé sur config
        if (userConfig.AUTO_TYPING === 'true') {
            try {
                await socket.sendPresenceUpdate('composing', msg.key.remoteJid);
            } catch (error) {
                console.error(`𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚝 𝚝𝚢𝚙𝚒𝚗𝚐 𝚙𝚛𝚎𝚜𝚎𝚗𝚌𝚎:`, error);
            }
        }
        
        // Auto-recording basé sur config
        if (userConfig.AUTO_RECORDING === 'true') {
            try {
                await socket.sendPresenceUpdate('recording', msg.key.remoteJid);
            } catch (error) {
                console.error(`𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚝 𝚛𝚎𝚌𝚘𝚛𝚍𝚒𝚗𝚐 𝚙𝚛𝚎𝚜𝚎𝚗𝚌𝚎:`, error);
            }
        }
    });
}

async function setupCallHandlers(socket, number) {
    socket.ev.on('call', async (calls) => {
        try {
            // Charger config utilisateur depuis MongoDB
            const userConfig = await getUserConfigFromMongoDB(number);
            if (userConfig.ANTI_CALL !== 'true') return;

            for (const call of calls) {
                if (call.status !== 'offer') continue;
                const id = call.id;
                const from = call.from;

                await socket.rejectCall(id, from);
                await socket.sendMessage(from, {
                    text: userConfig.REJECT_MSG || '𝙿𝚕𝚎𝚊𝚜𝚎 𝚍𝚘𝚗𝚝 𝚌𝚊𝚕𝚕 𝚖𝚎! 😊'
                });
                console.log(`📞 𝙲𝚊𝚕𝚕 𝚛𝚎𝚓𝚎𝚌𝚝𝚎𝚍 𝚏𝚘𝚛 ${number} 𝚏𝚛𝚘𝚖 ${from}`);
            }
        } catch (err) {
            console.error(`𝙰𝚗𝚝𝚒-𝚌𝚊𝚕𝚕 𝚎𝚛𝚛𝚘𝚛 𝚏𝚘𝚛 ${number}:`, err);
        }
    });
}

function setupAutoRestart(socket, number) {
    let restartAttempts = 0;
    const maxRestartAttempts = 3;
    
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        console.log(`𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚞𝚙𝚍𝚊𝚝𝚎 𝚏𝚘𝚛 ${number}:`, { connection, lastDisconnect });
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message;
            
            console.log(`𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚌𝚕𝚘𝚜𝚎𝚍 𝚏𝚘𝚛 ${number}:`, {
                statusCode,
                errorMessage,
                isManualUnlink: statusCode === 401
            });
            
            // Manual unlink detection
            if (statusCode === 401 || errorMessage?.includes('401')) {
                console.log(`🔐 𝙼𝚊𝚗𝚞𝚊𝚕 𝚞𝚗𝚕𝚒𝚗𝚔 𝚍𝚎𝚝𝚎𝚌𝚝𝚎𝚍 𝚏𝚘𝚛 ${number}, 𝚌𝚕𝚎𝚊𝚗𝚒𝚗𝚐 𝚞𝚙...`);
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                
                // IMPORTANT: Supprimer la session, le numéro actif et le socket
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                await deleteSessionFromMongoDB(sanitizedNumber);
                await removeNumberFromMongoDB(sanitizedNumber);
                
                // Send Telegram notification
                await sendTelegramNotification(
                    `🔐 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃\n\n` +
                    `𝙽𝚞𝚖𝚋𝚎𝚛: ${number}\n` +
                    `𝚂𝚝𝚊𝚝𝚞𝚜: 𝙼𝚊𝚗𝚞𝚊𝚕𝚕𝚢 𝚞𝚗𝚕𝚒𝚗𝚔𝚎𝚍\n` +
                    `𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}`
                );
                
                // Arrêter l'écoute des événements sur ce socket
                socket.ev.removeAllListeners();
                return;
            }
            
            // Skip restart for normal/expected errors
            const isNormalError = statusCode === 408 || 
                                errorMessage?.includes('QR refs attempts ended');
            
            if (isNormalError) {
                console.log(`ℹ️ 𝙽𝚘𝚛𝚖𝚊𝚕 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚌𝚕𝚘𝚜𝚞𝚛𝚎 𝚏𝚘𝚛 ${number} (${errorMessage}), 𝚗𝚘 𝚛𝚎𝚜𝚝𝚊𝚛𝚝 𝚗𝚎𝚎𝚍𝚎𝚍.`);
                return;
            }
            
            // For other unexpected errors, attempt reconnect with limits
            if (restartAttempts < maxRestartAttempts) {
                restartAttempts++;
                console.log(`🔄 𝚄𝚗𝚎𝚡𝚙𝚎𝚌𝚝𝚎𝚍 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚕𝚘𝚜𝚝 𝚏𝚘𝚛 ${number}, 𝚊𝚝𝚝𝚎𝚖𝚙𝚝𝚒𝚗𝚐 𝚝𝚘 𝚛𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝 (${restartAttempts}/${maxRestartAttempts}) 𝚒𝚗 10 𝚜𝚎𝚌𝚘𝚗𝚍𝚜...`);
                
                // Supprimer de activeSockets avant de tenter le reconnect
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                // Supprimer les listeners de l'ancien socket pour éviter les fuites de mémoire
                socket.ev.removeAllListeners();

                // Wait and reconnect
                await delay(10000);
                
                try {
                    const mockRes = { 
                        headersSent: false, 
                        send: () => {}, 
                        status: () => mockRes,
                        setHeader: () => {},
                        json: () => {} // Ajouter json pour que startBot fonctionne
                    };
                    // Tenter de redémarrer le bot, qui va charger la session MongoDB
                    await startBot(number, mockRes);
                    console.log(`✅ 𝚁𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚒𝚗𝚒𝚝𝚒𝚊𝚝𝚎𝚍 𝚏𝚘𝚛 ${number}`);
                } catch (reconnectError) {
                    console.error(`❌ 𝚁𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚏𝚊𝚒𝚕𝚎𝚍 𝚏𝚘𝚛 ${number}:`, reconnectError);
                }
            } else {
                console.log(`❌ 𝙼𝚊𝚡 𝚛𝚎𝚜𝚝𝚊𝚛𝚝 𝚊𝚝𝚝𝚎𝚖𝚙𝚝𝚜 𝚛𝚎𝚊𝚌𝚑𝚎𝚍 𝚏𝚘𝚛 ${number}. 𝙼𝚊𝚗𝚞𝚊𝚕 𝚒𝚗𝚝𝚎𝚛𝚟𝚎𝚗𝚝𝚒𝚘𝚗 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍.`);
            }
        }
        
        // Reset counter on successful connection
        if (connection === 'open') {
            console.log(`✅ 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚎𝚜𝚝𝚊𝚋𝚕𝚒𝚜𝚑𝚎𝚍 𝚏𝚘𝚛 ${number}`);
            restartAttempts = 0;
        }
    });
}

// ==============================================================================
// 3. FONCTION PRINCIPALE STARTBOT
// ==============================================================================

async function startBot(number, res = null) {
    let connectionLockKey;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    try {
        const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);
        
        // Vérifier si déjà connecté
        if (isNumberAlreadyConnected(sanitizedNumber)) {
            console.log(`⏩ ${sanitizedNumber} 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍, 𝚜𝚔𝚒𝚙𝚙𝚒𝚗𝚐...`);
            const status = getConnectionStatus(sanitizedNumber);
            
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'already_connected', 
                    message: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍 𝚊𝚗𝚍 𝚊𝚌𝚝𝚒𝚟𝚎',
                    connectionTime: status.connectionTime,
                    uptime: `${status.uptime} 𝚜𝚎𝚌𝚘𝚗𝚍𝚜`
                });
            }
            return;
        }
        
        // Verrou pour éviter connexions simultanées
        connectionLockKey = `connecting_${sanitizedNumber}`;
        if (global[connectionLockKey]) {
            console.log(`⏩ ${sanitizedNumber} 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚒𝚗 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚙𝚛𝚘𝚌𝚎𝚜𝚜, 𝚜𝚔𝚒𝚙𝚙𝚒𝚗𝚐...`);
            if (res && !res.headersSent) {
                return res.json({ 
                    status: 'connection_in_progress', 
                    message: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚒𝚜 𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚋𝚎𝚒𝚗𝚐 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍'
                });
            }
            return;
        }
        global[connectionLockKey] = true;
        
        // 1. Vérifier session MongoDB
        const existingSession = await getSessionFromMongoDB(sanitizedNumber);
        
        if (!existingSession) {
            console.log(`🧹 𝙽𝚘 𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝚜𝚎𝚜𝚜𝚒𝚘𝚗 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 ${sanitizedNumber} - 𝚛𝚎𝚚𝚞𝚒𝚛𝚒𝚗𝚐 𝙽𝙴𝚆 𝚙𝚊𝚒𝚛𝚒𝚗𝚐`);
            
            // Nettoyer fichiers locaux
            if (fs.existsSync(sessionDir)) {
                await fs.remove(sessionDir);
                console.log(`🗑️ 𝙲𝚕𝚎𝚊𝚗𝚎𝚍 𝚕𝚎𝚏𝚝𝚘𝚟𝚎𝚛 𝚕𝚘𝚌𝚊𝚕 𝚜𝚎𝚜𝚜𝚒𝚘𝚗 𝚏𝚘𝚛 ${sanitizedNumber}`);
            }
        } else {
            // Restaurer depuis MongoDB
            fs.ensureDirSync(sessionDir);
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(existingSession, null, 2));
            console.log(`🔄 𝚁𝚎𝚜𝚝𝚘𝚛𝚎𝚍 𝚎𝚡𝚒𝚜𝚝𝚒𝚗𝚐 𝚜𝚎𝚜𝚜𝚒𝚘𝚗 𝚏𝚛𝚘𝚖 𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝚏𝚘𝚛 ${sanitizedNumber}`);
        }
        
        // 2. Initialiser socket
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }))
            },
            printQRInTerminal: false,
            // Utiliser le code d'appairage si on est dans une nouvelle session
            usePairingCode: !existingSession, 
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            syncFullHistory: false,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: '𝙷𝚎𝚕𝚕𝚘' };
            }
        });
        
        // 3. Enregistrer connexion
        socketCreationTime.set(sanitizedNumber, Date.now());
        activeSockets.set(sanitizedNumber, conn);
        store.bind(conn.ev);
        
        // 4. Setup handlers
        setupMessageHandlers(conn, number);
        setupCallHandlers(conn, number);
        setupAutoRestart(conn, number); // Configure l'autoreconnect
        
        // 5. UTILS ATTACHED TO CONN (non modifié)
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
        
        // 6. PAIRING CODE GENERATION - CORRECTION APPLIQUÉE
        if (!existingSession) {
            // Ne générer le code que si aucune session MongoDB n'existe
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await conn.requestPairingCode(sanitizedNumber);
                    console.log(`🔑 𝙿𝚊𝚒𝚛𝚒𝚗𝚐 𝙲𝚘𝚍𝚎: ${code}`);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            code: code, 
                            status: 'new_pairing',
                            message: '𝙽𝚎𝚠 𝚙𝚊𝚒𝚛𝚒𝚗𝚐 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍'
                        });
                    }
                } catch (err) {
                    console.error('❌ 𝙿𝚊𝚒𝚛𝚒𝚗𝚐 𝙴𝚛𝚛𝚘𝚛:', err.message);
                    if (res && !res.headersSent) {
                        return res.json({ 
                            error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝚙𝚊𝚒𝚛𝚒𝚗𝚐 𝚌𝚘𝚍𝚎',
                            details: err.message 
                        });
                    }
                }
            }, 3000);
        } else if (res && !res.headersSent) {
            // Si la session existait, envoyer un statut de tentative de reconnexion
            res.json({
                status: 'reconnecting',
                message: '𝙰𝚝𝚝𝚎𝚖𝚙𝚝𝚒𝚗𝚐 𝚝𝚘 𝚛𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚠𝚒𝚝𝚑 𝚎𝚡𝚒𝚜𝚝𝚒𝚗𝚐 𝚜𝚎𝚜𝚜𝚒𝚘𝚗 𝚍𝚊𝚝𝚊'
            });
        }
        
        // 7. Sauvegarde session dans MongoDB
        conn.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = fs.readFileSync(path.join(sessionDir, 'creds.json'), 'utf8');
            const creds = JSON.parse(fileContent);
            
            await saveSessionToMongoDB(sanitizedNumber, creds);
            console.log(`💾 𝚂𝚎𝚜𝚜𝚒𝚘𝚗 𝚞𝚙𝚍𝚊𝚝𝚎𝚍 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝚏𝚘𝚛 ${sanitizedNumber}`);
        });
        
        // 8. GESTION CONNEXION
        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                console.log(`✅ 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍: ${sanitizedNumber}`);
                const userJid = jidNormalizedUser(conn.user.id);
                
                // Ajouter aux numéros actifs
                await addNumberToMongoDB(sanitizedNumber);
                
                // Send Telegram notification
                await sendTelegramNotification(
                    `✅ 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳\n\n` +
                    `𝙽𝚞𝚖𝚋𝚎𝚛: ${number}\n` +
                    `𝚂𝚝𝚊𝚝𝚞𝚜: 𝙰𝚌𝚝𝚒𝚟𝚎\n` +
                    `𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}\n` +
                    `𝙱𝚘𝚝: 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙰𝚕𝚠𝚊𝚢𝚜 𝚊𝚝 𝚢𝚘𝚞𝚛 𝚜𝚎𝚛𝚟𝚒𝚌𝚎!`
                );
                
                // Auto follow newsletters
                await autoFollowNewsletters(conn);
                
                // Message de bienvenue
                const connectText = `
┏━❑ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐌𝐎𝐌𝐘-𝐊𝐈𝐃𝐘 ━━━━━━━━━━━
┃ 🔹 𝚈𝚘𝚞𝚛 𝚋𝚘𝚝 𝚒𝚜 𝚗𝚘𝚠 𝚊𝚌𝚝𝚒𝚟𝚎 & 𝚛𝚎𝚊𝚍𝚢!
┃ 🔹 𝙴𝚗𝚓𝚘𝚢 𝚜𝚖𝚊𝚛𝚝, 𝚜𝚎𝚊𝚖𝚕𝚎𝚜𝚜 𝚌𝚑𝚊𝚝𝚜
┃ 🔹 𝙲𝚞𝚛𝚛𝚎𝚗𝚝 𝚙𝚛𝚎𝚏𝚒𝚡: ${config.PREFIX}
┗━━━━━━━━━━━━━━━━━
┏━❑ 𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝙿𝚁𝙾𝙹𝙴𝙲𝚃 ━━━━━━━━━
┃ ⭐ 𝚂𝚝𝚊𝚛 | 🔄 𝙵𝚘𝚛𝚔 | 📢 𝚂𝚑𝚊𝚛𝚎
┃ 🔗 𝙲𝚑𝚊𝚗𝚗𝚎𝚕: ${config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02'}
┗━━━━━━━━━━━━━━━━━━━━━━━━

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                
                // Envoyer le message de bienvenue uniquement si la connexion est VRAIMENT nouvelle
                // Si la connexion vient d'un autoreconnect, on suppose que l'utilisateur est déjà notifié.
                if (!existingSession) {
                    await conn.sendMessage(userJid, {
                        image: { url: config.IMAGE_PATH || 'https://files.catbox.moe/natk49.jpg' },
                        caption: connectText
                    });
                }
                
                console.log(`🎉 ${sanitizedNumber} 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍!`);
            }
            
            if (connection === 'close') {
                let reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`❌ 𝚂𝚎𝚜𝚜𝚒𝚘𝚗 𝚌𝚕𝚘𝚜𝚎𝚍: 𝙻𝚘𝚐𝚐𝚎𝚍 𝙾𝚞𝚝.`);
                    // La gestion de la suppression des données est maintenant dans setupAutoRestart
                }
            }
        });
        
        // 9. ANTI-CALL, 10. ANTIDELETE et 📥 MESSAGE HANDLER (UPSERT)
        // ... (Logique non modifiée, conservée pour la complétude) ...

        // 9. ANTI-CALL avec config MongoDB
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
                        text: userConfig.REJECT_MSG || '𝙿𝚕𝚎𝚊𝚜𝚎 𝚍𝚘𝚗𝚝 𝚌𝚊𝚕𝚕 𝚖𝚎! 😊'
                    });
                }
            } catch (err) { 
                console.error("𝙰𝚗𝚝𝚒-𝚌𝚊𝚕𝚕 𝚎𝚛𝚛𝚘𝚛:", err); 
            }
        });
        
        // 10. ANTIDELETE
        conn.ev.on('messages.update', async (updates) => {
            await handleAntidelete(conn, updates, store);
        });
        
        // ===============================================================
        // 📥 MESSAGE HANDLER (UPSERT) AVEC CONFIG MONGODB
        // ===============================================================
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek.message) return;
                
                // Charger config utilisateur
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
                
                // Auto Read basé sur config
                if (userConfig.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]);
                }
                
                // Auto-reply handler (new feature)
                if (mek.message?.conversation || mek.message?.extendedTextMessage?.text) {
                    const messageText = (mek.message.conversation || mek.message.extendedTextMessage?.text || '').toLowerCase();
                    
                    // Auto-reply messages
                    const autoReplies = {
                        "hi": "𝙷𝚒! 👋 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?",
                        "hello": "𝙷𝚎𝚕𝚕𝚘! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚏𝚘𝚛 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜",
                        "hey": "𝙷𝚎𝚢 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚏𝚘𝚛 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜",
                        "mambo": "𝙿𝚘𝚊 𝚜𝚊𝚗𝚊! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?",
                        "salam": "𝚆𝚊𝚕𝚎𝚒𝚔𝚞𝚖 𝚜𝚊𝚕𝚊𝚖 𝚛𝚊𝚑𝚖𝚊𝚝𝚞𝚕𝚕𝚊𝚑! 💫",
                        "vip": "𝙷𝚎𝚕𝚕𝚘 𝚅𝙸𝙿! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?",
                        "mkuu": "𝙷𝚎𝚢 𝚖𝚔𝚞𝚞! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?",
                        "boss": "𝚈𝚎𝚜 𝚋𝚘𝚜𝚜! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞?",
                        "habari": "𝙽𝚣𝚞𝚛𝚒 𝚜𝚊𝚗𝚊! 👋 𝙷𝚊𝚋𝚊𝚛𝚒 𝚢𝚊𝚔𝚘?",
                        "bot": "𝚈𝚎𝚜, 𝙸 𝚊𝚖 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈! 🤖 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?",
                        "menu": "𝚃𝚢𝚙𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜! 📜",
                        "owner": "𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛 𝚞𝚜𝚒𝚗𝚐 .𝚘𝚠𝚗𝚎𝚛 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 👑",
                        "thanks": "𝚈𝚘𝚞'𝚛𝚎 𝚠𝚎𝚕𝚌𝚘𝚖𝚎! 😊",
                        "thank you": "𝙰𝚗𝚢𝚝𝚒𝚖𝚎! 𝙻𝚎𝚝 𝚖𝚎 𝚔𝚗𝚘𝚠 𝚒𝚏 𝚢𝚘𝚞 𝚗𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 🤖",
                        "asante": "𝚂𝚊𝚗𝚊 𝚔𝚊𝚛𝚒𝚋𝚞! 😊",
                        "poa": "𝚂𝚊𝚠𝚊 𝚜𝚊𝚗𝚊! 👋",
                        "mghani": "𝙷𝚎𝚢 𝚖𝚐𝚑𝚊𝚗𝚒! 💫 𝙷𝚊𝚋𝚊𝚛𝚒 𝚐𝚊𝚗𝚒?",
                        "shikamo": "𝚂𝚑𝚒𝚔𝚊𝚖𝚘 𝚋𝚊𝚗𝚊! 🤝",
                        "safi": "𝚂𝚊𝚏𝚒 𝚜𝚊𝚗𝚊! 👍",
                        "chao": "𝙲𝚑𝚊𝚘! 👋 𝚂𝚊𝚕𝚊𝚖𝚊 𝚜𝚊𝚊𝚗𝚊!",
                        "bye": "𝙺𝚠𝚊𝚑𝚎𝚛𝚒! 💫",
                        "goodnight": "𝙻𝚊𝚕𝚊 𝚜𝚊𝚕𝚊𝚖𝚊! 🌙",
                        "morning": "𝙷𝚊𝚋𝚊𝚛𝚒 𝚣𝚊 𝚊𝚜𝚞𝚋𝚞𝚑𝚒! 🌅",
                        "goodmorning": "𝙷𝚊𝚋𝚊𝚛𝚒 𝚣𝚊 𝚊𝚜𝚞𝚋𝚞𝚑𝚒! 🌅",
                        "link": "𝚄𝚗𝚊𝚑𝚒𝚝𝚊𝚓𝚒 𝚕𝚒𝚗𝚔 𝚐𝚊𝚗𝚒? 🔗",
                        "haram": "𝚂𝚊𝚠𝚊 𝚜𝚊𝚗𝚊! 😊",
                        "dhur": "𝚂𝚊𝚠𝚊 𝚜𝚊𝚗𝚊 𝚋𝚊𝚗𝚊! ☺️",
                        "lanat": "𝚂𝚊𝚕𝚊𝚖𝚊 𝚋𝚊𝚗𝚊! ✨",
                        "saf": "𝚂𝚊𝚠𝚊 𝚜𝚊𝚗𝚊! 😊",
                        "i love you": "𝚃𝚑𝚊𝚗𝚔 𝚢𝚘𝚞! 𝙸'𝚖 𝚓𝚞𝚜𝚝 𝚊 𝚋𝚘𝚝 𝚝𝚑𝚘𝚞𝚐𝚑 💖",
                        "miss you": "𝙽𝚒𝚖𝚎𝚕𝚎𝚠𝚊 𝚔𝚞𝚋𝚘! 😊",
                        "we": "𝚆𝚎𝚠𝚎 𝚗𝚍𝚒𝚘! 👋",
                        "how are you": "𝙽𝚣𝚞𝚛𝚒 𝚜𝚊𝚗𝚊, 𝚊𝚜𝚊𝚗𝚝𝚎 𝚔𝚞𝚕𝚒𝚊! 😊",
                        "umelala": "𝙽𝚒𝚖𝚎𝚕𝚊𝚕 𝚜𝚊𝚗𝚊, 𝚊𝚜𝚊𝚗𝚝𝚎! 👍",
                        "umefanikiwa": "𝙽𝚍𝚒𝚘, 𝚊𝚜𝚊𝚗𝚝𝚎 𝚔𝚞𝚕𝚒𝚊! 💫",
                        "mvua": "𝙷𝚊𝚋𝚊𝚛𝚒 𝚣𝚊 𝚖𝚟𝚞𝚊? 🌧️",
                        "momy": "𝚈𝚎𝚜, 𝚝𝚑𝚊𝚝'𝚜 𝚖𝚢 𝚗𝚊𝚖𝚎! 🤖",
                        "kidy": "𝙸 𝚊𝚖 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈! 💫",
                        "imad": "𝙽𝚒 𝚖𝚎 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝚋𝚘𝚝 🤖",
                        "sawa": "𝚂𝚊𝚠𝚊 𝚜𝚊𝚗𝚊! 👋",
                        "nai": "𝚂𝚊𝚠𝚊! ✨",
                        "misi": "𝙼𝚒𝚜𝚒 𝚖𝚣𝚒𝚖𝚊! 😊",
                        "mmh": "𝙼𝚖𝚑 𝚜𝚊𝚠𝚊! 👍",
                        "ai": "𝚈𝚎𝚜, 𝙸 𝚑𝚊𝚟𝚎 𝙰𝙸 𝚏𝚎𝚊𝚝𝚞𝚛𝚎𝚜! 𝚄𝚜𝚎 .𝚊𝚒 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 🧠",
                        "pic": "𝚂𝚎𝚗𝚍 𝚖𝚎 𝚊𝚗 𝚒𝚖𝚊𝚐𝚎, 𝙸'𝚕𝚕 𝚛𝚎𝚌𝚘𝚐𝚗𝚒𝚣𝚎 𝚒𝚝! 📷",
                        "song": "𝚄𝚜𝚎 .𝚜𝚘𝚗𝚐 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚘𝚛 𝚖𝚞𝚜𝚒𝚌! 🎵",
                        "help": "𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚘𝚛 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜! ❓",
                        "assist": "𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞? 💭",
                        "support": "𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛 𝚞𝚜𝚒𝚗𝚐 .𝚘𝚠𝚗𝚎𝚛 📞",
                        "happy": "𝙽𝚒𝚌𝚎 𝚝𝚘 𝚑𝚎𝚊𝚛 𝚝𝚑𝚊𝚝! 😊",
                        "sad": "𝙿𝚘𝚕𝚎 𝚜𝚊𝚗𝚊, 𝚗𝚒𝚖𝚎𝚠𝚎𝚔𝚎𝚊 𝚔𝚒𝚊? 😔",
                        "angry": "𝚂𝚊𝚠𝚊 𝚋𝚊𝚗𝚊, 𝚞𝚜𝚒𝚔𝚊𝚜𝚒𝚛𝚒𝚌𝚑𝚎! ☺️",
                        "cool": "𝚃𝚑𝚊𝚗𝚔 𝚢𝚘𝚞! 😎",
                        "amazing": "𝙰𝚜𝚊𝚗𝚝𝚎 𝚜𝚊𝚗𝚊! 🙏",
                        "sweet": "𝚃𝚑𝚊𝚗𝚔 𝚢𝚘𝚞 𝚋𝚊𝚗𝚊! 💖"
                    };
                    
                    if (autoReplies[messageText] && userConfig.AUTO_REPLY === 'true') {
                        await conn.sendMessage(mek.key.remoteJid, { 
                            text: autoReplies[messageText] 
                        }, { quoted: mek });
                    }
                }
                
                // Newsletter Reaction
                const newsletterJids = ["120363296818107681@newsletter"];
                const newsEmojis = ["❤️", "👍", "😮", "😎", "💀", "💫", "🔥", "👑"];
                if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
                    try {
                        const serverId = mek.newsletterServerId;
                        if (serverId) {
                            const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                            await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
                        }
                    } catch (e) {}
                }
                
                // Status Handling avec config MongoDB
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
                            react: { text: '👑', key: mek.key } 
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
                
                // Handle antilink (new feature)
                if (userConfig.ANTI_LINK === 'true') {
                    await handleAntilink(conn, mek, from, m);
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
                const pushname = mek.pushName || '𝚄𝚜𝚎𝚛';
                
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
                
                // Auto Presence basé sur config MongoDB
                if (userConfig.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (userConfig.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);
                
                // Custom MyQuoted
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
                
                const reply = (text) => conn.sendMessage(from, { text: text }, { quoted: fakevCard });
                const l = reply;
                
                // "Send" Command
                const cmdNoPrefix = body.toLowerCase().trim();
                if (["send", "sendme", "sand"].includes(cmdNoPrefix)) {
                    if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await conn.sendMessage(from, { text: "*𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚜𝚝𝚊𝚝𝚞𝚜 𝚝𝚘 𝚜𝚎𝚗𝚍 𝚒𝚝! 😊*" }, { quoted: mek });
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
                    // Statistiques
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
                                reply, config, fakevCard
                            });
                        } catch (e) {
                            console.error("[𝚜𝚒𝚕𝚊𝚝𝚎𝚌𝚑 𝙴𝚁𝚁𝙾𝚁] " + e);
                        }
                    }
                }
                
                // Statistiques messages
                await incrementStats(sanitizedNumber, 'messagesReceived');
                if (isGroup) {
                    await incrementStats(sanitizedNumber, 'groupsInteracted');
                }
                
                // Execute Events
                events.commands.map(async (command) => {
                    const ctx = { from, l, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, fakevCard };
                    
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
                error: '𝙸𝚗𝚝𝚎𝚛𝚗𝚊𝚕 𝚂𝚎𝚛𝚟𝚎𝚛 𝙴𝚛𝚛𝚘𝚛', 
                details: err.message 
            });
        }
    } finally {
        // Libérer le verrou
        if (connectionLockKey) {
            global[connectionLockKey] = false;
        }
    }
}

// ==============================================================================
// 4. ROUTES API
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍' });
    await startBot(number, res);
});

// Route pour vérifier statut
router.get('/status', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        // Retourner toutes les connexions actives
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
            ? '𝙽𝚞𝚖𝚋𝚎𝚛 𝚒𝚜 𝚊𝚌𝚝𝚒𝚟𝚎𝚕𝚢 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍' 
            : '𝙽𝚞𝚖𝚋𝚎𝚛 𝚒𝚜 𝚗𝚘𝚝 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍'
    });
});

// Route pour déconnecter
router.get('/disconnect', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).json({ error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚙𝚊𝚛𝚊𝚖𝚎𝚝𝚎𝚛 𝚒𝚜 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!activeSockets.has(sanitizedNumber)) {
        return res.status(404).json({ 
            error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍 𝚒𝚗 𝚊𝚌𝚝𝚒𝚟𝚎 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗𝚜' 
        });
    }

    try {
        const socket = activeSockets.get(sanitizedNumber);
        
        // Fermer connexion
        await socket.ws.close();
        socket.ev.removeAllListeners();
        
        // Supprimer du tracking et de la base de données
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
        await removeNumberFromMongoDB(sanitizedNumber);
        await deleteSessionFromMongoDB(sanitizedNumber); // S'assurer que la session MongoDB est supprimée aussi
        
        console.log(`✅ 𝙼𝚊𝚗𝚞𝚊𝚕𝚕𝚢 𝚍𝚒𝚜𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍 ${sanitizedNumber}`);
        
        res.json({ 
            status: 'success', 
            message: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚍𝚒𝚜𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢' 
        });
        
    } catch (error) {
        console.error(`𝙴𝚛𝚛𝚘𝚛 𝚍𝚒𝚜𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚗𝚐 ${sanitizedNumber}:`, error);
        res.status(500).json({ 
            error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚒𝚜𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚗𝚞𝚖𝚋𝚎𝚛' 
        });
    }
});

// Route pour voir numéros actifs
router.get('/active', (req, res) => {
    res.json({
        count: activeSockets.size,
        numbers: Array.from(activeSockets.keys())
    });
});

// Route ping
router.get('/ping', (req, res) => {
    res.json({
        status: 'active',
        message: '𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝚒𝚜 𝚛𝚞𝚗𝚗𝚒𝚗𝚐',
        activeSessions: activeSockets.size,
        database: '𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝙸𝚗𝚝𝚎𝚐𝚛𝚊𝚝𝚎𝚍'
    });
});

// Route pour reconnecter tous
router.get('/connect-all', async (req, res) => {
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (numbers.length === 0) {
            return res.status(404).json({ error: '𝙽𝚘 𝚗𝚞𝚖𝚋𝚎𝚛𝚜 𝚏𝚘𝚞𝚗𝚍 𝚝𝚘 𝚌𝚘𝚗𝚗𝚎𝚌𝚝' });
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
        console.error('𝙲𝚘𝚗𝚗𝚎𝚌𝚝 𝚊𝚕𝚕 𝚎𝚛𝚛𝚘𝚛:', error);
        res.status(500).json({ error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚊𝚕𝚕 𝚋𝚘𝚝𝚜' });
    }
});

// Route pour reconfigurer
router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) {
        return res.status(400).json({ error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚊𝚗𝚍 𝚌𝚘𝚗𝚏𝚒𝚐 𝚊𝚛𝚎 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍' });
    }

    let newConfig;
    try {
        newConfig = JSON.parse(configString);
    } catch (error) {
        return res.status(400).json({ error: '𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚌𝚘𝚗𝚏𝚒𝚐 𝚏𝚘𝚛𝚖𝚊𝚝' });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) {
        return res.status(404).json({ error: '𝙽𝚘 𝚊𝚌𝚝𝚒𝚟𝚎 𝚜𝚎𝚜𝚜𝚒𝚘𝚗 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 𝚝𝚑𝚒𝚜 𝚗𝚞𝚖𝚋𝚎𝚛' });
    }

    // Générer OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder OTP dans MongoDB
    await saveOTPToMongoDB(sanitizedNumber, otp, newConfig);

    try {
        // Envoyer OTP
        const userJid = jidNormalizedUser(socket.user.id);
        await socket.sendMessage(userJid, {
            text: `*🔐 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙰𝚃𝙸𝙾𝙽 𝚄𝙿𝙳𝙰𝚃𝙴*\n\n𝚈𝚘𝚞𝚛 𝙾𝚃𝙿: *${otp}*\n𝚅𝚊𝚕𝚒𝚍 𝚏𝚘𝚛 5 𝚖𝚒𝚗𝚞𝚝𝚎𝚜\n\n𝚄𝚜𝚎: .𝚟𝚎𝚛𝚒𝚏𝚢-𝚘𝚝𝚙 ${otp}`
        });
        
        res.json({ 
            status: 'otp_sent', 
            message: '𝙾𝚃𝙿 𝚜𝚎𝚗𝚝 𝚝𝚘 𝚢𝚘𝚞𝚛 𝚗𝚞𝚖𝚋𝚎𝚛' 
        });
    } catch (error) {
        console.error('𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝙾𝚃𝙿:', error);
        res.status(500).json({ error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝙾𝚃𝙿' });
    }
});

// Route pour vérifier OTP
router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) {
        return res.status(400).json({ error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚊𝚗𝚍 𝙾𝚃𝙿 𝚊𝚛𝚎 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍' });
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
                text: `*✅ 𝙲𝙾𝙽𝙵𝙸𝙶 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*\n\n𝚈𝚘𝚞𝚛 𝚌𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊𝚝𝚒𝚘𝚗 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢 𝚞𝚙𝚍𝚊𝚝𝚎𝚍!\n\n𝙲𝚑𝚊𝚗𝚐𝚎𝚜 𝚜𝚊𝚟𝚎𝚍 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱.`
            });
        }
        res.json({ 
            status: 'success', 
            message: '𝙲𝚘𝚗𝚏𝚒𝚐 𝚞𝚙𝚍𝚊𝚝𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱' 
        });
    } catch (error) {
        console.error('𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚙𝚍𝚊𝚝𝚎 𝚌𝚘𝚗𝚏𝚒𝚐 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱:', error);
        res.status(500).json({ error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚙𝚍𝚊𝚝𝚎 𝚌𝚘𝚗𝚏𝚒𝚐' });
    }
});

// Route pour statistiques
router.get('/stats', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).json({ error: '𝙽𝚞𝚖𝚋𝚎𝚛 𝚒𝚜 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍' });
    }
    
    try {
        const stats = await getStatsForNumber(number);
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const connectionStatus = getConnectionStatus(sanitizedNumber);
        
        res.json({
            number: sanitizedNumber,
            connectionStatus: connectionStatus.isConnected ? '𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍' : '𝙳𝚒𝚜𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍',
            uptime: connectionStatus.uptime,
            stats: stats
        });
    } catch (error) {
        console.error('𝙴𝚛𝚛𝚘𝚛 𝚐𝚎𝚝𝚝𝚒𝚗𝚐 𝚜𝚝𝚊𝚝𝚜:', error);
        res.status(500).json({ error: '𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚝 𝚜𝚝𝚊𝚝𝚒𝚜𝚝𝚒𝚌𝚜' });
    }
});

// ==============================================================================
// 5. RECONNEXION AUTOMATIQUE AU DÉMARRAGE
// ==============================================================================

async function autoReconnectFromMongoDB() {
    try {
        console.log('🔁 𝙰𝚝𝚝𝚎𝚖𝚙𝚝𝚒𝚗𝚐 𝚊𝚞𝚝𝚘-𝚛𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚏𝚛𝚘𝚖 𝙼𝚘𝚗𝚐𝚘𝙳𝙱...');
        const numbers = await getAllNumbersFromMongoDB();
        
        if (numbers.length === 0) {
            console.log('ℹ️ 𝙽𝚘 𝚗𝚞𝚖𝚋𝚎𝚛𝚜 𝚏𝚘𝚞𝚗𝚍 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝚏𝚘𝚛 𝚊𝚞𝚝𝚘-𝚛𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝');
            return;
        }
        
        console.log(`📊 𝙵𝚘𝚞𝚗𝚍 ${numbers.length} 𝚗𝚞𝚖𝚋𝚎𝚛𝚜 𝚒𝚗 𝙼𝚘𝚗𝚐𝚘𝙳𝙱`);
        
        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                console.log(`🔁 𝚁𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚗𝚐: ${number}`);
                const mockRes = { 
                    headersSent: false, 
                    json: () => {}, 
                    status: () => mockRes 
                };
                await startBot(number, mockRes);
                await delay(2000); // Attendre entre chaque reconnexion
            } else {
                console.log(`✅ 𝙰𝚕𝚛𝚎𝚊𝚍𝚢 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍: ${number}`);
            }
        }
        
        console.log('✅ 𝙰𝚞𝚝𝚘-𝚛𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚎𝚍');
    } catch (error) {
        console.error('❌ 𝚊𝚞𝚝𝚘𝚁𝚎𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝙵𝚛𝚘𝚖𝙼𝚘𝚗𝚐𝚘𝙳𝙱 𝚎𝚛𝚛𝚘𝚛:', error.message);
    }
}

// Démarrer reconnexion automatique après 3 secondes
setTimeout(() => {
    autoReconnectFromMongoDB();
}, 3000);

// ==============================================================================
// 6. CLEANUP ON EXIT
// ==============================================================================

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    
    // Nettoyer sessions locales
    const sessionDir = path.join(__dirname, 'session');
    if (fs.existsSync(sessionDir)) {
        fs.emptyDirSync(sessionDir);
    }
});

process.on('uncaughtException', (err) => {
    console.error('𝚄𝚗𝚌𝚊𝚞𝚐𝚑𝚝 𝚎𝚡𝚌𝚎𝚙𝚝𝚒𝚘𝚗:', err);
    // Redémarrer avec PM2 si configuré
    if (process.env.PM2_NAME) {
        const { exec } = require('child_process');
        exec(`pm2 restart ${process.env.PM2_NAME}`);
    }
});

module.exports = router;
