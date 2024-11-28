import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { ApplicationCommandOptionType, ComponentType } from "discord.js";
import { ServiceManager } from "../lib/ServiceManager";
import { HolmesEmbedBuilder } from "../lib/EmbedBuilder";

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
};

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};

const serviceManager = new ServiceManager();
const embedBuilder = new HolmesEmbedBuilder();

export async function run({ interaction }: SlashCommandProps) {
  const username = interaction.options.getString("username");
  const nsfw = interaction.options.getBoolean("nsfw") ?? false;

  if (!username) {
    return interaction.reply("Please provide a username to search for");
  }

  const sanitizedUsername = username.trim().replace(/\s+/g, '');
  if (sanitizedUsername.length === 0) {
    return interaction.reply("Username cannot be empty or only spaces");
  }

  await interaction.deferReply();

  try {
    const results = await serviceManager.checkUsername(sanitizedUsername, nsfw);
    const matchedResults = results.filter(result => result.exist);

    let currentPage = 0;
    const totalPages = Math.ceil(matchedResults.length / 15);

    const initialEmbed = embedBuilder.createEmbed(username, matchedResults, currentPage, nsfw);
    const buttons = embedBuilder.createButtons(currentPage, totalPages);

    const message = await interaction.editReply({
      embeds: [initialEmbed],
      components: buttons
    });

    if (totalPages > 1) {
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
          return;
        }

        currentPage = i.customId === 'prev'
          ? Math.max(0, currentPage - 1)
          : Math.min(totalPages - 1, currentPage + 1);

        const updatedEmbed = embedBuilder.createEmbed(username, matchedResults, currentPage, nsfw);
        const updatedButtons = embedBuilder.createButtons(currentPage, totalPages);

        await i.update({
          embeds: [updatedEmbed],
          components: updatedButtons
        });
      });

      collector.on('end', () => {
        message.edit({ components: [] }).catch(() => {});
      });
    }
  } catch (error) {
    await interaction.editReply('An error occurred while searching for the username.');
  }
}
