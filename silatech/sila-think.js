const { cmd, commands } = require('../momy');
const axios = require('axios');

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

const AXIOS_DEFAULTS = {
	timeout: 45000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json'
	}
};

// Main think command
cmd({
    pattern: "think",
    alias: ["copilot-think", "deepthink", "reasoning", "analyze", "consider", "ponder"],
    react: "🧠",
    desc: "Deep AI thinking and analysis",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, q, l }) => {
    try {
        if (!q || !q.trim()) {
            return await conn.sendMessage(from, {
                text: `┏━❑ 𝐃𝐄𝐄𝐏 𝐀𝐈 𝐓𝐇𝐈𝐍𝐊𝐄𝐑 ━━━━━━━━━
┃ 🧠 𝙰𝚞𝚡𝚘𝚞𝚜 𝚖𝚞𝚎𝚜𝚝𝚒𝚘𝚗𝚜 𝚍𝚎𝚎𝚙𝚕𝚢
┃
┃ 𝚄𝚜𝚎: .𝚝𝚑𝚒𝚗𝚔 𝚢𝚘𝚞𝚛 𝚍𝚞𝚎𝚜𝚝𝚒𝚘𝚗
┃
┃ 𝙰𝚕𝚒𝚊𝚜𝚎𝚜:
┃ • .𝚝𝚑𝚒𝚗𝚔
┃ • .𝚍𝚎𝚎𝚙𝚝𝚑𝚒𝚗𝚔
┃ • .𝚛𝚎𝚊𝚜𝚘𝚗𝚒𝚗𝚐
┃ • .𝚊𝚗𝚊𝚕𝚢𝚣𝚎
┃
┃ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎𝚜:
┃ • .𝚝𝚑𝚒𝚗𝚔 𝙸𝚜 𝙰𝙸 𝚊 𝚌𝚘𝚗𝚜𝚌𝚒𝚘𝚞𝚜𝚗𝚎𝚜𝚜?
┃ • .𝚊𝚗𝚊𝚕𝚢𝚣𝚎 𝙷𝚘𝚠 𝚕𝚒𝚐𝚑𝚝 𝚊𝚏𝚏𝚎𝚌𝚝𝚜 𝚙𝚒𝚊𝚙𝚞
┗━━━━━━━━━━━━━━━━━━━━`,
                contextInfo: getContextInfo(sender)
            }, { quoted: fakevCard });
        }

        // Show thinking indicator
        const thinkMsg = await conn.sendMessage(from, {
            text: `🧠 𝐃𝐞𝐞𝐩 𝐭𝐡𝐢𝐧𝐤𝐢𝐧𝐠...\n⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝 𝚏𝚘𝚛 𝚊𝚗𝚊𝚕𝚢𝚜𝚒𝚜...`
        }, { quoted: mek });

        try {
            // Call Copilot Think API
            const apiUrl = `https://api.yupra.my.id/api/ai/copilot-think?text=${encodeURIComponent(q.trim())}`;
            const response = await axios.get(apiUrl, AXIOS_DEFAULTS);

            if (!response.data) {
                throw new Error('No response from API');
            }

            let aiResponse = response.data.response || response.data.result || response.data.data || response.data.message || JSON.stringify(response.data);

            // Truncate if too long
            if (aiResponse.length > 4096) {
                aiResponse = aiResponse.substring(0, 4090) + '...';
            }

            // Format with better styling
            const formattedResponse = aiResponse
                .split('\n')
                .map(line => `┃ ${line}`)
                .join('\n');

            const finalMsg = `┏━❑ 𝐀𝐈 𝐃𝐄𝐄𝐏 𝐀𝐍𝐀𝐋𝐘𝐒𝐈𝐒 ━━━━━━━━━

${formattedResponse}
`;

            // Delete thinking message
            await conn.sendMessage(from, { delete: thinkMsg.key });

            // Send response
            await conn.sendMessage(from, {
                text: finalMsg,
                contextInfo: getContextInfo(sender)
            }, { quoted: fakevCard });

        } catch (apiErr) {
            console.error('API Error:', apiErr);
            await conn.sendMessage(from, { delete: thinkMsg.key });
            
            let errorMsg = '❌ 𝙰𝙸 𝙰𝙽𝙰𝙻𝚈𝚂𝙸𝚂 𝙴𝚁𝚁𝙾𝚁';
            
            if (apiErr.response?.status === 429) {
                errorMsg = '❌ 𝙰𝚞𝚎𝚘𝚞𝚜 𝚕𝚒𝚖𝚒𝚝𝚎𝚍 - 𝚠𝚊𝚒𝚝 𝚊 𝚖𝚒𝚗𝚞𝚝𝚎';
            } else if (apiErr.response?.status === 500) {
                errorMsg = '❌𝙰𝚒 𝚖𝚊𝚕𝚏𝚞𝚗𝚌𝚝𝚒𝚘𝚗𝚒𝚗𝚐';
            } else if (apiErr.code === 'ECONNABORTED') {
                errorMsg = '❌ 𝚁𝚎𝚚𝚞𝚎𝚜𝚝 𝚝𝚒𝚖𝚎𝚍 𝚘𝚞𝚝';
            }

            return reply(errorMsg, { quoted: fakevCard });
        }

    } catch (e) {
        console.error('Think command error:', e);
        reply(`❌ 𝙰𝙽𝙰𝙻𝚈𝚂𝙸𝚂 𝙴𝚁𝚁𝙾𝚁\n\n𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛`, { quoted: fakevCard });
        if (l) l(e);
    }
});

// Multi-step reasoning command
cmd({
    pattern: "reason",
    alias: ["logic", "explain", "breakdown", "steps"],
    react: "🔍",
    desc: "Step-by-step reasoning and logic",
    category: "ai",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, q, l }) => {
    try {
        if (!q || !q.trim()) {
            return reply(`┏━❑ 𝐒𝐓𝐄𝐏-𝐁𝐘-𝐒𝐓𝐄𝐏 𝐑𝐄𝐀𝐒𝐎𝐍𝐈𝐍𝐆 ━━━━━━━━━
┃ 🔍 𝙰𝚗𝚊𝚖𝚦𝚡𝚘 𝚘𝚞𝚎𝚜𝚝𝚒𝚘𝚖𝚙 𝚎𝚞𝚛𝚎
┃
┃ 𝚄𝚜𝚎: .𝚛𝚎𝚊𝚜𝚘𝚗 𝚌𝚘𝚘𝚙𝚕𝚎𝚡 𝚍𝚞𝚎𝚜𝚝𝚒𝚘𝚖
┗━━━━━━━━━━━━━━━━━━━━`, { quoted: fakevCard });
        }

        const loadMsg = await conn.sendMessage(from, {
            text: `🔍 𝐀𝐧𝐚𝐥𝐲𝐳𝐢𝐧𝐠...\n⏳ 𝐁𝐫𝐞𝐚𝐤𝐢𝐧𝐠 𝐝𝐨𝐰𝐧 𝐬𝐭𝐞𝐩𝐬...`
        }, { quoted: mek });

        try {
            const reasonPrompt = `Explain this step by step with clear reasoning: ${q.trim()}`;
            const apiUrl = `https://api.yupra.my.id/api/ai/copilot-think?text=${encodeURIComponent(reasonPrompt)}`;
            const response = await axios.get(apiUrl, AXIOS_DEFAULTS);

            if (!response.data) {
                throw new Error('No response from API');
            }

            let aiResponse = response.data.response || response.data.result || response.data.data || response.data.message || JSON.stringify(response.data);

            // Truncate if too long
            if (aiResponse.length > 4096) {
                aiResponse = aiResponse.substring(0, 4090) + '...';
            }

            const formattedResponse = aiResponse
                .split('\n')
                .map(line => `┃ ${line}`)
                .join('\n');

            const finalMsg = `┏━❑ 𝐒𝐓𝐄𝐏-𝐁𝐘-𝐒𝐓𝐄𝐏 𝐀𝐍𝐀𝐋𝐘𝐒𝐈𝐒 ━━━━━━
┃
${formattedResponse}
┃
┗━━━━━━━━━━━━━━━━━━━━`;

            await conn.sendMessage(from, { delete: loadMsg.key });

            await conn.sendMessage(from, {
                text: finalMsg,
                contextInfo: getContextInfo(sender)
            }, { quoted: fakevCard });

        } catch (apiErr) {
            console.error('API Error:', apiErr);
            await conn.sendMessage(from, { delete: loadMsg.key });
            return reply(`❌ 𝙰𝙽𝙰𝙻𝚈𝚂𝙸𝚂 𝙴𝚁𝚁𝙾𝚁\n𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚖`, { quoted: fakevCard });
        }

    } catch (e) {
        console.error('Reason command error:', e);
        reply(`❌ 𝙴𝚁𝚁𝙾𝚁 𝚠𝚜𝚎𝚍`, { quoted: fakevCard });
        if (l) l(e);
    }
});
