import { z } from "zod";

const configSchema = z.object({
  token: z.string().readonly()
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = configSchema.parse(process.env);