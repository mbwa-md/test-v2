const { cmd } = require('../momy');

cmd({
    pattern: "unmute",
    alias: ["open", "speak"],
    desc: "unmute group",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, isGroup }) => {
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

        // Check if bot is admin
        const botParticipant = members.find(p => p.id === conn.user.id);
        if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
            return reply("*❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚖𝚊𝚔𝚎 𝚝𝚑𝚎 𝚋𝚘𝚝 𝚊𝚗 𝚊𝚍𝚖𝚒𝚗 𝚏𝚒𝚛𝚜𝚝*");
        }

        // Unmute the group
        await conn.groupSettingUpdate(from, 'not_announcement');
        
        const successMsg = `╭━━【 🔊 𝚄𝙽𝙼𝚄𝚃𝙴 】━━━╮
│ ✅ 𝙶𝚛𝚘𝚞𝚙 𝚞𝚗𝚖𝚞𝚝𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
│ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚌𝚊𝚗 𝚗𝚘𝚠 𝚜𝚎𝚗𝚍 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
│ 📢 𝙰𝚕𝚕 𝚞𝚜𝚎𝚛𝚜 𝚊𝚛𝚎 𝚗𝚘𝚠 𝚊𝚕𝚕𝚘𝚠𝚎𝚍 𝚝𝚘 𝚝𝚊𝚕𝚔
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, { text: successMsg });
        await m.react("✅");

    } catch (error) {
        console.error('Error in unmute command:', error);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚗𝚖𝚞𝚝𝚎 𝚐𝚛𝚘𝚞𝚙*");
        await m.react("❌");
    }
});
