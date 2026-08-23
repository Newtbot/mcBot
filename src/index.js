const mcChecksums = require('minecraft-protocol/src/datatypes/checksums');
const _origChecksum = mcChecksums.computeChatChecksum;
mcChecksums.computeChatChecksum = (lastSeenMessages) => {
  const r = _origChecksum(lastSeenMessages); // 1..255
  return r > 127 ? r - 256 : r;               // → -128..127
};
const { MinecraftBotManager } = require("./bot/minecraftBot");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const config = require("./config");
const { loadListeners } = require("./listeners");
const autoEat = require('mineflayer-auto-eat')

const mcManager = new MinecraftBotManager(config.MC, {
	onBot(bot) {
    bot.loadPlugin(autoEat.loader)
		loadListeners(bot, path.join(__dirname, "listeners"));
	},
});

mcManager.connect();

function shutdown() {
	console.log("[Bot] Shutting down...");
	mcManager.disconnect();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
	console.error("[Bot] Unhandled promise rejection:", reason);
});
