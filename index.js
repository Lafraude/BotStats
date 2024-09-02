const discord = require("discord.js");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');
const config = require("./config.json");
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


const stats = new discord.SlashCommandBuilder()
  .setName('stats')
  .setDescription('Affiche vos statistiques personnelles.')

const leaderboard = new discord.SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Affiche le classement des utilisateurs avec le plus de temps en vocal.')


const resetStats = new discord.SlashCommandBuilder()
  .setName('resetstats')
  .setDescription('Réinitialisez les stats d’un utilisateur avec un utilisateur, ou de tous avec la commande.')
  .addUserOption(user =>
    user.setName('user')
    .setDescription('L\'utilisateur dont les statistiques seront réinitialisées')
    .setRequired(false)
  )
const commands = [
  stats.toJSON(),
  leaderboard.toJSON(),
  resetStats.toJSON()
  ];
  
  const rest = new discord.REST({ version: '10' }).setToken(config.token);
  
  try {
    console.log("\x1b[32m",'Lancement de l\'actualisation des commandes de l\'application (/)');
  
    rest.put(discord.Routes.applicationCommands(config.client_id), { body: commands });
  
    console.log("\x1b[32m", 'Commandes d\'application (/) rechargées avec succès..\n====== Bot is Ready ======');
  } catch (error) {
    console.error(error);
  }


client.once('ready', async () => {
  const guilds = client.guilds.cache.map(guild => guild.name).join('\n> ');
    console.log(`- Connecté en tant que ${client.user.tag}!`)
      while(true){
        client.user.setActivity(` ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} membres`, {
            type: 1,
            url: "TON LIEN"    
          });

          await new Promise(resolve => setTimeout(resolve, 12));
          console.log("\x1b[35m", `🏓 Ping : ${client.ws.ping} ms`)
          await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }  
  )

///////////////////////////////////////////////////////////////////////////////
                            // PARTIE ANTICRASH //
///////////////////////////////////////////////////////////////////////////////

const CHANNEL_ID = config.excepnocap;
function sendErrorEmbed(channel, title, description) {
  const embed = new discord.EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#FF0000')
      .setTimestamp();
  
  channel.send({ embeds: [embed] });
}

process.on('uncaughtException', (err) => {
  console.error('Une exception non capturée a été détectée:', err.message);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
      sendErrorEmbed(channel, 'Une exception non capturée est survenue', `\`\`\`${err.message}\`\`\``);
  }
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Une promesse rejetée non capturée a été détectée:', promise, 'raison:', reason);
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
      sendErrorEmbed(channel, 'Une promesse rejetée non capturée', `\`\`\`${reason}\`\`\``);
  }
});
///////////////////////////////////////////////////////////////////////////////


// Partie loading 
const loadedCommands = [];
const loadedEvents = [];
let isLoading = true;

function loadFiles(dir, type, targetArray) {
    const files = fs.readdirSync(path.join(__dirname, dir));
    let allLoaded = true;

    files.forEach(file => {
        const filePath = path.join(__dirname, dir, file);
        try {
            const item = require(filePath);
            console.log(`${chalk.greenBright('✅')} ${chalk.bold.white(file)} ${chalk.cyan(`(${type})`)} ${chalk.green('chargé avec succès.')}`);
            targetArray.push(item);
        } catch (error) {
            console.error(`${chalk.redBright('❌')} ${chalk.bold.white(file)} ${chalk.cyan(`(${type})`)} ${chalk.red('n\'a pas pu être chargé :')}\n${chalk.gray(error.message)}`);
            allLoaded = false;
        }
    });

    return allLoaded;
}

function verifyLoadedItems(items, itemType) {
    items.forEach((item, index) => {
        try {
            if (item.isReady && !item.isReady()) {
                throw new Error(`${itemType} non prêt.`);
            }
            console.log(`${chalk.greenBright('✅')} ${chalk.bold.white(`${itemType} ${index + 1}`)} ${chalk.green('opérationnel.')}`);
        } catch (error) {
            console.error(`${chalk.redBright('❌')} ${chalk.bold.white(`${itemType} ${index + 1}`)} ${chalk.red('non opérationnel :')}\n${chalk.gray(error.message)}`);
        }
    });
}

const loadingTimeout = setTimeout(() => {
    if (isLoading) {
        console.log(chalk.yellow.bold('\n⏳ Le bot est encore en train de se lancer, veuillez patienter...'));
    }
}, 1000);

console.log(chalk.blue.bold('\nChargement des commandes...'));
const commandsLoaded = loadFiles('commands', 'commande', loadedCommands);

console.log(chalk.blue.bold('\nChargement des événements...'));
const eventsLoaded = loadFiles('events', 'événement', loadedEvents);

if (commandsLoaded && eventsLoaded) {
    console.log(chalk.green.bold('\n🚀 Toutes les commandes et événements ont été chargés avec succès.'));
} else {
    console.log(chalk.red.bold('\n⚠️ Certains fichiers n\'ont pas été chargés correctement.'));
}

setTimeout(() => {
    isLoading = false;
    clearTimeout(loadingTimeout);

    console.log(chalk.magenta.bold('\nVérification des commandes et événements après lancement...'));
    verifyLoadedItems(loadedCommands, 'Commande');
    verifyLoadedItems(loadedEvents, 'Événement');

    console.log(chalk.magenta.bold('\nVérification terminée. Attendez l\'affichage du ping pour confirmer que le bot est lancé.'));
}, 10);

// NE PAS MODIFIER
client.login(config.token)
  .catch("Erreur sur le token" + console.error);