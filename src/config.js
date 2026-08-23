const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MC = {
	host: process.env.MC_HOST,
	port: parseInt(process.env.MC_PORT || "63348", 10),
	username: process.env.MC_EMAIL,
	password: process.env.MC_PASSWORD,
	auth: process.env.MC_AUTH || "offline",
	version: process.env.MC_VERSION,
};

// UUIDs resolved from the Mojang API (https://api.mojang.com/users/profiles/minecraft/<name>).
// Keyed by the canonical username casing returned by Mojang, since Minecraft usernames are case-sensitive.
// UUIDs are immutable per account, so this is safe to hardcode — no need to hit the API at runtime.
const whiteList = {
	"nootbot": "9162dc75-cd6b-4347-8d72-8650901d811d",
	"VinceNL": "93d7deb5-ccd4-4403-9d58-b1ff606e83a0",
	"tux4242": "507f79b6-7c20-43b5-958e-18f7298666da",
	"wmantly": "f679db19-8c0e-4b27-a7a9-9318a4bf5931",
	"Dinojager": "328e6a2f-472a-4c88-836e-bb59442806cb",
	"MelonExtract": "ed4272a4-b480-4112-a1c0-c1d2f4d64053",
};

module.exports = { MC, whiteList };