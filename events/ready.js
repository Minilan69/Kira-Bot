// Imports
const { Events, EmbedBuilder } = require("discord.js");
const moment = require("moment");
moment.locale("fr");

// Event Responder
module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    // Variables
    let day = moment().format("DD/MM/YYYY");
    let hour = moment().format("HH:mm:ss");

    // Console
    client.logger.ok("Ready", `Ready on ${client.user.username}`);

    // Message
    if (client.config.ready.channel) {
      let channel = client.channels.cache.get(client.config.ready.channel);
      if (!channel)
        return client.logger.error(
          "Ready",
          "An invalid channel has been set in the configuration file"
        );
      let content = client.config.ready.message;
      content = content.replaceAll("{date}", day);
      content = content.replaceAll("{time}", hour);
      content = content.replaceAll("{botName}", client.user.username);
      // Embed
      const embed = new EmbedBuilder()
        .setColor("DarkRed")
        .setAuthor({
          name: client.user.username,
          iconURL: client.user.avatarURL(),
        })
        .setDescription(content)
        .setTimestamp();
      channel.send({ embeds: [embed] });
    } else {
      client.logger.warn("Ready", "No channel set in the configuration file");
    }
  },
};
