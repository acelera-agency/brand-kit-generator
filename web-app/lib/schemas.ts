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

export const Stage5Schema = z.object({
  voice: z.object({
    principles: z
      .array(z.string().min(8, "Each principle needs to be specific."))
      .min(3, "Need at least 3 voice principles.")
      .max(7, "Keep voice principles to 7 or fewer."),
    do: z.array(z.string().min(8, "Each do statement needs to be specific.")).min(5, "Need at least 5 do statements."),
    dont: z.array(z.string().min(8, "Each don't statement needs to be specific.")).min(5, "Need at least 5 don't statements."),
    writingRules: z
      .array(z.string().min(8, "Each writing rule needs to be specific."))
      .min(3, "Need at least 3 writing rules."),
    beforeAfter: z
      .array(
        z.object({
          old: z.string().min(8, "The old example is too short."),
          new: z.string().min(8, "The new example is too short."),
        }),
      )
      .min(3, "Need at least 3 before/after examples."),
  }),
});

export type Stage5 = z.infer<typeof Stage5Schema>;

const HomepageHeroTemplateSchema = z.object({
  eyebrow: z.string().min(3, "Homepage eyebrow is too short."),
  h1: z.string().min(3, "Homepage H1 is too short."),
  subhead: z.string().min(10, "Homepage subhead is too short."),
  ctaVariants: z
    .array(z.string().min(2, "Each CTA needs copy."))
    .length(2, "Homepage hero needs exactly 2 CTA variants."),
});

const ColdOutreachTemplateSchema = z.object({
  subjects: z
    .array(z.string().min(3, "Each subject line needs copy."))
    .length(3, "Cold outreach needs exactly 3 subject variants."),
  body: z.string().min(60, "Cold outreach body is too short."),
  signOff: z.string().min(3, "Cold outreach sign-off is too short."),
});

const SocialBiosTemplateSchema = z.object({
  linkedin: z.string().min(10, "LinkedIn bio is too short."),
  twitter: z
    .string()
    .min(10, "Twitter bio is too short.")
    .max(160, "Twitter bio exceeds 160 characters."),
  instagram: z
    .string()
    .min(10, "Instagram bio is too short.")
    .max(150, "Instagram bio exceeds 150 characters."),
});

const FirstMinuteTemplateSchema = z.object({
  script: z.string().min(40, "First-minute script is too short."),
  wordCount: z.number().int().positive("Word count must be a positive integer."),
});

export const Stage6Schema = z.object({
  templates: z.object({
    homepageHero: HomepageHeroTemplateSchema,
    coldOutreach: ColdOutreachTemplateSchema,
    socialBios: SocialBiosTemplateSchema,
    firstMinute: FirstMinuteTemplateSchema,
    emailSignature: z.string().min(10, "Email signature is too short."),
  }),
});

export type Stage6 = z.infer<typeof Stage6Schema>;

const PaletteRoleSchema = z.enum([
  "primary",
  "secondary",
  "background",
  "accent",
  "neutral",
]);

const TypographySourceSchema = z.enum(["google", "adobe", "self-hosted"]);

const TypographyFamilySchema = z.object({
  family: z.string().min(2, "Font family name is too short."),
  weights: z.array(z.number().int().positive()).min(1, "Need at least 1 font weight."),
  source: TypographySourceSchema,
  url: z.string().url("Typography URL must be valid.").optional(),
});

export const Stage7Schema = z.object({
  visual: z.object({
    palette: z
      .array(
        z.object({
          name: z.string().min(2, "Palette token name is too short."),
          hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Palette hex must be a 6-digit hex color."),
          role: PaletteRoleSchema,
          narrative: z.string().min(8, "Palette narrative is too short.").optional(),
        }),
      )
      .min(1, "Need at least 1 palette token.")
      .max(7, "Palette is capped at 7 tokens."),
    typography: z.object({
      display: TypographyFamilySchema,
      body: TypographyFamilySchema,
      mono: TypographyFamilySchema.optional(),
    }),
    characteristicComponents: z
      .array(
        z.object({
          name: z.string().min(2, "Component name is too short."),
          description: z.string().min(8, "Component description is too short."),
        }),
      )
      .min(3, "Need at least 3 characteristic components."),
    forbiddenVisuals: z
      .array(z.string().min(8, "Forbidden visual note is too short."))
      .min(6, "Need at least 6 forbidden visuals."),
    logoDirection: z.string().min(20, "Logo direction needs more detail."),
  }),
});

export type Stage7 = z.infer<typeof Stage7Schema>;
