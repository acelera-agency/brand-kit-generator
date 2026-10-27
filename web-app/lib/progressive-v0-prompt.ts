import { STAGE_LABELS, type StageId } from "./stage-requirements";
import type { StoredKitData } from "./types";
import type { V0PromptResult } from "./v0-prompt";

const BASE_SYSTEM = `You are building a progressive brand-site draft inside Brand Kit Generator.

This is not the final website. It is a working draft that improves after each approved interview milestone.

Rules:
- Build a single-page Next.js App Router app with Tailwind CSS.
- Use only the provided brand data. Do not invent proof, customers, metrics, testimonials, logos, or features.
- If a section needs missing information, label it as a working assumption instead of pretending it is known.
- Keep the page useful from the first draft: hero, positioning tension, early CTA, and a visible "still learning" section.
- Avoid generic AI SaaS visuals, purple-blue gradients, fake dashboards, stock imagery, and filler copy.
- Preserve previous useful structure when iterating; update the page with the new stage signal instead of rebuilding randomly.`;

function requireText(value: string | undefined, label: string) {
  const text = value?.trim();
  if (!text) {
    throw new Error(`${label} is required for a progressive v0 draft.`);
  }
  return text;
}

function bulletList(items: string[] | undefined) {
  return items?.filter(Boolean).map((item) => `- ${item}`).join("\n") ?? "";
}

function stageDelta(kit: StoredKitData, stageId: StageId): string {
  switch (stageId) {
    case "stage_0":
      return `Context / contradiction:\n${requireText(kit.beforeAfter, "stage 0 context")}`;
    case "stage_1":
      return `Enemy:\n${requireText(kit.enemy, "stage 1 enemy")}`;
    case "stage_2":
      if (!kit.stack) throw new Error("stage 2 stack is required for a progressive v0 iteration.");
      return [
        "Core stack:",
        `- Character: ${kit.stack.character}`,
        `- Promise: ${kit.stack.promise}`,
        `- Method: ${kit.stack.method}`,
      ].join("\n");
    case "stage_3":
      if (!kit.antiPositioning?.length) {
        throw new Error("stage 3 anti-positioning is required for a progressive v0 iteration.");
      }
      return [
        "Anti-positioning:",
        ...kit.antiPositioning.map((item) => `- NOT ${item.statement} / cost: ${item.cost}`),
      ].join("\n");
    case "stage_4": {
      const signals = kit.icp?.primary.signals;
      if (!signals?.length) throw new Error("stage 4 ICP signals are required for a progressive v0 iteration.");
      const parts = [`Primary ICP signals:\n${bulletList(signals)}`];
      if (kit.icp?.badFitSignals?.length) {
        parts.push(`Bad-fit signals to repel:\n${bulletList(kit.icp.badFitSignals)}`);
      }
      return parts.join("\n\n");
    }
    case "stage_5":
      if (!kit.voice) throw new Error("stage 5 voice is required for a progressive v0 iteration.");
      return [
        `Voice principles:\n${bulletList(kit.voice.principles)}`,
        `Do phrases:\n${bulletList(kit.voice.do)}`,
        `Don't phrases:\n${bulletList(kit.voice.dont)}`,
        `Writing rules:\n${bulletList(kit.voice.writingRules)}`,
      ].join("\n\n");
    case "stage_6":
      if (!kit.templates) throw new Error("stage 6 templates are required for a progressive v0 iteration.");
      return [
        "Application templates:",
        kit.templates.homepageHero
          ? `Hero: ${kit.templates.homepageHero.eyebrow} / ${kit.templates.homepageHero.h1} / ${kit.templates.homepageHero.subhead}`
          : "",
        kit.templates.coldOutreach
          ? `Cold outreach body: ${kit.templates.coldOutreach.body}`
          : "",
        kit.templates.firstMinute
          ? `First minute: ${kit.templates.firstMinute.script}`
          : "",
      ].filter(Boolean).join("\n");
    case "stage_7":
      if (!kit.visual) throw new Error("stage 7 visual direction is required for a progressive v0 iteration.");
      return [
        `Palette:\n${kit.visual.palette.map((color) => `- ${color.name}: ${color.hex} (${color.role})`).join("\n")}`,
        `Typography: ${kit.visual.typography.display.family} display, ${kit.visual.typography.body.family} body`,
        `Components:\n${kit.visual.characteristicComponents.map((c) => `- ${c.name}: ${c.description}`).join("\n")}`,
        `Forbidden visuals:\n${bulletList(kit.visual.forbiddenVisuals)}`,
      ].join("\n\n");
    case "stage_8":
      if (!kit.rules) throw new Error("stage 8 rules are required for a progressive v0 iteration.");
      return [
        "Non-negotiable rules:",
        ...Object.entries(kit.rules).flatMap(([group, rules]) =>
          rules.map((rule) => `- ${group}: ${rule.rule} / reason: ${rule.reason}`),
        ),
      ].join("\n");
  }
}

export function buildProgressiveInitialSitePrompt(kit: StoredKitData): V0PromptResult {
  const context = requireText(kit.beforeAfter, "stage 0 context");

  return {
    system: BASE_SYSTEM,
    message: `Create the first working draft of the brand site from stage_0 only.

Stage 0 context:
${context}

Build a working draft, not a final site. The draft should make the founder feel progress immediately while clearly showing which sections are still unresolved.`,
  };
}

export function buildProgressiveStageIterationPrompt(
  kit: StoredKitData,
  stageId: StageId,
): V0PromptResult {
  return {
    system: BASE_SYSTEM,
    message: `Update the existing progressive brand-site draft with the newly approved milestone.

Milestone: ${stageId} / ${STAGE_LABELS[stageId]}

Approved delta:
${stageDelta(kit, stageId)}

Apply only this delta. Keep prior useful structure, improve the copy and sections where this new milestone creates stronger specificity, and keep unknown areas explicitly marked as working assumptions.`,
  };
}
