const { cmd } = require('../momy');
const axios = require('axios');

// Function to enhance the prompt
function enhancePrompt(prompt) {
    // Quality enhancing keywords
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece',
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];

    // Randomly select 3-4 enhancers
    const numEnhancers = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    // Combine original prompt with enhancers
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

cmd({
    pattern: "imagine",
    alias: ["flux", "aiimage", "silapic"],
    desc: "generate AI image",
    category: "ai",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.replace(/^\.(imagine|generate|aiimage|pic)\s+/i, "").trim().length === 0) {
            return reply("*🎨 𝙰𝙸 𝙸𝙼𝙰𝙶𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙾𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .imagine your_prompt\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .imagine beautiful sunset over mountains\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .imagine cat wearing sunglasses\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const prompt = text.replace(/^\.(imagine|generate|aiimage|pic)\s+/i, "").trim();
        await reply("*🎨 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚒𝚗𝚐 𝚒𝚖𝚊𝚐𝚎...*");

        // Enhance the prompt with quality keywords
        const enhancedPrompt = enhancePrompt(prompt);

        // Make API request
        const response = await axios.get(`https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        // Convert response to buffer
        const imageBuffer = Buffer.from(response.data);

        // Send the generated image
        const caption = `╭━━【 🎨 𝙰𝙸 𝙸𝙼𝙰𝙶𝙴 】━━━╮
│ 📝 𝙿𝚛𝚘𝚖𝚙𝚝: ${prompt}
│ 🎨 𝙰𝙸: 𝙼𝚒𝚍𝚓𝚘𝚞𝚛𝚗𝚎𝚢/𝚂𝚝𝚊𝚋𝚕𝚎 𝙳𝚒𝚏𝚏𝚞𝚜𝚒𝚘𝚗
│ 📊 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: 𝙷𝙳 (𝟺𝙺)
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: caption
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (error) {
        console.error('Error in imagine command:', error);
        
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            reply("*⏰ 𝚃𝚒𝚖𝚎𝚘𝚞𝚝 𝚎𝚛𝚛𝚘𝚛. 𝙸𝚖𝚊𝚐𝚎 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚒𝚘𝚗 𝚝𝚘𝚘𝚔 𝚝𝚘𝚘 𝚕𝚘𝚗𝚐.*");
        } else if (error.response?.status === 429) {
            reply("*🚫 𝚃𝚘𝚘 𝚖𝚊𝚗𝚢 𝚛𝚎𝚚𝚞𝚎𝚜𝚝𝚜. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*");
        } else {
            reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝚒𝚖𝚊𝚐𝚎. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*");
        }
        
        await m.react("❌");
    }
});
