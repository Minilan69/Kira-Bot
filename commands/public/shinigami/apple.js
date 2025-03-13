const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser } = require("../../../db/dbUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("apple")
    .setDescription("See your number of apples")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member that you want to see the number of apples")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    function embedinator(description) {
      return new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(description)
        .setTimestamp();
    }

    // Variables
    const user = interaction.options.getUser("member") || interaction.user;
    const userId = user.id;

    try {
      const userdb = getUser(userId);

      const apple = userdb.apple;
      let message;

      // Message

      if (userId === interaction.user.id) {
        message = `You have **${apple}**`;
      } else {
        message = `${user} has **${apple}** `;
      }

      // Reply
      await interaction.editReply({ embeds: [embedinator(message)] });
    } catch (error) {
      // Error
      interaction.client.logger.error("Apple", error);
      await interaction.editReply({ embeds: [embedinator("Impossible to have the number of apples")] });
    }
  },
};