const { cmd } = require('../momy');

cmd({
    pattern: "blocklist",
    alias: ["blocked", "blocks", "blist"],
    desc: "View and manage blocked numbers",
    category: "owner",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, isCreator }) => {
    try {
        if (!isCreator) {
            return reply("This command is only for bot owner");
        }

        const action = args[0]?.toLowerCase();
        
        if (!action || action === 'list') {
            // Show blocked numbers list
            try {
                const blocked = await conn.fetchBlocklist();
                
                if (!blocked || blocked.length === 0) {
                    return reply("No blocked numbers found");
                }
                
                let listMessage = `🚫 *BLOCKED NUMBERS* (${blocked.length})\n\n`;
                
                blocked.forEach((number, index) => {
                    listMessage += `${index + 1}. ${number}\n`;
                });
                
                listMessage += `\nUse:\n.blocklist add 255xxxxxxxxx\n.blocklist remove 255xxxxxxxxx\n.blocklist check 255xxxxxxxxx`;
                
                await reply(listMessage);
                
            } catch (error) {
                console.error("Error fetching blocklist:", error);
                return reply("Failed to fetch blocklist");
            }
        }
        else if (action === 'add' || action === 'block') {
            // Block a number
            const number = args[1];
            if (!number) {
                return reply("Please provide a number to block\nExample: .blocklist add 255123456789");
            }
            
            try {
                // Format number
                const formattedNumber = number.replace(/[^0-9]/g, '');
                const jid = formattedNumber.includes('@') ? formattedNumber : formattedNumber + '@s.whatsapp.net';
                
                await conn.updateBlockStatus(jid, 'block');
                await reply(`✅ Number blocked: ${formattedNumber}`);
                await m.react("✅");
                
            } catch (error) {
                console.error("Error blocking number:", error);
                await reply(`❌ Failed to block number: ${error.message}`);
                await m.react("❌");
            }
        }
        else if (action === 'remove' || action === 'unblock' || action === 'delete') {
            // Unblock a number
            const number = args[1];
            if (!number) {
                return reply("Please provide a number to unblock\nExample: .blocklist remove 255123456789");
            }
            
            try {
                // Format number
                const formattedNumber = number.replace(/[^0-9]/g, '');
                const jid = formattedNumber.includes('@') ? formattedNumber : formattedNumber + '@s.whatsapp.net';
                
                await conn.updateBlockStatus(jid, 'unblock');
                await reply(`✅ Number unblocked: ${formattedNumber}`);
                await m.react("✅");
                
            } catch (error) {
                console.error("Error unblocking number:", error);
                await reply(`❌ Failed to unblock number: ${error.message}`);
                await m.react("❌");
            }
        }
        else if (action === 'check' || action === 'isblocked') {
            // Check if a number is blocked
            const number = args[1];
            if (!number) {
                return reply("Please provide a number to check\nExample: .blocklist check 255123456789");
            }
            
            try {
                // Format number
                const formattedNumber = number.replace(/[^0-9]/g, '');
                const jid = formattedNumber.includes('@') ? formattedNumber : formattedNumber + '@s.whatsapp.net';
                
                const blocked = await conn.fetchBlocklist();
                const isBlocked = blocked.includes(jid);
                
                await reply(`📱 *Number:* ${formattedNumber}\n🔒 *Status:* ${isBlocked ? 'Blocked 🚫' : 'Not Blocked ✅'}`);
                await m.react(isBlocked ? "🚫" : "✅");
                
            } catch (error) {
                console.error("Error checking block status:", error);
                await reply(`❌ Failed to check block status: ${error.message}`);
                await m.react("❌");
            }
        }
        else if (action === 'clear' || action === 'removeall') {
            // Unblock all numbers (with confirmation)
            const confirm = args[1];
            
            if (!confirm || confirm !== 'yes') {
                return reply("⚠️ *WARNING: This will unblock ALL numbers!*\n\nTo confirm, type: .blocklist clear yes");
            }
            
            try {
                const blocked = await conn.fetchBlocklist();
                
                if (!blocked || blocked.length === 0) {
                    return reply("No blocked numbers to unblock");
                }
                
                // Unblock each number
                for (const jid of blocked) {
                    try {
                        await conn.updateBlockStatus(jid, 'unblock');
                    } catch (e) {
                        console.error(`Failed to unblock ${jid}:`, e);
                    }
                }
                
                await reply(`✅ Successfully unblocked ${blocked.length} numbers`);
                await m.react("✅");
                
            } catch (error) {
                console.error("Error clearing blocklist:", error);
                await reply(`❌ Failed to clear blocklist: ${error.message}`);
                await m.react("❌");
            }
        }
        else if (action === 'help') {
            // Show help
            const helpMessage = `🚫 *BLOCKLIST COMMAND HELP*\n
*Commands:*
.blocklist list - Show all blocked numbers
.blocklist add 255xxx - Block a number
.blocklist remove 255xxx - Unblock a number
.blocklist check 255xxx - Check if number is blocked
.blocklist clear yes - Unblock all numbers (be careful!)
.blocklist help - Show this help

*Examples:*
.blocklist add 255123456789
.blocklist remove 255123456789
.blocklist check 255123456789`;
            
            await reply(helpMessage);
        }
        else {
            return reply("Invalid command\nUse: .blocklist help for all commands");
        }
        
    } catch (error) {
        console.error("Blocklist command error:", error);
        await reply(`❌ Error: ${error.message}`);
        await m.react("❌");
    }
});
