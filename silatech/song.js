const { cmd } = require('../momy');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["play", "mp3", "audio", "sila"],
    desc: "download audio from YouTube",
    category: "media",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝙰𝚄𝙳𝙸𝙾?*\n*𝚄𝚂𝙰𝙶𝙴:* .song song name\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .song shape of you");
        }

        await reply("*𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘...*");

        // Try first API
        try {
            const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`;
            const res = await axios.get(apiUrl);
            const data = res.data;

            if (data?.success && data?.result?.downloadUrl) {
                const meta = data.result.metadata;
                const dlUrl = data.result.downloadUrl;
                
                const caption = `╭━━【 🎵 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${meta.title}
│ 👤 𝙲𝚑𝚊𝚗𝚗𝚎𝚕: ${meta.channel}
│ ⏱️ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${meta.duration}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                
                // Send thumbnail if available
                if (meta.cover) {
                    await conn.sendMessage(from, {
                        image: { url: meta.cover },
                        caption: caption
                    }, { quoted: myquoted });
                }
                
                // Send audio
                await conn.sendMessage(from, {
                    audio: { url: dlUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                }, { quoted: myquoted });
                
                await m.react("✅");
                return;
            }
        } catch (e) {
            console.log("First API failed, trying second...");
        }

        // Fallback API - using existing API from your code
        try {
            // Search YouTube first to get URL
            const searchUrl = `https://api.nekolabs.my.id/api/ytsearch?q=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);
            
            if (searchRes.data?.status && searchRes.data.result?.length > 0) {
                const video = searchRes.data.result[0];
                const ytUrl = video.url;
                
                // Download using second API
                const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3&apikey=sadiya`;
                const apiRes = await axios.get(api);

                if (apiRes.data?.status && apiRes.data.result?.download) {
                    const result = apiRes.data.result;
                    const caption = `╭━━【 🎵 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${result.title}
│ ⏱️ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${result.duration}
│ 👁️ 𝚅𝚒𝚎𝚠𝚜: ${result.views}
│ 📅 𝚄𝚙𝚕𝚘𝚊𝚍𝚎𝚍: ${result.publish}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

                    // Send thumbnail
                    await conn.sendMessage(from, {
                        image: { url: result.thumbnail },
                        caption: caption
                    }, { quoted: myquoted });
                    
                    // Send audio
                    await conn.sendMessage(from, {
                        audio: { url: result.download },
                        mimetype: "audio/mpeg",
                        fileName: `${result.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                    }, { quoted: myquoted });
                    
                    await m.react("✅");
                    return;
                }
            }
        } catch (e) {
            console.log("Second API failed");
        }

        // If both APIs fail
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚊𝚞𝚍𝚒𝚘*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛*");
        await m.react("❌");

    } catch (error) {
        console.error("Song error:", error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘*");
        await m.react("❌");
    }
});
