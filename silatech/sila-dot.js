const { cmd } = require('../momy');

cmd({
    pattern: ".",
    desc: "bot information",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, pushname, myquoted }) => {
    try {
        const response = `╭━━【 📱 𝚂𝙸𝙻𝙰 𝚃𝙴𝙲𝙷 】━━━╮
│ 
│ 🤖 *𝙱𝙾𝚃 𝙻𝙸𝙽𝙺:*
│ https://momy-kidy-freebot.onrender.com
│ 
│ 📢 *𝙲𝙷𝙰𝙽𝙽𝙴𝙻:*
│ https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02
│ 
│ 👑 *𝙾𝚆𝙽𝙴𝚁:*
│ +255789661031
│ 
│ 💡 *𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:*
│ Type .menu for commands
│ 
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

    } catch (error) {
        console.error('Error in dot command:', error);
    }
});
