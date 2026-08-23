# mcBot

A Minecraft bot using [mineflayer](https://github.com/PrismarineJS/mineflayer), built for anarchy servers where disconnects/kicks are the norm — it auto-reconnects with exponential backoff, and (intentionally) does **not** auto-reconnect after a low-health auto-log.

## Setup

1. Copy `.env.example` to `.env` and fill in your Minecraft server details.
2. Install dependencies: `npm install`
3. Run: `npm start` (or `npm run dev` for `node --watch`).

Requires `.env` with `MC_HOST`, `MC_PORT` (default `63348`), `MC_EMAIL`, `MC_AUTH` (default `offline`), optional `MC_PASSWORD` (microsoft) and `MC_VERSION`.

## Features

- **Auto-reconnect** with exponential backoff (5s → 120s + jitter) on any disconnect/kick.
- **Auto-eat** (`mineflayer-auto-eat`): the `health` listener enables auto-eat whenever food < 20 and disables it at full food, so the bot never starves.
- **Auto-log (stays offline):** when `bot.health` drops below 8, `health.js` calls `bot.quit()` and sets `bot.autoLogged = true`. `minecraftBot.js` sees that flag in `scheduleReconnect` and **does not reconnect** — the bot stays offline until a human restarts it. This avoids dying on anarchy and forces someone to check on it.
- **Whitelist-gated CJ Trade:** a whitelisted player can whisper `dep` (or `deposit`) to the bot. The bot opens a `/trade`, then auto-drives the CJ Trade GUI (ready → execute on the partner's confirm). On success it logs `trade finished`. Auto-deposit to storage is the next piece (see Storage, pending).

## CJ Trade (whisper-triggered)

Flow:

1. The whitelist lives in `src/config.js` as `whiteList` (canonical username → Mojang UUID). `whisper.js` resolves the sender's UUID (via `modules/getPlayers`) and only proceeds for whitelisted accounts.
2. A whitelisted player whispers `dep` / `deposit` → the bot sets `bot._trade = { partner }` and sends `/trade <player>`. A 35s safety timer clears `bot._trade` if the trade window never opens.
3. The `windowOpen` listener (fired for the trade window `minecraft:generic_9x6`) clicks **ready** (slot 37), then watches slot 53. When the partner confirms (the `magenta_dye → lime_dye` transition), it clicks **execute** (slot 37 again).
4. Success is taken from the bot's own execute click. An explicit abort chat message (`/aborted the trade/i`) flips the result to failed. On success the bot logs `trade finished`; on failure it whispers the partner `trade failed`.

> `bot._trade` is a custom flag (not a mineflayer built-in) used to carry trade state across the window-open event.

## Storage / auto-deposit (planned)

After a successful trade, the intent is to dump the inventory into a marked storage chest. This is **not yet implemented** — `src/lib/trade.js` does not exist yet.

Planned design (so the docs match what's being built):

- `depositToStorage(bot)` finds nearby storage containers (chest / trapped chest / barrel / shulker box) that have a **sign block directly below** them (nearest-first via `bot.findBlocks`), then opens each in turn.
- It deposits the **entire inventory except a keep-list** (`config.keepItems`) and **food** (food is kept so auto-eat keeps working). Armor/offhand are never touched because `window.deposit` only moves items from the main-inventory slot range.
- If a chest fills up, it **overflows to the next sign-marked chest** until everything is stored (or no marked chests remain).
- The chest must be within interaction range of the bot (place it next to where the bot stands after a trade). Pathfinding to a distant chest is out of scope.

## Structure

```
src/
  index.js          Entry point. Loads autoEat + all listeners on EVERY (re)connect.
  config.js         Env config + whitelist (username -> Mojang UUID).
  bot/              MinecraftBotManager: create, reconnect w/ backoff, auto-log skip.
  listeners/        Event listeners: health, whisper, windowOpen.
  lib/              Trade/storage helpers (depositToStorage — pending).
  modules/          getPlayers (Mojang UUID lookup used by the whisper whitelist).
  commands/         (empty) — chat-command system is planned, not yet wired.
```

## Adding a Minecraft listener

Add a file to `src/listeners/` exporting `{ name, once, execute(bot, ...args) }`. `listeners/index.js` requires every `.js` in the folder and attaches it with `bot.on(name, ...)` (or `bot.once` when `once` is true). This runs on **every** (re)connect, so never attach listeners outside the listener files or they'll be lost on reconnect.

## Adding a chat command

> **Not yet implemented.** There is currently no `!`-command dispatcher and `src/commands/` is empty. The chat-command extension point described in `AGENTS.md` is planned but not wired. For now, bot triggers are driven by **whispers** (see `whisper.js`), not public chat commands.

## Behavior

- Connects at startup; retries on failure instead of crashing.
- After a low-health auto-log, the bot stays offline until manually restarted (see Auto-log above).
- `index.js` patches `minecraft-protocol`'s chat checksum calculation — a workaround required for signed-chat on this server.
- SIGINT/SIGTERM shutdown sends a clean quit and cancels pending reconnects.
