const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:MOMY-KIDY BOT\nORG:MOMY-KIDY BOT;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
        }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    status: 1
};

cmd({
    pattern: "vv",
    alias: ["antivv", "avv", "viewonce", "open"],
    desc: "view once media saver",
    category: "tools",
    react: "👁️"
}, async (conn, mek, m, { from, reply, sender, isCreator, myquoted }) => {
    try {
        const fromMe = mek.key.fromMe;
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!isCreator && !fromMe) return reply("🚫 Owner only command!");

        if (!quoted) {
            return reply("*𝙷𝙰𝚂 𝙰𝙽𝚈𝙾𝙽𝙴 𝚂𝙴𝙽𝚃 𝚈𝙾𝚄 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺 𝙰𝙽𝙳 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝚂𝙴𝙴 𝙸𝚃 🤔*\n\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*❮𝚅𝚅❯*\n\n*𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙾𝙿𝙴𝙽 🥰*");
        }

        let type = Object.keys(quoted)[0];
        if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
            return reply("*𝚈𝙾𝚄 𝙾𝙽𝙻𝚈 𝙽𝙴𝙴𝙳 𝚃𝙾 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝚃𝙷𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺*");
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
        await conn.sendMessage(from, { react: { text: '😍', key: mek.key } });

    } catch (error) {
        console.error("View once error:", error);
        reply(`*𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝚁𝙸𝚃𝙴 ❮𝚅𝚅❯ 𝙰𝙶𝙰𝙸𝙽 🥺*\n\n_Error:_ ${error.message}`);
    }
});

// Optional: Command ya kusave kwenye temp folder (kama unahitaji)
cmd({
    pattern: "savevv",
    alias: ["saveviewonce"],
    desc: "save view once media to temp folder",
    category: "tools",
    react: "💾"
}, async (conn, mek, m, { from, reply, sender, isCreator, myquoted }) => {
    if (!isCreator) return reply("🚫 Owner only command!");

    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return reply("*Reply to a view once message to save it*");
        }

        let type = Object.keys(quoted)[0];
        if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
            return reply("*This is not a view once media*");
        }

        const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        // Create temp directory
        const tempDir = path.join(__dirname, '../temp');
        await fs.ensureDir(tempDir);

        // Determine file extension
        let ext = '.bin';
        if (type === "imageMessage") ext = '.jpg';
        else if (type === "videoMessage") ext = '.mp4';
        else if (type === "audioMessage") ext = '.mp3';

        const filename = `viewonce_${Date.now()}${ext}`;
        const filepath = path.join(tempDir, filename);

        // Save to file
        await fs.writeFile(filepath, buffer);

        reply(`*✅ View once media saved as: ${filename}*`);

    } catch (error) {
        console.error("Save view once error:", error);
        reply("*❌ Failed to save view once media*");
    }
});
