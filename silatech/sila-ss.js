const { cmd } = require('../momy');
const axios = require('axios');

cmd({
    pattern: "screenshot",
    alias: ["ss", "webshot", "sitepic"],
    desc: "take website screenshot",
    category: "tools",
    react: "🖥️",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.replace(/^\.(screenshot|ss|webshot|sitepic)\s+/i, "").trim().length === 0) {
            return reply("*🖥️ 𝚆𝙴𝙱𝚂𝙸𝚃𝙴 𝚂𝙲𝚁𝙴𝙴𝙽𝚂𝙷𝙾𝚃*\n\n*𝚄𝚂𝙰𝙶𝙴:* .screenshot website_url\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .screenshot https://google.com\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const url = text.replace(/^\.(screenshot|ss|webshot|sitepic)\s+/i, "").trim();
        
        // Add https:// if missing
        let websiteUrl = url;
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
            websiteUrl = 'https://' + websiteUrl;
        }

        await reply("*🖥️ 𝚃𝚊𝚔𝚒𝚗𝚐 𝚜𝚌𝚛𝚎𝚎𝚗𝚜𝚑𝚘𝚝...*");

        try {
            // Try first API
            const apiUrl1 = `https://movanest.xyz/v2/ssweb?url=${encodeURIComponent(websiteUrl)}&width=1280&height=720&full_page=true`;
            const res1 = await axios.get(apiUrl1, { timeout: 60000 });

            if (res1.data?.status && res1.data.screenshot) {
                const screenshotUrl = res1.data.screenshot;
                
                const caption = `╭━━【 🖥️ 𝚆𝙴𝙱𝚂𝙸𝚃𝙴 𝚂𝙲𝚁𝙴𝙴𝙽𝚂𝙷𝙾𝚃 】━━━╮
│ 🔗 𝚄𝚁𝙻: ${websiteUrl}
│ 📐 𝚁𝚎𝚜𝚘𝚕𝚞𝚝𝚒𝚘𝚗: 𝟷𝟸𝟾𝟶𝚡𝟽𝟸𝟶 (𝙷𝙳)
│ 📊 𝙵𝚞𝚕𝚕 𝙿𝚊𝚐𝚎: 𝚈𝚎𝚜
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

                await conn.sendMessage(from, {
                    image: { url: screenshotUrl },
                    caption: caption
                }, { quoted: myquoted });

                await m.react("✅");
                return;
            }
        } catch (error) {
            console.log("First API failed, trying second...");
        }

        // Try second API
        try {
            const apiUrl2 = `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_API_KEY&url=${encodeURIComponent(websiteUrl)}&full_page=true&format=jpeg&quality=100`;
            const res2 = await axios.get(apiUrl2, { timeout: 60000, responseType: 'arraybuffer' });

            const caption = `╭━━【 🖥️ 𝚆𝙴𝙱𝚂𝙸𝚃𝙴 𝚂𝙲𝚁𝙴𝙴𝙽𝚂𝙷𝙾𝚃 】━━━╮
│ 🔗 𝚄𝚁𝙻: ${websiteUrl}
│ 📐 𝚁𝚎𝚜𝚘𝚕𝚞𝚝𝚒𝚘𝚗: 𝟷𝟸𝟾𝟶𝚡𝟽𝟸𝟶 (𝙷𝙳)
│ 📊 𝙵𝚞𝚕𝚕 𝙿𝚊𝚐𝚎: 𝚈𝚎𝚜
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

            await conn.sendMessage(from, {
                image: res2.data,
                caption: caption
            }, { quoted: myquoted });

            await m.react("✅");
            return;

        } catch (error) {
            console.error("Both APIs failed");
            throw error;
        }

    } catch (err) {
        console.error("SCREENSHOT COMMAND ERROR:", err.message);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚝𝚊𝚔𝚎 𝚜𝚌𝚛𝚎𝚎𝚗𝚜𝚑𝚘𝚝*");
        await m.react("❌");
    }
});
