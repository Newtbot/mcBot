const fs = require('fs');
const path = require('path');

function loadListeners(bot, dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const listener = require(path.join(dir, file));
    if (listener.once) {
      bot.once(listener.name, (...args) => listener.execute(bot, ...args));
    } else {
      bot.on(listener.name, (...args) => listener.execute(bot, ...args));
    }
  }
}

module.exports = { loadListeners };