const { cmd } = require('../momy');
const fetch = require('node-fetch');

const BASE = 'https://shizoapi.onrender.com/api/pies';
const VALID_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab'];

async function fetchPiesImageBuffer(country) {
	const url = `${BASE}/${country}?apikey=shizo`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const contentType = res.headers.get('content-type') || '';
	if (!contentType.includes('image')) throw new Error('API did not return an image');
	return res.buffer();
}

// Main pies command
cmd({
    pattern: "pies",
    alias: ["asian", "beauty"],
    desc: "get asian beauty images",
    category: "media",
    react: "🌺",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const sub = (args && args[0] ? args[0] : '').toLowerCase();
        
        if (!sub) {
            return reply(`*🌺 𝙰𝚂𝙸𝙰𝙽 𝙱𝙴𝙰𝚄𝚃𝚈*\n\n*𝚄𝚂𝙰𝙶𝙴:* .pies <country>\n*𝙲𝙾𝚄𝙽𝚃𝚁𝙸𝙴𝚂:* ${VALID_COUNTRIES.join(', ')}\n\n*𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡*`);
        }
        
        if (!VALID_COUNTRIES.includes(sub)) {
            return reply(`*❌ 𝚄𝚗𝚜𝚞𝚙𝚙𝚘𝚛𝚝𝚎𝚍 𝚌𝚘𝚞𝚗𝚝𝚛𝚢: ${sub}*\n*𝚃𝚛𝚢 𝚘𝚗𝚎 𝚘𝚏:* ${VALID_COUNTRIES.join(', ')}`);
        }

        await reply("*🌺 𝙵𝚎𝚝𝚌𝚑𝚒𝚗𝚐 𝚒𝚖𝚊𝚐𝚎...*");

        const imageBuffer = await fetchPiesImageBuffer(sub);
        
        const countryNames = {
            'china': '🇨🇳 𝙲𝚑𝚒𝚗𝚎𝚜𝚎',
            'indonesia': '🇮🇩 𝙸𝚗𝚍𝚘𝚗𝚎𝚜𝚒𝚊𝚗',
            'japan': '🇯🇵 𝙹𝚊𝚙𝚊𝚗𝚎𝚜𝚎',
            'korea': '🇰🇷 𝙺𝚘𝚛𝚎𝚊𝚗',
            'hijab': '🧕 𝙷𝚒𝚓𝚊𝚋'
        };

        const caption = `╭━━【 🌺 𝙰𝚂𝙸𝙰𝙽 𝙱𝙴𝙰𝚄𝚃𝚈 】━━━╮
│ 📍 𝙲𝚘𝚞𝚗𝚝𝚛𝚢: ${countryNames[sub] || sub}
│ 🖼️ 𝙸𝚖𝚊𝚐𝚎 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: 𝙷𝙳
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: caption
        }, { quoted: myquoted });

        await m.react("✅");

    } catch (err) {
        console.error('Error in pies command:', err);
        reply("*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚏𝚎𝚝𝚌𝚑 𝚒𝚖𝚊𝚐𝚎. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.*");
        await m.react("❌");
    }
});

// Individual country commands
VALID_COUNTRIES.forEach(country => {
    cmd({
        pattern: country,
        desc: `get ${country} beauty images`,
        category: "media",
        react: "🌺",
        filename: __filename
    }, async (conn, mek, m, { from, reply, myquoted }) => {
        try {
            await reply(`*🌺 𝙵𝚎𝚝𝚌𝚑𝚒𝚗𝚐 ${country} 𝚒𝚖𝚊𝚐𝚎...*`);

            const imageBuffer = await fetchPiesImageBuffer(country);
            
            const countryNames = {
                'china': '🇨🇳 𝙲𝚑𝚒𝚗𝚎𝚜𝚎',
                'indonesia': '🇮🇩 𝙸𝚗𝚍𝚘𝚗𝚎𝚜𝚒𝚊𝚗',
                'japan': '🇯🇵 𝙹𝚊𝚙𝚊𝚗𝚎𝚜𝚎',
                'korea': '🇰🇷 𝙺𝚘𝚛𝚎𝚊𝚗',
                'hijab': '🧕 𝙷𝚒𝚓𝚊𝚋'
            };

            const caption = `╭━━【 🌺 𝙰𝚂𝙸𝙰𝙽 𝙱𝙴𝙰𝚄𝚃𝚈 】━━━╮
│ 📍 𝙲𝚘𝚞𝚗𝚝𝚛𝚢: ${countryNames[country] || country}
│ 🖼️ 𝙸𝚖𝚊𝚐𝚎 𝚀𝚞𝚊𝚕𝚒𝚝𝚢: 𝙷𝙳
╰━━━━━━━━━━━━━━━━━━━╯

> 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

            await conn.sendMessage(from, {
                image: imageBuffer,
                caption: caption
            }, { quoted: myquoted });

            await m.react("✅");

        } catch (err) {
            console.error(`Error in ${country} command:`, err);
            reply(`*❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚏𝚎𝚝𝚌𝚑 ${country} 𝚒𝚖𝚊𝚐𝚎.*`);
            await m.react("❌");
        }
    });
});
