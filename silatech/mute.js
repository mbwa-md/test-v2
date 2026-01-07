const { cmd } = require('../momy');

cmd({
    pattern: "mute",
    alias: ["silence", "lock"],
    desc: "mute/unmute group",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, args, isGroup, participants, groupMetadata }) => {
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

        // Get duration from args
        const durationArg = args[0];
        let durationInMinutes = 0;
        
        // Check if user wants to unmute
        if (durationArg === "off" || durationArg === "unmute" || durationArg === "open") {
            try {
                await conn.groupSettingUpdate(from, 'not_announcement');
                
                const successMsg = `╭━━【 🔊 𝚄𝙽𝙼𝚄𝚃𝙴 】━━━╮
│ ✅ 𝙶𝚛𝚘𝚞𝚙 𝚞𝚗𝚖𝚞𝚝𝚎𝚍
│ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜 𝚌𝚊𝚗 𝚗𝚘𝚠 𝚜𝚎𝚗𝚍 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                
                await conn.sendMessage(from, { text: successMsg });
                await m.react("✅");
                return;
            } catch (error) {
                console.error('Error unmuting group:', error);
                return reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚞𝚗𝚖𝚞𝚝𝚎 𝚐𝚛𝚘𝚞𝚙*");
            }
        }

        // Check for duration
        if (durationArg && !isNaN(durationArg)) {
            durationInMinutes = parseInt(durationArg);
            if (durationInMinutes < 1 || durationInMinutes > 1440) {
                return reply("*❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚍𝚞𝚛𝚊𝚝𝚒𝚘𝚗. 𝚄𝚜𝚎 1-1440 𝚖𝚒𝚗𝚞𝚝𝚎𝚜*");
            }
        }

        // Mute the group
        await conn.groupSettingUpdate(from, 'announcement');
        
        let successMsg;
        if (durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            
            successMsg = `╭━━【 🔇 𝙼𝚄𝚃𝙴 】━━━╮
│ ✅ 𝙶𝚛𝚘𝚞𝚙 𝚖𝚞𝚝𝚎𝚍
│ ⏰ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${durationInMinutes} 𝚖𝚒𝚗𝚞𝚝𝚎𝚜
│ 👥 𝙾𝚗𝚕𝚢 𝚊𝚍𝚖𝚒𝚗𝚜 𝚌𝚊𝚗 𝚜𝚎𝚗𝚍 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            
            await conn.sendMessage(from, { text: successMsg });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await conn.groupSettingUpdate(from, 'not_announcement');
                    const unmuteMsg = `╭━━【 🔊 𝙰𝚄𝚃𝙾 𝚄𝙽𝙼𝚄𝚃𝙴 】━━━╮
│ ✅ 𝙶𝚛𝚘𝚞𝚙 𝚊𝚞𝚝𝚘𝚖𝚊𝚝𝚒𝚌𝚊𝚕𝚕𝚢 𝚞𝚗𝚖𝚞𝚝𝚎𝚍
│ ⏰ 𝚃𝚒𝚖𝚎𝚛 𝚌𝚘𝚖𝚙𝚕𝚎𝚝𝚎𝚍: ${durationInMinutes} 𝚖𝚒𝚗𝚞𝚝𝚎𝚜
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                    
                    await conn.sendMessage(from, { text: unmuteMsg });
                } catch (unmuteError) {
                    console.error('Error auto-unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
            
        } else {
            // Permanent mute
            successMsg = `╭━━【 🔇 𝙿𝙴𝚁𝙼𝙰𝙽𝙴𝙽𝚃 𝙼𝚄𝚃𝙴 】━━━╮
│ ✅ 𝙶𝚛𝚘𝚞𝚙 𝚙𝚎𝚛𝚖𝚊𝚗𝚎𝚗𝚝𝚕𝚢 𝚖𝚞𝚝𝚎𝚍
│ 👥 𝙾𝚗𝚕𝚢 𝚊𝚍𝚖𝚒𝚗𝚜 𝚌𝚊𝚗 𝚜𝚎𝚗𝚍 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
│ 💡 𝚄𝚜𝚎: .𝚖𝚞𝚝𝚎 𝚘𝚏𝚏 𝚝𝚘 𝚞𝚗𝚖𝚞𝚝𝚎
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            
            await conn.sendMessage(from, { text: successMsg });
        }

        await m.react("✅");

    } catch (error) {
        console.error('Error in mute command:', error);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚖𝚞𝚝𝚎/𝚞𝚗𝚖𝚞𝚝𝚎 𝚐𝚛𝚘𝚞𝚙*");
        await m.react("❌");
    }
});
