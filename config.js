const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

module.exports = {
    // ===========================================================
    // 1. BASIC CONFIGURATION (Session & Database)
    // ===========================================================
    SESSION_ID: process.env.SESSION_ID || "MOMY-KIDY", 
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://kxshrii:i7sgjXF6SO2cTJwU@kelumxz.zggub8h.mongodb.net/',
    
    // ===========================================================
    // 2. BOT INFORMATION
    // ===========================================================
    PREFIX: process.env.PREFIX || '.',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '255789661031',
    BOT_NAME: "MOMY-KIDY",
    BOT_FOOTER: '> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',
    
    // Work mode: public, private, group, inbox
    WORK_TYPE: process.env.WORK_TYPE || "public", 
    
    // ===========================================================
    // 3. AUTOMATIC FEATURES (STATUS)
    // ===========================================================
    AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS || 'true', // Automatically view statuses
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'true', // Automatically like statuses
    AUTO_LIKE_EMOJI: ['⚔️', '🔥', '⚡', '💀', '🩸', '🛡️', '🎯', '💣', '🏹', '🔪', '🗡️', '🏆', '💎', '🌟', '💥', '🌪️', '☠️', '👑', '⚙️', '🔰', '💢', '💫', '🌀', '❤️', '💗', '🤍', '🖤', '👀', '😎', '✅', '😁', '🌙', '☄️', '🌠', '🌌', '💚'], 
    
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'false', // Reply to statuses
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || '🖥️', // Reply message
    
    // ===========================================================
    // 4. CHAT & PRESENCE FEATURES
    // ===========================================================
    READ_MESSAGE: process.env.READ_MESSAGE || 'false', // Mark messages as read (Blue Tick)
    AUTO_TYPING: process.env.AUTO_TYPING || 'false', // Show "Typing..."
    AUTO_RECORDING: process.env.AUTO_RECORDING || 'false', // Show "Recording..."
    
    // ===========================================================
    // 5. GROUP MANAGEMENT
    // ===========================================================
    WELCOME_ENABLE: process.env.WELCOME_ENABLE || 'true',
    GOODBYE_ENABLE: process.env.GOODBYE_ENABLE || 'true',
    WELCOME_MSG: process.env.WELCOME_MSG || null, 
    GOODBYE_MSG: process.env.GOODBYE_MSG || null, 
    WELCOME_IMAGE: process.env.WELCOME_IMAGE || null, 
    GOODBYE_IMAGE: process.env.GOODBYE_IMAGE || null,
    
    GROUP_INVITE_LINK: process.env.GROUP_INVITE_LINK || 'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks',
    
    // ===========================================================
    // 6. SECURITY & ANTI-CALL
    // ===========================================================
    ANTI_CALL: process.env.ANTI_CALL || 'false', // Reject calls
    REJECT_MSG: process.env.REJECT_MSG || '🔒 NO CALLS ALLOWED 🔒',
    
    // ===========================================================
    // 7. IMAGES & LINKS
    // ===========================================================
    IMAGE_PATH: 'https://files.catbox.moe/natk49.jpg',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
    GROUP_LINK_1: 'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks',
    GROUP_LINK_2: 'https://chat.whatsapp.com/C03aOCLQeRUH821jWqRPC6',
    
    // ===========================================================
    // 8. CHANNEL JIDS
    // ===========================================================
    CHANNEL_JID_1: '120363402325089913@newsletter',
    CHANNEL_JID_2: '120363422610520277@newsletter',
    
    // ===========================================================
    // 9. EXTERNAL API (Optional)
    // ===========================================================
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8526421940:AAFU39FEU61U3ORKIe8NuqzBACydzqcOgSI',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7303596375'
};
