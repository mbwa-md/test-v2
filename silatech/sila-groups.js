const { cmd } = require('../momy');

// =================================================================
// 🚀 GROUP MANAGEMENT COMMANDS
// =================================================================

// Kick member from group
cmd({
    pattern: "kick",
    alias: ["remove"],
    desc: "kick member from group",
    category: "group",
    react: "🚪",
    use: ".kick @user or .kick 255789661031"
},
async(conn, mek, m, { from, reply, args, isAdmins, isGroup, sender, participants, groupAdmins }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const userToKick = args[0] || m.mentionedJid?.[0];
        if (!userToKick) return reply("*mention user or provide number*");
        
        const userJid = userToKick.includes('@') ? userToKick : userToKick + '@s.whatsapp.net';
        
        // Check if trying to kick admin
        if (groupAdmins.includes(userJid)) {
            return reply("*cannot kick admin*");
        }
        
        // Check if trying to kick self
        if (userJid === sender) {
            return reply("*cannot kick yourself*");
        }
        
        await conn.groupParticipantsUpdate(from, [userJid], "remove");
        await reply(`*kicked @${userJid.split('@')[0]} from group*`);
        
    } catch (error) {
        reply("*error kicking member*");
    }
});

// Add member to group
cmd({
    pattern: "add",
    alias: ["invite"],
    desc: "add member to group",
    category: "group",
    react: "👥",
    use: ".add 255789661031"
},
async(conn, mek, m, { from, reply, args, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const numbers = args.filter(arg => !isNaN(arg) && arg.length >= 9);
        if (numbers.length === 0) return reply("*provide phone numbers*");
        
        const jids = numbers.map(num => num.includes('@') ? num : num + '@s.whatsapp.net');
        await conn.groupParticipantsUpdate(from, jids, "add");
        
        await reply(`*added ${numbers.length} members to group*`);
        
    } catch (error) {
        reply("*error adding members*");
    }
});

// Promote to admin
cmd({
    pattern: "promote",
    alias: ["admin"],
    desc: "promote member to admin",
    category: "group",
    react: "⬆️",
    use: ".promote @user"
},
async(conn, mek, m, { from, reply, args, isAdmins, isGroup, groupAdmins }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const userToPromote = args[0] || m.mentionedJid?.[0];
        if (!userToPromote) return reply("*mention user or provide number*");
        
        const userJid = userToPromote.includes('@') ? userToPromote : userToPromote + '@s.whatsapp.net';
        
        // Check if already admin
        if (groupAdmins.includes(userJid)) {
            return reply("*user is already admin*");
        }
        
        await conn.groupParticipantsUpdate(from, [userJid], "promote");
        await reply(`*promoted @${userJid.split('@')[0]} to admin*`);
        
    } catch (error) {
        reply("*error promoting member*");
    }
});

// Demote from admin
cmd({
    pattern: "demote",
    desc: "demote member from admin",
    category: "group",
    react: "⬇️",
    use: ".demote @user"
},
async(conn, mek, m, { from, reply, args, isAdmins, isGroup, groupAdmins, sender }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const userToDemote = args[0] || m.mentionedJid?.[0];
        if (!userToDemote) return reply("*mention user or provide number*");
        
        const userJid = userToDemote.includes('@') ? userToPromote : userToPromote + '@s.whatsapp.net';
        
        // Check if not admin
        if (!groupAdmins.includes(userJid)) {
            return reply("*user is not admin*");
        }
        
        // Cannot demote yourself if you're the only admin
        if (userJid === sender) {
            return reply("*cannot demote yourself*");
        }
        
        await conn.groupParticipantsUpdate(from, [userJid], "demote");
        await reply(`*demoted @${userJid.split('@')[0]} from admin*`);
        
    } catch (error) {
        reply("*error demoting member*");
    }
});

// Group info
cmd({
    pattern: "groupinfo",
    alias: ["ginfo", "infogroup"],
    desc: "get group information",
    category: "group",
    react: "🏷️",
    use: ".groupinfo"
},
async(conn, mek, m, { from, reply, isGroup, groupMetadata, groupName }) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const participants = groupMetadata.participants || [];
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
        reply("*error getting group info*");
    }
});

// Tag all members
cmd({
    pattern: "tagall",
    alias: ["mentionall", "everyone"],
    desc: "tag all group members",
    category: "group",
    react: "📢",
    use: ".tagall [message]"
},
async(conn, mek, m, { from, reply, args, q, isAdmins, isGroup, groupMetadata }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const participants = groupMetadata.participants || [];
        const mentions = participants.map(p => p.id);
        const message = q || "announcement";
        
        await conn.sendMessage(from, {
            text: `📢 *announcement*\n\n${message}\n\n${mentions.map(id => `@${id.split('@')[0]}`).join(' ')}`,
            mentions: mentions
        }, { quoted: mek });
        
    } catch (error) {
        reply("*error tagging members*");
    }
});

// Set group subject
cmd({
    pattern: "setname",
    alias: ["setgroupname", "changename"],
    desc: "change group name",
    category: "group",
    react: "🏷️",
    use: ".setname new group name"
},
async(conn, mek, m, { from, reply, q, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!q) return reply("*provide new group name*");
        
        await conn.groupUpdateSubject(from, q);
        await reply(`*group name changed to: ${q}*`);
        
    } catch (error) {
        reply("*error changing group name*");
    }
});

// Set group description
cmd({
    pattern: "setdesc",
    alias: ["setdescription", "changedesc"],
    desc: "change group description",
    category: "group",
    react: "📝",
    use: ".setdesc new description"
},
async(conn, mek, m, { from, reply, q, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!q) return reply("*provide new description*");
        
        await conn.groupUpdateDescription(from, q);
        await reply(`*group description updated*`);
        
    } catch (error) {
        reply("*error changing description*");
    }
});

// Get group link
cmd({
    pattern: "link",
    alias: ["grouplink", "invitelink"],
    desc: "get group invite link",
    category: "group",
    react: "🔗",
    use: ".link"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await reply(`*group invite link:*\n${link}`);
        
    } catch (error) {
        reply("*error getting group link*");
    }
});

// Revoke group link
cmd({
    pattern: "revoke",
    alias: ["newlink", "resetlink"],
    desc: "revoke and create new group link",
    category: "group",
    react: "🔄",
    use: ".revoke"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupRevokeInvite(from);
        const code = await conn.groupInviteCode(from);
        const newLink = `https://chat.whatsapp.com/${code}`;
        
        await reply(`*new group link:*\n${newLink}`);
        
    } catch (error) {
        reply("*error revoking link*");
    }
});

// Leave group
cmd({
    pattern: "leave",
    alias: ["exitgroup", "bye"],
    desc: "bot leaves the group",
    category: "group",
    react: "👋",
    use: ".leave"
},
async(conn, mek, m, { from, reply, isCreator, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isCreator) return reply("*owner only command*");
    
    try {
        await reply("*leaving group...*");
        await conn.groupLeave(from);
        
    } catch (error) {
        reply("*error leaving group*");
    }
});

// Mute group
cmd({
    pattern: "mute",
    alias: ["silence"],
    desc: "mute group (only admins can send messages)",
    category: "group",
    react: "🔇",
    use: ".mute"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'announcement');
        await reply("*group muted (only admins can send)*");
        
    } catch (error) {
        reply("*error muting group*");
    }
});

// Unmute group
cmd({
    pattern: "unmute",
    alias: ["unsilence"],
    desc: "unmute group (everyone can send messages)",
    category: "group",
    react: "🔊",
    use: ".unmute"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'not_announcement');
        await reply("*group unmuted (everyone can send)*");
        
    } catch (error) {
        reply("*error unmuting group*");
    }
});

// Lock group
cmd({
    pattern: "lock",
    desc: "lock group (only admins can add members)",
    category: "group",
    react: "🔒",
    use: ".lock"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'locked');
        await reply("*group locked (only admins can add members)*");
        
    } catch (error) {
        reply("*error locking group*");
    }
});

// Unlock group
cmd({
    pattern: "unlock",
    desc: "unlock group (everyone can add members)",
    category: "group",
    react: "🔓",
    use: ".unlock"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        await conn.groupSettingUpdate(from, 'unlocked');
        await reply("*group unlocked (everyone can add members)*");
        
    } catch (error) {
        reply("*error unlocking group*");
    }
});

// List admins
cmd({
    pattern: "admins",
    alias: ["listadmins"],
    desc: "list all group admins",
    category: "group",
    react: "👑",
    use: ".admins"
},
async(conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const participants = groupMetadata.participants || [];
        const admins = participants.filter(p => p.admin);
        
        if (admins.length === 0) {
            return reply("*no admins in this group*");
        }
        
        let adminList = `╭━━【 👑 𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽𝚂 】━━━━╮\n│ 📊 total: *${admins.length}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        
        admins.forEach((admin, index) => {
            adminList += `╭━━【 #${index + 1} 】━━━━━━━━╮\n│ 👑 @${admin.id.split('@')[0]}\n╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });
        
        adminList += `\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await reply(adminList);
        
    } catch (error) {
        reply("*error listing admins*");
    }
});

// Group stats
cmd({
    pattern: "groupstats",
    alias: ["gstats"],
    desc: "show group statistics",
    category: "group",
    react: "📊",
    use: ".groupstats"
},
async(conn, mek, m, { from, reply, isGroup, groupMetadata }) => {
    if (!isGroup) return reply("*group command only*");
    
    try {
        const participants = groupMetadata.participants || [];
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
        reply("*error getting group stats*");
    }
});

// Delete message in group (for admins)
cmd({
    pattern: "delete",
    alias: ["del", "remove"],
    desc: "delete message in group",
    category: "group",
    react: "🗑️",
    use: ".delete (reply to message)"
},
async(conn, mek, m, { from, reply, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            return reply("*reply to a message to delete*");
        }
        
        const quoted = mek.message.extendedTextMessage.contextInfo;
        await conn.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: quoted.stanzaId,
                participant: quoted.participant
            }
        });
        
    } catch (error) {
        reply("*error deleting message*");
    }
});
