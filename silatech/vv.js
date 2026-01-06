const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "vv",
    alias: ["viewonce", "vo"],
    desc: "view once media saver",
    category: "tools",
    react: "👁️",
    filename: __filename
}, async (conn, mek, m, { from, reply, myquoted }) => {
    try {
        // Check if there's a quoted message
        if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            return reply("*reply to a view once message*");
        }

        const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
        
        // Check if it's a view once message
        const isViewOnce = quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessage;
        if (!isViewOnce) {
            return reply("*this is not a view once message*");
        }

        // Get the actual message
        const viewOnceMsg = quotedMsg.viewOnceMessageV2?.message || quotedMsg.viewOnceMessage?.message;
        if (!viewOnceMsg) {
            return reply("*cannot extract view once content*");
        }

        // Determine message type
        const messageType = Object.keys(viewOnceMsg)[0];
        const isImage = messageType === 'imageMessage';
        const isVideo = messageType === 'videoMessage';
        
        if (!isImage && !isVideo) {
            return reply("*only image and video view once are supported*");
        }

        const mediaData = viewOnceMsg[messageType];
        const caption = mediaData.caption || '';
        
        // Reply that we're processing
        await reply("*processing view once media...*");

        // Download the media
        const stream = await downloadContentFromMessage(mediaData, messageType.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Create temp directory if not exists
        const tempDir = path.join(__dirname, '../temp');
        await fs.ensureDir(tempDir);
        
        // Generate unique filename
        const timestamp = Date.now();
        const ext = isImage ? 'jpg' : 'mp4';
        const filename = `viewonce_${timestamp}.${ext}`;
        const filePath = path.join(tempDir, filename);
        
        // Save to file
        await fs.writeFile(filePath, buffer);

        // Send the media back
        if (isImage) {
            await conn.sendMessage(from, {
                image: { url: filePath },
                caption: `╭━━【 👁️ 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙸𝙼𝙰𝙶𝙴 】━━━━╮
│ 📸 𝚒𝚖𝚊𝚐𝚎 𝚜𝚊𝚟𝚎𝚍 𝚏𝚛𝚘𝚖 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎
│ 📝 ${caption ? 'caption: ' + caption : 'no caption'}
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
            }, { quoted: myquoted });
        } else if (isVideo) {
            await conn.sendMessage(from, {
                video: { url: filePath },
                caption: `╭━━【 👁️ 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝚅𝙸𝙳𝙴𝙾 】━━━━╮
│ 🎥 𝚟𝚒𝚍𝚎𝚘 𝚜𝚊𝚟𝚎𝚍 𝚏𝚛𝚘𝚖 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎
│ ⏱️ 𝚍𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${Math.floor(mediaData.seconds || 0)}𝚜
│ 📝 ${caption ? 'caption: ' + caption : 'no caption'}
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
            }, { quoted: myquoted });
        }

        // Clean up temp file after sending
        setTimeout(async () => {
            try {
                await fs.unlink(filePath);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError.message);
            }
        }, 5000);

        // React to show success
        await m.react("✅");

    } catch (error) {
        console.error("View once error:", error);
        reply("*error saving view once media*");
    }
});

// Command to save all view once messages automatically
cmd({
    pattern: "autovv",
    alias: ["autoviewonce", "savevo"],
    desc: "auto save all view once messages",
    category: "settings",
    react: "👁️",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        // This would need to be implemented in your main message handler
        // For now, just show status
        const response = `╭━━【 👁️ 𝙰𝚄𝚃𝙾 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 】━━━━╮
│ 📝 𝚜𝚝𝚊𝚝𝚞𝚜: *𝚌𝚘𝚖𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗*
│ ⚠️ 𝚗𝚘𝚝𝚎: 𝚊𝚞𝚝𝚘 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎 𝚜𝚊𝚟𝚒𝚗𝚐
│ 🔧 𝚠𝚒𝚕𝚕 𝚋𝚎 𝚒𝚖𝚙𝚕𝚎𝚖𝚎𝚗𝚝𝚎𝚍 𝚒𝚗 𝚗𝚎𝚡𝚝 𝚞𝚙𝚍𝚊𝚝𝚎
╰━━━━━━━━━━━━━━━━━━━━╯

*𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚞𝚜𝚎:* .𝚟𝚟 (𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎)

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(response);
        
    } catch (error) {
        console.error("Auto view once error:", error);
        reply("*error configuring auto view once*");
    }
});

// Command to view saved view once media
cmd({
    pattern: "savedvv",
    alias: ["viewoncelist", "vosaved"],
    desc: "view saved view once media",
    category: "tools",
    react: "📁",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        const tempDir = path.join(__dirname, '../temp');
        
        // Check if directory exists
        if (!await fs.pathExists(tempDir)) {
            return reply("*no saved view once media found*");
        }

        // Get all view once files
        const files = await fs.readdir(tempDir);
        const viewOnceFiles = files.filter(file => file.startsWith('viewonce_'));
        
        if (viewOnceFiles.length === 0) {
            return reply("*no saved view once media found*");
        }

        let response = `╭━━【 📁 𝚂𝙰𝚅𝙴𝙳 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 】━━━━╮
│ 📊 𝚝𝚘𝚝𝚊𝚕 𝚜𝚊𝚟𝚎𝚍: *${viewOnceFiles.length}*
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        // Show file list
        viewOnceFiles.forEach((file, index) => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            const type = file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') 
                ? '🖼️' : '🎥';
            
            response += `╭━━【 #${index + 1} 】━━━━━━━━╮
│ ${type} 𝚗𝚊𝚖𝚎: *${file}*
│ 📦 𝚜𝚒𝚣𝚎: *${sizeMB} 𝚖𝚋*
│ 📅 𝚜𝚊𝚟𝚎𝚍: *${new Date(stats.mtime).toLocaleString()}*
╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });

        response += `\n*𝚞𝚜𝚎:* .𝚌𝚕𝚎𝚊𝚛𝚟𝚟 𝚝𝚘 𝚌𝚕𝚎𝚊𝚛 𝚊𝚕𝚕 𝚜𝚊𝚟𝚎𝚍 𝚖𝚎𝚍𝚒𝚊\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await reply(response);
        
    } catch (error) {
        console.error("Saved view once error:", error);
        reply("*error listing saved media*");
    }
});

// Command to clear saved view once media
cmd({
    pattern: "clearvv",
    alias: ["clearviewonce", "clearsaved"],
    desc: "clear all saved view once media",
    category: "tools",
    react: "🧹",
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        const tempDir = path.join(__dirname, '../temp');
        
        // Check if directory exists
        if (!await fs.pathExists(tempDir)) {
            return reply("*no saved media to clear*");
        }

        // Get all view once files
        const files = await fs.readdir(tempDir);
        const viewOnceFiles = files.filter(file => file.startsWith('viewonce_'));
        
        if (viewOnceFiles.length === 0) {
            return reply("*no saved media to clear*");
        }

        // Delete all files
        let deletedCount = 0;
        for (const file of viewOnceFiles) {
            try {
                await fs.unlink(path.join(tempDir, file));
                deletedCount++;
            } catch (deleteError) {
                console.error(`Error deleting ${file}:`, deleteError.message);
            }
        }

        await reply(`*cleared ${deletedCount} saved view once media files*`);
        
    } catch (error) {
        console.error("Clear view once error:", error);
        reply("*error clearing saved media*");
    }
});
