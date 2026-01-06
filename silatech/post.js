const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// =================================================================
// 📢 POST STATUS TO GROUP
// =================================================================

cmd({
    pattern: "post",
    alias: ["statuspost", "announce"],
    desc: "post your status to group",
    category: "group",
    react: "📢",
    use: ".post [text] (reply to image/video/audio for media)"
},
async(conn, mek, m, { from, reply, q, isGroup, isAdmins, myquoted }) => {
    if (!isGroup) return reply("*group command only*");
    if (!isAdmins) return reply("*admin only command*");
    
    try {
        // Check if user has a status
        const statusUpdates = await conn.fetchStatus();
        
        if (!statusUpdates || statusUpdates.length === 0) {
            return reply("*you don't have any status updates*");
        }
        
        const latestStatus = statusUpdates[0];
        
        // Get status content
        let content = {};
        let caption = "";
        
        if (latestStatus.message?.imageMessage) {
            // Image status
            const imageMsg = latestStatus.message.imageMessage;
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            content = { image: buffer };
            caption = imageMsg.caption || "";
        } 
        else if (latestStatus.message?.videoMessage) {
            // Video status
            const videoMsg = latestStatus.message.videoMessage;
            const stream = await downloadContentFromMessage(videoMsg, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            content = { video: buffer };
            caption = videoMsg.caption || "";
        }
        else if (latestStatus.message?.extendedTextMessage) {
            // Text status
            content = { 
                text: latestStatus.message.extendedTextMessage.text || "📢 Status Update"
            };
        }
        else if (latestStatus.message?.conversation) {
            // Simple text status
            content = { 
                text: latestStatus.message.conversation
            };
        }
        
        // Add text if provided
        if (q) {
            caption = q + (caption ? "\n\n" + caption : "");
        }
        
        // Add caption to content if it exists
        if (caption && (content.image || content.video)) {
            content.caption = caption;
        } else if (caption) {
            content.text = caption;
        }
        
        // Add author info
        const finalCaption = content.caption || content.text || "📢 Status Update";
        const formattedCaption = `╭━━【 📢 𝚂𝚃𝙰𝚃𝚄𝚂 𝙿𝙾𝚂𝚃 】━━━━╮
│ 👤 from: @${m.sender.split('@')[0]}
│ ⏰ time: ${new Date().toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━━━╯

${finalCaption}

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        // Update content with formatted caption
        if (content.image) {
            content.caption = formattedCaption;
        } else if (content.video) {
            content.caption = formattedCaption;
        } else {
            content.text = formattedCaption;
        }
        
        // Send to group
        await conn.sendMessage(from, content, { quoted: myquoted });
        
        await reply("*status posted to group*");
        
    } catch (error) {
        console.error("Post status error:", error);
        reply("*error posting status*");
    }
});

// =================================================================
// 📱 POST YOUR CURRENT STATUS
// =================================================================

cmd({
    pattern: "mystatus",
    alias: ["status", "viewstatus"],
    desc: "view and post your current status",
    category: "general",
    react: "📱",
    use: ".mystatus"
},
async(conn, mek, m, { from, reply, myquoted }) => {
    try {
        const statusUpdates = await conn.fetchStatus();
        
        if (!statusUpdates || statusUpdates.length === 0) {
            return reply("*you don't have any status updates*");
        }
        
        const latestStatus = statusUpdates[0];
        
        let response = `╭━━【 📱 𝚈𝙾𝚄𝚁 𝚂𝚃𝙰𝚃𝚄𝚂 】━━━━╮
│ 📊 total status: *${statusUpdates.length}*
│ 🔄 latest: *${new Date(latestStatus.timestamp * 1000).toLocaleString()}*
╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;

        // Show last 3 statuses
        const recentStatuses = statusUpdates.slice(0, 3);
        recentStatuses.forEach((status, index) => {
            let statusText = "";
            
            if (status.message?.imageMessage) {
                statusText = "🖼️ image status";
                if (status.message.imageMessage.caption) {
                    statusText += `: ${status.message.imageMessage.caption.substring(0, 50)}...`;
                }
            } 
            else if (status.message?.videoMessage) {
                statusText = "🎥 video status";
                if (status.message.videoMessage.caption) {
                    statusText += `: ${status.message.videoMessage.caption.substring(0, 50)}...`;
                }
            }
            else if (status.message?.extendedTextMessage?.text) {
                statusText = `📝 ${status.message.extendedTextMessage.text.substring(0, 100)}...`;
            }
            else if (status.message?.conversation) {
                statusText = `📝 ${status.message.conversation.substring(0, 100)}...`;
            }
            else {
                statusText = "📄 unknown status type";
            }
            
            response += `╭━━【 #${index + 1} 】━━━━━━━━╮
│ ${statusText}
│ 🕐 ${new Date(status.timestamp * 1000).toLocaleTimeString()}
╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        });
        
        response += `\n*use:* .post (in group) to share your status\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await reply(response);
        
    } catch (error) {
        console.error("My status error:", error);
        reply("*error fetching your status*");
    }
});

// =================================================================
// 📢 POST MESSAGE AS STATUS (From any content)
// =================================================================

cmd({
    pattern: "tostatus",
    alias: ["makestatus", "createstatus"],
    desc: "convert message to status",
    category: "tools",
    react: "📢",
    use: ".tostatus [text] (reply to media)"
},
async(conn, mek, m, { from, reply, q, myquoted }) => {
    try {
        // Check if it's a reply
        if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            return reply("*reply to a message to make it status*");
        }
        
        const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
        const messageType = Object.keys(quotedMsg)[0];
        
        // Prepare status content
        let statusContent = {};
        
        if (messageType === 'imageMessage') {
            const imageMsg = quotedMsg.imageMessage;
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            statusContent = {
                image: buffer,
                caption: q || imageMsg.caption || ""
            };
        }
        else if (messageType === 'videoMessage') {
            const videoMsg = quotedMsg.videoMessage;
            const stream = await downloadContentFromMessage(videoMsg, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            statusContent = {
                video: buffer,
                caption: q || videoMsg.caption || ""
            };
        }
        else if (messageType === 'extendedTextMessage') {
            statusContent = {
                text: q || quotedMsg.extendedTextMessage.text || "📢 Status Update"
            };
        }
        else if (messageType === 'conversation') {
            statusContent = {
                text: q || quotedMsg.conversation || "📢 Status Update"
            };
        }
        else {
            return reply("*unsupported message type for status*");
        }
        
        // Update status
        await conn.updateStatus(statusContent);
        
        await reply("*status updated successfully*");
        
    } catch (error) {
        console.error("To status error:", error);
        reply("*error creating status*");
    }
});
