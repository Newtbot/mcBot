// Slot mapping decoded by Vince in bulbastore's CJTradeSession (CJ Trade plugin).
const CJ_CONFIRM_SLOT = 37;
const CJ_STATE_SLOT = 53;
const CJ_TRADE_ABORTED = /aborted the trade/i;

// const { depositToStorage } = require('../lib/trade'); // disabled: src/lib/trade.js not present yet

module.exports = {
	name: "windowOpen",
	async execute(bot, window) {
		console.log("[trade][debug] execute fired; bot._trade=", !!bot._trade, "window.type=", window.type);

		if (!bot._trade) return;
		if (window.type === "minecraft:chest") return;

		const partner = bot._trade.partner;
		let success = false;
		let finalized = false;
		let customerStep = 0;

		// Single post-trade path. Guarded so it can be called from both the
		// execute-click AND the window 'close' without double-running.
		const finalize = () => {
			if (finalized) return;
			finalized = true;
			bot.removeListener("messagestr", onVerdict);
			bot._trade = null;
			// if (success) await depositToStorage(bot);
			if (success) console.log("trade finished");
			else bot.whisper(partner, "trade failed");
		};

		try {
			await bot.moveSlotItem(CJ_CONFIRM_SLOT, CJ_CONFIRM_SLOT);
			// console.log("[trade][debug] bot ready clicked");
		} catch (err) {
			console.error("[trade] failed to click ready", err);
		}

		window.on("updateSlot:53", async (oldItem, newItem) => {
			const n = newItem && newItem.name;
			const o = oldItem && oldItem.name;
			// console.log("[trade][debug] slot53", o, "->", n, "step=", customerStep);
			if (n === "magenta_dye" && customerStep === 0) {
				customerStep = 1; // customer ready
			} else if (
				o === "magenta_dye" &&
				n === "lime_dye" &&
				customerStep === 1
			) {
				customerStep = 2; // customer executing
				if (!success) {
					success = true;
					// console.log("[trade][debug] bot execute clicked; success=true");
					await bot.moveSlotItem(CJ_CONFIRM_SLOT, CJ_CONFIRM_SLOT); // bot EXECUTE
					// Trade executed. Finalize after items settle, independent of
					// whether the server emits 'close' for this window.
					setTimeout(finalize, 1500);
				}
			}
		});

		// Verdict: trust our own execute-click as success. Only an explicit
		// abort message flips it back to false.
		const onVerdict = (message) => {
			const line = (message == null ? "" : message.toString()).trim();
			if (CJ_TRADE_ABORTED.test(line)) {
				// console.log("[trade] abort detected:", line);
				success = false;
			}
		};
		bot.on("messagestr", onVerdict);

		window.once("close", () => {
			// console.log("[trade][debug] closed; success=", success);
			finalize();
		});
	},
};
