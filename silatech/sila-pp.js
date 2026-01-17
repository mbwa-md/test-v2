const { cmd } = require('../inconnuboy')
const fs = require('fs')
const path = require('path')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

cmd({
    pattern: "pp",
    alias: ["setpp", "setbotpp", "setprofile"],
    react: "😇",
    desc: "Change bot profile picture (Owner only)",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isCreator, reply }) => {
    try {
        if (!isCreator)
            return reply("*YEH COMMAND SIRF BOT OWNER KE LIYE HAI 😎*")

        // ✅ STRONG REPLY CHECK
        if (!m.quoted || !m.quoted.message) {
            return reply(
                "*🥺 KISI PHOTO KO REPLY KARO*\n\n" +
                "*Example:*\nReply image + `.pp`"
            )
        }

        // 🔥 IMAGE DETECTION (ALL CASES)
        let msg = m.quoted.message

        if (msg.viewOnceMessageV2)
            msg = msg.viewOnceMessageV2.message
        if (msg.viewOnceMessageV2Extension)
            msg = msg.viewOnceMessageV2Extension.message

        const type = Object.keys(msg)[0]
        if (type !== "imageMessage") {
            return reply("*❌ SIRF PHOTO PE `.pp` USE KARO 🥺*")
        }

        // 📂 tmp folder
        const tmpDir = "./tmp"
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

        // ⬇️ DOWNLOAD IMAGE
        const stream = await downloadContentFromMessage(
            msg.imageMessage,
            "image"
        )

        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

        const filePath = path.join(tmpDir, `botpp_${Date.now()}.jpg`)
        fs.writeFileSync(filePath, buffer)

        // 🖼️ SET PROFILE PIC
        await conn.updateProfilePicture(
            conn.user.id,
            fs.readFileSync(filePath)
        )

        fs.unlinkSync(filePath)

        reply("*✅ BOT KI PROFILE PHOTO CHANGE HO GAYI HAI 😍*")

    } catch (e) {
        console.log("SETPP ERROR:", e)
        reply("*❌ PROFILE PHOTO CHANGE NAHI HO SAKI 🥺*")
    }
})