const { cmd } = require('../momy')
const fs = require('fs')
const axios = require('axios')
const { isUrl } = require('../lib/functions')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

cmd({
    pattern: "grouppic",
    alias: ["setgpp", "setgrouppic", "groupdp", "gpp"],
    react: "🖼️",
    desc: "Change group profile picture",
    category: "group",
    use: ".grouppic (reply image / image url)",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, args, reply }) => {
    try {
        if (!isGroup)
            return reply("*YEH COMMAND SIRF GROUPS ME USE KARE 😊*")

        if (!isAdmins)
            return reply("*YEH COMMAND SIRF GROUP ADMINS USE KAR SAKTE HAI 😊*")

        if (!isBotAdmins)
            return reply("*PEHLE MUJHE GROUP ADMIN BANAO 🥺*")

        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ""
        let imagePath

        // tmp folder
        const tmpDir = "./tmp"
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

        // 🖼️ Case 1: Reply / sent image
        if (mime.startsWith("image/")) {
            const stream = await downloadContentFromMessage(quoted.msg, "image")
            let buffer = Buffer.from([])
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

            imagePath = `${tmpDir}/gpp_${Date.now()}.jpg`
            fs.writeFileSync(imagePath, buffer)
        }

        // 🌐 Case 2: Image URL
        else if (args[0] && isUrl(args[0])) {
            const res = await axios.get(args[0], { responseType: "arraybuffer" })
            imagePath = `${tmpDir}/gpp_${Date.now()}.jpg`
            fs.writeFileSync(imagePath, res.data)
        }

        else {
            return reply(
                "*📸 GROUP PHOTO SET KARNE KE LIYE:*\n\n" +
                "• Kisi image ko reply karo\n" +
                "• Ya image URL do\n\n" +
                "*Example:*\n.grouppic https://image-url"
            )
        }

        // update group profile picture
        await conn.updateProfilePicture(from, fs.readFileSync(imagePath))

        fs.unlinkSync(imagePath)

        reply("*✅ GROUP KI PROFILE PHOTO CHANGE HO GAYI HAI 🖼️*")

    } catch (e) {
        console.log("GROUPPIC ERROR:", e)
        reply("*❌ GROUP PHOTO CHANGE NAHI HO SAKI 🥺*")
    }
})