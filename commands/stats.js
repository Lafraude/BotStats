const discord = require("discord.js");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');
const QuickChart = require('quickchart-js');

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const config = require('../config.json')
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

function generateChart(labels, messagesData, voiceTimeData) {
    const chart = new QuickChart();

    chart.setConfig({
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Messages envoyés',
                    data: messagesData,
                    borderColor: 'rgba(76, 175, 80, 1)', // Vert 
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'Temps en vocal (minutes)',
                    data: voiceTimeData,
                    borderColor: 'rgba(33, 150, 243, 1)', // Bleu 
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    fill: true,
                    tension: 0.3,
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 12,
                            family: 'Helvetica, Arial, sans-serif',
                            weight: 'normal',
                        },
                        color: '#fff', 
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Temps',
                        font: {
                            size: 14,
                            family: 'Helvetica, Arial, sans-serif',
                            weight: 'bold',
                        },
                        color: '#fff', 
                    },
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#ddd',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Nombre',
                        font: {
                            size: 14,
                            family: 'Helvetica, Arial, sans-serif',
                            weight: 'bold',
                        },
                        color: '#fff', 
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)', 
                    },
                    ticks: {
                        color: '#ddd',
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    const chartUrl = chart.getUrl() + `&timestamp=${Date.now()}`;

    return chartUrl; 
}

const dataFilePath = './userStats.json';

let userStats = {};
if (fs.existsSync(dataFilePath)) {
    userStats = JSON.parse(fs.readFileSync(dataFilePath));
}

function resetStats(userId = null) {
    if (userId) {
        delete userStats[userId];
    } else {
        userStats = {};
    }
    saveStats(); 
}


function saveStats() {
    fs.writeFileSync(dataFilePath, JSON.stringify(userStats, null, 2));
}

function getCurrentMinute() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function updateStats(userId, messagesCount = 0, timeInVoice = 0) {
    const currentMinute = getCurrentMinute();

    if (!userStats[userId]) {
        userStats[userId] = { minuteStats: {} };
    }

    if (!userStats[userId].minuteStats[currentMinute]) {
        userStats[userId].minuteStats[currentMinute] = { messagesCount: 0, timeInVoice: 0 };
    }

    userStats[userId].minuteStats[currentMinute].messagesCount += messagesCount;
    userStats[userId].minuteStats[currentMinute].timeInVoice += timeInVoice;
    saveStats();
}


client.commands = new Collection();

client.commands.set('stats', {
    data: {
        name: 'stats',
        description: 'Affiche vos statistiques personnelles.',
    },
    async execute(interaction) {
        try {
            await interaction.deferReply(); 
            const userId = interaction.user.id;
            const stats = userStats[userId] || { minuteStats: {} };

            const currentMinute = getCurrentMinute();
            const labels = Object.keys(stats.minuteStats).sort();
            const messagesData = labels.map(minute => stats.minuteStats[minute]?.messagesCount || 0);
            const voiceTimeData = labels.map(minute => Math.floor((stats.minuteStats[minute]?.timeInVoice || 0) / 60));

            const chartUrl = generateChart(labels, messagesData, voiceTimeData);

            const embed = new discord.EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('Vos Statistiques')
                .setImage(chartUrl) 
                .setTimestamp()
                .setFooter({ text: 'Statistiques actuelles', iconURL: client.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la commande stats:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'Il y a eu une erreur lors de l\'exécution de cette commande.', ephemeral: true });
            }
        }
    },
});

client.commands.set('leaderboard', {
    data: {
        name: 'leaderboard',
        description: 'Affiche le classement des utilisateurs avec le plus de temps en vocal.',
    },
    async execute(interaction) {
        try {
            await interaction.deferReply();

            function calculateTotals(stats) {
                let totalMessages = 0;
                let totalTimeInVoice = 0;

                for (const dateTime in stats.minuteStats) {
                    const { messagesCount, timeInVoice } = stats.minuteStats[dateTime];
                    totalMessages += messagesCount;
                    totalTimeInVoice += timeInVoice;
                }

                return { totalMessages, totalTimeInVoice };
            }

            const aggregatedStats = Object.entries(userStats).map(([userId, stats]) => {
                const { totalMessages, totalTimeInVoice } = calculateTotals(stats);
                return { userId, totalMessages, totalTimeInVoice };
            });

            if (aggregatedStats.length === 0) {
                return interaction.editReply({ content: 'Aucun utilisateur n\'a encore de statistiques disponibles.' });
            }

            const sortedUsers = aggregatedStats
                .sort((a, b) => b.totalTimeInVoice - a.totalTimeInVoice || b.totalMessages - a.totalMessages) 
                .slice(0, 10);

            const embed = new discord.EmbedBuilder()
                .setColor(0x00ff00) 
                .setTitle('Classement des 10 utilisateurs avec le plus de temps en vocal')
                .setTimestamp()
                .setFooter({ text: 'Classement actuel', iconURL: client.user.displayAvatarURL() });

            sortedUsers.forEach(({ userId, totalMessages, totalTimeInVoice }, index) => {
                const timeInVoiceMinutes = Math.floor(totalTimeInVoice / 60); 
                embed.addFields({
                    name: `${index + 1}. ${client.users.cache.get(userId)?.tag || 'Utilisateur inconnu'}`,
                    value: `Temps en vocal : ${timeInVoiceMinutes} minutes\nMessages envoyés : ${totalMessages}`,
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la commande leaderboard:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'Il y a eu une erreur lors de l\'exécution de cette commande.', ephemeral: true });
            }
        }
    },
});


client.commands.set('resetstats', {
    data: {
        name: 'resetstats',
        description: 'Réinitialise les statistiques. Utilisez un utilisateur pour réinitialiser les statistiques d\'un utilisateur spécifique.',
        options: [
            {
                name: 'user',
                type: 6, 
                description: 'L\'utilisateur dont les statistiques seront réinitialisées',
                required: false,
            },
        ],
    },
    async execute(interaction) {
        try {
            await interaction.deferReply(); 
            const userId = interaction.options.getUser('user')?.id;
            const isAdmin = interaction.member.permissions.has('Administrator');

            if (!isAdmin) {
                return interaction.editReply({ content: 'Vous n\'avez pas les permissions nécessaires pour exécuter cette commande.', ephemeral: true});
            }

            if (userId) {
                resetStats(userId); 
                const user = await client.users.fetch(userId);
                const embed = new discord.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Statistiques Réinitialisées')
                    .setDescription(`Les statistiques de <@${userId}> ont été réinitialisées.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                resetStats(); 
                const embed = new discord.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Statistiques Réinitialisées')
                    .setDescription('Les statistiques de tous les utilisateurs ont été réinitialisées.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Erreur lors de la commande resetstats:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'Il y a eu une erreur lors de l\'exécution de cette commande.', ephemeral: true });
            }
        }
    },
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    if (!userStats[userId]) {
        userStats[userId] = { minuteStats: {} };
    }

    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 19).replace('T', ' ')}`;

    if (!userStats[userId].minuteStats[timestamp]) {
        userStats[userId].minuteStats[timestamp] = { messagesCount: 0, timeInVoice: 0 };
    }

    userStats[userId].minuteStats[timestamp].messagesCount += 1;
    saveStats();
});

const voiceTimes = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
    const userId = newState.id;

    if (!oldState.channelId && newState.channelId) {
        voiceTimes.set(userId, Date.now());
    } else if (oldState.channelId && !newState.channelId) {
        const joinTime = voiceTimes.get(userId);
        if (joinTime) {
            const timeSpent = (Date.now() - joinTime) / 1000; 
            voiceTimes.delete(userId);

            if (!userStats[userId]) {
                userStats[userId] = { minuteStats: {} };
            }

            const now = new Date();
            const timestamp = `${now.toISOString().slice(0, 19).replace('T', ' ')}`;

            if (!userStats[userId].minuteStats[timestamp]) {
                userStats[userId].minuteStats[timestamp] = { messagesCount: 0, timeInVoice: 0 };
            }

            userStats[userId].minuteStats[timestamp].timeInVoice += Math.floor(timeSpent / 60); 
            saveStats();
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (command) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la commande:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Il y a eu une erreur lors de l\'exécution de cette commande.', ephemeral: true });
            }
        }
    }
});

client.login(config.token)
  .catch("Erreur sur le token" + console.error);