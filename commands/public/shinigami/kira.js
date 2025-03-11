const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const killTimers = new Map(); // Stocke les timers avec { targetId: { timeout, attackerId } }

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kira")
    .setDescription("Write the name of the person you want to kill in your death note")
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
      const embed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `${target} is an invalid target !`
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
    if (attacker.id === target.id) {
      const embed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(`You can't kill yourself !`)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
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
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `${attacker} wrote : \`${target.username} died of ${reason} in ${time} minutes\` in his death note !`
        )
        .setTimestamp();

      const embedCountermp = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `You going to died in ${time} minutes because ${attacker} as counter the attack\n You can counter the attack with the command \`/kira\`\n But you have to find the attacker !`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embedCounter] });
      await target.send({ embeds: [embedCountermp] });

      // Nouveau timer contre l'attaquant initial
      const newTimeout = setTimeout(async () => {
        const embedKilled = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({
            name: interaction.client.user.username,
            iconURL: interaction.client.user.displayAvatarURL({
              dynamic: true,
            }),
          })
          .setDescription(
            `${target} died of ${reason} for ${time} minutes !`
          )
          .setTimestamp();

        const embedKilledmp = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({
            name: interaction.client.user.username,
            iconURL: interaction.client.user.displayAvatarURL({
              dynamic: true,
            }),
          })
          .setDescription(`You are died of ${reason} for ${time} minutes`)
          .setTimestamp();

        await interaction.followUp({ embeds: [embedKilled] });
        await target.send({ embeds: [embedKilledmp] });
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout: newTimeout, attackerId: attackerId });


    } else if (!killTimers.has(targetId)) {
      // Aucun timer actif, on lance une attaque normale
      const embedStart = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `${attacker} wrote : \`${target.username} died of ${reason} in ${time} minutes\` in his death note !`
        )
        .setTimestamp();

      const embedStartmp = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(
          `You going to died in ${time} minutes\n You can counter the attack with the command \`/kira\`\n But you have to find the attacker !`
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embedStart] });
      await target.send({ embeds: [embedStartmp] });

      const timeout = setTimeout(async () => {
        const embedExecuted = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({
            name: interaction.client.user.username,
            iconURL: interaction.client.user.displayAvatarURL({
              dynamic: true,
            }),
          })
          .setDescription(
            `${target} died of ${reason} for ${time} minutes !`
          )
          .setTimestamp();

        const embedExecutedmp = new EmbedBuilder()
          .setColor("DarkRed")
          .setAuthor({
            name: interaction.client.user.username,
            iconURL: interaction.client.user.displayAvatarURL({
              dynamic: true,
            }),
          })
          .setDescription(`You are died of ${reason} for ${time} minutes`)
          .setTimestamp();

        await interaction.followUp({ embeds: [embedExecuted] });
        await target.send({ embeds: [embedExecutedmp] });
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout, attackerId });

    } else {
      const embedError = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: interaction.client.user.username,
          iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription("The target is already going to died !")
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embedError] });
    }
  },
};