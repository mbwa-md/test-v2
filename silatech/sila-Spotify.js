const { cmd, commands } = require('../momy');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

const AXIOS_DEFAULTS = {
	timeout: 60000,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*'
	}
};

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

async function downloadSpotifyAudio(spotifyUrl) {
	const apiUrl = `https://api.yupra.my.id/api/downloader/spotify?url=${encodeURIComponent(spotifyUrl)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.status && res?.data?.result?.download) {
		return {
			download: res.data.result.download,
			title: res.data.result.title || res.data.result.name,
			artist: res.data.result.artist || res.data.result.artists?.join(', '),
			thumbnail: res.data.result.image || res.data.result.cover
		};
	}
	throw new Error('Failed to get download link from Spotify');
}

async function searchSpotifyYupra(query) {
	const apiUrl = `https://api.yupra.my.id/api/search/spotify?q=${encodeURIComponent(query)}`;
	const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
	if (res?.data?.status && res?.data?.result?.length > 0) {
		return res.data.result;
	}
	throw new Error('No search results found');
}

async function downloadAudio(audioUrl) {
	try {
		const audioResponse = await axios.get(audioUrl, {
			responseType: 'arraybuffer',
			timeout: 90000,
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
			decompress: true,
			validateStatus: s => s >= 200 && s < 400,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': '*/*',
				'Accept-Encoding': 'identity'
			}
		});
		return Buffer.from(audioResponse.data);
	} catch (e1) {
		const audioResponse = await axios.get(audioUrl, {
			responseType: 'stream',
			timeout: 90000,
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
			validateStatus: s => s >= 200 && s < 400,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': '*/*',
				'Accept-Encoding': 'identity'
			}
		});
		const chunks = [];
		await new Promise((resolve, reject) => {
			audioResponse.data.on('data', c => chunks.push(c));
			audioResponse.data.on('end', resolve);
			audioResponse.data.on('error', reject);
		});
		return Buffer.concat(chunks);
	}
}

function detectAudioFormat(buffer) {
	const firstBytes = buffer.slice(0, 12);
	const hexSignature = firstBytes.toString('hex');
	const asciiSignature = firstBytes.toString('ascii', 4, 8);

	let mimeType = 'audio/mpeg';
	let extension = 'mp3';
	let format = 'MP3';

	if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
		format = 'M4A/MP4';
		mimeType = 'audio/mp4';
		extension = 'm4a';
	}
	else if (buffer.toString('ascii', 0, 3) === 'ID3' || 
	         (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
		format = 'MP3';
		mimeType = 'audio/mpeg';
		extension = 'mp3';
	}
	else if (buffer.toString('ascii', 0, 4) === 'OggS') {
		format = 'OGG/Opus';
		mimeType = 'audio/ogg; codecs=opus';
		extension = 'ogg';
	}
	else if (buffer.toString('ascii', 0, 4) === 'RIFF') {
		format = 'WAV';
		mimeType = 'audio/wav';
		extension = 'wav';
	}

	return { mimeType, extension, format };
}

// Spotify command
cmd({
	pattern: 'spotify',
	alias: ['spot', 'spoti', 'spotifyplay', 'spotmusic', 'spotify', 'silaspotify'],
	react: '🎧',
	desc: 'Search and play songs from Spotify',
	category: 'downloader',
	filename: __filename
}, async (conn, mek, m, { from, sender, reply, q }) => {
	try {
		if (!q) {
			return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 𝙿𝙻𝙰𝚈𝙴𝚁 ━━━━━━━━━
┃ 🎧 𝚂𝚎𝚊𝚛𝚌𝚑 & 𝚙𝚕𝚊𝚢 𝚖𝚞𝚜𝚒𝚌 𝚏𝚛𝚘𝚖 𝚂𝚙𝚘𝚝𝚒𝚏𝚢
┃
┃ 𝚄𝚜𝚎: .𝚜𝚙𝚘𝚝𝚒𝚏𝚢 𝚜𝚘𝚗𝚐_𝚗𝚊𝚖𝚎
┃
┃ 𝙰𝚕𝚒𝚊𝚜𝚎𝚜:
┃ • .𝚜𝚙𝚘𝚝
┃ • .𝚜𝚙𝚘𝚝𝚖𝚞𝚜𝚒𝚌
┃ • .𝚜𝚒𝚕𝚊𝚜𝚙𝚘𝚝𝚒𝚏𝚢
┃
┃ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎𝚜:
┃ • .𝚜𝚙𝚘𝚝𝚒𝚏𝚢 𝙰𝚖𝚒𝚗𝙰𝚣𝚎𝚛𝚊
┃ • .𝚜𝚙𝚘𝚝 𝙱𝚎𝚝𝚝𝚎𝚛 𝙷𝚊𝚣𝚎𝚕
┗━━━━━━━━━━━━━━━━━━━━`);
		}

		// Show search progress
		const searchMsg = await conn.sendMessage(from, {
			text: `🔍 𝚂𝚎𝚊𝚛𝚌𝚑𝚒𝚗𝚐 𝚂𝚙𝚘𝚝𝚒𝚏𝚢 𝚏𝚘𝚛 *${q}*...`
		}, { quoted: mek });

		// Search Spotify
		let results;
		try {
			results = await searchSpotifyYupra(q);
		} catch (searchErr) {
			await conn.sendMessage(from, { delete: searchMsg.key });
			return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚜𝚎𝚊𝚛𝚌𝚑 𝚎𝚛𝚛𝚘𝚛 ━━━━━━━━━
┃ ❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍
┃ 𝚃𝚛𝚢 𝚖𝚘𝚛𝚎 𝚜𝚙𝚎𝚌𝚒𝚏𝚒𝚌 𝚛𝚖𝚎𝚜
┗━━━━━━━━━━━━━━━━━━━━`);
		}

		if (!results || results.length === 0) {
			await conn.sendMessage(from, { delete: searchMsg.key });
			return reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚜𝚎𝚊𝚛𝚌𝚑 ━━━━━━━━━
┃ ❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍
┗━━━━━━━━━━━━━━━━━━━━`);
		}

		// Use first result
		const song = results[0];

		// Build results list
		let resultsList = `┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚂𝙿𝙾𝚃𝙸𝙵𝚈 𝚂𝙴𝙰𝚁𝙲𝙷 ━━━━━━\n┃\n`;
		results.slice(0, 5).forEach((r, i) => {
			const artists = r.artists?.map(a => a.name)?.join(', ') || 'Unknown';
			resultsList += `┃ 𝟶${i + 1} • ${r.title?.substring(0, 35)}\n┃    🎤 ${artists.substring(0, 35)}\n┃\n`;
		});
		resultsList += `┗━━━━━━━━━━━━━━━━━━━━━\n\n🎧 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐 𝚝𝚘𝚙 𝚛𝚎𝚜𝚞𝚕𝚝...`;

		const artistName = song.artists?.map(a => a.name)?.join(', ') || 'Unknown Artist';

		await conn.sendMessage(from, {
			text: resultsList,
			contextInfo: {
				mentionedJid: [sender],
				externalAdReply: {
					title: song.title,
					body: artistName,
					mediaType: 'IMAGE',
					renderLargerThumbnail: true,
					thumbnail: song.thumbnail_url
				}
			}
		}, { quoted: mek });

		// Download audio using direct download API
		try {
			const downloadData = await downloadSpotifyAudio(song.url);
			
			if (!downloadData.download) {
				throw new Error('No download URL available');
			}

			// Download to buffer
			const audioBuffer = await downloadAudio(downloadData.download);

			if (!audioBuffer || audioBuffer.length === 0) {
				throw new Error('Downloaded buffer is empty');
			}

			// Detect format
			const { mimeType, extension, format } = detectAudioFormat(audioBuffer);

			// Convert to MP3 if needed
			let finalBuffer = audioBuffer;
			let finalMimeType = 'audio/mpeg';
			let finalExtension = 'mp3';

			if (extension !== 'mp3') {
				try {
					finalBuffer = await toAudio(audioBuffer, extension);
					if (!finalBuffer || finalBuffer.length === 0) {
						throw new Error('Conversion returned empty');
					}
					finalMimeType = 'audio/mpeg';
					finalExtension = 'mp3';
				} catch (convErr) {
					finalBuffer = audioBuffer;
					finalMimeType = mimeType;
					finalExtension = extension;
				}
			}

			// Send audio
			await conn.sendMessage(from, {
				audio: finalBuffer,
				mimetype: finalMimeType,
				fileName: `${downloadData.title || song.title || 'song'}.${finalExtension}`,
				ptt: false,
				contextInfo: {
					externalAdReply: {
						title: downloadData.title || song.title,
						body: downloadData.artist || artistName,
						mediaType: 'IMAGE',
						thumbnail: downloadData.thumbnail || song.thumbnail_url
					}
				}
			}, { quoted: mek });

			// Cleanup
			try {
				const tempDir = path.join(__dirname, '../temp');
				if (fs.existsSync(tempDir)) {
					const files = fs.readdirSync(tempDir);
					const now = Date.now();
					files.forEach(file => {
						const filePath = path.join(tempDir, file);
						try {
							const stats = fs.statSync(filePath);
							if (now - stats.mtimeMs > 10000) {
								if (file.endsWith('.mp3') || file.endsWith('.m4a')) {
									fs.unlinkSync(filePath);
								}
							}
						} catch (e) {
							// Ignore
						}
					});
				}
			} catch (cleanupErr) {
				// Ignore
			}

		} catch (downloadErr) {
			console.error('Download error:', downloadErr);
			reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚎𝚛𝚛𝚘𝚛 ━━━━━━━━━
┃ ❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍
┃ 𝚙𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗
┗━━━━━━━━━━━━━━━━━━━━`, { quoted: fakevCard });
		}

	} catch (err) {
		console.error('Spotify command error:', err);
		reply(`┏━❑ 𝐒𝙸𝙻𝐀-𝐌𝐃 𝚎𝚛𝚛𝚘𝚛 ━━━━━━━━━
┃ ❌ 𝚂𝚘𝚖𝚎𝚝𝚑𝚒𝚗𝚐 𝚠𝚎𝚗𝚝 𝚠𝚛𝚘𝚗𝚐
┃ 𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛
┗━━━━━━━━━━━━━━━━━━━━`, { quoted: fakevCard });
	}
});
