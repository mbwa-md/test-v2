const { cmd } = require('../momy');
const axios = require('axios');

cmd({
    pattern: "openai",
    alias: ["chatgpt", "silai", "open-gpt"],
    desc: "Chat with OpenAI",
    category: "ai",
    react: "🧠",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.replace(/^\.(openai|chatgpt|gpt3|open-gpt)\s+/i, "").trim().length === 0) {
            return reply("*🧠 𝙾𝙿𝙴𝙽𝙰𝙸 𝙲𝙷𝙰𝚃𝙱𝙾𝚃*\n\n*𝚄𝚂𝙰𝙶𝙴:* .openai your_message\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .openai Hello, how are you?\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const question = text.replace(/^\.(openai|chatgpt|gpt3|open-gpt)\s+/i, "").trim();
        await reply("*🧠 𝙰𝚜𝚔𝚒𝚗𝚐 𝙾𝚙𝚎𝚗𝙰𝙸...*");

        const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(question)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result) {
            await m.react("❌");
            return reply("*❌ 𝙾𝚙𝚎𝚗𝙰𝙸 𝚏𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍*");
        }

        const response = `
│ ${data.result}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in OpenAI command:", e);
        await m.react("❌");
        reply("*❌ 𝙰𝚗 𝚎𝚛𝚛𝚘𝚛 𝚘𝚌𝚌𝚞𝚛𝚛𝚎𝚍 𝚠𝚒𝚝𝚑 𝙾𝚙𝚎𝚗𝙰𝙸*");
    }
});

cmd({
    pattern: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing"],
    desc: "Chat with AI model",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.replace(/^\.(ai|bot|dj|gpt|gpt4|bing)\s+/i, "").trim().length === 0) {
            return reply("*🤖 𝙰𝙸 𝙲𝙷𝙰𝚃𝙱𝙾𝚃*\n\n*𝚄𝚂𝙰𝙶𝙴:* .ai your_message\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .ai What is artificial intelligence?\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const question = text.replace(/^\.(ai|bot|dj|gpt|gpt4|bing)\s+/i, "").trim();
        await reply("*🤖 𝙰𝚜𝚔𝚒𝚗𝚐 𝙰𝙸...*");

        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(question)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.message) {
            await m.react("❌");
            return reply("*❌ 𝙰𝙸 𝚏𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍*");
        }

        const response =`
│ ${data.message}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in AI command:", e);
        await m.react("❌");
        reply("*❌ 𝙰𝚗 𝚎𝚛𝚛𝚘𝚛 𝚘𝚌𝚌𝚞𝚛𝚛𝚎𝚍 𝚠𝚒𝚝𝚑 𝙰𝙸*");
    }
});

cmd({
    pattern: "deepseek",
    alias: ["deep", "seekai"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "👾",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.replace(/^\.(deepseek|deep|seekai)\s+/i, "").trim().length === 0) {
            return reply("*👾 𝙳𝙴𝙴𝙿𝚂𝙴𝙴𝙺 𝙰𝙸*\n\n*𝚄𝚂𝙰𝙶𝙴:* .deepseek your_message\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .deepseek Explain quantum physics\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const question = text.replace(/^\.(deepseek|deep|seekai)\s+/i, "").trim();
        await reply("*👾 𝙰𝚜𝚔𝚒𝚗𝚐 𝙳𝚎𝚎𝚙𝚂𝚎𝚎𝚔...*");

        const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(question)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.answer) {
            await m.react("❌");
            return reply("*❌ 𝙳𝚎𝚎𝚙𝚂𝚎𝚎𝚔 𝙰𝙸 𝚏𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍*");
        }

        const response = `
│ ${data.answer}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: response
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in DeepSeek AI command:", e);
        await m.react("❌");
        reply("*❌ 𝙰𝚗 𝚎𝚛𝚛𝚘𝚛 𝚘𝚌𝚌𝚞𝚛𝚛𝚎𝚍 𝚠𝚒𝚝𝚑 𝙳𝚎𝚎𝚙𝚂𝚎𝚎𝚔*");
    }
});
