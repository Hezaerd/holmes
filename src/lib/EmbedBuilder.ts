import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import type { CheckResult } from '../types';

export class HolmesEmbedBuilder {
  private RESULTS_PER_PAGE = 15;

  public createEmbed(
    username: string,
    results: CheckResult[],
    currentPage: number,
    includeNSFW: boolean
  ): EmbedBuilder {
    const totalPages = Math.ceil(results.length / this.RESULTS_PER_PAGE);
    const pageResults = this.getPageResults(results, currentPage);

    return new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`🔍 Username Search Results: ${username}`)
      .setDescription(this.getDescription(results.length, currentPage, totalPages))
      .addFields(this.createFields(pageResults))
      .setFooter({
        text: `Searched ${results.length} services${includeNSFW ? ' (including NSFW)' : ''}`
      })
      .setTimestamp();
  }

  public createButtons(currentPage: number, totalPages: number): ActionRowBuilder<ButtonBuilder>[] {
    if (totalPages <= 1) return [];

    const prevButton = new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages - 1);

    return [new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton)];
  }

  private getPageResults(results: CheckResult[], page: number): CheckResult[] {
    const startIndex = page * this.RESULTS_PER_PAGE;
    return results.slice(startIndex, startIndex + this.RESULTS_PER_PAGE);
  }

  private getDescription(total: number, currentPage: number, totalPages: number): string {
    if (total === 0) return 'No matches found.';
    return `Found ${total} matches${totalPages > 1 ? ` (Page ${currentPage + 1}/${totalPages})` : ''}:`;
  }

  private createFields(results: CheckResult[]) {
    return results.map(result => ({
      name: result.service,
      value: `[View Profile](${result.url})${result.error ? ` (${result.error})` : ''}`,
      inline: true
    }));
  }
}