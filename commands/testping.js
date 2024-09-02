const discord = require("discord.js");
const config = require('../config.json')
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents
  ],
  
});
client.setMaxListeners(Infinity)

client.on('messageCreate', message => {
    if (message.content === '!testping') {
        // Crée un embed rigolo avec des émojis et un titre amusant
        const embed = new discord.EmbedBuilder()
            .setColor(0x00ff00) // Couleur verte
            .setTitle('🏓 Test de Ping !')
            .setDescription(`Le ping actuel est de **${client.ws.ping} ms** !`)
            .addFields(
                { name: '⚡ Réponse rapide', value: 'Le ping est super rapide !' },
                { name: '🤖 Mon humeur', value: 'Je suis en pleine forme ! 💪' }
            )
            .setThumbnail('https://media.giphy.com/media/3o7TKy3w4Zk9e7HV1y/giphy.gif') // Image GIF amusante
            .setFooter({ text: 'Pingé avec amour par votre bot préféré', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
});

client.login(config.token)
  .catch("Erreur sur le token" + console.error);