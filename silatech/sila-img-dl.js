const { cmd, commands } = require('../momy');
const axios = require('axios');

// Unsplash API Key
const UNSPLASH_API_KEY = "TKwNF_gHeB4Z6ieR6sV_Q8gIkQW_VFOcmiNfD0AX0uM";

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

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
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
    pattern: "img",
    alias: ["image", "searchimg", "pic", "photo"],
    react: "🖼️",
    desc: "Search and download images from Unsplash",
    category: "search",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!q) {
        return await conn.sendMessage(from, {
            text: `┏━❑ 𝐈𝐌𝐀𝐆𝐄 𝐒𝐄𝐀𝐑𝐂𝐇 ━━━━━━━━━━━━━━━
┃ 🖼️ 𝚂𝚎𝚊𝚛𝚌𝚑 𝚒𝚖𝚊𝚐𝚎𝚜 𝚏𝚛𝚘𝚖 𝚄𝚗𝚜𝚙𝚕𝚊𝚜𝚑
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 𝐔𝐬𝐚𝐠𝐞:
┃ • ${prefix}img <keywords> [number]
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎𝚜:
┃ • ${prefix}img beautiful sunset
┃ • ${prefix}img cute cats 5
┃ • ${prefix}img nature wallpaper 10
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    // Parse arguments
    const argsList = q.split(' ');
    let imageCount = 3; // Default
    
    // Check if last argument is a number
    const lastArg = argsList[argsList.length - 1];
    const parsedCount = parseInt(lastArg);
    
    let searchQuery;
    if (!isNaN(parsedCount) && parsedCount > 0 && parsedCount <= 20) {
        imageCount = parsedCount;
        searchQuery = argsList.slice(0, -1).join(' ');
    } else {
        searchQuery = q;
    }
    
    // Limit max images
    if (imageCount > 10) imageCount = 10;
    
    if (!searchQuery || searchQuery.trim() === '') {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚜𝚎𝚊𝚛𝚌𝚑 𝚔𝚎𝚢𝚠𝚘𝚛𝚍𝚜`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    // Send searching message
    await conn.sendMessage(from, {
        text: `┏━❑ 𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆 ━━━━━━━━━━━━━━━
┃ 🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚏𝚘𝚛: ${searchQuery}
┃ 📊 𝙸𝚖𝚊𝚐𝚎𝚜: ${imageCount}
┃ ⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    
    try {
        // Make API request
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${imageCount}&client_id=${UNSPLASH_API_KEY}`;
        const { data } = await axios.get(url);
        
        if (!data.results || data.results.length === 0) {
            return await conn.sendMessage(from, {
                text: `❌ 𝙽𝚘 𝚒𝚖𝚊𝚐𝚎𝚜 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 "${searchQuery}"\n\n𝚃𝚛𝚢 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚔𝚎𝚢𝚠𝚘𝚛𝚍𝚜`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        
        // Send images
        let sentCount = 0;
        const imagesToSend = data.results.slice(0, imageCount);
        
        for (const [index, image] of imagesToSend.entries()) {
            try {
                await conn.sendMessage(from, {
                    image: { url: image.urls.regular },
                    caption: `┏━❑ 𝐈𝐌𝐀𝐆𝐄 𝐑𝐄𝐒𝐔𝐋𝐓 ━━━━━━━━━━━━━━━
┃ 🖼️ 𝚂𝚎𝚊𝚛𝚌𝚑: ${searchQuery}
┃ 📸 𝙿𝚑𝚘𝚝𝚘𝚐𝚛𝚊𝚙𝚑𝚎𝚛: ${image.user.name || 'Unknown'}
┃ 👍 𝙻𝚒𝚔𝚎𝚜: ${image.likes || 0}
┃ 🔗 𝚄𝚗𝚜𝚙𝚕𝚊𝚜𝚑: ${image.links.html}
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 🖼️ 𝙸𝚖𝚊𝚐𝚎 ${index + 1} 𝚘𝚏 ${imagesToSend.length}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                    contextInfo: getContextInfo({ sender: sender })
                }, { quoted: fakevCard });
                
                sentCount++;
                
                // Add delay between sending images
                if (index < imagesToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                
            } catch (imageError) {
                console.error(`Error sending image ${index + 1}:`, imageError);
            }
        }
        
        // Send completion message
        if (sentCount > 0) {
            await conn.sendMessage(from, {
                text: `┏━❑ 𝐒𝐄𝐀𝐑𝐂𝐇 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 ━━━━━━━━━━━━━━━
┃ ✅ 𝚂𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢 𝚜𝚎𝚗𝚝 ${sentCount} 𝚒𝚖𝚊𝚐𝚎𝚜
┃ 🔍 𝚂𝚎𝚊𝚛𝚌𝚑 𝚚𝚞𝚎𝚛𝚢: ${searchQuery}
┃ 🖼️ 𝚂𝚘𝚞𝚛𝚌𝚎: 𝚄𝚗𝚜𝚙𝚕𝚊𝚜𝚑 𝙰𝙿𝙸
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        } else {
            await conn.sendMessage(from, {
                text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝚊𝚗𝚢 𝚒𝚖𝚊𝚐𝚎𝚜`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        
    } catch (apiError) {
        if (apiError.response?.status === 401) {
            await conn.sendMessage(from, {
                text: `❌ 𝙰𝙿𝙸 𝚔𝚎𝚢 𝚒𝚗𝚟𝚊𝚕𝚒𝚍 𝚘𝚛 𝚎𝚡𝚙𝚒𝚛𝚎𝚍\n\n𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        } else if (apiError.response?.status === 429) {
            await conn.sendMessage(from, {
                text: `❌ 𝚁𝚊𝚝𝚎 𝚕𝚒𝚖𝚒𝚝 𝚎𝚡𝚌𝚎𝚎𝚍𝚎𝚍\n\n𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        } else {
            await conn.sendMessage(from, {
                text: `❌ 𝙴𝚛𝚛𝚘𝚛 𝚏𝚎𝚝𝚌𝚑𝚒𝚗𝚐 𝚒𝚖𝚊𝚐𝚎𝚜\n\n${apiError.message}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        l(apiError);
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});
