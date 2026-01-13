const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const { UploadFileUgu, TelegraPh } = require('../lib/uploader');

async function getMediaBufferAndExt(message) {
    const m = message.message || {};
    if (m.imageMessage) {
        const stream = await downloadContentFromMessage(m.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.jpg', type: 'image' };
    }
    if (m.videoMessage) {
        const stream = await downloadContentFromMessage(m.videoMessage, 'video');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp4', type: 'video' };
    }
    if (m.audioMessage) {
        const stream = await downloadContentFromMessage(m.audioMessage, 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp3', type: 'audio' };
    }
    if (m.documentMessage) {
        const stream = await downloadContentFromMessage(m.documentMessage, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const fileName = m.documentMessage.fileName || 'file.bin';
        const ext = path.extname(fileName) || '.bin';
        return { buffer: Buffer.concat(chunks), ext, type: 'document' };
    }
    if (m.stickerMessage) {
        const stream = await downloadContentFromMessage(m.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.webp', type: 'sticker' };
    }
    return null;
}

async function getQuotedMediaBufferAndExt(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    if (!quoted) return null;
    return getMediaBufferAndExt({ message: quoted });
}

cmd({
    pattern: "url",
    alias: ["upload", "geturl", "link"],
    desc: "upload media and get url",
    category: "tools",
    react: "🔗"
}, async (conn, mek, m, { from, reply, myquoted }) => {
    try {
        // Prefer current message media, else quoted media
        let media = await getMediaBufferAndExt(mek);
        if (!media) media = await getQuotedMediaBufferAndExt(mek);

        if (!media) {
            return reply("*📤 𝚄𝙿𝙻𝙾𝙰𝙳 𝙼𝙴𝙳𝙸𝙰 𝚃𝙾 𝙶𝙴𝚃 𝚄𝚁𝙻*\n\n*𝚄𝚂𝙰𝙶𝙴:* Reply to or send any media with .url\n*𝚂𝚄𝙿𝙿𝙾𝚁𝚃𝙴𝙳:* Images, Videos, Audio, Stickers, Documents\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        await reply("*📤 𝚄𝚙𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚖𝚎𝚍𝚒𝚊...*");

        const tempDir = path.join(__dirname, '../temp');
        await fs.ensureDir(tempDir);
        const tempPath = path.join(tempDir, `${Date.now()}${media.ext}`);
        await fs.writeFile(tempPath, media.buffer);

        let url = '';
        try {
            if (media.ext === '.jpg' || media.ext === '.png' || media.ext === '.webp') {
                // Try TelegraPh for images/webp first
                try {
                    url = await TelegraPh(tempPath);
                } catch {
                    // Fallback to Uguu
                    const res = await UploadFileUgu(tempPath);
                    url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
                }
            } else {
                const res = await UploadFileUgu(tempPath);
                url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
            }
        } finally {
            // Clean up temp file after 2 seconds
            setTimeout(async () => {
                try {
                    await fs.unlink(tempPath);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError.message);
                }
            }, 2000);
        }

        if (!url) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚙𝚕𝚘𝚊𝚍 𝚖𝚎𝚍𝚒𝚊*");
        }

        const mediaTypeMap = {
            'image': '🖼️ 𝙸𝚖𝚊𝚐𝚎',
            'video': '🎥 𝚅𝚒𝚍𝚎𝚘',
            'audio': '🎵 𝙰𝚞𝚍𝚒𝚘',
            'document': '📄 𝙳𝚘𝚌𝚞𝚖𝚎𝚗𝚝',
            'sticker': '🤡 𝚂𝚝𝚒𝚌𝚔𝚎𝚛'
        };

        const mediaType = mediaTypeMap[media.type] || '📁 𝙵𝚒𝚕𝚎';

        const response = `╭━━【 🔗 𝙼𝙴𝙳𝙸𝙰 𝚄𝚁𝙻 】━━━╮
│ ${mediaType}
│ 📎 𝙴𝚡𝚝𝚎𝚗𝚜𝚒𝚘𝚗: ${media.ext}
│ 🔗 𝚄𝚁𝙻:
│ ${url}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('[URL] error:', error?.message || error);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚌𝚘𝚗𝚟𝚎𝚛𝚝 𝚖𝚎𝚍𝚒𝚊 𝚝𝚘 𝚄𝚁𝙻*");
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
