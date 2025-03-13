const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser } = require("../../../db/dbUtils");

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

    const attacker = interaction.user;
    const target = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "heart attack";
    const time = interaction.options.getInteger("time") || 1;

    if (!target || target.bot) {
      return interaction.editReply({embeds: [embedinator(`${target} is an invalid target !`)]});
    }
    if (attacker.id === target.id) {
      return interaction.editReply({embeds: [embedinator(`You can't kill yourself !`)]});
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

      await interaction.editReply({embeds: [embedinator(`${attacker} wrote : \`${target.username} going to died of ${reason} in ${time} minutes\` in his Death Note !`)]});
      await attacker.send({embeds: [embedinator(`You have use your Death Note on ${target} to counter the attack\n He going to died of ${reason} in ${time} minutes !`)]});
      await target.send({embeds: [embedinator(`Someone have use his Death Note on you\n You going to died in ${time} minutes\n You can counter the attack with the command \`/kira\`\n But you have to find the attacker !`)]});

      // Nouveau timer contre l'attaquant initial
      const newTimeout = setTimeout(async () => {

        await interaction.followUp({embeds: [embedinator(`${target} died of ${reason} for ${time} minutes !`)]});
        await attacker.send({embeds: [embedinator(`${target} died of ${reason} for ${time} minutes !`)]});
        await target.send({embeds: [embedinator(`You are died of ${reason} for ${time} minutes`)]});
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout: newTimeout, attackerId: attackerId });


    } else if (!killTimers.has(targetId)) {
      // Aucun timer actif, on lance une attaque normale

      await interaction.editReply({embeds: [embedinator(`${attacker} wrote : \`${target.username} going to died of ${reason} in ${time} minutes\` in his Death Note !`)]});
      await attacker.send({embeds: [embedinator(`You have use your Death Note on ${target}\n He going to died of ${reason} in ${time} minutes !`)]});
      await target.send({embeds: [embedinator(`Someone have use his Death Note on you\n You going to died in ${time} minutes\n You can counter the attack with the command \`/kira\`\n But you have to find the attacker !`)]});

      const timeout = setTimeout(async () => {

        await interaction.followUp({embeds: [embedinator(`${target} died of ${reason} for ${time} minutes !`)]});
        await attacker.send({embeds: [embedinator(`${target} died of ${reason} for ${time} minutes !`)]});
        await target.send({embeds: [embedinator(`You are died of ${reason} for ${time} minutes`)]});
        killTimers.delete(targetId);
      }, time * 60000); // 60 secondes

      killTimers.set(targetId, { timeout, attackerId });


    } else {
  
      await interaction.editReply({embeds: [embedinator("The target is already going to died !")]});

    }
  },
};