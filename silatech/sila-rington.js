const { cmd, commands } = require('../momy');
const axios = require('axios');

cmd({
    pattern: "ringtone",
    alias: ["ring", "rtone"],
    react: "🎵",
    desc: "Search ringtone",
    category: "search",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!q) {
        return reply("❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚜𝚎𝚊𝚛𝚌𝚑 𝚚𝚞𝚎𝚛𝚢");
    }
    
    const { data } = await axios.get(`https://www.dark-yasiya-api.site/download/ringtone?text=${encodeURIComponent(q)}`);
    
    if (!data.status || !data.result || data.result.length === 0) {
        return reply(`❌ 𝙽𝚘 𝚛𝚒𝚗𝚐𝚝𝚘𝚗𝚎𝚜 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 "${q}"`);
    }
    
    const randomRingtone = data.result[Math.floor(Math.random() * data.result.length)];
    
    await conn.sendMessage(
        from,
        {
            audio: { url: randomRingtone.dl_link },
            mimetype: "audio/mpeg",
            fileName: `${randomRingtone.title}.mp3`,
        },
        { quoted: mek }
    );
    
} catch (e) {
    reply("❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚏𝚎𝚝𝚌𝚑 𝚛𝚒𝚗𝚐𝚝𝚘𝚗𝚎");
    l(e);
}
});
