import type { BrandKit } from "./types";

const bulletList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const surfaceRules = (
  title: string,
  rules: Array<{ rule: string; reason: string }>,
) => [
  `### ${title}`,
  ...rules.flatMap(({ rule, reason }) => [`- ${rule}`, `  Reason: ${reason}`]),
].join("\n");

export function exportToMarkdown(kit: BrandKit): string {
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
      ...(kit.icp.secondary
        ? [
            "### Secondary ICP",
            `Role: ${kit.icp.secondary.role}`,
            bulletList(kit.icp.secondary.signals),
          ]
        : []),
      ...(kit.icp.badFitSignals && kit.icp.badFitSignals.length > 0
        ? ["### Anti-signals", bulletList(kit.icp.badFitSignals)]
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
  ];

  return sections.join("\n\n").trim();
}
