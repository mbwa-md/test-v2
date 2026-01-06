const { cmd } = require('../momy');

cmd({
    pattern: "jid",
    alias: ["getjid", "id"],
    desc: "get jid of user, group, or channel",
    category: "tools",
    react: "🆔",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, isGroup, myquoted }) => {
    try {
        let result = "";
        
        if (isGroup) {
            // Group information
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            result = `╭━━【 🏷️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾 】━━━━╮
│ 🏷️ 𝚐𝚛𝚘𝚞𝚙 𝚓𝚒𝚍: *${from}*
│ 👥 𝚝𝚘𝚝𝚊𝚕 𝚖𝚎𝚖𝚋𝚎𝚛𝚜: *${participants.length}*
│ 👑 𝚊𝚍𝚖𝚒𝚗𝚜: *${participants.filter(p => p.admin).length}*
╰━━━━━━━━━━━━━━━━━━━━╯

`;

            // Add admin JIDs
            const admins = participants.filter(p => p.admin);
            if (admins.length > 0) {
                result += "╭━━【 👑 𝙰𝙳𝙼𝙸𝙽𝚂 𝙹𝙸𝙳𝚂 】━━━━╮\n";
                admins.forEach(admin => {
                    const number = admin.id.split('@')[0];
                    result += `│ 👤 @${number} *(${admin.id})*\n`;
                });
                result += "╰━━━━━━━━━━━━━━━━━━━━╯\n\n";
            }

            // Add all participants JIDs (limited to 20)
            result += "╭━━【 👥 𝙿𝙰𝚁𝚃𝙸𝙲𝙸𝙿𝙰𝙽𝚃𝚂 】━━━━╮\n";
            participants.slice(0, 20).forEach(participant => {
                const number = participant.id.split('@')[0];
                const role = participant.admin ? "👑" : "👤";
                result += `│ ${role} @${number}\n`;
            });
            if (participants.length > 20) {
                result += `│ ...and ${participants.length - 20} more\n`;
            }
            result += "╰━━━━━━━━━━━━━━━━━━━━╯\n";

        } else if (myquoted && myquoted.key && myquoted.key.remoteJid.includes('@newsletter')) {
            // Channel information
            const channelJid = myquoted.key.remoteJid;
            result = `╭━━【 📢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻 𝙸𝙽𝙵𝙾 】━━━━╮
│ 📢 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚓𝚒𝚍: *${channelJid}*
│ 📄 𝚗𝚎𝚠𝚜𝚕𝚎𝚝𝚝𝚎𝚛 𝚒𝚍: *${channelJid.split('@')[0]}*
╰━━━━━━━━━━━━━━━━━━━━╯`;

        } else if (myquoted && myquoted.key && myquoted.key.participant) {
            // Quoted user information
            const quotedJid = myquoted.key.participant;
            const quotedNumber = quotedJid.split('@')[0];
            result = `╭━━【 👤 𝚀𝚄𝙾𝚃𝙴𝙳 𝚄𝚂𝙴𝚁 】━━━━╮
│ 👤 𝚞𝚜𝚎𝚛 𝚓𝚒𝚍: *${quotedJid}*
│ 📞 𝚗𝚞𝚖𝚋𝚎𝚛: *${quotedNumber}*
╰━━━━━━━━━━━━━━━━━━━━╯`;

        } else {
            // Personal/Inbox information
            const userJid = sender;
            const userNumber = userJid.split('@')[0];
            result = `╭━━【 👤 𝚈𝙾𝚄𝚁 𝙸𝙽𝙵𝙾 】━━━━╮
│ 👤 𝚢𝚘𝚞𝚛 𝚓𝚒𝚍: *${userJid}*
│ 📞 𝚢𝚘𝚞𝚛 𝚗𝚞𝚖𝚋𝚎𝚛: *${userNumber}*
│ 💬 𝚌𝚞𝚛𝚛𝚎𝚗𝚝 𝚌𝚑𝚊𝚝: *${from}*
╰━━━━━━━━━━━━━━━━━━━━╯

`;

            // Bot information
            const botJid = conn.user?.id || "Unknown";
            result += `╭━━【 🤖 𝙱𝙾𝚃 𝙸𝙽𝙵𝙾 】━━━━╮
│ 🤖 𝚋𝚘𝚝 𝚓𝚒𝚍: *${botJid}*
│ ⚙️ 𝚋𝚘𝚝 𝚗𝚞𝚖𝚋𝚎𝚛: *${botJid.split(':')[0]}*
╰━━━━━━━━━━━━━━━━━━━━╯`;
        }

        // Add footer
        result += `\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(result);
        
    } catch (error) {
        console.error("JID command error:", error);
        reply("*error fetching jid information*");
    }
});

// Command to get all group JIDs the bot is in
cmd({
    pattern: "allgroups",
    alias: ["groupsjid", "grouplist"],
    desc: "get jids of all groups bot is in",
    category: "tools",
    react: "👥",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        const groups = await conn.groupFetchAllParticipating();
        const groupList = Object.values(groups);
        
        if (groupList.length === 0) {
            return reply("*bot is not in any groups*");
        }

        let result = `╭━━【 👥 𝙰𝙻𝙻 𝙶𝚁𝙾𝚄𝙿𝚂 】━━━━╮
│ 📊 𝚝𝚘𝚝𝚊𝚕 𝚐𝚛𝚘𝚞𝚙𝚜: *${groupList.length}*
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        groupList.forEach((group, index) => {
            result += `╭━━【 #${index + 1} 】━━━━━━━━╮
│ 🏷️ 𝚗𝚊𝚖𝚎: *${group.subject || 'Unknown'}*
│ 🆔 𝚓𝚒𝚍: *${group.id}*
│ 👥 𝚖𝚎𝚖𝚋𝚎𝚛𝚜: *${group.participants?.length || 0}*
│ 👑 𝚊𝚍𝚖𝚒𝚗𝚜: *${group.participants?.filter(p => p.admin)?.length || 0}*
╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });

        result += `\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(result);
        
    } catch (error) {
        console.error("All groups command error:", error);
        reply("*error fetching groups list*");
    }
});

// Command to get channel information
cmd({
    pattern: "channeljid",
    alias: ["newsletterjid", "channels"],
    desc: "get channel jid information",
    category: "tools",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        // You might need to store channel JIDs in config
        const config = require('../config');
        const channelJids = [config.CHANNEL_JID_1, config.CHANNEL_JID_2].filter(Boolean);
        
        if (channelJids.length === 0) {
            return reply("*no channels configured*");
        }

        let result = `╭━━【 📢 𝙲𝙾𝙽𝙵𝙸𝙶𝚄𝚁𝙴𝙳 𝙲𝙷𝙰𝙽𝙽𝙴𝙻𝚂 】━━━━╮
│ 📊 𝚝𝚘𝚝𝚊𝚕 𝚌𝚑𝚊𝚗𝚗𝚎𝚕𝚜: *${channelJids.length}*
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        channelJids.forEach((jid, index) => {
            const channelId = jid.split('@')[0];
            result += `╭━━【 #${index + 1} 】━━━━━━━━╮
│ 📢 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚓𝚒𝚍: *${jid}*
│ 🔢 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚒𝚍: *${channelId}*
╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });

        result += `\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(result);
        
    } catch (error) {
        console.error("Channel JID command error:", error);
        reply("*error fetching channel information*");
    }
});

// Command to get all chat JIDs (inbox)
cmd({
    pattern: "inboxjid",
    alias: ["chats", "allchats"],
    desc: "get jids of all chats in inbox",
    category: "tools",
    react: "📨",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        // Note: This might not be available in all versions
        // You might need to implement your own chat tracking
        const result = `╭━━【 📨 𝙸𝙽𝙱𝙾𝚇 𝙲𝙷𝙰𝚃𝚂 】━━━━╮
│ 📊 𝚒𝚗𝚏𝚘: 𝚒𝚗𝚋𝚘𝚡 𝚌𝚑𝚊𝚝𝚜 𝚌𝚊𝚗𝚗𝚘𝚝 𝚋𝚎 𝚏𝚎𝚝𝚌𝚑𝚎𝚍
│ 📝 𝚗𝚘𝚝𝚎: 𝚞𝚜𝚎 .𝚓𝚒𝚍 𝚒𝚗 𝚎𝚊𝚌𝚑 𝚌𝚑𝚊𝚝
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(result);
        
    } catch (error) {
        console.error("Inbox JID command error:", error);
        reply("*error fetching inbox information*");
    }
});
