const { cmd } = require('../momy');
const axios = require('axios');

const REPO_IMAGE = 'https://files.catbox.moe/36vahk.png';
const REPO_LINK = 'https://github.com/Sila-Md/SILA-MD';

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

// Utility function for formatted messages
function silaMessage(text) {
  return {
    text: text,
    contextInfo: {
      externalAdReply: {
        title: 'SILA-MD',
        body: 'GitHub Repository ‧ Verified',
        thumbnailUrl: REPO_IMAGE,
        sourceUrl: REPO_LINK,
        mediaUrl: REPO_IMAGE,
        renderLargerThumbnail: true,
        mediaType: 1
      },
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363402325089913@newsletter',
        newsletterName: 'SILA TECH',
        serverMessageId: Math.floor(Math.random() * 1000000)
      },
      isForwarded: true,
      forwardingScore: 999
    }
  };
}

cmd({
    pattern: "repo",
    alias: ["repository", "github"],
    desc: "Get bot repository link",
    category: "main",
    react: "📦",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Fetch GitHub stats
        let stars = '⭐';
        let forks = '🔀';
        
        try {
            const response = await axios.get('https://api.github.com/repos/Sila-Md/SILA-MD');
            stars = response.data.stargazers_count || '⭐';
            forks = response.data.forks_count || '🔀';
        } catch (err) {
            console.log('Could not fetch GitHub stats');
        }
        
        const repoMessage = 
`┏━❑ 𝐒𝐈𝐋𝐀-𝐌𝐃 𝙶𝙸𝚃𝙷𝚄𝙱 ━━━━━━━━━
┃ 📦 𝚁𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢: SILA-MD
┃ 👨‍💻 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛: Sila Tech
┃ 🔗 𝙻𝚒𝚗𝚔: https://github.com/Sila-Md/SILA-MD
┃
┃ ⭐ 𝚂𝚝𝚊𝚛𝚜: ${stars}
┃ 🔀 𝙵𝚘𝚛𝚔𝚜: ${forks}
┃
┃ 🛠️ 𝙾𝚙𝚎𝚗 𝚂𝚘𝚞𝚛𝚌𝚎 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙱𝚘𝚝
┃ 💚 𝙼𝚊𝚍𝚎 𝚠𝚒𝚝𝚑 ❤️ 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑
┗━━━━━━━━━━━━━━━━━━━━`;

        const messageData = silaMessage(repoMessage);
        
        await conn.sendMessage(from, messageData, { quoted: fakevCard });
        
    } catch (e) {
        reply("❌ 𝙴𝚛𝚛𝚘𝚛: " + e.message);
    }
});
