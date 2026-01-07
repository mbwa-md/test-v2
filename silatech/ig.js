const { cmd } = require('../momy');
const { igdl } = require("ruhend-scraper");

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

// Function to extract unique media URLs
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    
    return uniqueMedia;
}

cmd({
    pattern: "ig",
    alias: ["instagram", "igdl"],
    desc: "download instagram video/photo",
    category: "media",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        // Check if message has already been processed
        const msgId = mek.key?.id;
        if (msgId && processedMessages.has(msgId)) {
            return;
        }
        
        // Add message ID to processed set
        if (msgId) {
            processedMessages.add(msgId);
            setTimeout(() => {
                processedMessages.delete(msgId);
            }, 5 * 60 * 1000);
        }

        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.trim().length < 2) {
            return reply("*𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .ig instagram_url\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .ig https://instagram.com/p/xxx\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const url = text.replace(/^\.(ig|instagram|igdl)\s+/i, "").trim();
        
        // Check for various Instagram URL formats
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//,
            /https?:\/\/(?:www\.)?instagram\.com\/p\//,
            /https?:\/\/(?:www\.)?instagram\.com\/reel\//,
            /https?:\/\/(?:www\.)?instagram\.com\/tv\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return reply("*𝚃𝚑𝚊𝚝 𝚒𝚜 𝚗𝚘𝚝 𝚊 𝚟𝚊𝚕𝚒𝚍 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖 𝚕𝚒𝚗𝚔*");
        }

        await reply("*🔍 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖 𝚖𝚎𝚍𝚒𝚊...*");

        const downloadData = await igdl(url);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            return reply("*❌ 𝙽𝚘 𝚖𝚎𝚍𝚒𝚊 𝚏𝚘𝚞𝚗𝚍 𝚊𝚝 𝚝𝚑𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎𝚍 𝚕𝚒𝚗𝚔*");
        }

        const mediaData = downloadData.data;
        
        // Simple deduplication
        const uniqueMedia = extractUniqueMedia(mediaData);
        
        // Limit to maximum 20 unique media items
        const mediaToDownload = uniqueMedia.slice(0, 20);
        
        if (mediaToDownload.length === 0) {
            return reply("*❌ 𝙽𝚘 𝚟𝚊𝚕𝚒𝚍 𝚖𝚎𝚍𝚒𝚊 𝚏𝚘𝚞𝚗𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍*");
        }

        // Send caption first
        const caption = `╭━━【 📸 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 】━━━╮
│ 📊 𝙼𝚎𝚍𝚒𝚊 𝚏𝚘𝚞𝚗𝚍: ${mediaToDownload.length}
│ 📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            text: caption
        }, { quoted: myquoted });

        // Download all media
        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;

                // Check if URL ends with common video extensions
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                              media.type === 'video' || 
                              url.includes('/reel/') || 
                              url.includes('/tv/');

                if (isVideo) {
                    await conn.sendMessage(from, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4"
                    }, { quoted: myquoted });
                } else {
                    await conn.sendMessage(from, {
                        image: { url: mediaUrl }
                    }, { quoted: myquoted });
                }
                
                // Add small delay between downloads
                if (i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (mediaError) {
                console.error(`Error downloading media ${i + 1}:`, mediaError);
                // Continue with next media if one fails
            }
        }

        await m.react("✅");

    } catch (error) {
        console.error('Error in Instagram command:', error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝙸𝚗𝚜𝚝𝚊𝚐𝚛𝚊𝚖 𝚖𝚎𝚍𝚒𝚊*");
        await m.react("❌");
    }
});
