const { cmd } = require('../momy');
const axios = require('axios');

cmd({
  pattern: "fb",
  react: "📱",
  alias: ["facebook", "fbdl"],
  category: "download",
  desc: "download facebook video",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, myquoted }) => {
  try {
    if (!q) return reply("*provide facebook video link*");

    const apiUrl = `https://movanest.xyz/v2/fbdown?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.results || data.results.length === 0) {
      return reply("*video not found*");
    }

    const dlUrl = data.results[0].hdQualityLink || data.results[0].normalQualityLink;

    const caption = `╭━━【 📱 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾 】━━━━╮
│ 📥 downloading facebook video...
╰━━━━━━━━━━━━━━━━━━━━╯

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

    await conn.sendMessage(from, {
      video: { url: dlUrl },
      caption: caption,
      mimetype: "video/mp4"
    }, { quoted: myquoted });

  } catch (err) {
    reply("*error downloading video*");
    console.error(err);
  }
});
