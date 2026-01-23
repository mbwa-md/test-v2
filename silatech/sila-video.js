const { cmd } = require('../momy');
const axios = require('axios');
const yts = require('yt-search');

const VIDEO_IMAGE = 'https://files.catbox.moe/36vahk.png';

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© 𝐒𝐈𝐋𝐀-𝐌𝐃",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐒𝐈𝐋𝐀 𝐌𝐃 𝐁𝐎𝐓\nORG:𝐒𝐈𝐋𝐀-𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
    }
  }
};

cmd({
    pattern: "video",
    alias: ["ytmp4", "mp4", "ytv", "silavideo"],
    desc: "Download videos from YouTube",
    category: "downloader",
    react: "🎥",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, q }) => {
    try {
        if (!q) {
            return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁 ━━━━━━━━━
┃ 🎥 𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝚅𝙸𝙳𝙴𝙾 🥺
┃
┃ 𝚃𝚈𝙿𝙴: .𝚟𝚒𝚍𝚎𝚘 𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴
┃
┃ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎:
┃ .𝚟𝚒𝚍𝚎𝚘 𝙲𝚛𝚒𝚜𝚝𝚒𝚊𝚗𝚘 𝚁𝚘𝚗𝚊𝚕𝚍𝚘 𝙶𝚘𝚊𝚕
┗━━━━━━━━━━━━━━━━━━━━`);
        }

        const search = await yts(q);
        if (!search.videos.length) {
            return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚅𝙸𝙳𝙴𝙾 𝚂𝙴𝙰𝚁𝙲𝙷 ━━━━━━━━━
┃ ❌ 𝙲𝚊𝚗'𝚝 𝙵𝚒𝚗𝚍 𝙰𝚗𝚢 𝚅𝚒𝚍𝚎𝚘
┃ 😭 𝚂𝙾𝚁𝚁𝚈 🥺❤️
┗━━━━━━━━━━━━━━━━━━━━`);
        }

        const data = search.videos[0];
        const ytUrl = data.url;

        const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
        const { data: apiRes } = await axios.get(api);

        if (!apiRes?.status || !apiRes.result?.media?.video_url) {
            return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚅𝙸𝙳𝙴𝙾 𝙴𝚁𝚁𝙾𝚁 ━━━━━━━━━
┃ ❌ 𝚅𝚒𝚍𝚎𝚘 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙵𝚊𝚒𝚕𝚎𝚍
┃ 🥺 𝙿𝚕𝚎𝚊𝚜𝚎 𝚃𝚛𝚢 𝙰𝚐𝚊𝚒𝚗 ☺️
┗━━━━━━━━━━━━━━━━━━━━`);
        }

        const result = apiRes.result.media;
        const caption = `┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚅𝙸𝙳𝙴𝙾 𝙿𝙻𝙰𝚈𝙴𝚁 ━━━━━━━━━
┃ 🎬 𝚃𝚒𝚝𝚕𝚎: ${data.title}
┃
┃ 🔗 𝙻𝚒𝚗𝚔: ${data.url}
┃ 👀 𝚅𝙸𝙴𝚆𝚂: ${data.views}
┃ ⏱️ 𝚃𝙸𝙼𝙴: ${data.timestamp}
┃
┃ 📝 𝙲𝙷𝙾𝙾𝚂𝙴 𝚈𝙾𝚄𝚁 𝚅𝙴𝚁𝚂𝙸𝙾𝙽:
┃ 
┃ ❮1❯ 𝚂𝙸𝙼𝙿𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
┃ ❮2❯ 𝙵𝙸𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
┗━━━━━━━━━━━━━━━━━━━━`;

        const sentMsg = await conn.sendMessage(from, { 
            image: { url: result.thumbnail }, 
            caption: caption 
        }, { quoted: fakevCard });
        
        const messageID = sentMsg.key.id;

        // Store handler for this specific message
        const messageHandler = async (msgData) => {
            if (!msgData.messages) return;
            
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg?.message) return;

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            const senderID = receivedMsg.key.remoteJid;

            if (isReplyToBot && senderID === from) {
                const choice = receivedText.trim();
                
                try {
                    if (choice === "1") {
                        // Send as simple video
                        await conn.sendMessage(senderID, { 
                            video: { url: result.video_url }, 
                            mimetype: "video/mp4",
                            caption: `*Video: ${data.title}*\n\n*Downloaded by SILA-MD*`
                        }, { quoted: fakevCard });
                    } else if (choice === "2") {
                        // Send as document
                        await conn.sendMessage(senderID, { 
                            document: { url: result.video_url }, 
                            mimetype: "video/mp4", 
                            fileName: `${data.title}.mp4`,
                            caption: `*Video: ${data.title}*\n\n*Downloaded by SILA-MD*`
                        }, { quoted: fakevCard });
                    } else {
                        await conn.sendMessage(senderID, { 
                            text: `┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚂𝙴𝙻𝙴𝙲𝚃𝙸𝙾𝙽 ━━━━━━━━━
┃ ❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚁𝚎𝚙𝚕𝚢 𝚆𝙸𝚃𝙷 ❮1❯ 𝚘𝚛 ❮2❯
┗━━━━━━━━━━━━━━━━━━━━` 
                        }, { quoted: fakevCard });
                    }
                } catch (err) {
                    console.error("Video send error:", err.message);
                    await conn.sendMessage(senderID, { 
                        text: `┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚂𝙴𝙽𝙳 𝙴𝚁𝚁𝙾𝚁 ━━━━━━━━━
┃ ❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝚟𝚒𝚍𝚎𝚘 📹
┗━━━━━━━━━━━━━━━━━━━━` 
                    }, { quoted: fakevCard });
                }
                
                // Remove listener
                conn.ev.off('messages.upsert', messageHandler);
            }
        };

        // Add listener
        conn.ev.on('messages.upsert', messageHandler);
        
        // Auto remove after 60 seconds
        setTimeout(() => {
            conn.ev.off('messages.upsert', messageHandler);
        }, 60000);

    } catch (error) {
        console.error('Video Error:', error.message);
        reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳 ━━━━━━━━━
┃ 😔 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚏𝚊𝚒𝚕𝚎𝚍!
┗━━━━━━━━━━━━━━━━━━━━`);
    }
});
