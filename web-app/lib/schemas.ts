import { z } from "zod";

export const Stage0Schema = z.object({
  beforeAfter: z
    .string()
    .min(40, "The before/after narrative needs more substance. Aim for about 3 sentences.")
    .max(800, "The before/after narrative is too long."),
});

export type Stage0 = z.infer<typeof Stage0Schema>;
