import type { StoredKitData } from "./types";

export type AgentExportFormat = "json" | "markdown";

const list = (items?: string[]) =>
  items?.length ? items.map((item) => `- ${item}`).join("\n") : null;

export function exportStoredKitForAgent(
  kit: StoredKitData,
  format: "json",
): StoredKitData;
export function exportStoredKitForAgent(
  kit: StoredKitData,
  format: "markdown",
): string;
export function exportStoredKitForAgent(
  kit: StoredKitData,
  format: AgentExportFormat,
) {
  if (format === "json") return kit;

  const sections: string[] = [];

  if (kit.beforeAfter) sections.push(`## Context\n\n${kit.beforeAfter}`);
  if (kit.enemy) sections.push(`## Enemy\n\n${kit.enemy}`);
  if (kit.stack) {
    sections.push(
      [
        "## Brand stack",
        `- Character: ${kit.stack.character}`,
        `- Promise: ${kit.stack.promise}`,
        `- Method: ${kit.stack.method}`,
      ].join("\n"),
    );
  }
  if (kit.antiPositioning?.length) {
    sections.push(
      [
        "## Anti-positioning",
        ...kit.antiPositioning.flatMap(({ statement, cost }) => [
          `- ${statement}`,
          `  Cost: ${cost}`,
        ]),
      ].join("\n"),
    );
  }
  if (kit.icp) {
    sections.push(
      [
        "## ICP",
        "### Primary signals",
        list(kit.icp.primary.signals),
        kit.icp.badFitSignals?.length ? "### Bad-fit signals" : null,
        list(kit.icp.badFitSignals),
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }
  if (kit.voice) {
    sections.push(
      [
        "## Voice",
        "### Principles",
        list(kit.voice.principles),
        "### Do",
        list(kit.voice.do),
        "### Don't",
        list(kit.voice.dont),
        "### Writing rules",
        list(kit.voice.writingRules),
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }
  if (kit.templates) {
    sections.push(
      [
        "## Templates",
        "### Homepage hero",
        `- Eyebrow: ${kit.templates.homepageHero.eyebrow}`,
        `- H1: ${kit.templates.homepageHero.h1}`,
        `- Subhead: ${kit.templates.homepageHero.subhead}`,
      ].join("\n"),
    );
  }
  if (kit.visual) {
    sections.push(
      [
        "## Visual direction",
        "### Palette",
        kit.visual.palette
          .map(({ name, hex, role }) => `- ${name} (${hex}) - ${role}`)
          .join("\n"),
        "### Typography",
        `- Display: ${kit.visual.typography.display.family}`,
        `- Body: ${kit.visual.typography.body.family}`,
      ].join("\n\n"),
    );
  }
  if (kit.rules) {
    sections.push(
      [
        "## Rules",
        "### Outreach",
        kit.rules.outreach.map(({ rule, reason }) => `- ${rule}\n  Reason: ${reason}`).join("\n"),
      ].join("\n\n"),
    );
  }

  return sections.length
    ? sections.join("\n\n").trim()
    : "## Brand kit\n\nNo approved brand signals yet.";
}
