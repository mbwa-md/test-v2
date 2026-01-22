const { cmd } = require('../momy');
const axios = require('axios');
const yts = require('yt-search');

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

        // Search for the song/video
        let video;
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            video = { url: query };
        } else {
            const search = await yts(query);
            if (!search || !search.videos.length) {
                return reply("*❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍*");
            }
            video = search.videos[0];
        }

        // Send video info
        const caption = `╭━━【 🎵 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${video.title}
│ ⏱️ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${video.timestamp}
│ 👁️ 𝚅𝚒𝚎𝚠𝚜: ${video.views}
╰━━━━━━━━━━━━━━━━━━━╯

*𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐢𝐧𝐠...*`;

        await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption: caption
        }, { quoted: myquoted });

        // Try multiple APIs for downloading
        let audioUrl = null;
        let audioTitle = video.title;
        let audioThumb = video.thumbnail;

        // API 1: Yupra
        try {
            const apiUrl1 = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
            const res1 = await axios.get(apiUrl1, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (res1.data?.success && res1.data?.data?.download_url) {
                audioUrl = res1.data.data.download_url;
                audioTitle = res1.data.data.title || video.title;
                audioThumb = res1.data.data.thumbnail || video.thumbnail;
                console.log("Using Yupra API");
            }
        } catch (e) {
            console.log("Yupra API failed:", e.message);
        }

        // API 2: Okatsu (fallback)
        if (!audioUrl) {
            try {
                const apiUrl2 = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                const res2 = await axios.get(apiUrl2, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                if (res2.data?.dl) {
                    audioUrl = res2.data.dl;
                    audioTitle = res2.data.title || video.title;
                    audioThumb = res2.data.thumb || video.thumbnail;
                    console.log("Using Okatsu API");
                }
            } catch (e) {
                console.log("Okatsu API failed:", e.message);
            }
        }

        // API 3: Alternative API (backup)
        if (!audioUrl) {
            try {
                const apiUrl3 = `https://youtube-mp3-download1.p.rapidapi.com/dl?id=${video.url.split('v=')[1] || video.url}`;
                const res3 = await axios.get(apiUrl3, {
                    timeout: 30000,
                    headers: {
                        'X-RapidAPI-Key': 'your-api-key-here', // Add your API key if available
                        'X-RapidAPI-Host': 'youtube-mp3-download1.p.rapidapi.com'
                    }
                });

                if (res3.data?.link) {
                    audioUrl = res3.data.link;
                    console.log("Using RapidAPI");
                }
            } catch (e) {
                console.log("RapidAPI failed:", e.message);
            }
        }

        if (!audioUrl) {
            throw new Error("All APIs failed");
        }

        // Download the audio
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        // Send the audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${audioTitle.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
        }, { quoted: myquoted });

        // Send success message
        await conn.sendMessage(from, {
            text: `✅ *${audioTitle}* has been downloaded successfully!\n\n> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (error) {
        console.error("Song error:", error);
        
        if (error.message.includes("All APIs failed")) {
            await reply("*❌ 𝙰𝚕𝚕 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚊𝚙𝚒𝚜 𝚏𝚊𝚒𝚕𝚎𝚍*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛 𝚘𝚛 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚊𝚍𝚖𝚒𝚗*");
        } else if (error.message.includes("timeout")) {
            await reply("*❌ 𝚁𝚎𝚚𝚞𝚎𝚜𝚝 𝚝𝚒𝚖𝚎𝚍 𝚘𝚞𝚝*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛*");
        } else {
            await reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘*\n*𝙲𝚑𝚎𝚌𝚔 𝚢𝚘𝚞𝚛 𝚒𝚗𝚝𝚎𝚛𝚗𝚎𝚝 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗*");
        }
        
        await m.react("❌");
    }
});
