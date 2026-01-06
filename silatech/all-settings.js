const { cmd } = require('../momy');
const { updateUserConfig } = require('../lib/database');

// Helper function to update config in memory and database
const updateConfig = async (key, value, botNumber, config, reply) => {
    try {
        // 1. Update in-memory config (Immediate)
        config[key] = value;
        
        // 2. Update in Database (Persistent)
        const newConfig = { ...config }; 
        newConfig[key] = value;
        
        await updateUserConfig(botNumber, newConfig);
        
        return reply(`✅ *${key}* updated to: *${value}*`);
    } catch (e) {
        console.error(e);
        return reply("❌ error saving to database");
    }
};

// ============================================================
// 1. PRESENCE MANAGEMENT (Recording / Typing)
// ============================================================

cmd({
    pattern: "autorecording",
    alias: ["autorec", "arecording"],
    desc: "enable/disable auto recording simulation",
    category: "settings",
    react: "🎤"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_RECORDING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_RECORDING', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.AUTO_RECORDING}*\n\n*use:*\n.𝖺𝗎𝗍𝗈𝗋𝖾𝖼𝗈𝗋𝖽𝗂𝗇𝗀 𝗈𝗇\n.𝖺𝗎𝗍𝗈𝗋𝖾𝖼𝗈𝗋𝖽𝗂𝗇𝗀 𝗈𝖿𝖿`);
    }
});

cmd({
    pattern: "autotyping",
    alias: ["autotype", "atyping"],
    desc: "enable/disable auto typing simulation",
    category: "settings",
    react: "⌨️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_TYPING', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_TYPING', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.AUTO_TYPING}*\n\n*use:*\n.𝖺𝗎𝗍𝗈𝗍𝗒𝗉𝗂𝗇𝗀 𝗈𝗇\n.𝖺𝗎𝗍𝗈𝗍𝗒𝗉𝗂𝗇𝗀 𝗈𝖿𝖿`);
    }
});

// ============================================================
// 2. CALL MANAGEMENT (Anti-Call)
// ============================================================

cmd({
    pattern: "anticall",
    alias: "acall",
    desc: "auto reject calls",
    category: "settings",
    react: "📵"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('ANTI_CALL', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('ANTI_CALL', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.ANTI_CALL}*\n\n*use:*\n.𝖺𝗇𝗍𝗂𝖼𝖺𝗅𝗅 𝗈𝗇\n.𝖺𝗇𝗍𝗂𝖼𝖺𝗅𝗅 𝗈𝖿𝖿`);
    }
});

// ============================================================
// 3. GROUP MANAGEMENT (Welcome / Goodbye)
// ============================================================

cmd({
    pattern: "welcome",
    desc: "enable/disable welcome messages",
    category: "settings",
    react: "👋"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('WELCOME_ENABLE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('WELCOME_ENABLE', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.WELCOME_ENABLE}*\n\n*use:*\n.𝗐𝖾𝗅𝖼𝗈𝗆𝖾 𝗈𝗇\n.𝗐𝖾𝗅𝖼𝗈𝗆𝖾 𝗈𝖿𝖿`);
    }
});

cmd({
    pattern: "goodbye",
    desc: "enable/disable goodbye messages",
    category: "settings",
    react: "👋"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('GOODBYE_ENABLE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('GOODBYE_ENABLE', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.GOODBYE_ENABLE}*\n\n*use:*\n.𝗀𝗈𝗈𝖽𝖻𝗒𝖾 𝗈𝗇\n.𝗀𝗈𝗈𝖽𝖻𝗒𝖾 𝗈𝖿𝖿`);
    }
});

// ============================================================
// 4. READ & STATUS MANAGEMENT
// ============================================================

cmd({
    pattern: "autoread",
    desc: "enable/disable auto read messages (Blue Tick)",
    category: "settings",
    react: "👁️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('READ_MESSAGE', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('READ_MESSAGE', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.READ_MESSAGE}*\n\n*use:*\n.𝖺𝗎𝗍𝗈𝗋𝖾𝖺𝖽 𝗈𝗇\n.𝖺𝗎𝗍𝗈𝗋𝖾𝖺𝖽 𝗈𝖿𝖿`);
    }
});

cmd({
    pattern: "autoview",
    alias: ["avs", "statusseen", "astatus"],
    desc: "auto view status updates",
    category: "settings",
    react: "👁️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_VIEW_STATUS', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_VIEW_STATUS', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.AUTO_VIEW_STATUS}*\n\n*use:*\n.𝖺𝗎𝗍𝗈𝗏𝗂𝖾𝗐 𝗈𝗇\n.𝖺𝗎𝗍𝗈𝗏𝗂𝖾𝗐 𝗈𝖿𝖿`);
    }
});

cmd({
    pattern: "autolike",
    alias: ["als"],
    desc: "auto like status updates",
    category: "settings",
    react: "❤️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const value = args[0]?.toLowerCase();
    
    if (value === 'on' || value === 'true') {
        await updateConfig('AUTO_LIKE_STATUS', 'true', botNumber, config, reply);
    } else if (value === 'off' || value === 'false') {
        await updateConfig('AUTO_LIKE_STATUS', 'false', botNumber, config, reply);
    } else {
        reply(`*current status: ${config.AUTO_LIKE_STATUS}*\n\n*use:*\n.𝖺𝗎𝗍𝗈𝗅𝗂𝗄𝖾 𝗈𝗇\n.𝖺𝗎𝗍𝗈𝗅𝗂𝗄𝖾 𝗈𝖿𝖿`);
    }
});

// ============================================================
// 5. SYSTEM (Mode & Prefix)
// ============================================================

cmd({
    pattern: "mode",
    desc: "change bot mode (public/private/groups/inbox)",
    category: "settings",
    react: "⚙️"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const mode = args[0]?.toLowerCase();
    const validModes = ['public', 'private', 'groups', 'inbox'];

    if (validModes.includes(mode)) {
        await updateConfig('WORK_TYPE', mode, botNumber, config, reply);
    } else {
        reply(`*invalid mode*\n*available modes:* ${validModes.join(', ')}\n*current:* ${config.WORK_TYPE}`);
    }
});

cmd({
    pattern: "setprefix",
    desc: "change bot prefix",
    category: "settings",
    react: "💀"
},
async(conn, mek, m, { args, isOwner, reply, botNumber, config }) => {
    if (!isOwner) return reply("*owner only command*");
    const newPrefix = args[0];

    if (newPrefix) {
        if (newPrefix.length > 3) return reply("❌ prefix too long (max 3 characters)");
        await updateConfig('PREFIX', newPrefix, botNumber, config, reply);
    } else {
        reply(`*current prefix: ${config.PREFIX}*\n*use:*\n.𝗌𝖾𝗍𝗉𝗋𝖾𝖿𝗂𝗑 .\n.𝗌𝖾𝗍𝗉𝗋𝖾𝖿𝗂𝗑 !\n.𝗌𝖾𝗍𝗉𝗋𝖾𝖿𝗂𝗑 #`);
    }
});
