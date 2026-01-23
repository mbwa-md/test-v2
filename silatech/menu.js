const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../momy');

// Function to convert text to plain uppercase
const toUpper = (str) => str.toUpperCase();
const normalize = str => str.toLowerCase().replace(/\s+menu$/, '').trim();

// =============================================================
// 📌 COMMANDE MENU
// =============================================================
cmd({
  pattern: "menu",
  alias: ["help", "allmenu", "m", "list"],
  use: ".menu",
  desc: "show all bot commands",
  category: "menu",
  react: "💀",
  filename: __filename
}, 
async (conn, mek, m, { from, reply, sender, myquoted }) => {

  try {
    const totalCommands = commands.length;

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let mn = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${mn}m ${s}s`;
    };

    const prefix = config.PREFIX || ".";
    const mode = config.WORK_TYPE?.toUpperCase() || "PUBLIC";

    // Menu Header
    let menu = `╭━━【 💀 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 】━━━━╮
│ 👤 user: @${sender.split("@")[0]}
│ ⚙️ mode: ${mode}
│ ⌨️ prefix: ${prefix}
│ 📊 commands: ${totalCommands}
│ ⏱️ uptime: ${uptime()}
╰━━━━━━━━━━━━━━━━━━━━╯

*📁 available commands:*\n`;

    // Grouping Categories
    let categories = {};
    for (let c of commands) {
      if (!c || !c.pattern || !c.category) continue;
      const cat = normalize(c.category);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    }

    const sortedCats = Object.keys(categories).sort();

    // Loop through Categories
    for (let cat of sortedCats) {
      const catHeader = toUpper(cat);
      
      // Start category section
      menu += `\n┏━❑ ${catHeader} ━━━━━━━━━\n`;
      
      const cmds = categories[cat]
        .filter(c => c.pattern)
        .sort((a, b) => {
          const nameA = Array.isArray(a.pattern) ? a.pattern[0] : a.pattern;
          const nameB = Array.isArray(b.pattern) ? b.pattern[0] : b.pattern;
          return nameA.localeCompare(nameB);
        });

      // Display commands in vertical list format
      cmds.forEach((cmd, index) => {
        const cmdName = Array.isArray(cmd.pattern) ? cmd.pattern[0] : cmd.pattern.split('|')[0];
        const isLast = index === cmds.length - 1;
        
        if (isLast) {
          menu += `┃ ⤷ ${prefix}${cmdName}\n`;
          menu += `┗━━━━━━━━━━━━━━━━━━━━\n`;
        } else {
          menu += `┃ ⤷ ${prefix}${cmdName}\n`;
        }
      });
    }

    // Footer
    menu += `\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

    // Send the Menu with image and context info
    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/natk49.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363402325089913@newsletter',
          newsletterName: 'MOMY-KIDY',
          serverMessageId: 13
        }
      }
    }, { quoted: myquoted });

  } catch (e) {
    console.error("menu error:", e);
    reply(`*error generating menu*`);
  }

});
