import { z } from "zod";

const hasAtMostWords = (value: string, maxWords: number) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length <= maxWords;

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

export const Stage2Schema = z.object({
  stack: z.object({
    character: z
      .string()
      .min(3, "Character needs at least a short phrase.")
      .max(50, "Character is too long.")
      .refine((value) => hasAtMostWords(value, 10), {
        message: "Character phrase must be 10 words or fewer.",
      }),
    promise: z
      .string()
      .min(3, "Promise needs at least a short phrase.")
      .max(50, "Promise is too long.")
      .refine((value) => hasAtMostWords(value, 10), {
        message: "Promise phrase must be 10 words or fewer.",
      }),
    method: z
      .string()
      .min(3, "Method needs at least a short phrase.")
      .max(50, "Method is too long.")
      .refine((value) => hasAtMostWords(value, 10), {
        message: "Method phrase must be 10 words or fewer.",
      }),
  }),
});

export type Stage2 = z.infer<typeof Stage2Schema>;

export const Stage3Schema = z.object({
  antiPositioning: z
    .array(
      z.object({
        statement: z.string().min(8, "Each anti-positioning line needs a real statement."),
        cost: z.string().min(8, "Each anti-positioning line needs a concrete cost."),
      }),
    )
    .min(5, "Need at least 5 anti-positioning statements."),
});

export type Stage3 = z.infer<typeof Stage3Schema>;

export const Stage4Schema = z.object({
  icp: z.object({
    primary: z.object({
      signals: z
        .array(z.string().min(8, "Each signal needs to be specific."))
        .min(4, "Need at least 4 behavioral signals.")
        .max(6, "Keep the primary ICP to 6 signals or fewer."),
    }),
    secondary: z
      .object({
        role: z.string().min(1, "Secondary ICP needs a role."),
        signals: z.array(z.string().min(8, "Each signal needs to be specific.")),
      })
      .optional(),
  }),
});

export type Stage4 = z.infer<typeof Stage4Schema>;
