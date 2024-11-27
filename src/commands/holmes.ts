import type { CommandData, SlashCommandProps, CommandOptions  } from "commandkit";
import {
  ApplicationCommandOptionType
} from "discord.js";

import { HolmesEmbedBuilder } from "../lib/holmes-embed";

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
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "nsfw",
      description: "Also search for NSFW services",
      required: false,
    }
  ]
}

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
}

export async function run({ interaction, client }: SlashCommandProps) {
  const username = interaction.options.getString("username");
  const nsfw = interaction.options.getBoolean("nsfw") ?? false;

  if (!username) {
    return interaction.reply("Please provide a username to search for");
  }

  const sanitizedUsername = username.trim().replace(/\s+/g, '-');

  if (sanitizedUsername.length === 0) {
    return interaction.reply("Username cannot be empty or only spaces");
  }

  await interaction.deferReply();

  const results = await Promise.all(
    services
      .filter(service => nsfw ? true : !service.isNSFW)
      .map(service => checkUsername(service, sanitizedUsername))
  );

  const matchedResults = results.filter(result => result.exist);

  const embed = new HolmesEmbedBuilder(`🔍 Username Search Results: ${username}`)
    .setDescription(
      matchedResults.length > 0
        ? 'Found the following matches:'
        : 'No matches found.'
    )

  if (matchedResults.length > 0) {
    embed.addFields(
      matchedResults.map(result => ({
        name: result.service,
        value: `[View Profile](${result.url})`,
        inline: true
      }))
    );
  }

  embed.setFooter({
    text: `Searched ${results.length} services${nsfw ? ' (including NSFW)' : ''}`
  });

  await interaction.editReply({ embeds: [embed] });
}
