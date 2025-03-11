// Imports
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const process = require("process");

// Command
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Displays the bot's ping and remote server information"),
  async execute(interaction) {
    await interaction.deferReply();

    // Variables
    const user = interaction.options.getUser("membre") || interaction.user;
    const userName = user.username;
    const userAvatar = user.displayAvatarURL({ dynamic: true });

    const sent = await interaction.followUp({
      content: "Calculating...",
      fetchReply: true,
    });

    try {
      // Collect Data
      const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
      let apiLatency = Math.ceil(interaction.client.ws.ping);
      if (apiLatency == -1) {
        apiLatency = 0;
      }
      const botUptime = formatUptime(process.uptime());

      // Message
      const embed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({ name: userName, iconURL: userAvatar })
        .setTitle("🏓 Pong!")
        .addFields(
          {
            name: `**Bot ping**`,
            value: `${botLatency}ms`,
            inline: true,
          },
          {
            name: `**Discord API latency**`,
            value: `${apiLatency}ms`,
            inline: true,
          },
          {
            name: `**Bot uptime**`,
            value: `${botUptime}`,
            inline: true,
          }
        )

        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      // Error
      interaction.client.logger.error("Ping", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setAuthor({ name: userName, iconURL: userAvatar })
        .setDescription("Impossible de ping")
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

// Formate UpTime
function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}j ${h}h ${m}m ${s}s`;
}
