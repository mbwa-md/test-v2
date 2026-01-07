const { cmd } = require('../momy');

cmd({
    pattern: "tagall",
    alias: ["all", "mentionall", "everyone"],
    desc: "tag all group members",
    category: "group",
    react: "🏷️",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, isGroup, participants, groupMetadata }) => {
    try {
        // Check if in group
        if (!isGroup) {
            return reply("*❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚘𝚗𝚕𝚢 𝚠𝚘𝚛𝚔𝚜 𝚒𝚗 𝚐𝚛𝚘𝚞𝚙𝚜*");
        }

        // Get group metadata
        const groupData = await conn.groupMetadata(from);
        const members = groupData.participants;
        
        if (!members || members.length === 0) {
            return reply("*❌ 𝙽𝚘 𝚖𝚎𝚖𝚋𝚎𝚛𝚜 𝚏𝚘𝚞𝚗𝚍 𝚒𝚗 𝚝𝚑𝚎 𝚐𝚛𝚘𝚞𝚙*");
        }

        // Check if sender is admin
        const senderParticipant = members.find(p => p.id === sender);
        if (!senderParticipant || (senderParticipant.admin !== "admin" && senderParticipant.admin !== "superadmin")) {
            return reply("*❌ 𝙾𝚗𝚕𝚢 𝚐𝚛𝚘𝚞𝚙 𝚊𝚍𝚖𝚒𝚗𝚜 𝚌𝚊𝚗 𝚞𝚜𝚎 𝚝𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍*");
        }

        // Check if bot is admin
        const botParticipant = members.find(p => p.id === conn.user.id);
        if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
            return reply("*❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚖𝚊𝚔𝚎 𝚝𝚑𝚎 𝚋𝚘𝚝 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗 𝚏𝚒𝚛𝚜𝚝*");
        }

        // Create message with tags
        let messageText = `╭━━【 🏷️ 𝚃𝙰𝙶 𝙰𝙻𝙻 】━━━╮
│ 📢 𝙶𝚛𝚘𝚞𝚙: ${groupData.subject}
│ 👥 𝚃𝚘𝚝𝚊𝚕 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${members.length}
╰━━━━━━━━━━━━━━━━━━━╯

🔊 *𝙷𝚎𝚕𝚕𝚘 𝙴𝚟𝚎𝚛𝚢𝚘𝚗𝚎!*`;

        // Add all members mentions
        members.forEach((member, index) => {
            const number = member.id.split('@')[0];
            messageText += `\n${index + 1}. @${number}`;
        });

        messageText += `\n\n> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        // Send message with mentions
        await conn.sendMessage(from, {
            text: messageText,
            mentions: members.map(m => m.id)
        }, { quoted: mek });

        await m.react("✅");

    } catch (error) {
        console.error('Error in tagall command:', error);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚝𝚊𝚐 𝚊𝚕𝚕 𝚖𝚎𝚖𝚋𝚎𝚛𝚜*");
        await m.react("❌");
    }
});
