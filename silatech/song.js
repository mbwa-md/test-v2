const { cmd } = require('../momy');
const axios = require('axios');

cmd({
  pattern: "song",
  alias: ["play", "audio", "mp3"],
  react: "🎶",
  desc: "Download YouTube audio in mini bot style",
  category: "download",
  use: ".song <name/link>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    // Basic Check
    if (!q) return reply("*👑 ENTER SONG NAME OR LINK G!*");

    // Start Reaction
    await m.react("📥");

    // Calling API (Using Movanest ytmp3 v2)
    const apiUrl = `https://www.movanest.xyz/v2/ytmp3?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    // Validation Check based on your Video command logic
    if (!data || !data.results || !data.results.download || !data.results.download.url) {
      await m.react("❌");
      return reply("*👑 ERROR :❯* AUDIO NOT FOUND! 😔");
    }

    const metadata = data.results.metadata;
    const download = data.results.download;

    // Mini Bot Style Caption (Exactly like your Video command)
    const caption = `
*👑 SONG DOWNLOADER 👑*

*👑 NAME   :❯ ${metadata.title.toUpperCase()}*
*👑 VIEWS  :❯ ${metadata.views}*
*👑 TIME   :❯ ${metadata.duration.timestamp}*
*👑 SIZE   :❯ ${(download.size / 1024 / 1024).toFixed(2)} MB*

*👑 BILAL-MD 👑*`;

    // 1. Send Image First (Thumbnail)
    await conn.sendMessage(from, { 
      image: { url: metadata.thumbnail || metadata.image }, 
      caption: caption 
    }, { quoted: mek });

    // 2. Send Audio File
    await conn.sendMessage(from, {
      audio: { url: download.url },
      mimetype: "audio/mpeg",
      fileName: `${metadata.title.toUpperCase()}.mp3`
    }, { quoted: mek });

    // Success Reaction
    await m.react("✅");

  } catch (err) {
    console.error("SONG CMD ERROR:", err);
    await m.react("❌");
    reply("*👑 ERROR :❯* API SE RABTA NAHI HO PA RHA!");
  }
});
