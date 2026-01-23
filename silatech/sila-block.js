const { cmd, commands } = require('../momy');

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

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

cmd({
    pattern: "block",
    alias: ["ban"],
    react: "🚫",
    desc: "Block a user",
    category: "owner",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    // Owner check
    if (!isOwner) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    let jid;
    
    // Check kama kuna quoted message
    if (quoted) {
        jid = quoted.sender;
    }
    // Check kama kuna mentioned users
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
        jid = m.mentionedJid[0];
    }
    // Check kama kuna argument (namba)
    else if (q) {
        // Clean the number
        let number = q.replace(/[^0-9]/g, '');
        if (number.startsWith('0')) {
            number = '255' + number.substring(1);
        }
        if (!number.includes('@')) {
            number = number + '@s.whatsapp.net';
        }
        jid = number;
    } else {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚖𝚎𝚜𝚜𝚊𝚐𝚎, 𝚖𝚎𝚗𝚝𝚒𝚘𝚗 𝚊 𝚞𝚜𝚎𝚛, 𝚘𝚛 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚗𝚞𝚖𝚋𝚎𝚛\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: ${prefix}block 255789661031`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    try {
        await conn.updateBlockStatus(jid, "block");
        
        // Get user info
        const user = await conn.fetchStatus(jid).catch(() => null);
        const username = user?.status || jid.split('@')[0];
        
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐁𝐋𝐎𝐂𝐊 𝐔𝐒𝐄𝐑 ━━━━━━━━━━━━━━━
┃ 🚫 𝚄𝚜𝚎𝚛 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚋𝚕𝚘𝚌𝚔𝚎𝚍
┃ 👤 𝙽𝚊𝚖𝚎: @${jid.split('@')[0]}
┃ 📱 𝙽𝚞𝚖𝚋𝚎𝚛: ${jid.split('@')[0]}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            mentions: [jid],
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
    } catch (e) {
        await conn.sendMessage(from, {
            text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚋𝚕𝚘𝚌𝚔 𝚞𝚜𝚎𝚛\n\n𝙴𝚛𝚛𝚘𝚛: ${e.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        l(e);
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});

cmd({
    pattern: "unblock",
    alias: ["unban"],
    react: "🔓",
    desc: "Unblock a user",
    category: "owner",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    // Owner check
    if (!isOwner) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    let jid;
    
    // Check kama kuna quoted message
    if (quoted) {
        jid = quoted.sender;
    }
    // Check kama kuna mentioned users
    else if (m.mentionedJid && m.mentionedJid.length > 0) {
        jid = m.mentionedJid[0];
    }
    // Check kama kuna argument (namba)
    else if (q) {
        // Clean the number
        let number = q.replace(/[^0-9]/g, '');
        if (number.startsWith('0')) {
            number = '255' + number.substring(1);
        }
        if (!number.includes('@')) {
            number = number + '@s.whatsapp.net';
        }
        jid = number;
    } else {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊 𝚖𝚎𝚜𝚜𝚊𝚐𝚎, 𝚖𝚎𝚗𝚝𝚒𝚘𝚗 𝚊 𝚞𝚜𝚎𝚛, 𝚘𝚛 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚗𝚞𝚖𝚋𝚎𝚛\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: ${prefix}unblock 255789661031`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    try {
        await conn.updateBlockStatus(jid, "unblock");
        
        // Get user info
        const user = await conn.fetchStatus(jid).catch(() => null);
        const username = user?.status || jid.split('@')[0];
        
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐔𝐍𝐁𝐋𝐎𝐂𝐊 𝐔𝐒𝐄𝐑 ━━━━━━━━━━━━━━━
┃ 🔓 𝚄𝚜𝚎𝚛 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚞𝚗𝚋𝚕𝚘𝚌𝚔𝚎𝚍
┃ 👤 𝙽𝚊𝚖𝚎: @${jid.split('@')[0]}
┃ 📱 𝙽𝚞𝚖𝚋𝚎𝚛: ${jid.split('@')[0]}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            mentions: [jid],
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
    } catch (e) {
        await conn.sendMessage(from, {
            text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚗𝚋𝚕𝚘𝚌𝚔 𝚞𝚜𝚎𝚛\n\n𝙴𝚛𝚛𝚘𝚛: ${e.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        l(e);
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});
