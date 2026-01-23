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

const getContextInfo = (sender) => {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

// ADD command
cmd({
    pattern: "add",
    alias: ["adduser"],
    react: "➕",
    desc: "Add user to group",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    if (!isAdmins) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚈𝚘𝚞 𝚗𝚎𝚎𝚍 𝚝𝚘 𝚋𝚎 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    if (!q && !m.mentionedJid) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚖𝚎𝚗𝚝𝚒𝚘𝚗 𝚘𝚛 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚗𝚞𝚖𝚋𝚎𝚛`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    let users = [];
    if (m.mentionedJid) {
        users = m.mentionedJid;
    } else {
        const numbers = q.split(' ').map(num => num.replace(/[^0-9]/g, '')).filter(num => num.length > 0);
        for (let number of numbers) {
            if (number.startsWith('0')) {
                number = '255' + number.substring(1);
            }
            users.push(number + '@s.whatsapp.net');
        }
    }
    
    if (users.length === 0) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙽𝚘 𝚟𝚊𝚕𝚒𝚍 𝚞𝚜𝚎𝚛𝚜 𝚏𝚘𝚞𝚗𝚍`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    const added = [];
    const failed = [];
    
    for (let user of users) {
        try {
            await conn.groupParticipantsUpdate(from, [user], "add");
            added.push(user.split('@')[0]);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            failed.push(user.split('@')[0]);
        }
    }
    
    let result = `┏━❑ 𝐀𝐃𝐃 𝐔𝐒𝐄𝐑 ━━━━━━━━━━━━━━━
┃ ✅ 𝚄𝚜𝚎𝚛𝚜 𝚊𝚍𝚍𝚎𝚍: ${added.length}
┃ ❌ 𝙵𝚊𝚒𝚕𝚎𝚍: ${failed.length}
┗━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    if (added.length > 0) {
        result = `┏━❑ 𝐀𝐃𝐃 𝐔𝐒𝐄𝐑 ━━━━━━━━━━━━━━━
┃ ✅ 𝚂𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢 𝚊𝚍𝚍𝚎𝚍:
┃ ${added.map(num => `┃ • ${num}`).join('\n')}
┗━━━━━━━━━━━━━━━━━━━━━━━━`;
    }
    
    await conn.sendMessage(from, {
        text: result,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// HIDETAG command
cmd({
    pattern: "hidetag",
    alias: ["htag"],
    react: "🏷️",
    desc: "Tag all members invisibly",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    if (!isAdmins) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚈𝚘𝚞 𝚗𝚎𝚎𝚍 𝚝𝚘 𝚋𝚎 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    const message = q || "📢 𝙰𝚝𝚝𝚎𝚗𝚝𝚒𝚘𝚗 𝚊𝚕𝚕 𝚖𝚎𝚖𝚋𝚎𝚛𝚜!";
    const mentions = participants.map(p => p.id);
    
    await conn.sendMessage(from, {
        text: message,
        mentions: mentions
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// TAG command
cmd({
    pattern: "tag",
    react: "👥",
    desc: "Tag all members",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    if (!isAdmins) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚈𝚘𝚞 𝚗𝚎𝚎𝚍 𝚝𝚘 𝚋𝚎 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    let message = q || "📢 𝙰𝚝𝚝𝚎𝚗𝚝𝚒𝚘𝚗!";
    const mentions = participants.map(p => p.id);
    
    let tagMessage = `┏━❑ 𝐆𝐑𝐎𝐔𝐏 𝐓𝐀𝐆 ━━━━━━━━━━━━━━━
┃ ${message}
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${participants.length}`;
    
    for (let i = 0; i < Math.min(10, participants.length); i++) {
        tagMessage += `\n┃ @${participants[i].id.split('@')[0]}`;
    }
    
    if (participants.length > 10) {
        tagMessage += `\n┃ ... 𝚊𝚗𝚍 ${participants.length - 10} 𝚖𝚘𝚛𝚎`;
    }
    
    tagMessage += `\n┗━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    await conn.sendMessage(from, {
        text: tagMessage,
        mentions: mentions
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// TAGADMIN command
cmd({
    pattern: "tagadmin",
    alias: ["tadmin", "admintag"],
    react: "👑",
    desc: "Tag all admins",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    if (!isAdmins) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚈𝚘𝚞 𝚗𝚎𝚎𝚍 𝚝𝚘 𝚋𝚎 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    const adminList = groupAdmins.map(admin => `@${admin.split('@')[0]}`).join(' ');
    const message = q || "📢 𝙰𝚝𝚝𝚎𝚗𝚝𝚒𝚘𝚗 𝚊𝚍𝚖𝚒𝚗𝚜!";
    
    await conn.sendMessage(from, {
        text: `┏━❑ 𝐀𝐃𝐌𝐈𝐍 𝐓𝐀𝐆 ━━━━━━━━━━━━━━━
┃ ${message}
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 👑 𝙰𝚍𝚖𝚒𝚗𝚜:
┃ ${adminList}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: groupAdmins
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// GROUPJID command
cmd({
    pattern: "groupjid",
    alias: ["gcid"],
    react: "🆔",
    desc: "Get group ID",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    await conn.sendMessage(from, {
        text: `┏━❑ 𝐆𝐑𝐎𝐔𝐏 𝐈𝐃 ━━━━━━━━━━━━━━━
┃ 🏷️ 𝙽𝚊𝚖𝚎: ${groupName}
┃ 🆔 𝙹𝙸𝙳: ${from}
┃ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${participants.length}
┃ 👑 𝙰𝚍𝚖𝚒𝚗𝚜: ${groupAdmins.length}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// LISTADMIN command
cmd({
    pattern: "listadmin",
    alias: ["admins"],
    react: "📋",
    desc: "List all admins",
    category: "group",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚐𝚛𝚘𝚞𝚙𝚜`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }
    
    let adminList = "┏━❑ 𝐆𝐑𝐎𝐔𝐏 𝐀𝐃𝐌𝐈𝐍𝐒 ━━━━━━━━━━━━━━━\n";
    
    for (let i = 0; i < groupAdmins.length; i++) {
        try {
            const adminInfo = await conn.fetchStatus(groupAdmins[i]).catch(() => null);
            const adminName = adminInfo?.status || `@${groupAdmins[i].split('@')[0]}`;
            adminList += `┃ ${i + 1}. ${adminName}\n`;
        } catch {
            adminList += `┃ ${i + 1}. @${groupAdmins[i].split('@')[0]}\n`;
        }
    }
    
    adminList += `┃ ━━━━━━━━━━━━━━━━━━━━━━\n`;
    adminList += `┃ 👑 𝚃𝚘𝚝𝚊𝚕 𝙰𝚍𝚖𝚒𝚗𝚜: ${groupAdmins.length}\n`;
    adminList += `┗━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    await conn.sendMessage(from, {
        text: adminList,
        mentions: groupAdmins,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});

// POLL command (I'll continue with the rest in next response due to character limit)
// ... nitaendelea na commands zingine kwenye response inayofuata
