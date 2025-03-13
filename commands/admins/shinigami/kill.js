const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { updateTimestamp, updateIs_Dead } = require("../../../db/dbUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kill")
    .setDescription("Kill someone with admin power")
    .addUserOption((option) =>
      option.setName("target").setDescription("Person you want to kill").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("time").setDescription("Time in minutes of death").setRequired(false).setMinValue(1).setMaxValue(1440)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    // Fonction pour créer un embed
    function embedinator (description) {
      return new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(description)
        .setTimestamp();
    }

    const target = interaction.options.getUser("target");
    const time = interaction.options.getInteger("time") || 1;

    if (!target || target.bot) return interaction.editReply({embeds: [embedinator(`**${target}** is an invalid target !`)]});

    const targetId = target.id;

    updateTimestamp(targetId, Date.now() + time * 60000);
    updateIs_Dead(targetId, 1);

    interaction.editReply({embeds: [embedinator(`**${target}** died for **${time}** minutes !`)]});
  },
};