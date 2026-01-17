const config = require('../config')
const { cmd, commands } = require('../momy')
const { isUrl } = require('../lib/functions')

cmd({
    pattern: "kick",
    react: "👢",
    alias: ["remove", "kickout"],
    desc: "Remove a member from group",
    category: "group",
    use: ".kick @user",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup, senderNumber, groupAdmins, mentionedJid }) => {
    try {
        if (!isGroup) return reply("*YEH COMMAND SIRF GROUPS ME USE KARE 😊*");

        const botOwner = conn.user.id.split(":")[0];
        const senderJid = senderNumber + "@s.whatsapp.net";

        if (!groupAdmins.includes(senderJid) && senderNumber !== botOwner) {
            return reply("*YEH COMMAND SIRF ADMINS USE KAR SAKTE HAI 😊*");
        }

        // Bot admin check
        const groupInfo = await conn.groupMetadata(from);
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";

        if (!groupInfo.participants.find(p => p.id === botNumber && p.admin)) {
            return reply("*PEHLE MUJHE GROUP ADMIN BANAO 🥺*");
        }

        if (!mentionedJid || mentionedJid.length === 0) {
            return reply("*❌ KISI MEMBER KO TAG KARO*\n\nExample:\n.kick @user");
        }

        for (let user of mentionedJid) {
            await conn.groupParticipantsUpdate(from, [user], "remove");
        }

        reply(
            "*👢 MEMBER REMOVE HO GAYA 👢*\n\n" +
            "⚠️ Group rules follow na karne ki wajah se\n\n" +
            "*👑 SILA MD WHATSAPP BOT 👑*"
        );

    } catch (e) {
        console.error("Kick Error:", e);
        reply("*❌ MEMBER REMOVE KARNE ME ERROR AYA 🥺*");
    }
});