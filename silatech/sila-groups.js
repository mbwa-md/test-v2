const { cmd } = require('../momy');

// =================================================================
// 🚀 COMPLETE GROUP MANAGEMENT COMMANDS
// =================================================================

// Get group metadata safely
async function getGroupMetadata(conn, from) {
    try {
        return await conn.groupMetadata(from);
    } catch (error) {
        console.error("Get group metadata error:", error);
        return null;
    }
}

// Check if user is admin
function isUserAdmin(participants, userId) {
    const user = participants.find(p => p.id === userId);
    return user && user.admin;
}

// ======================== GROUP COMMANDS ========================

// 1. KICK MEMBER
cmd({
    pattern: "kick",
    alias: ["remove", "out"],
    desc: "kick member from group",
    category: "group",
    react: "🚪",
    use: ".kick @user"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const freshMetadata = await getGroupMetadata(conn, from);
        if (!freshMetadata) return reply("*error getting group info*");
        
        const freshParticipants = freshMetadata.participants || [];
        
        let targetUser;
        
        // Check mentions
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetUser = m.mentionedJid[0];
        }
        // Check phone number
        else if (args[0] && args[0].match(/^\d+$/)) {
            targetUser = args[0] + '@s.whatsapp.net';
        }
        // Check if replied to message
        else if (quoted && quoted.sender) {
            targetUser = quoted.sender;
        } else {
            return reply("*mention user, provide number, or reply to message*");
        }
        
        // Check if target is admin
        if (isUserAdmin(freshParticipants, targetUser)) {
            return reply("*cannot kick admin*");
        }
        
        // Check if target is self
        if (targetUser === sender) {
            return reply("*cannot kick yourself*");
        }
        
        // Check if target is in group
        const isInGroup = freshParticipants.some(p => p.id === targetUser);
        if (!isInGroup) {
            return reply("*user not in group*");
        }
        
        await conn.groupParticipantsUpdate(from, [targetUser], "remove");
        await reply(`*kicked @${targetUser.split('@')[0]} from group*`, { mentions: [targetUser] });
        
    } catch (error) {
        console.error("Kick error:", error);
        reply("*error kicking member*");
    }
});

// 2. ADD MEMBER
cmd({
    pattern: "add",
    alias: ["invite", "inv"],
    desc: "add member to group",
    category: "group",
    react: "👥",
    use: ".add 255789661031"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const numbers = args.filter(arg => arg.match(/^\d+$/) && arg.length >= 9);
        if (numbers.length === 0) return reply("*provide phone numbers*");
        
        const jids = numbers.map(num => num.includes('@') ? num : num + '@s.whatsapp.net');
        
        // Check bot admin status
        if (!isBotAdmins) {
            return reply("*bot must be admin to add members*");
        }
        
        await conn.groupParticipantsUpdate(from, jids, "add");
        await reply(`*added ${numbers.length} member(s) to group*`);
        
    } catch (error) {
        console.error("Add error:", error);
        reply("*error adding members*");
    }
});

// 3. PROMOTE TO ADMIN
cmd({
    pattern: "promote",
    alias: ["admin", "makeadmin"],
    desc: "promote member to admin",
    category: "group",
    react: "⬆️",
    use: ".promote @user"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        let targetUser;
        
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetUser = m.mentionedJid[0];
        }
        else if (args[0] && args[0].match(/^\d+$/)) {
            targetUser = args[0] + '@s.whatsapp.net';
        }
        else if (quoted && quoted.sender) {
            targetUser = quoted.sender;
        } else {
            return reply("*mention user, provide number, or reply to message*");
        }
        
        // Check if already admin
        if (groupAdmins.includes(targetUser)) {
            return reply("*user is already admin*");
        }
        
        // Check if user is in group
        const isInGroup = participants.some(p => p.id === targetUser);
        if (!isInGroup) {
            return reply("*user not in group*");
        }
        
        await conn.groupParticipantsUpdate(from, [targetUser], "promote");
        await reply(`*promoted @${targetUser.split('@')[0]} to admin*`, { mentions: [targetUser] });
        
    } catch (error) {
        console.error("Promote error:", error);
        reply("*error promoting member*");
    }
});

// 4. DEMOTE FROM ADMIN
cmd({
    pattern: "demote",
    alias: ["removeadmin", "unadmin"],
    desc: "demote member from admin",
    category: "group",
    react: "⬇️",
    use: ".demote @user"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        let targetUser;
        
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetUser = m.mentionedJid[0];
        }
        else if (args[0] && args[0].match(/^\d+$/)) {
            targetUser = args[0] + '@s.whatsapp.net';
        }
        else if (quoted && quoted.sender) {
            targetUser = quoted.sender;
        } else {
            return reply("*mention user, provide number, or reply to message*");
        }
        
        // Check if not admin
        if (!groupAdmins.includes(targetUser)) {
            return reply("*user is not admin*");
        }
        
        // Check if trying to demote self
        if (targetUser === sender) {
            return reply("*cannot demote yourself*");
        }
        
        // Check if there are other admins
        const otherAdmins = groupAdmins.filter(admin => admin !== targetUser);
        if (otherAdmins.length === 0) {
            return reply("*cannot demote last admin*");
        }
        
        await conn.groupParticipantsUpdate(from, [targetUser], "demote");
        await reply(`*demoted @${targetUser.split('@')[0]} from admin*`, { mentions: [targetUser] });
        
    } catch (error) {
        console.error("Demote error:", error);
        reply("*error demoting member*");
    }
});

// 5. TAG ALL MEMBERS
cmd({
    pattern: "tagall",
    alias: ["mentionall", "everyone", "all"],
    desc: "tag all group members",
    category: "group",
    react: "📢",
    use: ".tagall [message]"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const mentions = participants.map(p => p.id);
        const message = q || "📢 announcement";
        
        await conn.sendMessage(from, {
            text: `📢 *announcement*\n\n${message}\n\n${mentions.map(id => `@${id.split('@')[0]}`).join(' ')}`,
            mentions: mentions
        }, { quoted: myquoted });
        
    } catch (error) {
        console.error("Tagall error:", error);
        reply("*error tagging members*");
    }
});

// 6. SET GROUP NAME
cmd({
    pattern: "setname",
    alias: ["setgroupname", "changename", "rename"],
    desc: "change group name",
    category: "group",
    react: "🏷️",
    use: ".setname new group name"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!q) return reply("*provide new group name*");
        if (q.length > 25) return reply("*group name too long (max 25 chars)*");
        
        await conn.groupUpdateSubject(from, q);
        await reply(`*group name changed to: ${q}*`);
        
    } catch (error) {
        console.error("Setname error:", error);
        reply("*error changing group name*");
    }
});

// 7. SET GROUP DESCRIPTION
cmd({
    pattern: "setdesc",
    alias: ["setdescription", "changedesc", "description"],
    desc: "change group description",
    category: "group",
    react: "📝",
    use: ".setdesc new description"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!q) return reply("*provide new description*");
        if (q.length > 500) return reply("*description too long (max 500 chars)*");
        
        await conn.groupUpdateDescription(from, q);
        await reply(`*group description updated*`);
        
    } catch (error) {
        console.error("Setdesc error:", error);
        reply("*error changing description*");
    }
});

// 8. GET GROUP LINK
cmd({
    pattern: "link",
    alias: ["grouplink", "invitelink", "invite"],
    desc: "get group invite link",
    category: "group",
    react: "🔗",
    use: ".link"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!isBotAdmins) return reply("*bot must be admin to get link*");
        
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await reply(`*group invite link:*\n${link}`);
        
    } catch (error) {
        console.error("Link error:", error);
        reply("*error getting group link*");
    }
});

// 9. MUTE GROUP
cmd({
    pattern: "mute",
    alias: ["silence", "lockchat"],
    desc: "mute group (only admins can send messages)",
    category: "group",
    react: "🔇",
    use: ".mute"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'announcement');
        await reply("*group muted (only admins can send messages)*");
        
    } catch (error) {
        console.error("Mute error:", error);
        reply("*error muting group*");
    }
});

// 10. UNMUTE GROUP
cmd({
    pattern: "unmute",
    alias: ["unsilence", "unlockchat"],
    desc: "unmute group (everyone can send messages)",
    category: "group",
    react: "🔊",
    use: ".unmute"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'not_announcement');
        await reply("*group unmuted (everyone can send messages)*");
        
    } catch (error) {
        console.error("Unmute error:", error);
        reply("*error unmuting group*");
    }
});

// 11. LOCK GROUP
cmd({
    pattern: "lock",
    alias: ["lockgroup", "restrict"],
    desc: "lock group (only admins can add members)",
    category: "group",
    react: "🔒",
    use: ".lock"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'locked');
        await reply("*group locked (only admins can add members)*");
        
    } catch (error) {
        console.error("Lock error:", error);
        reply("*error locking group*");
    }
});

// 12. UNLOCK GROUP
cmd({
    pattern: "unlock",
    alias: ["unlockgroup", "open"],
    desc: "unlock group (everyone can add members)",
    category: "group",
    react: "🔓",
    use: ".unlock"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'unlocked');
        await reply("*group unlocked (everyone can add members)*");
        
    } catch (error) {
        console.error("Unlock error:", error);
        reply("*error unlocking group*");
    }
});

// 13. DELETE MESSAGE
cmd({
    pattern: "delete",
    alias: ["del", "remove"],
    desc: "delete message in group",
    category: "group",
    react: "🗑️",
    use: ".delete (reply to message)"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!quoted) return reply("*reply to a message to delete*");
        
        if (!isBotAdmins) return reply("*bot must be admin to delete messages*");
        
        await conn.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: quoted.id,
                participant: quoted.sender
            }
        });
        
    } catch (error) {
        console.error("Delete error:", error);
        reply("*error deleting message*");
    }
});

// 14. POST MESSAGE
cmd({
    pattern: "post",
    alias: ["announce", "broadcast"],
    desc: "post announcement to group",
    category: "group",
    react: "📢",
    use: ".post [message]"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const message = q || "📢 announcement";
        const senderNumber = sender.split('@')[0];
        
        const postMessage = `╭━━【 📢 𝙰𝙽𝙽𝙾𝚄𝙽𝙲𝙴𝙼𝙴𝙽𝚃 】━━━━╮
│ 👤 from: @${senderNumber}
│ ⏰ time: ${new Date().toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━━━╯

${message}

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await conn.sendMessage(from, {
            text: postMessage,
            mentions: [sender]
        }, { quoted: myquoted });
        
    } catch (error) {
        console.error("Post error:", error);
        reply("*error posting message*");
    }
});

// 15. GROUP INFO
cmd({
    pattern: "groupinfo",
    alias: ["ginfo", "infogroup"],
    desc: "get group information",
    category: "group",
    react: "🏷️",
    use: ".groupinfo"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const admins = participants.filter(p => p.admin).length;
        const bots = participants.filter(p => p.id.includes('@s.whatsapp.net')).length;
        
        const info = `╭━━【 🏷️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾 】━━━━╮
│ 🏷️ name: *${groupName}*
│ 🆔 id: *${from}*
│ 👥 members: *${participants.length}*
│ 👑 admins: *${admins}*
│ 🤖 bots: *${bots}*
│ 🔗 created: *${new Date(groupMetadata.creation * 1000).toLocaleDateString()}*
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await reply(info);
        
    } catch (error) {
        console.error("Group info error:", error);
        reply("*error getting group info*");
    }
});

// 16. LIST ADMINS
cmd({
    pattern: "admins",
    alias: ["listadmins", "adminslist"],
    desc: "list all group admins",
    category: "group",
    react: "👑",
    use: ".admins"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const admins = participants.filter(p => p.admin);
        
        if (admins.length === 0) {
            return reply("*no admins in this group*");
        }
        
        let adminList = `╭━━【 👑 𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽𝚂 】━━━━╮
│ 📊 total: *${admins.length}*
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        
        admins.forEach((admin, index) => {
            const number = admin.id.split('@')[0];
            const role = admin.admin === 'superadmin' ? '⭐' : '👑';
            adminList += `╭━━【 #${index + 1} 】━━━━━━━━╮
│ ${role} @${number}
╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });
        
        adminList += `\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await reply(adminList);
        
    } catch (error) {
        console.error("Admins error:", error);
        reply("*error listing admins*");
    }
});

// 17. LEAVE GROUP
cmd({
    pattern: "leave",
    alias: ["exitgroup", "bye"],
    desc: "bot leaves the group",
    category: "group",
    react: "👋",
    use: ".leave"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isOwner) return reply("*owner only command*");
    
    try {
        await reply("*leaving group...*");
        await conn.groupLeave(from);
        
    } catch (error) {
        console.error("Leave error:", error);
        reply("*error leaving group*");
    }
});

// 18. GROUP STATS
cmd({
    pattern: "groupstats",
    alias: ["gstats", "stats"],
    desc: "show group statistics",
    category: "group",
    react: "📊",
    use: ".groupstats"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const admins = participants.filter(p => p.admin).length;
        const superAdmins = participants.filter(p => p.admin === 'superadmin').length;
        const regularMembers = participants.length - admins;
        
        const stats = `╭━━【 📊 𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚂 】━━━━╮
│ 👥 total members: *${participants.length}*
│ 👑 admins: *${admins}*
│ ⭐ super admins: *${superAdmins}*
│ 👤 regular members: *${regularMembers}*
│ 📅 created: *${new Date(groupMetadata.creation * 1000).toLocaleDateString()}*
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await reply(stats);
        
    } catch (error) {
        console.error("Group stats error:", error);
        reply("*error getting group stats*");
    }
});

// 19. REVOKE LINK
cmd({
    pattern: "revoke",
    alias: ["newlink", "resetlink"],
    desc: "revoke and create new group link",
    category: "group",
    react: "🔄",
    use: ".revoke"
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, myquoted}) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!isBotAdmins) return reply("*bot must be admin to revoke link*");
        
        await conn.groupRevokeInvite(from);
        const code = await conn.groupInviteCode(from);
        const newLink = `https://chat.whatsapp.com/${code}`;
        
        await reply(`*new group link:*\n${newLink}`);
        
    } catch (error) {
        console.error("Revoke error:", error);
        reply("*error revoking link*");
    }
});
