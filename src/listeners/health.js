module.exports = {
	name: "health",
	execute(bot) {
		//notes to myself
		/* 
		- i want to have autolog based on health event
		- i want to see a const or boolean to be set when the bot autolog 
		and my reconnect function will check it before it reconnect
		*/
		const autoLoggedHealth = 8;

		//auto eat nonsense!
		if (bot?.food === 20) {
			bot.autoEat.disableAuto();
		} else if (bot?.food < 20) {
			bot.autoEat.enableAuto();
		}

		// auto log logic!
		// console.log(bot.health)
		if (bot.health < autoLoggedHealth) {
			try {
				bot.autoLogged = true
				bot.quit(`Low health (${bot.health})`);
			} catch (error) {
				console.error(`[MC] quit() failed: ${error.message}`);
			}
		}

		// if (bot.health < AUTO_LOG_HEALTH) {
		// 	console.warn(`[MC] Health ${bot.health} < ${AUTO_LOG_HEALTH} — logging out to avoid death.`);
		// 	try {
		// 		// set a autoLogged boolean in bot instance.
		// 		// prevents bot from reconnected.
		// 		bot.autoLogged = true
		// 		bot.quit(`Low health (${bot.health})`);
		// 	} catch (error) {
		// 		console.error(`[MC] quit() failed: ${error.message}`);
		// 	}
		// }
	},
};
