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
        const text = args.join(" ");
        
        if (!text) {
            return reply("OpenAI Chatbot\n\nUsage: .openai your message\nExample: .openai Hello, how are you?\n\nPowered By Sila Tech");
        }

        await reply("Asking OpenAI...");

        const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result) {
            await m.react("❌");
            return reply("OpenAI failed to respond");
        }

        await conn.sendMessage(from, {
            text: data.result + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in OpenAI command:", e);
        await m.react("❌");
        reply("An error occurred with OpenAI");
    }
});

cmd({
    pattern: "silaai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing"],
    desc: "Chat with AI model",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = args.join(" ");
        
        if (!text) {
            return reply("AI Chatbot\n\nUsage: .ai your message\nExample: .ai What is artificial intelligence?\n\nPowered By Sila Tech");
        }

        await reply("Asking AI...");

        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.message) {
            await m.react("❌");
            return reply("AI failed to respond");
        }

        await conn.sendMessage(from, {
            text: data.message + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in AI command:", e);
        await m.react("❌");
        reply("An error occurred with AI");
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
        const text = args.join(" ");
        
        if (!text) {
            return reply("DeepSeek AI\n\nUsage: .deepseek your message\nExample: .deepseek Explain quantum physics\n\nPowered By Sila Tech");
        }

        await reply("Asking DeepSeek...");

        const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.answer) {
            await m.react("❌");
            return reply("DeepSeek AI failed to respond");
        }

        await conn.sendMessage(from, {
            text: data.answer + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in DeepSeek AI command:", e);
        await m.react("❌");
        reply("An error occurred with DeepSeek");
    }
});

// GPT-5 Command
cmd({
    pattern: "ai",
    alias: ["gpt5", "gpt5plus"],
    desc: "Chat with SILA AI",
    category: "ai",
    react: "🚀",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = args.join(" ");
        
        if (!text) {
            return reply("GPT-5 AI\n\nUsage: .gpt5 your message\nExample: .gpt5 Write me a poem about nature\n\nPowered By Sila Tech");
        }

        await reply("Asking GPT-5...");

        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.response) {
            await m.react("❌");
            return reply("GPT-5 failed to respond");
        }

        await conn.sendMessage(from, {
            text: data.response + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in GPT-5 command:", e);
        await m.react("❌");
        reply("An error occurred with GPT-5");
    }
});

// Copilot Command
cmd({
    pattern: "copilot",
    alias: ["think", "copilotai", "microsoftai"],
    desc: "Chat with Microsoft Copilot AI",
    category: "ai",
    react: "💻",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = args.join(" ");
        
        if (!text) {
            return reply("Microsoft Copilot AI\n\nUsage: .copilot your message\nExample: .copilot Help me write code in JavaScript\n\nPowered By Sila Tech");
        }

        await reply("Asking Copilot...");

        const apiUrl = `https://api.yupra.my.id/api/ai/copilot-think?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.response) {
            await m.react("❌");
            return reply("Copilot failed to respond");
        }

        await conn.sendMessage(from, {
            text: data.response + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in Copilot command:", e);
        await m.react("❌");
        reply("An error occurred with Copilot");
    }
});

// Advanced AI Command
cmd({
    pattern: "advai",
    alias: ["advancedai", "smartai", "superai"],
    desc: "Advanced AI with multiple model fallback",
    category: "ai",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = args.join(" ");
        
        if (!text) {
            return reply("Advanced AI\n\nUsage: .advai your message\nExample: .advai Solve this math problem\n\nPowered By Sila Tech");
        }

        await reply("Processing with advanced AI...");

        let response = null;
        
        // Try multiple APIs in sequence
        const apis = [
            { url: `https://api.yupra.my.id/api/ai/gpt5?q=${encodeURIComponent(text)}`, key: 'response' },
            { url: `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(text)}`, key: 'message' },
            { url: `https://vapis.my.id/api/openai?q=${encodeURIComponent(text)}`, key: 'result' },
            { url: `https://api.yupra.my.id/api/ai/copilot-think?q=${encodeURIComponent(text)}`, key: 'response' }
        ];

        for (let api of apis) {
            try {
                const { data } = await axios.get(api.url);
                if (data && data[api.key]) {
                    response = data[api.key];
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!response) {
            await m.react("❌");
            return reply("All AI services failed to respond");
        }

        await conn.sendMessage(from, {
            text: response + "\n\nPowered By Sila Tech"
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (e) {
        console.error("Error in Advanced AI command:", e);
        await m.react("❌");
        reply("An error occurred with Advanced AI");
    }
});
