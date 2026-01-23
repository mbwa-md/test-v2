const { cmd } = require('../momy');
const axios = require('axios');


// State storage kwa kuhifadhi hali ya chatbot
let chatbotState = {
    enabled: true,
    mode: 'both' // 'both', 'group', 'inbox'
};

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© 𝐒𝐈𝐋𝐀-𝐌𝐃",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐒𝐈𝐋𝐀 𝐌𝐃 𝐁𝐎𝐓\nORG:𝐒𝐈𝐋𝐀-𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
    }
  }
};

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

cmd({
    pattern: "chatbot",
    alias: ["ai", "bot"],
    react: "🤖",
    desc: "Chatbot control settings",
    category: "ai",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!args[0]) {
        return await conn.sendMessage(from, {
            text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒 ━━━━━━━━
┃ 🟢 Status: ${chatbotState.enabled ? 'ON' : 'OFF'}
┃ 🌐 Mode: ${chatbotState.mode.toUpperCase()}
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 𝐔𝐬𝐚𝐠𝐞:
┃ • ${prefix}chatbot on - Enable chatbot
┃ • ${prefix}chatbot off - Disable chatbot
┃ • ${prefix}chatbot group - Groups only
┃ • ${prefix}chatbot inbox - Inbox only
┃ • ${prefix}chatbot both - Groups & Inbox
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    const action = args[0].toLowerCase();
    
    switch(action) {
        case 'on':
            chatbotState.enabled = true;
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 ━━━━━━━━━━━━━━━
┃ ✅ Chatbot has been ENABLED
┃ Mode: ${chatbotState.mode.toUpperCase()}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
            break;
            
        case 'off':
            chatbotState.enabled = false;
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 ━━━━━━━━━━━━━━━
┃ 🔴 Chatbot has been DISABLED
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
            break;
            
        case 'group':
            chatbotState.mode = 'group';
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 ━━━━━━━━━━━━━━━
┃ 📱 Mode set to GROUPS ONLY
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
            break;
            
        case 'inbox':
            chatbotState.mode = 'inbox';
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 ━━━━━━━━━━━━━━━
┃ 💬 Mode set to INBOX ONLY
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
            break;
            
        case 'both':
            chatbotState.mode = 'both';
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 ━━━━━━━━━━━━━━━
┃ 🌐 Mode set to GROUPS & INBOX
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
            break;
            
        default:
            await conn.sendMessage(from, {
                text: `❌ Invalid option. Use:\n• on\n• off\n• group\n• inbox\n• both`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ Command failed`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});

// Auto-reply handler kwa mazungumzo ya kawaida (sio command)
// Huenda hii iwe katika main file yako au event handler
module.exports.chatbotHandler = async (conn, message) => {
    try {
        const { from, body, isGroup, sender } = message;
        
        // Angalia kama si command (haianzi na prefix)
        if (body.startsWith('.')) return;
        
        // Angalia kama chatbot imewashwa
        if (!chatbotState.enabled) return;
        
        // Angalia mode
        if (chatbotState.mode === 'group' && !isGroup) return;
        if (chatbotState.mode === 'inbox' && isGroup) return;
        
        // Kata nafasi mbele na nyuma ya message
        const userMessage = body.trim();
        if (!userMessage) return;
        
        // Toa baadhi ya maneno ambayo hatutaki kujibu
        const ignoreWords = ['http://', 'https://', 'www.', '.com', '.net', '.org'];
        if (ignoreWords.some(word => userMessage.toLowerCase().includes(word))) return;
        
        // Piga API ya GPT
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(userMessage)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.result) {
            // Tuma reply kwa kawaida kama mtu anavyoandika
            await conn.sendMessage(from, { 
                text: data.result 
            }, { 
                quoted: message 
            });
        }
        
    } catch (error) {
        console.error('Chatbot error:', error);
        // Usitumie error message kwa user, achia tu ikose
    }
};

// Export state kwa ajili ya ku-access kutoka files nyingine
module.exports.chatbotState = chatbotState;
