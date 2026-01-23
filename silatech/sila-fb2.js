const { cmd, commands } = require('../momy');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© 𝐒𝐈𝐋𝐀-𝐌𝐃",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐒𝐈𝐋𝐀 𝐌𝐃 𝐁𝐎𝐓\nORG:𝐒𝐈𝐋𝐀-𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
    }
  }
};

const getContextInfo = (sender) => {
    return {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    react: "🎥",
    desc: "Download Facebook video",
    category: "downloader",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!q) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚟𝚒𝚍𝚎𝚘 𝚄𝚁𝙻`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }

    if (!q.includes('facebook.com')) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚊𝚝 𝚒𝚜 𝚗𝚘𝚝 𝚊 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚕𝚒𝚗𝚔`,
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }

    await conn.sendMessage(from, {
        text: `⏳ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚏𝚛𝚘𝚖 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔...`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });

    let resolvedUrl = q;
    try {
        const res = await axios.get(q, { timeout: 20000, maxRedirects: 10, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const possible = res?.request?.res?.responseUrl;
        if (possible && typeof possible === 'string') {
            resolvedUrl = possible;
        }
    } catch {}

    async function fetchFromApi(u) {
        const apiUrl = `https://api.hanggts.xyz/download/facebook?url=${encodeURIComponent(u)}`;
        
        try {
            const response = await axios.get(apiUrl, {
                timeout: 20000,
                headers: {
                    'accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxRedirects: 5,
                validateStatus: s => s >= 200 && s < 500
            });
            
            if (response.data) {
                if (response.data.status === true || 
                    response.data.result || 
                    response.data.data || 
                    response.data.url || 
                    response.data.download || 
                    response.data.video) {
                    return { response, apiName: 'Hanggts API' };
                }
            }
        } catch (error) {
            console.error(`Hanggts API failed: ${error.message}`);
        }
        throw new Error('Hanggts API failed');
    }

    let apiResult;
    try {
        apiResult = await fetchFromApi(resolvedUrl);
    } catch {
        apiResult = await fetchFromApi(q);
    }

    const response = apiResult.response;
    const data = response.data;

    let fbvid = null;
    let title = null;

    if (data) {
        if (data.result) {
            if (data.result.media) {
                fbvid = data.result.media.video_hd || data.result.media.video_sd;
                title = data.result.info?.title || data.result.title || data.title || "Facebook Video";
            }
            else if (typeof data.result === 'object' && data.result.url) {
                fbvid = data.result.url;
                title = data.result.title || data.result.caption || data.title || "Facebook Video";
            } 
            else if (typeof data.result === 'string' && data.result.startsWith('http')) {
                fbvid = data.result;
                title = data.title || "Facebook Video";
            }
            else if (data.result.download) {
                fbvid = data.result.download;
                title = data.result.title || data.title || "Facebook Video";
            } else if (data.result.video) {
                fbvid = data.result.video;
                title = data.result.title || data.title || "Facebook Video";
            }
        }
        
        if (!fbvid && data.data) {
            if (typeof data.data === 'object' && data.data.url) {
                fbvid = data.data.url;
                title = data.data.title || data.data.caption || data.title || "Facebook Video";
            } else if (typeof data.data === 'string' && data.data.startsWith('http')) {
                fbvid = data.data;
                title = data.title || "Facebook Video";
            } else if (Array.isArray(data.data) && data.data.length > 0) {
                const hdVideo = data.data.find(item => (item.quality === 'HD' || item.quality === 'high') && (item.format === 'mp4' || !item.format));
                const sdVideo = data.data.find(item => (item.quality === 'SD' || item.quality === 'low') && (item.format === 'mp4' || !item.format));
                fbvid = hdVideo?.url || sdVideo?.url || data.data[0]?.url;
                title = hdVideo?.title || sdVideo?.title || data.data[0]?.title || data.title || "Facebook Video";
            } else if (data.data.download) {
                fbvid = data.data.download;
                title = data.data.title || data.title || "Facebook Video";
            } else if (data.data.video) {
                fbvid = data.data.video;
                title = data.data.title || data.title || "Facebook Video";
            }
        }
        
        if (!fbvid && data.url) {
            fbvid = data.url;
            title = data.title || data.caption || "Facebook Video";
        }
        
        if (!fbvid && data.download) {
            fbvid = data.download;
            title = data.title || "Facebook Video";
        }
        
        if (!fbvid && data.video) {
            if (typeof data.video === 'string') {
                fbvid = data.video;
            } else if (data.video.url) {
                fbvid = data.video.url;
            }
            title = data.title || data.video.title || "Facebook Video";
        }
    }

    if (!fbvid) {
        return await conn.sendMessage(from, {
            text: '❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚝 𝚟𝚒𝚍𝚎𝚘 𝚄𝚁𝙻',
            contextInfo: getContextInfo(sender)
        }, { quoted: fakevCard });
    }

    try {
        const caption = title ? `┏━❑ 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━━━━━━━
┃ 📹 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
┃ 📝 𝚃𝚒𝚝𝚕𝚎: ${title}
┗━━━━━━━━━━━━━━━━━━━━━━━━` : `┏━❑ 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━━━━━━━
┃ 📹 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
┗━━━━━━━━━━━━━━━━━━━━━━━━`;
        
        await conn.sendMessage(
            from,
            {
                video: { url: fbvid },
                mimetype: "video/mp4",
                caption: caption,
                contextInfo: getContextInfo(sender)
            },
            { quoted: fakevCard }
        );
        
    } catch (urlError) {
        console.error(`URL method failed: ${urlError.message}`);
        
        try {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

            const videoResponse = await axios({
                method: 'GET',
                url: fbvid,
                responseType: 'stream',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.facebook.com/'
                }
            });

            const writer = fs.createWriteStream(tempFile);
            videoResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
                throw new Error('Failed to download video');
            }

            const caption = title ? `┏━❑ 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━━━━━━━
┃ 📹 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
┃ 📝 𝚃𝚒𝚝𝚕𝚎: ${title}
┗━━━━━━━━━━━━━━━━━━━━━━━━` : `┏━❑ 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐕𝐈𝐃𝐄𝐎 ━━━━━━━━━━━━━━━
┃ 📹 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢
┗━━━━━━━━━━━━━━━━━━━━━━━━`;
            
            await conn.sendMessage(
                from,
                {
                    video: { url: tempFile },
                    mimetype: "video/mp4",
                    caption: caption,
                    contextInfo: getContextInfo(sender)
                },
                { quoted: fakevCard }
            );

            try {
                fs.unlinkSync(tempFile);
            } catch (err) {
                console.error('Error cleaning up temp file:', err);
            }
            
        } catch (bufferError) {
            console.error(`Buffer method also failed: ${bufferError.message}`);
            
            await conn.sendMessage(from, {
                text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚟𝚒𝚍𝚎𝚘\n\n𝙴𝚛𝚛𝚘𝚛: ${bufferError.message}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: fakevCard });
        }
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍\n\n𝙴𝚛𝚛𝚘𝚛: ${e.message}`,
        contextInfo: getContextInfo(sender)
    }, { quoted: fakevCard });
    l(e);
}
});
