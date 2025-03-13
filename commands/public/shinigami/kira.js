const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, updateApple, updateKill_Streak, addDeath_Note, updateIs_Kill, updateTimestamp, updateIs_Dead } = require("../../../db/dbUtils");

const killTimers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kira")
    .setDescription("Write the name of the person you want to kill in your death note")
    .addUserOption((option) =>
      option.setName("target").setDescription("Person you want to kill").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason of the death").setRequired(false).setMaxLength(250).setMinLength(1)
    )
    .addIntegerOption((option) =>
      option.setName("time").setDescription("Time in minutes before death").setRequired(false).setMinValue(1).setMaxValue(1440)
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


    const attacker = interaction.user;
    const target = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "heart attack";
    const time = interaction.options.getInteger("time") || 1;

    const attackerId = attacker.id;
    const targetId = target.id;
    const attackerdb = getUser(attackerId);
    const targetdb = getUser(targetId);
    const reward = Math.floor(targetdb.kill_streak / 2);

    if (attackerdb.timestamp > Date.now()) {
      return interaction.editReply({embeds: [embedinator(`You are **dead**, try in **${Math.ceil((attackerdb.timestamp - Date.now()) / 60000)}** minutes !`)]});
    } else {
      updateIs_Dead(attackerId, 0);
    }

    if (!target || target.bot) return interaction.editReply({embeds: [embedinator(`**${target}** is an invalid target !`)]});
    if (attacker.id === target.id) return interaction.editReply({embeds: [embedinator(`You can't kill **yourself** !`)]});
    if (killTimers.has(targetId)) return interaction.editReply({embeds: [embedinator("The target is already going to **die** !")]});
    if (targetdb.is_dead === 1) return interaction.editReply({embeds: [embedinator(`The target is actually **die** !`)]});

    // Ajouter une ligne dans le Death Note
    const line = addDeath_Note(attackerId, targetId, reason, time);

    // Fonction pour envoyer les messages aux joueurs
    function sendKillMessages() {
      const killer = attacker;
      const victim = target;

      interaction.editReply({embeds: [embedinator(`**${killer}** wrote : \`${victim.username} going to die of ${reason} in ${time} minutes\` in his Death Note !`)]});
      killer.send({embeds: [embedinator(`You used your Death Note on **${victim}**\n They will die of **${reason}** in **${time}** minutes !`)]});
      victim.send({embeds: [embedinator(`Someone used their Death Note on you\n You will die in **${time}** minutes\n You can counter the attack with the command \`/kira\`\n But you must find the attacker !`)]});
    }

    // Fonction pour exécuter la mise à mort
    function executeKill(killerId, victimId, reward, reason, time) {
      setTimeout(async () => {
        interaction.followUp({embeds: [embedinator(`**${target}** died of **${reason}** for **${time}** minutes !`)]});
        attacker.send({embeds: [embedinator(`**${target}** died of **${reason}** for **${time}** minutes ! \n You won **${reward}** apples !`)]});
        target.send({embeds: [embedinator(`You died of **${reason}** for **${time}** minutes !`)]});

        updateApple(killerId, reward);
        updateKill_Streak(killerId, getUser(killerId).kill_streak + 1);
        updateKill_Streak(victimId, 0);
        updateIs_Kill(killerId, line, 1);
        updateTimestamp(victimId, Date.now() + time * 60000);
        updateIs_Dead(victimId, 1);

        killTimers.delete(victimId);
      }, time * 60000);
    }

    // Gestion du contre-kill
    if (killTimers.has(attackerId) && killTimers.get(attackerId).attackerId === targetId) {
      clearTimeout(killTimers.get(attackerId).timeout);
      killTimers.delete(attackerId);
      sendKillMessages(true);

    } else {
      sendKillMessages();
    }
    executeKill(attackerId, targetId, reward, reason, time);
    killTimers.set(targetId, { timeout: executeKill, attackerId: attackerId });
  },
};