const { cmd } = require('../momy');
const config = require('../config');


cmd({
    pattern: "anti-call",
    react: "💀",
    alias: ["anticall"],
    desc: "enable or disable anti-call system",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*owner only command*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ANTI_CALL = "true";
        return reply("*anti-call activated*");
    } else if (status === "off") {
        config.ANTI_CALL = "false";
        return reply("*anti-call deactivated*");
    } else {
        return reply(`*current status: ${config.ANTI_CALL}*\n*use:*\n.anti-call on\n.anti-call off`);
    }
});
