import type { CommandData, SlashCommandProps, CommandOptions } from "commandkit";
import { ApplicationCommandOptionType, ComponentType } from "discord.js";
import { ServiceManager } from "../lib/ServiceManager";
import { HolmesEmbedBuilder } from "../lib/EmbedBuilder";

export const data: CommandData = {
  name: "holmes",
  description: "OSINT toolkit for Discord",
  options: [
    {
      name: "username",
      description: "Username related searches",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "search",
          description: "Search a username across various services",
          type: ApplicationCommandOptionType.Subcommand,
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
        },
        {
          name: "analyze",
          description: "Deep analysis of a specific username",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "username",
              description: "Username to analyze",
              required: true,
            }
          ]
        }
      ]
    },
    {
      name: "email",
      description: "Email related searches",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "search",
          description: "Search for email information and breaches",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "email",
              description: "Email address to search",
              required: true,
            }
          ]
        },
        {
          name: "validate",
          description: "Validate email format and check domain",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "email",
              description: "Email to validate",
              required: true,
            }
          ]
        }
      ]
    },
    {
      name: "domain",
      description: "Domain related searches",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "whois",
          description: "Get WHOIS information",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "domain",
              description: "Domain to analyze",
              required: true,
            }
          ]
        },
        {
          name: "dns",
          description: "Get DNS records",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: "domain",
              description: "Domain to analyze",
              required: true,
            }
          ]
        }
      ]
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
  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  switch (subcommandGroup) {
    case 'username':
      await handleUsernameCommands(interaction, subcommand);
      break;
    case 'email':
      await handleEmailCommands(interaction, subcommand);
      break;
    case 'domain':
      await handleDomainCommands(interaction, subcommand);
      break;
    default:
      await interaction.reply('Invalid command');
  }
}

async function handleUsernameCommands(interaction: any, subcommand: string) {
  switch (subcommand) {
    case 'search':
      await handleUsernameSearch(interaction);
      break;
    case 'analyze':
      await handleUsernameAnalysis(interaction);
      break;
    default:
      await interaction.reply('Invalid username subcommand');
  }
}

async function handleUsernameSearch(interaction: any) {
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

      collector.on('collect', async (i: any) => {
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

async function handleUsernameAnalysis(interaction: any) {
  await interaction.deferReply();

  const username = interaction.options.getString('username');
  const sanitizedUsername = username.trim();

  if (!sanitizedUsername) {
    await interaction.editReply('Please provide a valid username to analyze.');
    return;
  }

  const embedBuilder = new HolmesEmbedBuilder();

  try {
    // Create analysis embed
    const analysisEmbed = embedBuilder.createEmbed(sanitizedUsername, [], 0, false);

    // Common patterns analysis
    const patterns = {
      numbers: /\d+/g,
      specialChars: /[^a-zA-Z0-9]/g,
      commonFormats: {
        yearPattern: /(19|20)\d{2}/,
        birthYear: /[12][90]\d{2}$/,
        leet: /[43][0a][\d]+/i,
        underscores: /_+/g,
        dots: /\.+/g
      }
    };

    const analysis = {
      length: sanitizedUsername.length,
      hasNumbers: patterns.numbers.test(sanitizedUsername),
      numbers: sanitizedUsername.match(patterns.numbers) || [],
      specialChars: sanitizedUsername.match(patterns.specialChars) || [],
      possibleBirthYear: patterns.commonFormats.birthYear.test(sanitizedUsername),
      hasLeetSpeak: patterns.commonFormats.leet.test(sanitizedUsername),
      hasUnderscores: patterns.commonFormats.underscores.test(sanitizedUsername),
      hasDots: patterns.commonFormats.dots.test(sanitizedUsername)
    };

    // Add analysis fields to embed
    analysisEmbed.addFields([
      {
        name: 'Length',
        value: analysis.length.toString(),
        inline: true
      },
      {
        name: 'Contains Numbers',
        value: analysis.hasNumbers ? `Yes (${analysis.numbers.join(', ')})` : 'No',
        inline: true
      },
      {
        name: 'Special Characters',
        value: analysis.specialChars.length > 0 ? analysis.specialChars.join(', ') : 'None',
        inline: true
      },
      {
        name: 'Pattern Analysis',
        value: [
          analysis.possibleBirthYear ? '• Possible birth year detected' : '',
          analysis.hasLeetSpeak ? '• Contains possible leet speak' : '',
          analysis.hasUnderscores ? '• Contains underscores' : '',
          analysis.hasDots ? '• Contains dots' : ''
        ].filter(Boolean).join('\n') || 'No common patterns detected'
      }
    ]);

    // Add recommendations based on analysis
    let recommendations = [];
    if (analysis.possibleBirthYear) {
      recommendations.push('• Consider searching for variations without the year');
    }
    if (analysis.hasLeetSpeak) {
      recommendations.push('• Try searching for non-leet speak variations');
    }
    if (analysis.specialChars.length > 0) {
      recommendations.push('• Try searching without special characters');
    }

    if (recommendations.length > 0) {
      analysisEmbed.addFields([{
        name: 'Search Recommendations',
        value: recommendations.join('\n')
      }]);
    }

    await interaction.editReply({
      embeds: [analysisEmbed]
    });

  } catch (error) {
    await interaction.editReply('An error occurred while analyzing the username.');
  }
}

async function handleEmailCommands(interaction: any, subcommand: string) {
  // Implement email command handling
  await interaction.reply('Email commands coming soon!');
}

async function handleDomainCommands(interaction: any, subcommand: string) {
  // Implement domain command handling
  await interaction.reply('Domain commands coming soon!');
}
