const { cmd } = require('../momy');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "vv",
    alias: ["viewonce", "view", "open"],
    react: "🥺",
    desc: "Retrieve view-once media (Owner only)",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isCreator, reply, myquoted }) => {
    try {
        if (!isCreator)
            return reply("❌ THIS COMMAND IS ONLY FOR BOT OWNER")

        if (!myquoted || !m.quoted)
            return reply("❌ REPLY TO A VIEW-ONCE MEDIA\nUsage: .vv")

        await reply("📥 Detecting view-once media...");

        const quotedMsg = m.quoted.message;
        
        let mediaMsg = null;
        let mediaType = null;
        
        if (quotedMsg?.viewOnceMessageV2?.message) {
            mediaMsg = quotedMsg.viewOnceMessageV2.message;
        } else if (quotedMsg?.viewOnceMessageV2Extension?.message) {
            mediaMsg = quotedMsg.viewOnceMessageV2Extension.message;
        } else if (quotedMsg?.viewOnceMessage?.message) {
            mediaMsg = quotedMsg.viewOnceMessage.message;
        }
        
        if (!mediaMsg) {
            const directTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
            for (const type of directTypes) {
                if (quotedMsg?.[type]?.viewOnce) {
                    mediaMsg = { [type]: quotedMsg[type] };
                    break;
                }
            }
            
            if (!mediaMsg) {
                return reply("❌ This is not a view-once media");
            }
        }

        if (mediaMsg.imageMessage) {
            mediaType = 'image';
        } else if (mediaMsg.videoMessage) {
            mediaType = 'video';
        } else if (mediaMsg.audioMessage) {
            mediaType = 'audio';
        } else {
            return reply("❌ Unsupported view-once media type");
        }

        const mediaKey = mediaMsg[mediaType + 'Message'];
        if (!mediaKey) {
            return reply("❌ Failed to get media data");
        }

        await reply("📤 Downloading...");

        let buffer = Buffer.from([]);
        
        try {
            const stream = await downloadContentFromMessage(mediaKey, mediaType);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
        } catch (downloadError) {
            console.log("Download error:", downloadError);
            return reply("❌ Failed to download media");
        }

        if (buffer.length === 0) {
            return reply("❌ Empty media file");
        }

        let sendOptions = {};
        const timestamp = Date.now();
        
        if (mediaType === 'image') {
            sendOptions.image = buffer;
            sendOptions.caption = mediaKey.caption || "View-once image retrieved";
            sendOptions.fileName = `image-${timestamp}.jpg`;
        } else if (mediaType === 'video') {
            sendOptions.video = buffer;
            sendOptions.caption = mediaKey.caption || "View-once video retrieved";
            sendOptions.fileName = `video-${timestamp}.mp4`;
        } else if (mediaType === 'audio') {
            sendOptions.audio = buffer;
            sendOptions.mimetype = mediaKey.mimetype || 'audio/mpeg';
            sendOptions.ptt = mediaKey.ptt || false;
            sendOptions.fileName = `audio-${timestamp}.mp3`;
        }

        await conn.sendMessage(from, sendOptions, { quoted: mek });
        
        await reply(`✅ View-once ${mediaType} retrieved successfully!\nSize: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        await m.react("✅");

    } catch (e) {
        console.log("VV ERROR:", e);
        reply(`❌ Error: ${e.message || "Failed to retrieve view-once"}`);
        await m.react("❌");
    }
})
