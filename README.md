# mcBot

A Minecraft bot using [mineflayer](https://github.com/PrismarineJS/mineflayer), designed for anarchy servers where disconnects are the norm — it auto-reconnects with exponential backoff.

## Setup

1. Copy `.env.example` to `.env` and fill in your Minecraft server details.
2. Install dependencies: `npm install`
3. Run: `npm start`

## Structure

```
src/
  index.js        Entry point, wires everything together
  config.js       Loads env config
  bot/            Minecraft bot manager (create, reconnect, shutdown)
  listeners/      Minecraft bot event listeners (autoLog, chat dispatcher)
  commands/       In-game chat commands (prefix: !)
```

## Features

- Auto-reconnect with exponential backoff on any disconnect/kick (5s -> 120s + jitter).
- Auto-eat (`mineflayer-auto-eat`): eats food when hunger drops below 10.
- Auto-log: logs out when health drops below 6, then reconnects after backoff (avoids death on anarchy).
- In-game chat commands (`!` prefix, usable by anyone).

## Adding a Minecraft listener

Add a file to `src/listeners/` exporting `{ name, once, execute(bot, ...args) }`.

## Adding a chat command

Add a file to `src/commands/` exporting `{ name, execute(bot, username, args) }`. Example:

```js
module.exports = {
  name: 'ping',
  execute(bot, username) {
    bot.chat(`@${username} Pong! Health: ${bot.health}`);
  },
};
```

## Behavior

- Connects at startup; retries on failure instead of crashing.
- SIGINT/SIGTERM shutdown sends a clean quit and cancels pending reconnects.