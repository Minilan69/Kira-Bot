const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, updateIs_Dead } = require("../../../db/dbUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("death_note")
    .setDescription("See your death note")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member that you want to see the death note")
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
      const death_note = userdb.death_note;

      if (userdb.timestamp > Date.now()) {
      return interaction.editReply({embeds: [embedinator(`You are **dead**, try in **${Math.ceil((userdb.timestamp - Date.now()) / 60000)}** minutes !`)]});
    } else {
      updateIs_Dead(userId, 0);
    }

      let message = ``;

      if (Object.keys(death_note).length === 0) {
        message += "No death note";
      } else {
        // On crée un tableau de Promises pour récupérer tous les pseudos en parallèle
        const promises = Object.keys(death_note).map(async (key) => {
          const [victim_id, cause, time, is_kill] = death_note[key];
          const victimUser = await interaction.client.users.fetch(victim_id);
          return `\`${victimUser.username} is going to die of ${cause} in ${time} minutes\`\n`;
        });

        // On attend que toutes les Promises soient résolues
        const results = await Promise.all(promises);
        message += results.join("");
      }


      // Reply
      await interaction.editReply({ embeds: [embedinator(message)] });
    } catch (error) {
      // Error
      interaction.client.logger.error("Apple", error);
      await interaction.editReply({
        embeds: [embedinator("Impossible to have the death note")],
      });
    }
  },
};
