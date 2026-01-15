// telegram-bot.js
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const config = require('./telegram-config');
const { activeSockets, getConnectionStatus } = require('./index'); // Adjust path as needed

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
        this.setupMiddlewares();
        this.setupCommands();
        this.setupHandlers();
    }

    setupMiddlewares() {
        // Local session storage
        this.bot.use((new LocalSession({ database: 'telegram-sessions.json' })).middleware());
        
        // Error handling middleware
        this.bot.catch((err, ctx) => {
            console.error('Telegram bot error:', err);
            ctx.reply('❌ 𝙰𝚗 𝚎𝚛𝚛𝚘𝚛 𝚘𝚌𝚌𝚞𝚛𝚎𝚍. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.');
        });
    }

    setupCommands() {
        // Set bot commands
        this.bot.telegram.setMyCommands(config.COMMANDS);
    }

    setupHandlers() {
        // Start command
        this.bot.start((ctx) => {
            const welcomeMessage = `${config.MESSAGES.WELCOME}\n\n🔗 *𝚂𝚄𝙿𝙿𝙾𝚁𝚃 𝙻𝙸𝙽𝙺𝚂:*\n• 𝙶𝚒𝚝𝙷𝚞𝚋: ${config.URLS.GITHUB}\n• 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙲𝚑𝚊𝚗𝚗𝚎𝚕: ${config.URLS.TELEGRAM_CHANNEL}\n• 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙲𝚑𝚊𝚗𝚗𝚎𝚕: ${config.URLS.WHATSAPP_CHANNEL}`;
            
            const buttons = Markup.inlineKeyboard([
                [
                    Markup.button.url('📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕', config.URLS.TELEGRAM_CHANNEL),
                    Markup.button.url('👥 𝙶𝚛𝚘𝚞𝚙', config.URLS.TELEGRAM_GROUP)
                ],
                [
                    Markup.button.url('⭐ 𝙶𝚒𝚝𝙷𝚞𝚋', config.URLS.GITHUB),
                    Markup.button.url('📱 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙', config.URLS.WHATSAPP_CHANNEL)
                ],
                [
                    Markup.button.callback('🔧 𝙿𝚊𝚒𝚛 𝙱𝚘𝚝', 'pair_menu'),
                    Markup.button.callback('📊 𝚂𝚝𝚊𝚝𝚞𝚜', 'check_status')
                ]
            ]);
            
            ctx.replyWithMarkdown(welcomeMessage, buttons);
        });

        // Pair command
        this.bot.command('pair', async (ctx) => {
            const args = ctx.message.text.split(' ');
            
            if (args.length < 2) {
                return ctx.replyWithMarkdown('❌ *𝚄𝚜𝚊𝚐𝚎:* `/𝚙𝚊𝚒𝚛 <𝚗𝚞𝚖𝚋𝚎𝚛>`\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎:* `/𝚙𝚊𝚒𝚛 255789661031`');
            }
            
            const number = args[1];
            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            
            if (sanitizedNumber.length < 9) {
                return ctx.replyWithMarkdown('❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚙𝚑𝚘𝚗𝚎 𝚗𝚞𝚖𝚋𝚎𝚛. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚝𝚎𝚛 𝚊 𝚟𝚊𝚕𝚒𝚍 𝚗𝚞𝚖𝚋𝚎𝚛 𝚠𝚒𝚝𝚑 𝚌𝚘𝚞𝚗𝚝𝚛𝚢 𝚌𝚘𝚍𝚎.');
            }
            
            await this.handlePairing(ctx, sanitizedNumber);
        });

        // Owner command
        this.bot.command('owner', (ctx) => {
            ctx.replyWithMarkdown(config.MESSAGES.OWNER);
        });

        // Menu command
        this.bot.command('menu', (ctx) => {
            ctx.replyWithMarkdown(config.MESSAGES.HELP);
        });

        // Status command
        this.bot.command('status', async (ctx) => {
            await this.handleStatus(ctx);
        });

        // Help command
        this.bot.command('help', (ctx) => {
            ctx.replyWithMarkdown(config.MESSAGES.HELP);
        });

        // Callback query handlers
        this.bot.action('pair_menu', (ctx) => {
            ctx.replyWithMarkdown('📱 *𝙿𝙰𝙸𝚁 𝚈𝙾𝚄𝚁 𝙱𝙾𝚃*\n\n𝚄𝚜𝚎 𝚝𝚑𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍:\n`/𝚙𝚊𝚒𝚛 <𝚢𝚘𝚞𝚛-𝚗𝚞𝚖𝚋𝚎𝚛>`\n\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎:* `/𝚙𝚊𝚒𝚛 255789661031`');
        });

        this.bot.action('check_status', async (ctx) => {
            await this.handleStatus(ctx);
        });
    }

    async handlePairing(ctx, number) {
        try {
            // Send initial message
            await ctx.replyWithMarkdown(`⏳ *𝙿𝚊𝚒𝚛𝚒𝚗𝚐 𝚒𝚗 𝚙𝚛𝚘𝚐𝚛𝚎𝚜𝚜...*\n\n📱 𝙽𝚞𝚖𝚋𝚎𝚛: +${number}\n🔗 𝚂𝚝𝚊𝚝𝚞𝚜: 𝙸𝚗𝚒𝚝𝚒𝚊𝚝𝚒𝚗𝚐 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗...`);
            
            // Here you would call your startBot function
            // This is where you integrate with your WhatsApp bot pairing system
            // For now, we'll simulate the response
            
            const pairingCode = Math.floor(100000 + Math.random() * 900000);
            
            setTimeout(() => {
                ctx.replyWithMarkdown(`✅ *𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳!*\n\n📱 𝙽𝚞𝚖𝚋𝚎𝚛: +${number}\n🔑 𝙲𝚘𝚍𝚎: *${pairingCode}*\n\n📋 *𝙷𝚘𝚠 𝚝𝚘 𝚞𝚜𝚎:*\n1️⃣ 𝙾𝚙𝚎𝚗 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚘𝚗 𝚢𝚘𝚞𝚛 𝚙𝚑𝚘𝚗𝚎\n2️⃣ 𝙶𝚘 𝚝𝚘 𝙻𝚒𝚗𝚔𝚎𝚍 𝙳𝚎𝚟𝚒𝚌𝚎𝚜\n3️⃣ 𝙰𝚍𝚍 𝚊 𝚗𝚎𝚠 𝚍𝚎𝚟𝚒𝚌𝚎\n4️⃣ 𝙴𝚗𝚝𝚎𝚛 𝚝𝚑𝚎 𝚌𝚘𝚍𝚎: *${pairingCode}*\n5️⃣ 𝚆𝚊𝚒𝚝 𝚏𝚘𝚛 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚌𝚘𝚗𝚏𝚒𝚛𝚖𝚊𝚝𝚒𝚘𝚗\n\n⚠️ *𝙽𝚘𝚝𝚎:* 𝚃𝚑𝚒𝚜 𝚌𝚘𝚍𝚎 𝚒𝚜 𝚟𝚊𝚕𝚒𝚍 𝚏𝚘𝚛 20 𝚜𝚎𝚌𝚘𝚗𝚍𝚜 𝚘𝚗𝚕𝚢!`);
            }, 2000);
            
        } catch (error) {
            console.error('Pairing error:', error);
            ctx.replyWithMarkdown(`❌ *𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙴𝚁𝚁𝙾𝚁*\n\n𝙴𝚛𝚛𝚘𝚛: ${error.message}\n\n𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚘𝚛 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚝𝚑𝚎 𝚘𝚠𝚗𝚎𝚛.`);
        }
    }

    async handleStatus(ctx) {
        try {
            let statusMessage = `📊 *𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂*\n\n`;
            
            // Get active connections from main bot
            if (global.activeSockets && global.activeSockets.size > 0) {
                const activeCount = global.activeSockets.size;
                statusMessage += `✅ *𝙰𝚌𝚝𝚒𝚟𝚎 𝙱𝚘𝚝𝚜:* ${activeCount}\n\n`;
                
                // Get first few active numbers
                const activeNumbers = Array.from(global.activeSockets.keys()).slice(0, 5);
                activeNumbers.forEach((num, index) => {
                    statusMessage += `${index + 1}. +${num}\n`;
                });
                
                if (activeCount > 5) {
                    statusMessage += `... 𝚊𝚗𝚍 ${activeCount - 5} 𝚖𝚘𝚛𝚎\n`;
                }
            } else {
                statusMessage += `❌ *𝙽𝚘 𝚊𝚌𝚝𝚒𝚟𝚎 𝚋𝚘𝚝𝚜*\n\n𝙽𝚘 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚋𝚘𝚝𝚜 𝚊𝚛𝚎 𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚛𝚞𝚗𝚗𝚒𝚗𝚐.`;
            }
            
            statusMessage += `\n\n🤖 *𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝙱𝚘𝚝:* ✅ 𝙰𝚌𝚝𝚒𝚟𝚎\n🕒 𝚄𝚙𝚝𝚒𝚖𝚎: 𝚁𝚞𝚗𝚗𝚒𝚗𝚐...\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
            
            ctx.replyWithMarkdown(statusMessage);
            
        } catch (error) {
            console.error('Status error:', error);
            ctx.replyWithMarkdown('❌ *𝙴𝚁𝚁𝙾𝚁*\n\n𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚏𝚎𝚝𝚌𝚑 𝚋𝚘𝚝 𝚜𝚝𝚊𝚝𝚞𝚜. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.');
        }
    }

    start() {
        this.bot.launch().then(() => {
            console.log('🤖 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝚋𝚘𝚝 𝚜𝚝𝚊𝚛𝚝𝚎𝚍 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢!');
            
            // Enable graceful stop
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
            
        }).catch(error => {
            console.error('❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚝𝚊𝚛𝚝 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 𝚋𝚘𝚝:', error);
        });
    }
}

// Export for use in main file
module.exports = TelegramBot;

// Start bot if this file is run directly
if (require.main === module) {
    const telegramBot = new TelegramBot();
    telegramBot.start();
}
