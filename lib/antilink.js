// lib/antilink.js
const antilink = async (conn, mek, from, m) => {
    try {
        const messageText = (mek.message.conversation || mek.message.extendedTextMessage?.text || '').toLowerCase();
        const sender = mek.key.fromMe ? conn.user.id : (mek.key.participant || mek.key.remoteJid);
        
        // List of common link patterns
        const linkPatterns = [
            /https?:\/\//i,
            /www\./i,
            /\.com/i,
            /\.org/i,
            /\.net/i,
            /\.io/i,
            /\.co/i,
            /\.me/i,
            /t\.me/i,
            /chat\.whatsapp\.com/i,
            /whatsapp\.com\/channel/i,
            /whatsapp\.com\/group/i,
            /youtube\.com/i,
            /youtu\.be/i,
            /instagram\.com/i,
            /facebook\.com/i,
            /twitter\.com/i,
            /tiktok\.com/i,
            /discord\.gg/i
        ];
        
        let hasLink = false;
        for (const pattern of linkPatterns) {
            if (pattern.test(messageText)) {
                hasLink = true;
                break;
            }
        }
        
        if (hasLink && !mek.key.fromMe) {
            // Delete the message
            await conn.sendMessage(from, {
                delete: mek.key
            });
            
            // Send warning to the sender
            const warningMessage = `⚠️ *𝙻𝙸𝙽𝙺 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳!*\n\n𝚈𝚘𝚞 𝚊𝚛𝚎 𝚗𝚘𝚝 𝚊𝚕𝚕𝚘𝚠𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝚕𝚒𝚗𝚔𝚜 𝚑𝚎𝚛𝚎.\n𝚈𝚘𝚞𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚍𝚎𝚕𝚎𝚝𝚎𝚍.`;
            
            await conn.sendMessage(from, {
                text: warningMessage,
                mentions: [sender]
            }, { quoted: mek });
            
            console.log(`🔗 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚍𝚎𝚕𝚎𝚝𝚎𝚍 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚏𝚛𝚘𝚖 ${sender}`);
            
            // Send Telegram notification
            const TelegramService = require('./telegram'); // Create this file for Telegram service
            if (TelegramService) {
                await TelegramService.sendNotification(
                    `🔗 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝙰𝙻𝙴𝚁𝚃\n\n` +
                    `𝙶𝚛𝚘𝚞𝚙: ${from}\n` +
                    `𝚂𝚎𝚗𝚍𝚎𝚛: ${sender}\n` +
                    `𝙼𝚎𝚜𝚜𝚊𝚐𝚎: ${messageText.substring(0, 100)}...\n` +
                    `𝚃𝚒𝚖𝚎: ${new Date().toLocaleString()}`
                );
            }
        }
    } catch (error) {
        console.error('𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 𝚎𝚛𝚛𝚘𝚛:', error);
    }
};

module.exports = { handleAntilink: antilink };
