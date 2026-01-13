const { cmd } = require('../momy');
const config = require('../config');

// Command ya silaevent
cmd({
    pattern: "silaevent",
    alias: ["groupevent", "autoevent"],
    desc: "Turn group events (welcome/goodbye) on/off",
    category: "owner",
    react: "🎉"
},
async(conn, mek, m, { args, isOwner, reply, from, getUserConfigFromMongoDB, updateUserConfigInMongoDB }) => {
    if (!isOwner) return reply("*owner only command*");
    
    const mode = args[0]?.toLowerCase();
    const botNumber = conn.user.id.split(':')[0];
    
    if (mode === 'on' || mode === 'enable') {
        await updateUserConfigInMongoDB(botNumber, {
            GROUP_EVENTS: 'true'
        });
        await reply("*✅ Group events activated*\n\n🎉 Welcome/Goodbye messages enabled");
    } else if (mode === 'off' || mode === 'disable') {
        await updateUserConfigInMongoDB(botNumber, {
            GROUP_EVENTS: 'false'
        });
        await reply("*✅ Group events deactivated*\n\n🎉 Welcome/Goodbye messages disabled");
    } else {
        const userConfig = await getUserConfigFromMongoDB(botNumber);
        const current = userConfig?.GROUP_EVENTS === 'true';
        await reply(`*Group events: ${current ? "ON ✅" : "OFF ❌"}*\n\nUse: .silaevent on/off`);
    }
});
