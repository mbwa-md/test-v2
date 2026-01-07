const { cmd } = require('../momy');
const axios = require('axios');

cmd({
    pattern: "song",
    alias: ["play", "mp3", "audio", "sila"],
    desc: "download audio from YouTube with options",
    category: "media",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted, sender }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("*𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .song song name\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .song shape of you\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        // Show processing message with buttons
        const processingMsg = await conn.sendMessage(from, {
            text: `*🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐: "${query}"*\n\n*📥 𝚂𝚎𝚕𝚎𝚌𝚝 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚝𝚢𝚙𝚎:*`,
            footer: "𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡",
            templateButtons: [
                {
                    index: 1,
                    urlButton: {
                        displayText: "🎵 𝙰𝚞𝚍𝚒𝚘 (𝚖𝚙𝟹)",
                        url: "https://example.com"
                    }
                },
                {
                    index: 2,
                    quickReplyButton: {
                        displayText: "🎵 𝙰𝚞𝚍𝚒𝚘",
                        id: `song_audio_${query}`
                    }
                },
                {
                    index: 3,
                    quickReplyButton: {
                        displayText: "📄 𝙰𝚞𝚍𝚒𝚘𝙳𝚘𝚌",
                        id: `song_doc_${query}`
                    }
                }
            ]
        }, { quoted: myquoted });

        // Store query temporarily (optional - for button handling)
        // In a real implementation, you'd use a database or cache
        // For now, we'll process immediately

        // Search and send result
        await searchAndSendAudio(conn, from, query, myquoted, m, 'audio');

    } catch (error) {
        console.error("Song command error:", error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚜𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘*");
        await m.react("❌");
    }
});

// Function to search and send audio
async function searchAndSendAudio(conn, from, query, quotedMsg, m, type = 'audio') {
    try {
        await m.react("🔍");
        
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
│ 📁 𝚃𝚢𝚙𝚎: ${type === 'audio' ? '𝙰𝚞𝚍𝚒𝚘' : '𝙳𝚘𝚌𝚞𝚖𝚎𝚗𝚝'}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

                // Send thumbnail
                if (meta.cover) {
                    await conn.sendMessage(from, {
                        image: { url: meta.cover },
                        caption: caption
                    }, { quoted: quotedMsg });
                }

                // Send audio based on type
                if (type === 'audio') {
                    await conn.sendMessage(from, {
                        audio: { url: dlUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                    }, { quoted: quotedMsg });
                } else if (type === 'doc') {
                    await conn.sendMessage(from, {
                        document: { url: dlUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                    }, { quoted: quotedMsg });
                }
                
                await m.react("✅");
                return true;
            }
        } catch (e) {
            console.log("First API failed, trying second...");
        }

        // Fallback API
        try {
            const searchUrl = `https://api.nekolabs.my.id/api/ytsearch?q=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);
            
            if (searchRes.data?.status && searchRes.data.result?.length > 0) {
                const video = searchRes.data.result[0];
                const ytUrl = video.url;
                
                const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3&apikey=sadiya`;
                const apiRes = await axios.get(api);

                if (apiRes.data?.status && apiRes.data.result?.download) {
                    const result = apiRes.data.result;
                    const caption = `╭━━【 🎵 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 】━━━╮
│ 📛 𝚃𝚒𝚝𝚕𝚎: ${result.title}
│ ⏱️ 𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗: ${result.duration}
│ 👁️ 𝚅𝚒𝚎𝚠𝚜: ${result.views}
│ 📁 𝚃𝚢𝚙𝚎: ${type === 'audio' ? '𝙰𝚞𝚍𝚒𝚘' : '𝙳𝚘𝚌𝚞𝚖𝚎𝚗𝚝'}
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

                    // Send thumbnail
                    await conn.sendMessage(from, {
                        image: { url: result.thumbnail },
                        caption: caption
                    }, { quoted: quotedMsg });
                    
                    // Send audio based on type
                    if (type === 'audio') {
                        await conn.sendMessage(from, {
                            audio: { url: result.download },
                            mimetype: "audio/mpeg",
                            fileName: `${result.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                        }, { quoted: quotedMsg });
                    } else if (type === 'doc') {
                        await conn.sendMessage(from, {
                            document: { url: result.download },
                            mimetype: "audio/mpeg",
                            fileName: `${result.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                        }, { quoted: quotedMsg });
                    }
                    
                    await m.react("✅");
                    return true;
                }
            }
        } catch (e) {
            console.log("Second API failed");
        }

        await m.react("❌");
        return false;

    } catch (error) {
        console.error("Audio search error:", error);
        await m.react("❌");
        return false;
    }
}

// Separate command for audiodoc if needed
cmd({
    pattern: "audiodoc",
    alias: ["mp3doc", "songdoc"],
    desc: "download audio as document",
    category: "media",
    react: "📄",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const query = args.join(" ");
        if (!query) {
            return reply("*𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝙲𝚄𝙼𝙴𝙽𝚃 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*\n\n*𝚄𝚂𝙰𝙶𝙴:* .audiodoc song name\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .audiodoc shape of you\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*");
        }

        await reply("*🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘...*");
        await searchAndSendAudio(conn, from, query, myquoted, m, 'doc');

    } catch (error) {
        console.error("Audiodoc error:", error);
        reply("*❌ 𝙴𝚛𝚛𝚘𝚛 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚊𝚞𝚍𝚒𝚘 𝚍𝚘𝚌𝚞𝚖𝚎𝚗𝚝*");
        await m.react("❌");
    }
});

// Button handler (you need to add this to your main message handler)
/*
Add this to your main bot handler to process button clicks:

if (m.message?.templateButtonReplyMessage) {
    const buttonId = m.message.templateButtonReplyMessage.selectedId;
    
    if (buttonId?.startsWith('song_audio_')) {
        const query = buttonId.replace('song_audio_', '');
        await searchAndSendAudio(conn, from, query, m, m, 'audio');
    }
    else if (buttonId?.startsWith('song_doc_')) {
        const query = buttonId.replace('song_doc_', '');
        await searchAndSendAudio(conn, from, query, m, m, 'doc');
    }
}
*/
