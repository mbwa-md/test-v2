const { cmd } = require('../momy');
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl", "tik", "tiktokdl"],
    desc: "Download TikTok videos without watermark",
    category: "media",
    react: "⬇️",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        // Check if message has already been processed
        if (processedMessages.has(mek.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(mek.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(mek.key.id);
        }, 5 * 60 * 1000);

        const query = args.join(" ");
        
        if (!query) {
            return reply("Please provide TikTok link\nUsage: .tiktok https://tiktok.com/...");
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(query));
        
        if (!isValidUrl) {
            return reply("That is not a valid tiktok link");
        }

        await reply("Processing tiktok link...");
        await m.react("🔄");

        try {
            // Use Siputzx API
            const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(query)}`;

            let videoUrl = null;
            let audioUrl = null;
            let title = null;

            // Call Siputzx API
            try {
                const response = await axios.get(apiUrl, { 
                    timeout: 15000,
                    headers: {
                        'accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.data && response.data.status) {
                    if (response.data.data) {
                        if (response.data.data.urls && Array.isArray(response.data.data.urls) && response.data.data.urls.length > 0) {
                            videoUrl = response.data.data.urls[0];
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.video_url) {
                            videoUrl = response.data.data.video_url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.url) {
                            videoUrl = response.data.data.url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else if (response.data.data.download_url) {
                            videoUrl = response.data.data.download_url;
                            title = response.data.data.metadata?.title || "TikTok Video";
                        } else {
                            throw new Error("No video URL found");
                        }
                    } else {
                        throw new Error("No data field in response");
                    }
                } else {
                    throw new Error("Invalid API response");
                }
            } catch (apiError) {
                console.error(`Siputzx API failed: ${apiError.message}`);
                return reply("Failed to fetch video from API");
            }

            // Send the video if we got a URL
            if (videoUrl) {
                try {
                    await reply("Downloading video...");
                    
                    const caption = title ? `Downloaded By Sila Tech\n\nTitle: ${title}` : "Downloaded By Sila Tech";
                    
                    await conn.sendMessage(from, {
                        video: { url: videoUrl },
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: myquoted });

                    await reply("✅ TikTok video downloaded successfully!");
                    await m.react("✅");
                    return;

                } catch (downloadError) {
                    console.error(`Failed to send video: ${downloadError.message}`);
                    return reply("Failed to download video");
                }
            }

        } catch (error) {
            console.error('Error in TikTok download:', error);
            await reply("Failed to download the TikTok video. Please try again");
            await m.react("❌");
        }

    } catch (error) {
        console.error('Error in TikTok command:', error);
        await reply("An error occurred while processing the request");
        await m.react("❌");
    }
});
