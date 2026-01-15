// telegram-config.js
module.exports = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '7303596375',
    
    // Telegram bot settings
    TELEGRAM_BOT_NAME: 'MOMY-KIDY Pairing Bot',
    TELEGRAM_BOT_USERNAME: 'momy_kidy_bot',
    
    // Webhook settings (optional)
    TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL || null,
    TELEGRAM_WEBHOOK_PORT: process.env.TELEGRAM_WEBHOOK_PORT || 3001,
    
    // Database for Telegram sessions
    TELEGRAM_SESSION_PATH: './database/telegram-sessions/',
    
    // Commands
    COMMANDS: [
        { command: 'start', description: 'Start the bot' },
        { command: 'pair', description: 'Pair WhatsApp bot' },
        { command: 'owner', description: 'Contact owner' },
        { command: 'menu', description: 'Show commands menu' },
        { command: 'status', description: 'Check bot status' },
        { command: 'help', description: 'Show help information' }
    ],
    
    // Messages
    MESSAGES: {
        WELCOME: `🤖 *𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝚂𝚈𝚂𝚃𝙴𝙼* 🤖\n\n👋 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 𝚝𝚘 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙱𝚘𝚝 𝙿𝚊𝚒𝚛𝚒𝚗𝚐 𝚂𝚢𝚜𝚝𝚎𝚖!\n\n𝚄𝚜𝚎 /𝚙𝚊𝚒𝚛 <𝚗𝚞𝚖𝚋𝚎𝚛> 𝚝𝚘 𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚢𝚘𝚞𝚛 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝!`,
        HELP: `📚 *𝙷𝙴𝙻𝙿 𝙼𝙴𝙽𝚄*\n\n/𝚜𝚝𝚊𝚛𝚝 - 𝚂𝚝𝚊𝚛𝚝 𝚝𝚑𝚎 𝚋𝚘𝚝\n/𝚙𝚊𝚒𝚛 <𝚗𝚞𝚖𝚋𝚎𝚛> - 𝙿𝚊𝚒𝚛 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝\n/𝚘𝚠𝚗𝚎𝚛 - 𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛\n/𝚖𝚎𝚗𝚞 - 𝚂𝚑𝚘𝚠 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜 𝚖𝚎𝚗𝚞\n/𝚜𝚝𝚊𝚝𝚞𝚜 - 𝙲𝚑𝚎𝚌𝚔 𝚋𝚘𝚝 𝚜𝚝𝚊𝚝𝚞𝚜\n/𝚑𝚎𝚕𝚙 - 𝚂𝚑𝚘𝚠 𝚝𝚑𝚒𝚜 𝚖𝚎𝚜𝚜𝚊𝚐𝚎`,
        OWNER: `👑 *𝙾𝚆𝙽𝙴𝚁 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽*\n\n📛 𝙽𝚊𝚖𝚎: 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑\n📞 𝙿𝚑𝚘𝚗𝚎: +255 789 661 031\n📧 𝙴𝚖𝚊𝚒𝚕: 𝚜𝚒𝚕𝚊𝚝𝚎𝚌𝚑@𝚎𝚡𝚊𝚖𝚙𝚕𝚎.𝚌𝚘𝚖\n\n🔗 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖: @𝚜ir_sila`
    },
    
    // URLs
    URLS: {
        GITHUB: 'https://github.com/Sila-Md/SILA-MD',
        TELEGRAM_CHANNEL: 'https://t.me/sila_tech2',
        TELEGRAM_GROUP: 'https://t.me/sila_md',
        WHATSAPP_CHANNEL: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
        SUPPORT_GROUP: 'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks'
    }
};
