import { z } from "zod";

export const Stage0Schema = z.object({
  beforeAfter: z
    .string()
    .min(40, "The before/after narrative needs more substance. Aim for about 3 sentences.")
    .max(800, "The before/after narrative is too long."),
});

export type Stage0 = z.infer<typeof Stage0Schema>;

export const Stage1Schema = z.object({
  enemy: z
    .string()
    .min(15, "The enemy statement is too short.")
    .max(200, "The enemy statement is too long.")
    .refine((value) => !/\n\s*\n/.test(value), {
      message: "The enemy should stay as a single sentence, not multiple paragraphs.",
    }),
});

export type Stage1 = z.infer<typeof Stage1Schema>;
