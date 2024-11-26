import type { CommandData, SlashCommandProps, CommandOptions  } from "commandkit";
import {
  ApplicationCommandOptionType,
} from "discord.js";

import { checkUsername } from "../lib/fetcher/fetcher";
import services from "../lib/fetcher/services.json";

export const data: CommandData = {
  name: "holmes",
  description: "Search a username across various services",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "username",
      description: "The username to search for",
      required: true,
    }
  ]
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
}

export async function run({ interaction, client }: SlashCommandProps) {
  const username = interaction.options.getString("username");

  if (!username) {
    return interaction.reply("Please provide a username to search for");
  }

  await interaction.deferReply(); // Acknowledge the interaction

  const results = await Promise.all(
    services.map(service => checkUsername(service, username))
  )

  const response = results
    .filter(result => result.exist)
    .map(
      (result) =>
        `**${result.service}**: <${result.url}>`
    )
    .join("\n");

  interaction.editReply(response);
}
