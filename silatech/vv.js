const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "vv",
    alias: ["viewonce", "vo"],
    desc: "view once media saver",
    category: "tools",
    react: "👁️"
}, async (conn, mek, m, { from, reply, myquoted }) => {
    try {
        // Check if there's a quoted message
        if (!mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            return reply("*reply to a view once message*");
        }

        const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
        
        // Check for view once media in your message structure
        const quotedImage = quotedMsg?.imageMessage;
        const quotedVideo = quotedMsg?.videoMessage;
        
        if (!quotedImage && !quotedVideo) {
            return reply("*this is not a media message*");
        }

        // Check if it's view once
        const isViewOnce = (quotedImage && quotedImage.viewOnce) || 
                          (quotedVideo && quotedVideo.viewOnce);
        
        if (!isViewOnce) {
            return reply("*this is not a view once message*");
        }

        // Reply that we're processing
        await reply("*processing view once media...*");

        if (quotedImage && quotedImage.viewOnce) {
            // Download and send the image
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Create temp directory if not exists
            const tempDir = path.join(__dirname, '../temp');
            await fs.ensureDir(tempDir);
            
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `viewonce_${timestamp}.jpg`;
            const filePath = path.join(tempDir, filename);
            
            // Save to file
            await fs.writeFile(filePath, buffer);

            await conn.sendMessage(from, {
                image: { url: filePath },
                caption: `╭━━【 👁️ 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙸𝙼𝙰𝙶𝙴 】━━━━╮
│ 📸 𝚒𝚖𝚊𝚐𝚎 𝚜𝚊𝚟𝚎𝚍 𝚏𝚛𝚘𝚖 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎
│ 📝 ${quotedImage.caption ? 'caption: ' + quotedImage.caption : 'no caption'}
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
            }, { quoted: myquoted });

            // Clean up temp file after sending
            setTimeout(async () => {
                try {
                    await fs.unlink(filePath);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError.message);
                }
            }, 5000);

        } else if (quotedVideo && quotedVideo.viewOnce) {
            // Download and send the video
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Create temp directory if not exists
            const tempDir = path.join(__dirname, '../temp');
            await fs.ensureDir(tempDir);
            
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `viewonce_${timestamp}.mp4`;
            const filePath = path.join(tempDir, filename);
            
            // Save to file
            await fs.writeFile(filePath, buffer);

            await conn.sendMessage(from, {
                video: { url: filePath },
                caption: `╭━━【 👁️ 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝚅𝙸𝙳𝙴𝙾 】━━━━╮
│ 🎥 𝚟𝚒𝚍𝚎𝚘 𝚜𝚊𝚟𝚎𝚍 𝚏𝚛𝚘𝚖 𝚟𝚒𝚎𝚠 𝚘𝚗𝚌𝚎
│ ⏱️ 𝚍𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${Math.floor(quotedVideo.seconds || 0)}𝚜
│ 📝 ${quotedVideo.caption ? 'caption: ' + quotedVideo.caption : 'no caption'}
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
            }, { quoted: myquoted });

            // Clean up temp file after sending
            setTimeout(async () => {
                try {
                    await fs.unlink(filePath);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError.message);
                }
            }, 5000);
        }

        // React to show success
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

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
    react: "👁️"
}, async (conn, mek, m, { from, reply, isCreator, myquoted }) => {
    if (!isCreator) return reply("*owner only command*");
    
    try {
        const response = `╭━━【 👁️ 𝙰𝚄𝚃𝙾 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 】━━━━╮
│ 📝 𝚜𝚝𝚊𝚝𝚞𝚜: *𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗*
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
    react: "📁"
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
    react: "🧹"
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

        await reply(`*cleared ${deletedCount} saved view once media files*");
        
    } catch (error) {
        console.error("Clear view once error:", error);
        reply("*error clearing saved media*");
    }
});
