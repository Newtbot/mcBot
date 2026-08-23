const path = require("path");
const { getPlayerData } = require("../modules/getPlayers");
const config = require("../config");
const { whiteList } = require("../config");

module.exports = {
	name: "whisper",
	async execute(bot, username, message) {
		if (username === bot.username) return;

		//if apiUUID == null then run this. prevent mojang api ratelimit
		if (!bot.players[username].apiUUID) {
			const data = await getPlayerData(username);
			if (data) {
				try {
					bot.players[username].apiUUID = data.uuid;
				} catch (error) {
					console.error(error);
				}
			}
		}
		//actual checks for whisper command
		const allowedUUID = new Set(Object.values(whiteList));
		const whiteListPlayer = bot.players[username];
    const cmd = message.trim().toLowerCase();

		if (!allowedUUID.has(whiteListPlayer.apiUUID)) {
			try {
    		  bot.chat(`/msg ${username} Invalid Operation`);
			} catch (error) {
				console.error(error.stack);
			}
		} else {
      if (cmd === 'dep' || cmd === 'deposit') {
        if (bot._trade) { bot.whisper(username, 'already trading'); return; }
        bot._trade = { partner: username };
        bot.chat('/trade ' + username);
        // Safety: if the player never accepts, the window never opens.
        // Clear the flag so a later trade can still start.
        setTimeout(() => {
          if (bot._trade && bot._trade.partner === username) bot._trade = null;
        }, 35000);
      }
		}


	},
};
