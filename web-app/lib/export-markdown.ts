import type { BrandKit } from "./types";

const FORBIDDEN_GENERIC_WORDS = [
  "innovation",
  "disruption",
  "transformation",
  "next-generation",
  "cutting-edge",
  "seamless",
  "holistic",
  "end-to-end",
  "empowering",
  "revolutionary",
  "unleash",
  "unlock",
  "supercharge",
];

const bulletList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const wordCount = (value: string) =>
  value.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g)?.length ?? 0;

const splitSentences = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];

const truncate = (value: string, maxLength = 140) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

function findForbiddenGenericWords(text: string): string[] {
  return FORBIDDEN_GENERIC_WORDS.filter((word) => {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(word)}([^a-z0-9]|$)`,
      "i",
    );
    return pattern.test(text);
  });
}

function extractSentenceWordLimit(rules: string[]): number | null {
  for (const rule of rules) {
    const match = rule.match(
      /(?:under|fewer than|max(?:imum)?|no more than)\s+(\d+)\s+words?/i,
    );
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function draftQaFlags(kit: BrandKit): string[] {
  const flags: string[] = [];
  const forbiddenContextWords = findForbiddenGenericWords(
    kit.context.beforeAfter,
  );

  if (forbiddenContextWords.length) {
    flags.push(
      `Context uses forbidden generic words: ${forbiddenContextWords.join(", ")}.`,
    );
  }

  const sentenceLimit = extractSentenceWordLimit(kit.voice.writingRules);
  if (sentenceLimit) {
    const longSentence = splitSentences(kit.templates.coldOutreach.body).find(
      (sentence) => wordCount(sentence) > sentenceLimit,
    );

    if (longSentence) {
      flags.push(
        `Cold outreach has a sentence over ${sentenceLimit} words (${wordCount(longSentence)}): "${truncate(longSentence)}"`,
      );
    }
  }

  return flags;
}

const surfaceRules = (
  title: string,
  rules: Array<{ rule: string; reason: string }>,
) => [
  `### ${title}`,
  ...rules.flatMap(({ rule, reason }) => [`- ${rule}`, `  Reason: ${reason}`]),
].join("\n");

export function exportToMarkdown(kit: BrandKit): string {
  const qaFlags = draftQaFlags(kit);
  const sections = [
    ["## Context", kit.context.beforeAfter].join("\n\n"),
    ["## Enemy", kit.enemy].join("\n\n"),
    [
      "## Brand stack",
      `- Character: ${kit.stack.character}`,
      `- Promise: ${kit.stack.promise}`,
      `- Method: ${kit.stack.method}`,
    ].join("\n"),
    [
      "## Anti-positioning",
      ...kit.antiPositioning.flatMap(({ statement, cost }) => [
        `- ${statement}`,
        `  Cost: ${cost}`,
      ]),
    ].join("\n"),
    [
      "## ICP",
      "### Primary signals",
      bulletList(kit.icp.primary.signals),
      ...(kit.icp.badFitSignals?.length
        ? [
            "### Anti-signals",
            bulletList(kit.icp.badFitSignals),
          ]
        : []),
      ...(kit.icp.secondary
        ? [
            "### Secondary ICP",
            `Role: ${kit.icp.secondary.role}`,
            bulletList(kit.icp.secondary.signals),
          ]
        : []),
    ].join("\n\n"),
    [
      "## Voice",
      "### Principles",
      bulletList(kit.voice.principles),
      "### Do",
      kit.voice.do.map((item) => `- ✓ ${item}`).join("\n"),
      "### Don't",
      kit.voice.dont.map((item) => `- ✗ ${item}`).join("\n"),
      "### Writing rules",
      bulletList(kit.voice.writingRules),
      "### Before / after",
      kit.voice.beforeAfter
        .map(({ old, new: next }) => `- Old: ${old}\n  New: ${next}`)
        .join("\n"),
    ].join("\n\n"),
    [
      "## Templates",
      "### Homepage hero",
      `- Eyebrow: ${kit.templates.homepageHero.eyebrow}`,
      `- H1: ${kit.templates.homepageHero.h1}`,
      `- Subhead: ${kit.templates.homepageHero.subhead}`,
      `- CTA 1: ${kit.templates.homepageHero.ctaVariants[0]}`,
      `- CTA 2: ${kit.templates.homepageHero.ctaVariants[1]}`,
      "### Cold outreach",
      "#### Subjects",
      bulletList(kit.templates.coldOutreach.subjects),
      "#### Body",
      kit.templates.coldOutreach.body,
      "#### Sign-off",
      kit.templates.coldOutreach.signOff,
      "### Social bios",
      `- LinkedIn: ${kit.templates.socialBios.linkedin}`,
      `- Twitter: ${kit.templates.socialBios.twitter}`,
      `- Instagram: ${kit.templates.socialBios.instagram}`,
      "### First minute",
      `- Word count: ${kit.templates.firstMinute.wordCount}`,
      kit.templates.firstMinute.script,
      "### Email signature",
      kit.templates.emailSignature,
    ].join("\n\n"),
    [
      "## Visual direction",
      "### Palette",
      kit.visual.palette
        .map(
          ({ name, hex, role, narrative }) =>
            `- ${name} (${hex}) - ${role}${narrative ? `: ${narrative}` : ""}`,
        )
        .join("\n"),
      "### Typography",
      `- Display: ${kit.visual.typography.display.family} [${kit.visual.typography.display.weights.join(", ")}] via ${kit.visual.typography.display.source}`,
      `- Body: ${kit.visual.typography.body.family} [${kit.visual.typography.body.weights.join(", ")}] via ${kit.visual.typography.body.source}`,
      ...(kit.visual.typography.mono
        ? [
            `- Mono: ${kit.visual.typography.mono.family} [${kit.visual.typography.mono.weights.join(", ")}] via ${kit.visual.typography.mono.source}`,
          ]
        : []),
      "### Characteristic components",
      kit.visual.characteristicComponents
        .map(({ name, description }) => `- ${name}: ${description}`)
        .join("\n"),
      "### Forbidden visuals",
      bulletList(kit.visual.forbiddenVisuals),
      "### Logo direction",
      kit.visual.logoDirection,
    ].join("\n\n"),
    [
      "## Rules",
      surfaceRules("Outreach", kit.rules.outreach),
      surfaceRules("Sales meeting", kit.rules.salesMeeting),
      surfaceRules("Proposals", kit.rules.proposals),
      surfaceRules("Cases", kit.rules.cases),
      surfaceRules("Visual", kit.rules.visual),
    ].join("\n\n"),
    ...(qaFlags.length
      ? [["## Draft QA flags", bulletList(qaFlags)].join("\n\n")]
      : []),
  ];

  return sections.join("\n\n").trim();
}
