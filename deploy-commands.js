// Imports
const { Routes, PermissionsBitField } = require("discord.js");
const { clientId, token } = require("./config.json");
const fs = require("fs");
const path = require("path");
const Logger = require("./utils/Logger");

// Commands List
async function getCommands() {
  const commands = [];
  const foldersPath = path.join(__dirname, "commands");
  const commandCategories = fs.readdirSync(foldersPath);

  for (const category of commandCategories) {
    const categoryPath = path.join(foldersPath, category);
    const categoryFolders = fs.readdirSync(categoryPath);

    for (const folder of categoryFolders) {
      const commandFiles = fs
        .readdirSync(path.join(categoryPath, folder))
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(categoryPath, folder, file);
        const command = require(filePath);

        if ("data" in command && "execute" in command) {
          commands.push(command.data.toJSON());
        } else {
          Logger.error(
            "DeployCommands",
            `${filePath} missing data or execute function`
          );
          Logger.wait("DeployCommands", "Building commands...");
        }
      }
    }
  }

  return commands;
}

// Update Commands
async function deployCommands() {
  return new Promise(async (resolve) => {
    Logger.wait("DeployCommands", "Building commands...");
    const commands = await getCommands();
    Logger.ok(
      "DeployCommands",
      `${commands.length} command built        `
    );
    Logger.wait("DeployCommands", "Deploying commands...");
    const { REST } = require("@discordjs/rest");
    const rest = new REST({ timeout: 60000 }).setToken(token);

    try {
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        {
          body: commands,
        }
      );

      Logger.ok(
        "DeployCommands",
        `${data.length} command saved         `
      );
      resolve();
    } catch (error) {
      // Error
      Logger.error(
        "DeployCommands",
        "An error occurred while deploying commands"
      );
      Logger.error("DeployCommands", error);
      process.exit(1);
    }
  });
}

// Export
module.exports = {
  deployCommands,
};
