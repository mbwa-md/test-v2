const { cmd } = require('../momy');

// In-memory storage for antilink settings
const antilinkSettings = new Map();

cmd({
    pattern: "antilink",
    alias: ["antilinks", "nourl", "nolink"],
    desc: "manage group antilink protection",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, isGroup, participants, groupMetadata, sender }) => {
    try {
        // Check if in group
        if (!isGroup) {
            return reply("*❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚘𝚗𝚕𝚢 𝚠𝚘𝚛𝚔𝚜 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙𝚜*");
        }

        // Get group metadata
        const groupData = await conn.groupMetadata(from);
        const members = groupData.participants;
        
        // Check if sender is admin
        const senderParticipant = members.find(p => p.id === sender);
        if (!senderParticipant || (senderParticipant.admin !== "admin" && senderParticipant.admin !== "superadmin")) {
            return reply("*❌ 𝙾𝚗𝚕𝚢 𝚐𝚛𝚘𝚞𝚙 𝚊𝚍𝚖𝚒𝚗𝚜 𝚌𝚊𝚗 𝚞𝚜𝚎 𝚝𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍*");
        }

        const action = args[0]?.toLowerCase();
        
        if (!action) {
            const helpMsg = `╭━━【 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 】━━━╮
│ 
│ *𝚄𝚂𝙰𝙶𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:*
│ 
│ 🔒 *𝙴𝙽𝙰𝙱𝙻𝙴:*
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚘𝚗
│ 
│ 🔓 *𝙳𝙸𝚂𝙰𝙱𝙻𝙴:*
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚘𝚏𝚏
│ 
│ ⚙️ *𝚂𝙴𝚃 𝙰𝙲𝚃𝙸𝙾𝙽:*
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚜𝚎𝚝 𝚍𝚎𝚕𝚎𝚝𝚎
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚜𝚎𝚝 𝚔𝚒𝚌𝚔
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚜𝚎𝚝 𝚠𝚊𝚛𝚗
│ 
│ 📊 *𝙲𝙷𝙴𝙲𝙺 𝚂𝚃𝙰𝚃𝚄𝚂:*
│ .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚜𝚝𝚊𝚝𝚞𝚜
│ 
╰━━━━━━━━━━━━━━━━━━━╯

*𝙰𝙲𝚃𝙸𝙾𝙽𝚂 𝙴𝚇𝙿𝙻𝙰𝙽𝙰𝚃𝙸𝙾𝙽:*
• 𝚍𝚎𝚕𝚎𝚝𝚎 - 𝙳𝚎𝚕𝚎𝚝𝚎𝚜 𝚝𝚑𝚎 𝚕𝚒𝚗𝚔 𝚖𝚎𝚜𝚜𝚊𝚐𝚎
• 𝚔𝚒𝚌𝚔 - 𝚁𝚎𝚖𝚘𝚟𝚎𝚜 𝚝𝚑𝚎 𝚞𝚜𝚎𝚛 𝚏𝚛𝚘𝚖 𝚐𝚛𝚘𝚞𝚙
• 𝚠𝚊𝚛𝚗 - 𝚂𝚎𝚗𝚍𝚜 𝚊 𝚠𝚊𝚛𝚗𝚒𝚗𝚐 𝚖𝚎𝚜𝚜𝚊𝚐𝚎

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            return reply(helpMsg);
        }

        // Get current setting
        const currentSetting = antilinkSettings.get(from) || { enabled: false, action: 'delete' };

        switch (action) {
            case 'on':
                if (currentSetting.enabled) {
                    return reply("*⚠️ 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚎𝚗𝚊𝚋𝚕𝚎𝚍*");
                }
                antilinkSettings.set(from, { enabled: true, action: currentSetting.action });
                await reply(`*✅ 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚎𝚗𝚊𝚋𝚕𝚎𝚍*\n*𝙰𝚌𝚝𝚒𝚘𝚗:* ${currentSetting.action}`);
                await m.react("✅");
                break;

            case 'off':
                if (!currentSetting.enabled) {
                    return reply("*⚠️ 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚍𝚒𝚜𝚊𝚋𝚕𝚎𝚍*");
                }
                antilinkSettings.set(from, { enabled: false, action: currentSetting.action });
                await reply("*🔓 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚍𝚒𝚜𝚊𝚋𝚕𝚎𝚍*");
                await m.react("🔓");
                break;

            case 'set':
                const setAction = args[1]?.toLowerCase();
                if (!setAction || !['delete', 'kick', 'warn'].includes(setAction)) {
                    return reply("*❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚊𝚌𝚝𝚒𝚘𝚗. 𝚄𝚜𝚎: 𝚍𝚎𝚕𝚎𝚝𝚎, 𝚔𝚒𝚌𝚔, 𝚘𝚛 𝚠𝚊𝚛𝚗*");
                }
                antilinkSettings.set(from, { 
                    enabled: currentSetting.enabled, 
                    action: setAction 
                });
                await reply(`*⚙️ 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚊𝚌𝚝𝚒𝚘𝚗 𝚜𝚎𝚝 𝚝𝚘: ${setAction}*`);
                await m.react("⚙️");
                break;

            case 'status':
            case 'info':
                const status = currentSetting.enabled ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳';
                const statusMsg = `╭━━【 🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝚂𝚃𝙰𝚃𝚄𝚂 】━━━╮
│ 
│ 📍 𝙶𝚛𝚘𝚞𝚙: ${groupData.subject}
│ 📊 𝚂𝚝𝚊𝚝𝚞𝚜: ${status}
│ ⚙️ 𝙰𝚌𝚝𝚒𝚘𝚗: ${currentSetting.action}
│ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${members.length}
│ 
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                await reply(statusMsg);
                break;

            default:
                reply("*❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚌𝚘𝚖𝚖𝚊𝚗𝚍. 𝚄𝚜𝚎 .𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚏𝚘𝚛 𝚑𝚎𝚕𝚙*");
        }

    } catch (error) {
        console.error('Error in antilink command:', error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚖𝚊𝚗𝚊𝚐𝚒𝚗𝚐 𝚊𝚗𝚝𝚒𝚕𝚒𝚗𝚔*");
        await m.react("❌");
    }
});

// Link detection handler (add this to your main message handler)
async function handleLinkDetection(conn, mek, m, { from, text, sender, isGroup }) {
    try {
        if (!isGroup) return;

        const setting = antilinkSettings.get(from);
        if (!setting || !setting.enabled) return;

        if (!text) return;

        const linkPatterns = {
            whatsapp: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            channel: /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
            instagram: /instagram\.com\/[A-Za-z0-9_.]+\/?/i,
            facebook: /facebook\.com\/[A-Za-z0-9_.]+\/?/i,
            youtube: /youtube\.com\/[A-Za-z0-9_.]+\/?|youtu\.be\/[A-Za-z0-9_-]+/i,
            tiktok: /tiktok\.com\/@[A-Za-z0-9_.]+\/?|vm\.tiktok\.com\/[A-Za-z0-9]+\/?/i,
            allLinks: /https?:\/\/[^\s]+|www\.[^\s]+/i
        };

        let hasLink = false;
        for (const pattern of Object.values(linkPatterns)) {
            if (pattern.test(text)) {
                hasLink = true;
                break;
            }
        }

        if (!hasLink) return;

        const groupData = await conn.groupMetadata(from);
        const senderParticipant = groupData.participants.find(p => p.id === sender);
        const botParticipant = groupData.participants.find(p => p.id === conn.user.id);

        // Check if sender is admin (admins can post links)
        if (senderParticipant && (senderParticipant.admin === "admin" || senderParticipant.admin === "superadmin")) {
            return;
        }

        // Check if bot is admin
        if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
            return;
        }

        // Take action based on setting
        switch (setting.action) {
            case 'delete':
                try {
                    await conn.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: mek.key.id,
                            participant: sender
                        }
                    });
                    
                    await conn.sendMessage(from, {
                        text: `*⚠️ 𝙻𝙸𝙽𝙺 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳 & 𝙳𝙴𝙻𝙴𝚃𝙴𝙳*\n@${sender.split('@')[0]}, 𝚙𝚘𝚜𝚝𝚒𝚗𝚐 𝚕𝚒𝚗𝚔𝚜 𝚒𝚜 𝚗𝚘𝚝 𝚊𝚕𝚕𝚘𝚠𝚎𝚍 𝚒𝚗 𝚝𝚑𝚒𝚜 𝚐𝚛𝚘𝚞𝚙.`,
                        mentions: [sender]
                    });
                } catch (deleteError) {
                    console.error('Failed to delete message:', deleteError);
                }
                break;

            case 'kick':
                try {
                    // Delete the message first
                    await conn.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: mek.key.id,
                            participant: sender
                        }
                    });

                    // Kick the user
                    await conn.groupParticipantsUpdate(from, [sender], 'remove');
                    
                    await conn.sendMessage(from, {
                        text: `*🚫 𝚄𝚂𝙴𝚁 𝙺𝙸𝙲𝙺𝙴𝙳*\n@${sender.split('@')[0]} 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚛𝚎𝚖𝚘𝚟𝚎𝚍 𝚏𝚛𝚘𝚖 𝚝𝚑𝚎 𝚐𝚛𝚘𝚞𝚙 𝚏𝚘𝚛 𝚙𝚘𝚜𝚝𝚒𝚗𝚐 𝚕𝚒𝚗𝚔𝚜.`,
                        mentions: [sender]
                    });
                } catch (kickError) {
                    console.error('Failed to kick user:', kickError);
                }
                break;

            case 'warn':
                await conn.sendMessage(from, {
                    text: `*⚠️ 𝚆𝙰𝚁𝙽𝙸𝙽𝙶: 𝙻𝙸𝙽𝙺 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳*\n@${sender.split('@')[0]}, 𝚙𝚕𝚎𝚊𝚜𝚎 𝚍𝚘 𝚗𝚘𝚝 𝚙𝚘𝚜𝚝 𝚕𝚒𝚗𝚔𝚜 𝚒𝚗 𝚝𝚑𝚒𝚜 𝚐𝚛𝚘𝚞𝚙. 𝙽𝚎𝚡𝚝 𝚝𝚒𝚖𝚎 𝚢𝚘𝚞 𝚠𝚒𝚕𝚕 𝚋𝚎 𝚔𝚒𝚌𝚔𝚎𝚍.`,
                    mentions: [sender]
                });
                break;
        }

    } catch (error) {
        console.error('Error in link detection:', error);
    }
}

// Export functions
module.exports = {
    antilinkSettings,
    handleLinkDetection
};
