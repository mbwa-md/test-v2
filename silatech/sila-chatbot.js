const { cmd } = require('../momy');
const axios = require('axios');

// In-memory storage for chatbot settings
const chatbotSettings = new Map();

// Chatbot handler
async function handleChatbot(conn, mek, m, { from, text, sender, pushname, isGroup }) {
    try {
        if (!isGroup) return;
        
        const setting = chatbotSettings.get(from);
        if (!setting || !setting.enabled) return;
        
        if (!text || text.startsWith('.') || text.startsWith('!') || text.startsWith('/')) return;
        
        // Ignore very short messages
        if (text.length < 2) return;
        
        // Don't respond to bot messages
        if (sender === conn.user.id) return;
        
        // Check if message mentions the bot
        const botName = "sila";
        const isMentioned = text.toLowerCase().includes(botName);
        
        // Only respond if bot is mentioned or random response (30% chance)
        if (!isMentioned && Math.random() > 0.3) return;
        
        // Send typing indicator
        await conn.sendPresenceUpdate('composing', from);
        
        // Get response from AI
        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(text)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });
        
        if (!data || !data.message) return;
        
        // Add delay for natural feel
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send response
        let response = data.message;
        if (response.length > 500) {
            response = response.substring(0, 500) + "...";
        }
        
        await conn.sendMessage(from, {
            text: response,
            mentions: [sender]
        }, { quoted: mek });
        
    } catch (error) {
        console.error('Chatbot error:', error.message);
        // Don't send error messages to avoid spam
    }
}

// Chatbot command
cmd({
    pattern: "chatbot",
    alias: ["autochat", "silabot", "chat"],
    desc: "enable/disable group chatbot",
    category: "group",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, isGroup, participants, groupMetadata, sender }) => {
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

        const action = args[0]?.toLowerCase();
        
        if (!action || !['on', 'off', 'status'].includes(action)) {
            const helpMsg = `╭━━【 🤖 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 】━━━╮
│ 
│ *𝙰𝚄𝚃𝙾𝙼𝙰𝚃𝙸𝙲 𝙶𝚁𝙾𝚄𝙿 𝙲𝙷𝙰𝚃𝙱𝙾𝚃*
│ 
│ *𝚄𝚂𝙰𝙶𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:*
│ 
│ 🔵 *𝙴𝙽𝙰𝙱𝙻𝙴:*
│ .𝚌𝚑𝚊𝚝𝚋𝚘𝚝 𝚘𝚗
│ 
│ 🔴 *𝙳𝙸𝚂𝙰𝙱𝙻𝙴:*
│ .𝚌𝚑𝚊𝚝𝚋𝚘𝚝 𝚘𝚏𝚏
│ 
│ 📊 *𝙲𝙷𝙴𝙲𝙺 𝚂𝚃𝙰𝚃𝚄𝚂:*
│ .𝚌𝚑𝚊𝚝𝚋𝚘𝚝 𝚜𝚝𝚊𝚝𝚞𝚜
│ 
│ ──────────────────
│ *𝙷𝙾𝚆 𝙸𝚃 𝚆𝙾𝚁𝙺𝚂:*
│ • 𝙱𝚘𝚝 𝚠𝚒𝚕𝚕 𝚛𝚎𝚜𝚙𝚘𝚗𝚍 𝚝𝚘 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
│ • 𝙿𝚛𝚒𝚘𝚛𝚒𝚝𝚢 𝚝𝚘 𝚖𝚎𝚗𝚝𝚒𝚘𝚗𝚜
│ • 𝚁𝚊𝚗𝚍𝚘𝚖 𝚛𝚎𝚜𝚙𝚘𝚗𝚜𝚎𝚜 (𝟹𝟶% 𝚌𝚑𝚊𝚗𝚌𝚎)
│ • 𝙰𝙸-𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚛𝚎𝚜𝚙𝚘𝚗𝚜𝚎𝚜
│ 
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            return reply(helpMsg);
        }

        // Get current setting
        const currentSetting = chatbotSettings.get(from) || { enabled: false };

        switch (action) {
            case 'on':
                if (currentSetting.enabled) {
                    return reply("*🤖 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚎𝚗𝚊𝚋𝚕𝚎𝚍*");
                }
                chatbotSettings.set(from, { enabled: true });
                await reply(`*✅ 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚎𝚗𝚊𝚋𝚕𝚎𝚍*\n\n*𝙸𝚗𝚜𝚝𝚛𝚞𝚌𝚝𝚒𝚘𝚗𝚜:*\n• 𝙼𝚎𝚗𝚝𝚒𝚘𝚗 "𝚜𝚒𝚕𝚊" 𝚝𝚘 𝚝𝚊𝚕𝚔 𝚝𝚘 𝚋𝚘𝚝\n• 𝙱𝚘𝚝 𝚠𝚒𝚕𝚕 𝚊𝚕𝚜𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍 𝚛𝚊𝚗𝚍𝚘𝚖𝚕𝚢\n• 𝚄𝚜𝚎 *.𝚌𝚑𝚊𝚝𝚋𝚘𝚝 𝚘𝚏𝚏* 𝚝𝚘 𝚍𝚒𝚜𝚊𝚋𝚕𝚎`);
                await m.react("🤖");
                break;

            case 'off':
                if (!currentSetting.enabled) {
                    return reply("*🤖 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚍𝚒𝚜𝚊𝚋𝚕𝚎𝚍*");
                }
                chatbotSettings.set(from, { enabled: false });
                await reply("*🔴 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚍𝚒𝚜𝚊𝚋𝚕𝚎𝚍*");
                await m.react("🔴");
                break;

            case 'status':
                const status = currentSetting.enabled ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳';
                const statusMsg = `╭━━【 🤖 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 】━━━╮
│ 
│ 📍 𝙶𝚛𝚘𝚞𝚙: ${groupData.subject}
│ 📊 𝚂𝚝𝚊𝚝𝚞𝚜: ${status}
│ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${members.length}
│ 🤖 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎: 𝚜𝚒𝚕𝚊
│ 
│ ──────────────────
│ *𝙷𝙾𝚆 𝚃𝙾 𝚄𝚂𝙴:*
│ • 𝚃𝚢𝚙𝚎 "𝚑𝚎𝚢 𝚜𝚒𝚕𝚊"
│ • 𝙰𝚜𝚔 𝚚𝚞𝚎𝚜𝚝𝚒𝚘𝚗𝚜 𝚕𝚒𝚔𝚎 𝚗𝚘𝚛𝚖𝚊𝚕
│ • 𝙱𝚘𝚝 𝚠𝚒𝚕𝚕 𝚛𝚎𝚜𝚙𝚘𝚗𝚍 𝚊𝚞𝚝𝚘𝚖𝚊𝚝𝚒𝚌𝚊𝚕𝚕𝚢
│ 
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                await reply(statusMsg);
                break;
        }

    } catch (error) {
        console.error('Error in chatbot command:', error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚖𝚊𝚗𝚊𝚐𝚒𝚗𝚐 𝚌𝚑𝚊𝚝𝚋𝚘𝚝*");
        await m.react("❌");
    }
});

// Export functions
module.exports = {
    chatbotSettings,
    handleChatbot
};
