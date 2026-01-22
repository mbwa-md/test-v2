const { cmd } = require('../momy');
const axios = require('axios');

// Storage for chatbot settings
const chatbotState = {
    global: true, // Global on/off for all chats
    groups: {}, // Group-specific settings
    inbox: {} // Private chat settings
};

// Store conversation context
const conversationContext = {};

cmd({
    pattern: "chatbot",
    alias: ["autobot", "ai-bot", "autoreply"],
    desc: "Enable/disable AI chatbot",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, args, isCreator, sender }) => {
    try {
        const chatId = isGroup ? from : sender;
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            const status = isGroup ? 
                (chatbotState.groups[from] !== false ? 'ON' : 'OFF') :
                (chatbotState.inbox[sender] !== false ? 'ON' : 'OFF');
            
            return reply(`Chatbot Status: ${status}\n\nUsage:\n.chatbot on - Turn on\n.chatbot off - Turn off`);
        }
        
        if (action === 'on') {
            if (isGroup) {
                if (!isCreator) return reply("Only admin can enable chatbot in group");
                chatbotState.groups[from] = true;
                await reply("Chatbot enabled for this group");
            } else {
                chatbotState.inbox[sender] = true;
                await reply("Chatbot enabled for your chat");
            }
            await m.react("✅");
        } 
        else if (action === 'off') {
            if (isGroup) {
                if (!isCreator) return reply("Only admin can disable chatbot in group");
                chatbotState.groups[from] = false;
                await reply("Chatbot disabled for this group");
            } else {
                chatbotState.inbox[sender] = false;
                await reply("Chatbot disabled for your chat");
            }
            await m.react("⏸️");
        }
        else if (action === 'global' && isCreator) {
            chatbotState.global = !chatbotState.global;
            await reply(`Global chatbot ${chatbotState.global ? 'enabled' : 'disabled'}`);
            await m.react("🌍");
        }
        else if (action === 'clear' && isCreator) {
            conversationContext[chatId] = [];
            await reply("Chat history cleared");
            await m.react("🗑️");
        }
        else {
            return reply("Invalid command\nUse: .chatbot on/off");
        }
        
    } catch (e) {
        console.error("Chatbot command error:", e);
        await m.react("❌");
        reply("Error processing chatbot command");
    }
});

// Function to check if chatbot should respond
function shouldRespond(chatId, isGroup, sender) {
    // Check global setting
    if (!chatbotState.global) return false;
    
    // Check specific chat settings
    if (isGroup) {
        return chatbotState.groups[chatId] === true;
    } else {
        return chatbotState.inbox[sender] === true;
    }
}

// Function to get AI response
async function getAIResponse(message, chatId) {
    try {
        // Maintain conversation context
        if (!conversationContext[chatId]) {
            conversationContext[chatId] = [];
        }
        
        // Add new message to context (keep last 5 messages)
        conversationContext[chatId].push({ role: "user", content: message });
        if (conversationContext[chatId].length > 5) {
            conversationContext[chatId] = conversationContext[chatId].slice(-5);
        }
        
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?q=${encodeURIComponent(message)}`;
        const { data } = await axios.get(apiUrl, { timeout: 30000 });
        
        if (!data || !data.response) {
            throw new Error("No response from AI");
        }
        
        return data.response;
        
    } catch (error) {
        console.error("AI Response Error:", error.message);
        return "I'm here to help!";
    }
}

// Export the message handler
module.exports.chatbotHandler = async (conn, mek, m, { from, sender, isGroup, text, reply }) => {
    try {
        const chatId = isGroup ? from : sender;
        
        // Check if chatbot should respond
        if (!shouldRespond(from, isGroup, sender)) return;
        
        // Don't respond to bot commands
        if (text.startsWith('.')) return;
        
        // Don't respond to very short messages
        if (text.trim().length < 2) return;
        
        // Don't respond to bot's own messages
        if (mek.key.fromMe) return;
        
        // Get AI response
        const response = await getAIResponse(text, chatId);
        
        // Send response
        await conn.sendMessage(from, {
            text: response,
            mentions: isGroup ? [sender] : []
        }, { quoted: mek });
        
    } catch (error) {
        console.error("Chatbot handler error:", error);
    }
};
