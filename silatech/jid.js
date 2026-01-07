const { cmd } = require('../momy');

cmd({
    pattern: "jid",
    alias: ["getjid", "id"],
    desc: "get jid information",
    category: "tools",
    react: "🆔",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender, pushname, isGroup, myquoted }) => {
    try {
        let targetJid;
        let targetName;
        let targetType;
        let isMentioned = false;
        let isQuoted = false;

        // Check for mentions
        if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            isMentioned = true;
        }
        // Check for quoted message
        else if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            isQuoted = true;
        }
        // Check for channel
        else if (from.endsWith('@newsletter')) {
            targetJid = from;
            targetType = "Channel";
        }
        // Default to current user
        else {
            targetJid = sender;
        }

        // Determine type
        if (!targetType) {
            if (targetJid.endsWith('@g.us')) {
                targetType = "Group";
            } else if (targetJid.endsWith('@newsletter')) {
                targetType = "Channel";
            } else {
                targetType = "User";
            }
        }

        // Get name based on type
        if (targetType === "User") {
            if (isMentioned) targetName = "Mentioned User";
            else if (isQuoted) targetName = "Quoted User";
            else if (targetJid === sender) targetName = pushname || "You";
            else targetName = "User";
            
            // Try to get actual name
            try {
                const [userData] = await conn.onWhatsApp(targetJid);
                if (userData?.exists) {
                    targetName = userData.name || userData.verifiedName || targetName;
                }
            } catch (e) {}
        } 
        else if (targetType === "Group") {
            try {
                const metadata = await conn.groupMetadata(targetJid);
                targetName = metadata.subject || "Group";
            } catch (e) {
                targetName = "Group";
            }
        }
        else if (targetType === "Channel") {
            targetName = "Channel";
        }

        // Send response
        let response = `╭━━【 🆔 𝙹𝙸𝙳 𝙸𝙽𝙵𝙾 】━━━━╮
│ 📛 𝙽𝚊𝚖𝚎: ${targetName}
│ 🔤 𝚃𝚢𝚙𝚎: ${targetType}
│ 🆔 𝙹𝙸𝙳: ${targetJid}
╰━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

        // React to show success
        await m.react("✅");

    } catch (error) {
        console.error("JID error:", error);
        reply("*error getting jid information*");
        await m.react("❌");
    }
});
