# AGENTS.md

Minecraft bot (mineflayer). CommonJS, no lint/typecheck/test setup. Runs against an anarchy server — assume disconnects/kicks are normal.

## Collaboration style

- User is learning alongside the build. Explain the logic/why behind every change, in plain terms.
- Ask questions when anything is ambiguous or could go multiple ways; don't assume.
- Teacher/student dynamic: act as the user's teacher, not a code-vending machine. Walk through reasoning, trade-offs, and mineflayer specifics. Do NOT hand over complete working implementations for features the user intends to build themselves — guide them to write it. (User deliberately parks half-finished code like auto-log/health checks to finish later; respect that.)

## Commands

- `npm start` — run. `npm run dev` — run with `node --watch` (Node >= 18.11).
- Requires `.env`.
- Env vars: `MC_HOST`, `MC_PORT` (default `63348`), `MC_EMAIL` (in-game name for offline servers, or the Microsoft email when `MC_AUTH=microsoft`), `MC_AUTH` (default `offline`), `MC_PASSWORD` (only for `microsoft`), optional `MC_VERSION`. Single account only.

## Architecture

- `src/index.js` creates a `MinecraftBotManager` (`src/bot/minecraftBot.js`) and passes an `onBot` callback that sets up listeners on every new bot.
- `mcManager.connect()` creates the mineflayer bot; `onBot` fires with the new bot on EVERY (re)connect.

## Reconnection & error handling (anarchy)

- `MinecraftBotManager` (src/bot/minecraftBot.js) handles `error`, `kicked`, and `end`. Any disconnect triggers auto-reconnect with exponential backoff (5s -> 120s + random jitter). Backoff resets on `login`.
- Listeners are attached on EVERY new connection via the `onBot` callback in `index.js` — new bot object each time; never attach listeners outside that callback or they'll be lost on reconnect.
- `mcManager.disconnect()` stops the bot and cancels reconnects.
- Bot connects at startup; if the server is unreachable or credentials are invalid it retries instead of crashing.
- Unhandled rejections are logged, not crashed on.

## Minecraft listeners

- Add a file in `src/listeners/` exporting `{ name, once, execute(bot, ...eventArgs) }`. Loader (`src/listeners/index.js`) calls `listener.execute(bot, ...args)`.
- `autoLog.js` — on `health`, calls `bot.quit()` when `bot.health < 6` (threshold const at top). The manager's reconnect brings the bot back after backoff, so this doubles as a survivability trick on anarchy.
- `chat.js` — in-game chat command dispatcher. Any message starting with `!` is parsed as `!<cmd> <args>`, matched against handlers in `src/commands/`, executed via `command.execute(bot, username, args)`.

## Minecraft plugins

- Loaded ONCE per connection in the `onBot` callback in `index.js` (same place as listeners), via `bot.loadPlugin(...)`.
- `mineflayer-auto-eat` is loaded and enabled there (`bot.autoEat.setOpts({ minHunger: 10 })`, `bot.autoEat.enableAuto()`). The auto-eat plugin auto-loads its own util-plugin dependency.

## In-game chat commands

- Add a file in `src/commands/` exporting `{ name, execute(bot, username, args) }`. Loader (`src/commands/index.js`) collects them; `chat.js` dispatches. Prefix is `!`, anyone can use commands.
- This is the extension point for bot actions (move, drop, craft, etc.).