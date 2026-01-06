const { cmd } = require('../momy');
const { setAntideleteStatus, getAntideleteStatus } = require('../data/Antidelete');

// Store for antilink status per chat
const antilinkStatus = new Map();

// Helper to set antilink status
const setAntilinkStatus = async (chatId, status) => {
    antilinkStatus.set(chatId, status);
};

// Helper to get antilink status
const getAntilinkStatus = async (chatId) => {
    return antilinkStatus.get(chatId) || false;
};

// Antidelete command
cmd({
    pattern: "antidelete",
    alias: ["antidel"],
    desc: "Turn Antidelete on/off",
    category: "owner",
    react: "💀"
},
async(conn, mek, m, { args, isOwner, reply, from }) => {
    if (!isOwner) return reply("*owner only command*");
    const mode = args[0]?.toLowerCase();

    if (mode === 'on' || mode === 'enable') {
        await setAntideleteStatus(from, true);
        await reply("*anti-delete activated*");
    } else if (mode === 'off' || mode === 'disable') {
        await setAntideleteStatus(from, false);
        await reply("*anti-delete deactivated*");
    } else {
        const current = await getAntideleteStatus(from);
        await reply(`*anti-delete: ${current ? "on" : "off"}*`);
    }
});

// Antilink command
cmd({
    pattern: "antilink",
    alias: ["antilnk", "nolink"],
    desc: "Turn Antilink on/off (auto-delete links)",
    category: "owner",
    react: "💀"
},
async(conn, mek, m, { args, isOwner, reply, from, sender, isAdmins, isGroup }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isOwner && !isAdmins) return reply("*admin only command*");
    
    const mode = args[0]?.toLowerCase();

    if (mode === 'on' || mode === 'enable') {
        await setAntilinkStatus(from, true);
        await reply("*antilink activated*\nlinks will be auto-deleted");
    } else if (mode === 'off' || mode === 'disable') {
        await setAntilinkStatus(from, false);
        await reply("*antilink deactivated*\nlinks allowed");
    } else {
        const current = await getAntilinkStatus(from);
        await reply(`*antilink: ${current ? "on" : "off"}*`);
    }
});

// Function to check and delete links (to be used in message handler)
async function checkAndDeleteLinks(conn, mek, from, sender) {
    try {
        const isAntilinkEnabled = await getAntilinkStatus(from);
        if (!isAntilinkEnabled) return false;

        const message = mek.message;
        if (!message) return false;

        // Extract text from message
        let text = '';
        if (message.conversation) {
            text = message.conversation;
        } else if (message.extendedTextMessage?.text) {
            text = message.extendedTextMessage.text;
        } else if (message.imageMessage?.caption) {
            text = message.imageMessage.caption;
        } else if (message.videoMessage?.caption) {
            text = message.videoMessage.caption;
        }

        // Common link patterns
        const linkPatterns = [
            /https?:\/\/[^\s]+/gi,
            /www\.[^\s]+/gi,
            /\.com\b/gi,
            /\.net\b/gi,
            /\.org\b/gi,
            /\.co\b/gi,
            /\.tk\b/gi,
            /\.ml\b/gi,
            /\.ga\b/gi,
            /\.cf\b/gi,
            /\.gq\b/gi,
            /wa\.me\/[^\s]+/gi,
            /chat\.whatsapp\.com\/[^\s]+/gi,
            /whatsapp\.com\/channel\/[^\s]+/gi,
            /t\.me\/[^\s]+/gi,
            /telegram\.me\/[^\s]+/gi,
            /youtube\.com\/[^\s]+/gi,
            /youtu\.be\/[^\s]+/gi,
            /instagram\.com\/[^\s]+/gi,
            /facebook\.com\/[^\s]+/gi,
            /twitter\.com\/[^\s]+/gi,
            /tiktok\.com\/[^\s]+/gi,
            /snapchat\.com\/[^\s]+/gi,
            /discord\.gg\/[^\s]+/gi,
            /discord\.com\/[^\s]+/gi
        ];

        let foundLink = false;
        for (const pattern of linkPatterns) {
            if (pattern.test(text)) {
                foundLink = true;
                break;
            }
        }

        if (foundLink) {
            // Delete the message
            await conn.sendMessage(from, {
                delete: mek.key
            });

            // Send warning
            await conn.sendMessage(from, {
                text: `*⚠️ link deleted*\n@${sender.split('@')[0]} links are not allowed\nantilink system active`,
                mentions: [sender]
            });

            return true;
        }
    } catch (error) {
        console.error("antilink error:", error.message);
    }
    
    return false;
}

// Export the function for use in main handler
module.exports = {
    checkAndDeleteLinks,
    getAntilinkStatus,
    setAntilinkStatus
};
