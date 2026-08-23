const mineflayer = require("mineflayer");

const RETRY_BASE_DELAY = 5000;
const RETRY_MAX_DELAY = 120000;
const RETRY_FACTOR = 2;
const JITTER_MAX = 3000;

class MinecraftBotManager {
	constructor(config, { onBot } = {}) {
		this.config = config;
		this.onBot = onBot || null;
		this.bot = null;
		this.retryDelay = RETRY_BASE_DELAY;
		this.retryTimer = null;
		this.stopped = false;
	}

	connect() {
		if (this.stopped || this.bot) return;

		const options = {
			host: this.config.host,
			port: this.config.port,
			username: this.config.username || "ayayabot",
			auth: this.config.auth || "offline",
			hideErrors: true,
		};
		if (this.config.auth === "microsoft" && this.config.password) {
			options.password = this.config.password;
		}
		if (this.config.version) options.version = this.config.version;

		let bot;
		try {
			bot = mineflayer.createBot(options);
		} catch (error) {
			console.error(`[MC] Failed to create bot: ${error.message}`);
			this.scheduleReconnect("create failed");
			return;
		}

		this.bot = bot;

		bot.on("error", (error) => {
			console.error(`[MC] Connection error: ${error.message}`);
		});

		bot.once("login", () => {
			console.log(`[MC] Logged in as ${bot.username}`);
			this.retryDelay = RETRY_BASE_DELAY;
		});

		bot.once("spawn", () => {
			console.log("[MC] Spawned in the world.");
		});

		bot.on("kicked", (reason, loggedIn) => {
			console.warn(
				`[MC] Kicked from server${loggedIn ? "" : " (before login)"}: ${reason}`,
			);
			this.scheduleReconnect("bot got kicked");
		});

		bot.on("end", (reason) => {
			console.log(`[MC] Connection ended: ${reason || "unknown reason"}`);
			const autoLogged = bot.autoLogged;
			this.bot = null;
			this.scheduleReconnect("connection ended", autoLogged);
		});

		if (this.onBot) {
			this.onBot(bot);
		}
	}

	scheduleReconnect(reason, autoLogged) {
		if (this.stopped || this.retryTimer) return;
    //if auto autologged is true it shouldnt login at all. this would require manual intervention from owner.
		if (autoLogged) {
			try {
				console.log("[MC] Auto-logged (low health) — staying offline. Please login to check on the bot.",);
				return;
			} catch (error) {
        console.warn(error)
      }
		} else {
			const delay = this.retryDelay + Math.floor(Math.random() * JITTER_MAX);
			this.retryDelay = Math.min(
				this.retryDelay * RETRY_FACTOR,
				RETRY_MAX_DELAY,
			);
			console.log(
				`[MC] Reconnecting in ${Math.round(delay / 1000)}s (${reason})...`,
			);
			this.retryTimer = setTimeout(() => {
				this.retryTimer = null;
				this.connect();
			}, delay);
		}
	}

	disconnect() {
		this.stopped = true;
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}
		if (this.bot) {
			try {
				this.bot.quit();
			} catch (error) {
				console.error(`[MC] Error while quitting: ${error.message}`);
			}
			this.bot = null;
		}
	}
}

module.exports = { MinecraftBotManager };
