import type {
  CommandData,
  SlashCommandProps,
  CommandOptions,
} from "commandkit";

export const data: CommandData = {
  name: "ping",
  description: "Respond with Pong!",
};

export const options: CommandOptions = {
  devOnly: false,
  deleted: false,
};

export async function run({ interaction, client, handler }: SlashCommandProps) {
  await interaction.deferReply();

  const reply = await interaction.fetchReply();

  const latency = reply.createdTimestamp - interaction.createdTimestamp;

  await interaction.editReply(`:ping_pong: Pong! \`${latency}ms\`.`);
}
