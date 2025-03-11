const chalk = require("chalk");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const config = require("../config.json");

// Type Of Log
const levels = {
  INFO: { label: "INFO", color: chalk.blue },
  LOG: { label: "LOGS", color: chalk.blue },
  WARN: { label: "WARN", color: chalk.yellow },
  ERROR: { label: "ERROR", color: chalk.red },
  OK: { label: "OK", color: chalk.green },
  FATAL: { label: "FATAL", color: chalk.bgRed },
  WAIT: { label: " .. ", color: chalk.blue },
};

// Generate Log
function log(level, prefix, message) {
  let formattedMessage = config.log.message;
  formattedMessage = formattedMessage.replaceAll("{date}", getDay());
  formattedMessage = formattedMessage.replaceAll("{time}", getHour());
  formattedMessage = formattedMessage.replaceAll("{prefix}", prefix);
  formattedMessage = formattedMessage.replaceAll(
    "{label}",
    level.color(level.label)
  );
  formattedMessage = formattedMessage.replaceAll(
    "{message}",
    message ? level.color(message) : ""
  );

  if (level === levels.ERROR || level === levels.FATAL) {
    console.error(formattedMessage);
  } else {
    console.info(formattedMessage);
  }
}

// Log Gestion
module.exports = {
  info: (prefix, message) => log(levels.INFO, prefix, message),
  log: (prefix, message) => log(levels.LOG, prefix, message),
  warn: (prefix, message) => log(levels.WARN, prefix, message),
  error: (prefix, message) => log(levels.ERROR, prefix, message),
  ok: (prefix, message) => log(levels.OK, prefix, message),
  wait: (prefix, message) => {
    let Message = config.log.message;
    Message = Message.replaceAll("{date}", getDay());
    Message = Message.replaceAll("{time}", getHour());
    Message = Message.replaceAll("{prefix}", prefix);
    Message = Message.replaceAll(
      "{label}",
      levels.WAIT.color(levels.WAIT.label)
    );
    Message = Message.replaceAll("{message}", message ? message : "");
    process.stdout.write(Message);
    if (typeof process.stdout.cursorTo === "function")
      process.stdout.cursorTo(0);
  },
  fatal: async (err) => {
    log(levels.FATAL, "Encountered an uncaught exception", err.stack);

    const crashReport = `
An unexpected exception occurred
Time: ${getDayAndHour()}
Error: ${err}

Stack trace:
${err.stack}
    `;

    const folderPath = path.resolve("./crashs-report");
    const fileName = `${moment().format("DD-MM-YYYY_HH-mm-ss")}.txt`;
    const filePath = path.join(folderPath, fileName);

    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      fs.writeFileSync(filePath, crashReport);
      log(levels.ERROR, "Crash report saved to", filePath);
    } catch (error) {
      log(levels.ERROR, "Failed to save crash report", error.message);
    } finally {
      process.exit(1);
    }
  },
};

// Date Format
function getDay() {
  return moment().format("DD/MM/YYYY");
}
function getHour() {
  return moment().format("HH:mm:ss");
}
