const { cmd } = require('../momy');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    desc: "download facebook video",
    category: "media",
    react: "📥",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.trim().length < 2) {
            return reply("*𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .fb facebook_url\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .fb https://fb.watch/xxx\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        // Extract URL from command
        const url = text.replace(/^\.(fb|facebook|fbdl)\s+/i, "").trim();
        
        if (!url) {
            return reply("*𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚕𝚒𝚗𝚔*");
        }

        // Validate Facebook URL
        const facebookPatterns = [
            /https?:\/\/(?:www\.|m\.)?facebook\.com\//,
            /https?:\/\/(?:www\.)?fb\.watch\//,
            /https?:\/\/(?:www\.)?facebook\.com\/watch\//,
            /https?:\/\/(?:www\.)?fb\.com\//
        ];

        const isValidUrl = facebookPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return reply("*𝚃𝚑𝚊𝚝 𝚒𝚜 𝚗𝚘𝚝 𝚊 𝚟𝚊𝚕𝚒𝚍 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚕𝚒𝚗𝚔*");
        }

        await reply("*🔍 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚟𝚒𝚍𝚎𝚘...*");

        // Resolve share/short URLs to their final destination first
        let resolvedUrl = url;
        try {
            const res = await axios.get(url, { 
                timeout: 20000, 
                maxRedirects: 10, 
                headers: { 'User-Agent': 'Mozilla/5.0' } 
            });
            if (res?.request?.res?.responseUrl) {
                resolvedUrl = res.request.res.responseUrl;
            }
        } catch (e) {
            // ignore resolution errors; use original url
            console.log("URL resolution failed:", e.message);
        }

        // Helper to call API with retries and variants
        async function fetchFromApi(u) {
            const apiUrl = `https://api.princetechn.com/api/download/facebook?apikey=prince&url=${encodeURIComponent(u)}`;
            return axios.get(apiUrl, {
                timeout: 40000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                },
                maxRedirects: 5,
                validateStatus: s => s >= 200 && s < 500
            });
        }

        // Try resolved URL, then fallback to original URL
        let response;
        try {
            response = await fetchFromApi(resolvedUrl);
            if (!response || response.status >= 400 || !response.data) throw new Error('bad');
        } catch (e) {
            console.log("First API call failed, trying original URL");
            try {
                response = await fetchFromApi(url);
            } catch (err) {
                console.log("Second API call failed:", err.message);
                throw err;
            }
        }

        const data = response.data;

        if (!data || data.status !== 200 || !data.success || !data.result) {
            return reply("*❌ 𝚂𝚘𝚛𝚛𝚢, 𝚝𝚑𝚎 𝙰𝙿𝙸 𝚍𝚒𝚍 𝚗𝚘𝚝 𝚛𝚎𝚝𝚞𝚛𝚗 𝚟𝚊𝚕𝚒𝚍 𝚍𝚊𝚝𝚊*");
        }

        const fbvid = data.result.hd_video || data.result.sd_video;

        if (!fbvid) {
            return reply("*❌ 𝚆𝚛𝚘𝚗𝚐 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚍𝚊𝚝𝚊. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚜𝚞𝚛𝚎 𝚝𝚑𝚎 𝚟𝚒𝚍𝚎𝚘 𝚎𝚡𝚒𝚜𝚝𝚜*");
        }

        // Create temp directory if it doesn't exist
        const tmpDir = path.join(__dirname, '../temp');
        await fs.ensureDir(tmpDir);

        // Generate temp file path
        const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

        try {
            // Download the video
            const videoResponse = await axios({
                method: 'GET',
                url: fbvid,
                responseType: 'stream',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Range': 'bytes=0-',
                    'Connection': 'keep-alive',
                    'Referer': 'https://www.facebook.com/'
                }
            });

            const writer = fs.createWriteStream(tempFile);
            videoResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Check if file was downloaded successfully
            if (!(await fs.pathExists(tempFile)) || (await fs.stat(tempFile)).size === 0) {
                throw new Error('Failed to download video');
            }

            // Send the video
            const caption = `╭━━【 📥 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 】━━━╮
│ 📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
│ 📹 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: ${data.result.hd_video ? "𝙷𝙳" : "𝚂𝙳"}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

            await conn.sendMessage(from, {
                video: { url: tempFile },
                mimetype: "video/mp4",
                caption: caption
            }, { quoted: myquoted });

            // Clean up temp file after sending
            setTimeout(async () => {
                try {
                    await fs.unlink(tempFile);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError.message);
                }
            }, 5000);

            await m.react("✅");

        } catch (downloadError) {
            console.error('Video download error:', downloadError);
            
            // Try sending via URL directly
            try {
                const caption = `╭━━【 📥 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 】━━━╮
│ 📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
│ 📹 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: ${data.result.hd_video ? "𝙷𝙳" : "𝚂𝙳"}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

                await conn.sendMessage(from, {
                    video: { url: fbvid },
                    mimetype: "video/mp4",
                    caption: caption
                }, { quoted: myquoted });
                
                await m.react("✅");
                
            } catch (urlError) {
                console.error('URL send error:', urlError);
                reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚟𝚒𝚍𝚎𝚘*");
                await m.react("❌");
            }
        }

    } catch (error) {
        console.error('Error in Facebook command:', error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚟𝚒𝚍𝚎𝚘*");
        await m.react("❌");
    }
});
