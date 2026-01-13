const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

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

// Command ya viewonce (open viewonce messages)
cmd({
    pattern: "vv",
    alias: ["antivv", "avv", "viewonce", "open", "vo"],
    desc: "Open viewonce photos/videos/audio",
    category: "owner",
    react: "👁️",
    fromMe: true
},
async(conn, mek, m, { args, reply, from, sender, isOwner }) => {
    try {
        if (!isOwner) return await reply("🚫 Owner only command!");

        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return await reply("*𝙷𝙰𝚂 𝙰𝙽𝚈𝙾𝙽𝙴 𝚂𝙴𝙽𝚃 𝚈𝙾𝚄 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺 𝙰𝙽𝙳 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝚂𝙴𝙴 𝙸𝚃 🤔*\n\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*❮𝚅𝚅❯*\n\n*𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙾𝙿𝙴𝙽 🥰*");
        }

        let type = Object.keys(quoted)[0];
        if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
            return await reply("*𝚈𝙾𝚄 𝙾𝙽𝙻𝚈 𝙽𝙴𝙴𝙳 𝚃𝙾 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝚃𝙷𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺*");
        }

        const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        let sendContent = {};
        if (type === "imageMessage") {
            sendContent = {
                image: buffer,
                caption: quoted[type]?.caption || "",
                mimetype: quoted[type]?.mimetype || "image/jpeg"
            };
        } else if (type === "videoMessage") {
            sendContent = {
                video: buffer,
                caption: quoted[type]?.caption || "",
                mimetype: quoted[type]?.mimetype || "video/mp4"
            };
        } else if (type === "audioMessage") {
            sendContent = {
                audio: buffer,
                mimetype: quoted[type]?.mimetype || "audio/mp4",
                ptt: quoted[type]?.ptt || false
            };
        }

        await conn.sendMessage(sender, sendContent, { quoted: fakevCard });
        
        // Send success reaction
        await conn.sendMessage(from, { 
            react: { text: '😍', key: mek.key } 
        });
        
    } catch (error) {
        await reply(`*𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝚁𝙸𝚃𝙴 ❮𝚅𝚅❯ 𝙰𝙶𝙰𝙸𝙽 🥺*\n\n_Error:_ ${error.message}`);
    }
});

// Command ya kudetect viewonce automatically
cmd({
    pattern: "detectvo",
    alias: ["autovo", "viewoncedetect"],
    desc: "Turn on/off auto viewonce detection",
    category: "owner",
    react: "👀",
    fromMe: true
},
async(conn, mek, m, { args, reply, getUserConfigFromMongoDB, updateUserConfigInMongoDB }) => {
    const mode = args[0]?.toLowerCase();
    const botNumber = conn.user.id.split(':')[0];
    
    if (mode === 'on' || mode === 'enable') {
        await updateUserConfigInMongoDB(botNumber, {
            VIEWONCE_DETECT: 'true'
        });
        await reply("*✅ Auto viewonce detection activated*\n\n👀 Bot will notify you of viewonce messages");
    } else if (mode === 'off' || mode === 'disable') {
        await updateUserConfigInMongoDB(botNumber, {
            VIEWONCE_DETECT: 'false'
        });
        await reply("*✅ Auto viewonce detection deactivated*");
    } else {
        const userConfig = await getUserConfigFromMongoDB(botNumber);
        const current = userConfig?.VIEWONCE_DETECT === 'true';
        await reply(`*Auto viewonce detection: ${current ? "ON ✅" : "OFF ❌"}*\n\nUse: .detectvo on/off`);
    }
});

// Export function for auto detection
async function handleViewOnceDetection(conn, mek, sender) {
    try {
        const botNumber = conn.user.id.split(':')[0];
        const userConfig = await getUserConfigFromMongoDB(botNumber);
        
        if (userConfig?.VIEWONCE_DETECT !== 'true') return;
        
        if (mek.message?.viewOnceMessageV2) {
            // Extract viewonce message
            const viewOnceMsg = mek.message.viewOnceMessageV2.message;
            const messageType = Object.keys(viewOnceMsg)[0]?.replace('Message', '') || 'unknown';
            
            let caption = '';
            if (viewOnceMsg?.imageMessage?.caption) {
                caption = viewOnceMsg.imageMessage.caption;
            } else if (viewOnceMsg?.videoMessage?.caption) {
                caption = viewOnceMsg.videoMessage.caption;
            }
            
            // Send notification to owner
            const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
            const notification = `👀 *VIEW ONCE MESSAGE DETECTED*\n\n` +
                                `*From:* ${sender.split('@')[0]}\n` +
                                `*Type:* ${messageType.toUpperCase()}\n` +
                                `${caption ? `*Caption:* ${caption}\n` : ''}` +
                                `*Time:* ${new Date().toLocaleString()}\n\n` +
                                `⚠️ This message was set to disappear after viewing`;
            
            await conn.sendMessage(ownerJid, { text: notification });
            
            console.log(`✅ ViewOnce detected from ${sender}`);
        }
    } catch (error) {
        console.error('ViewOnce detection error:', error);
    }
}

module.exports = {
    handleViewOnceDetection
};
