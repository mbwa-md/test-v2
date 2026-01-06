const { cmd, commands } = require('../momy');
const config = require('../config');

// Commande Ping
cmd({
    pattern: "ping",
    desc: "Check bot latency",
    category: "general",
    react: "😎"
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted }) => {
    try {
        const startTime = Date.now();
        const message = await conn.sendMessage(from, { text: '🔍 _checking connection..._' }, { quoted: myquoted });
        const endTime = Date.now();
        const ping = endTime - startTime;
        
        const pongMessage = `*😎 SILA PONG : ${ping} ms*`;
        
        await conn.sendMessage(from, { text: pongMessage }, { quoted: message });
    } catch (e) {
        console.log(e);
        reply(`❌ error: ${e.message}`);
    }
});

// Commande Alive
cmd({
    pattern: "alive",
    desc: "Check if bot is alive",
    category: "general",
    react: "🔐"
},
async(conn, mek, m, { from, reply, myquoted }) => {
    try {
        await conn.sendMessage(from, { 
            image: { url: 'https://files.catbox.moe/hjyysd.jpg' },
            caption: `╭━━【 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃 】━━━━━━━━╮
│ status: *active & running*
│ prefix: *${config.PREFIX}*
│ version: *2.0.0*
│ developed: *sila tech*
╰━━━━━━━━━━━━━━━━━━━━╯

${config.BOT_FOOTER || '> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡'}`
        }, { quoted: myquoted });
    } catch (e) {
        reply("error: " + e.message);
    }
});
