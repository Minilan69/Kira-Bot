const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const killTimers = new Map(); // Stocke les timers avec { targetId: { timeout, attackerId } }

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kira")
    .setDescription("Attempts to kill someone after 60 seconds")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Person you want to kill")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason of the death")
        .setRequired(false)
        .setMaxLength(250)
        .setMinLength(1)
    )
    .addIntegerOption((option) =>
      option
        .setName("time")
        .setDescription("Time in minute you want to kill")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1440)
    ),


  async execute(interaction) {
    await interaction.deferReply();

    const attacker = interaction.user;
    const target = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "heart attack";
    const time = interaction.options.getInteger("time") || 1;

    if (!target || target.bot) {
      return interaction.editReply({
        content: "Utilisateur invalide !",
        ephemeral: true,
      });
    }

    const attackerId = attacker.id;
    const targetId = target.id;

    // Vérifier si la cible a déjà un timer actif
    if (
      killTimers.has(attackerId) &&
      killTimers.get(attackerId).attackerId === targetId
    ) {
      // Annule l'ancien timer et retourne l'attaque contre l'envoyeur
      clearTimeout(killTimers.get(attackerId).timeout);
      killTimers.delete(attackerId);

      const embedCounter = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: attacker.username,
          iconURL: attacker.displayAvatarURL({ dynamic: true }),
        })
        .setTitle("❌ Counter-attack!")
        .setDescription(
          `${attacker.username} wrote : \`${target.username} died of ${reason} in ${time} minutes\` in his death note !`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embedCounter] });

      // Nouveau timer contre l'attaquant initial
      const newTimeout = setTimeout(async () => {
        const embedKilled = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
          .setTitle("💀 Execution!")
          .setDescription(
            `${target.username} was died of ${reason} for ${time} minutes !`
          )
          .setTimestamp();

        await interaction.followUp({ embeds: [embedKilled] });
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout: newTimeout, attackerId: attackerId });


    } else {
      // Aucun timer actif, on lance une attaque normale
      const embedStart = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: attacker.username,
          iconURL: attacker.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `${attacker.username} wrote : \`${target.username} died of ${reason} in ${time} minutes\` in his death note !`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embedStart] });

      const timeout = setTimeout(async () => {
        const embedExecuted = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({
            name: target.username,
            iconURL: target.displayAvatarURL({ dynamic: true }),
          })
          .setTitle("💀 Execution!")
          .setDescription(
            `${target.username} was died of ${reason} for ${time} minutes !`
          )
          .setTimestamp();

        await interaction.followUp({ embeds: [embedExecuted] });
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout, attackerId });
    }
  },
};