(async () => {
  let checkDependencies = require("./utils/checkDependencies.js");
  await checkDependencies();
})();

// Imports
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const logger = require("./utils/Logger.js");
if (!fs.existsSync("./config.json")) {
  logger.error("Index", "No config.json file found");
  logger.info(
    "Index",
    "Please rename the config.example.json file to config.json and fill in the required fields"
  );
  process.exit(1);
}

var config = fs.readFileSync("./config.json");
try {
  config = JSON.parse(config);
} catch (err) {
  logger.error("Index", "Error parsing config.json");
  logger.error("Index", err);
  process.exit(1);
}

const { deployCommands } = require("./deploy-commands");

// Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.logger = logger;
client.config = config;

// Commands
(async () => {
  await deployCommands();
})();

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const folderPath = path.join(foldersPath, folder);
  const subFolders = fs.readdirSync(folderPath);

  for (const subFolder of subFolders) {
    const subFolderPath = path.join(folderPath, subFolder);
    const commandFiles = fs
      .readdirSync(subFolderPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(subFolderPath, file);
      const command = require(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        logger.warn("Index", `${filePath} missing property`);
      }
    }
  }
}

// Events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Bot
logger.wait("Index", "Connexion...");
client
  .login(config.token)
  .then(() => {
    logger.ok("Index", "Connected");
  })
  .catch((err) => {
    logger.error("Index", "Error connecting");
    logger.error("Index", err);
    process.exit(1);
  });