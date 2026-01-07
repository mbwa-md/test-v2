const { cmd } = require('../momy');
const axios = require('axios');
const yts = require('yt-search');

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result; // { download, title, ... }
    throw new Error('Izumi video api returned no download');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error('Okatsu ytmp4 returned no mp4');
}

cmd({
    pattern: "video",
    alias: ["ytv", "ytvideo", "mp4"],
    desc: "download youtube video",
    category: "media",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = mek.message?.conversation || mek.message?.extendedTextMessage?.text || args.join(" ");
        
        if (!text || text.trim().length < 2) {
            return reply("*𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .video search_or_url\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .video shape of you\n*𝙾𝚁:* .video https://youtu.be/xxx\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        const searchQuery = text.replace(/^\.(video|ytv|ytvideo|mp4)\s+/i, "").trim();
        
        // Determine if input is a YouTube link
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            await reply("*🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚈𝚘𝚞𝚃𝚞𝚋𝚎...*");
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("*❌ 𝙽𝚘 𝚟𝚒𝚍𝚎𝚘𝚜 𝚏𝚘𝚞𝚗𝚍!*");
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Validate YouTube URL
        const youtubePattern = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi;
        if (!youtubePattern.test(videoUrl)) {
            return reply("*❌ 𝚃𝚑𝚒𝚜 𝚒𝚜 𝚗𝚘𝚝 𝚊 𝚟𝚊𝚕𝚒𝚍 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚕𝚒𝚗𝚔!*");
        }

        // Send thumbnail
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || searchQuery;
            
            if (thumb) {
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: `╭━━【 🎬 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${captionTitle}
│ 📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
                }, { quoted: myquoted });
            }
        } catch (e) { 
            console.error('[VIDEO] thumb error:', e?.message || e);
        }

        // Get video: try Izumi first, then Okatsu fallback
        await reply("*📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚟𝚒𝚍𝚎𝚘...*");
        
        let videoData;
        try {
            videoData = await getIzumiVideoByUrl(videoUrl);
        } catch (e1) {
            videoData = await getOkatsuVideoByUrl(videoUrl);
        }

        if (!videoData?.download) {
            throw new Error("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚟𝚒𝚍𝚎𝚘*");
        }

        // Send video
        await conn.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${(videoData.title || videoTitle || 'video').replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp4`,
            caption: `╭━━【 🎬 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚅𝙸𝙳𝙴𝙾 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${videoData.title || videoTitle || 'Video'}
│ 📁 𝙵𝚘𝚛𝚖𝚊𝚝: 𝙼𝙿𝟺 (𝟽𝟸𝟶𝚙)
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚟𝚒𝚍𝚎𝚘*\n*𝚁𝚎𝚊𝚜𝚘𝚗:* " + (error.message || "Unknown error"));
        await m.react("❌");
    }
});
