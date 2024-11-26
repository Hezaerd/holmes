import { config } from "./config";
import { Client, GatewayIntentBits } from "discord.js";
import { CommandKit } from "commandkit";
import * as path from "path";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ]
})

new CommandKit({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
  skipBuiltInValidations: true,
  bulkRegister: true,
})

client.login(config.token)