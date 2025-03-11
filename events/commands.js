// Imports
const { Events, MessageFlags } = require("discord.js");

// Event Responde
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const client = interaction.client;

    // Variables
    const allowedChannels = ["1272561844741214270", "1320411448643555431"];
    const command = interaction.client.commands.get(interaction.commandName);

/*
    // Command Not Allowed
    if (!allowedChannels.includes(interaction.channelId)) {
      return interaction.reply({
        content:
          "❌ Les commandes ne peuvent être uniquement utilisée que dans certains salons",
        ephemeral: true,
      });
    }
*/
    // Command Don't Exist
    if (!command) {
      client.logger.error(
        "Commands",
        `${interaction.commandName} no command with this name`
      );
      return;
    }

    try {
      // Command Execution
      await command.execute(interaction);
      client.logger.ok("Commands", `${interaction.commandName}.js sucseed`);
    } catch (error) {
      // Error
      client.logger.error("Commands", error);
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Your command dont work !",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "❌ Your command dont work !",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
