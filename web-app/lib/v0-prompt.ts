import type { StoredKitData } from "./types";

export type V0PromptResult = {
  system: string;
  message: string;
};

export function buildV0SitePrompt(kit: StoredKitData): V0PromptResult {
  if (!kit.templates?.homepageHero) {
    throw new Error("Kit must have at least templates.homepageHero to generate a site.");
  }

  const hero = kit.templates.homepageHero;
  const palette = kit.visual?.palette ?? [];
  const typography = kit.visual?.typography;
  const forbidden = kit.visual?.forbiddenVisuals ?? [];

  const displayFont = typography?.display?.family ?? "Inter";
  const bodyFont = typography?.body?.family ?? "Inter";
  const displayWeights = typography?.display?.weights ?? [400, 600];
  const bodyWeights = typography?.body?.weights ?? [400, 500];
  const monoFont = typography?.mono?.family;

  const system = buildSystemMessage(kit, palette, typography, forbidden, displayFont, bodyFont, monoFont, displayWeights, bodyWeights);
  const message = buildUserMessage(kit, hero, palette, displayFont);

  return { system, message };
}

function buildSystemMessage(
  kit: StoredKitData,
  palette: NonNullable<StoredKitData["visual"]>["palette"],
  typography: NonNullable<StoredKitData["visual"]>["typography"] | undefined,
  forbidden: string[],
  displayFont: string,
  bodyFont: string,
  monoFont: string | undefined,
  displayWeights: number[],
  bodyWeights: number[],
): string {
  const sections: string[] = [];

  sections.push(`You are an expert brand web designer and developer. You build premium, production-quality landing pages using Next.js App Router and Tailwind CSS. You treat brand guidelines as law — every color, font, voice rule, and constraint must be followed exactly. You never use placeholder content; every word must come from the brand data provided.`);

  if (kit.enemy) {
    sections.push(`## Brand Enemy\nThis brand exists in opposition to: ${kit.enemy}\nEvery design and copy decision must reinforce this positioning. The enemy should be felt through what is absent — the anti-patterns the brand refuses to follow.`);
  }

  if (kit.stack) {
    sections.push(`## Brand Stack (Core Identity)\n- Character: ${kit.stack.character}\n- Promise: ${kit.stack.promise}\n- Method: ${kit.stack.method}\nThese three elements define the brand's soul. The character is the personality. The promise is what they deliver. The method is how they deliver it. The site must embody all three.`);
  }

  if (kit.antiPositioning?.length) {
    const lines = kit.antiPositioning
      .map((a) => `  - NOT "${a.statement}" — because ${a.cost}`)
      .join("\n");
    sections.push(`## Anti-Positioning (What We Are NOT)\n${lines}\nThese are hard boundaries. The site must never accidentally communicate any of these. If there is tension between a design choice and an anti-positioning statement, the anti-positioning wins.`);
  }

  if (kit.icp) {
    const parts: string[] = [];
    if (kit.icp.primary.signals.length) {
      parts.push(`Primary audience signals:\n${kit.icp.primary.signals.map((s) => `  - ${s}`).join("\n")}`);
    }
    if (kit.icp.secondary) {
      parts.push(`Secondary audience: ${kit.icp.secondary.role}\nSignals:\n${kit.icp.secondary.signals.map((s) => `  - ${s}`).join("\n")}`);
    }
    if (parts.length) {
      sections.push(`## Ideal Customer Profile\n${parts.join("\n\n")}\nThe entire site must speak TO this person. Every headline, every subhead, every CTA must resonate with these signals. The visitor should feel like this site was built specifically for them.`);
    }
  }

  if (kit.voice) {
    const voiceParts: string[] = [];

    if (kit.voice.principles?.length) {
      voiceParts.push(`### Core Voice Principles\n${kit.voice.principles.map((p) => `- ${p}`).join("\n")}\nThese define the overall personality of all copy on the site.`);
    }

    if (kit.voice.writingRules?.length) {
      voiceParts.push(`### Writing Rules (Non-negotiable)\n${kit.voice.writingRules.map((r) => `- ${r}`).join("\n")}\nEvery sentence on the site must pass these rules. No exceptions.`);
    }

    if (kit.voice.do?.length) {
      voiceParts.push(`### Do\n${kit.voice.do.map((d) => `- ${d}`).join("\n")}`);
    }

    if (kit.voice.dont?.length) {
      voiceParts.push(`### Don't\n${kit.voice.dont.map((d) => `- ${d}`).join("\n")}`);
    }

    if (kit.voice.beforeAfter?.length) {
      const examples = kit.voice.beforeAfter
        .map((ba) => `  Before: "${ba.old}" → After: "${ba.new}"`)
        .join("\n");
      voiceParts.push(`### Voice Before/After Examples\n${examples}\nUse these as calibration. All copy should sound like the "After" versions.`);
    }

    if (voiceParts.length) {
      sections.push(`## Brand Voice\n${voiceParts.join("\n\n")}`);
    }
  }

  if (kit.rules) {
    const ruleCategories: string[] = [];

    if (kit.rules.visual?.length) {
      ruleCategories.push(`### Visual Rules\n${kit.rules.visual.map((r) => `- ${r.rule} (because: ${r.reason})`).join("\n")}`);
    }
    if (kit.rules.outreach?.length) {
      ruleCategories.push(`### Outreach / CTA Rules\n${kit.rules.outreach.map((r) => `- ${r.rule} (because: ${r.reason})`).join("\n")}`);
    }
    if (kit.rules.salesMeeting?.length) {
      ruleCategories.push(`### Sales / Conversion Rules\n${kit.rules.salesMeeting.map((r) => `- ${r.rule} (because: ${r.reason})`).join("\n")}`);
    }
    if (kit.rules.proposals?.length) {
      ruleCategories.push(`### Proposal / Offering Rules\n${kit.rules.proposals.map((r) => `- ${r.rule} (because: ${r.reason})`).join("\n")}`);
    }
    if (kit.rules.cases?.length) {
      ruleCategories.push(`### Case Study / Proof Rules\n${kit.rules.cases.map((r) => `- ${r.rule} (because: ${r.reason})`).join("\n")}`);
    }

    if (ruleCategories.length) {
      sections.push(`## Brand Rules (All Non-negotiable)\n${ruleCategories.join("\n\n")}`);
    }
  }

  if (forbidden.length) {
    sections.push(`## Forbidden Visuals\n${forbidden.map((f) => `- ${f}`).join("\n")}\nNever use any of these. This includes AI-generated images that look like these categories.`);
  }

  if (palette.length) {
    const colorLines = palette
      .map((p) => {
        let line = `  - ${p.name}: ${p.hex} → use as ${p.role}`;
        if (p.narrative) line += `. Story: "${p.narrative}"`;
        return line;
      })
      .join("\n");

    sections.push(`## Color Palette\n${colorLines}\n\nUse these exact hex colors. Configure them as Tailwind custom colors. The palette is the visual DNA — do not introduce new colors not in this list. Every background, text, border, and accent must come from this palette.`);
  }

  const fontSourceNote = typography?.display?.source === "google" && typography?.body?.source === "google"
    ? "Use next/font/google for all fonts."
    : "Check font sources — some may not be on Google Fonts. Fall back to system fonts if a specified source is not google.";
  const fontLines: string[] = [
    `  - Display: ${displayFont} (weights: ${displayWeights.join(", ")}) — for headlines, hero text, section titles`,
    `  - Body: ${bodyFont} (weights: ${bodyWeights.join(", ")}) — for paragraphs, descriptions, UI text`,
  ];
  if (monoFont) {
    fontLines.push(`  - Mono: ${monoFont} — for code snippets or technical details if needed`);
  }
  sections.push(`## Typography\n${fontLines.join("\n")}\n\n${fontSourceNote}\n\nTypography hierarchy is critical: display font for impact, body font for readability. Never mix weights indiscriminately.`);

  if (kit.visual?.characteristicComponents?.length) {
    const compLines = kit.visual.characteristicComponents
      .map((c) => `  - ${c.name}: ${c.description}`)
      .join("\n");
    sections.push(`## Characteristic UI Components\n${compLines}\nThese components define the brand's visual identity. They should appear prominently and feel distinctive, not generic.`);
  }

  sections.push(`## Technical Requirements
- Next.js App Router with TypeScript
- Tailwind CSS only — no external UI libraries (no shadcn, no MUI, no Chakra)
- Import fonts via next/font/google (or next/font/local if not a Google Font)
- Configure the exact brand palette as Tailwind theme.extend.colors
- Mobile-first responsive design with smooth breakpoints
- Animations: minimal and purposeful — fades on scroll, subtle hover states only
- No placeholder content — every word from the brand data
- Semantic HTML with proper heading hierarchy
- Accessible: proper alt text, focus states, color contrast
- Generate: app/page.tsx, app/layout.tsx, app/globals.css, tailwind.config.ts, package.json, next.config.ts, tsconfig.json
- The result must be a complete, deployable Next.js app`);

  return sections.join("\n\n");
}

function buildUserMessage(
  kit: StoredKitData,
  hero: NonNullable<NonNullable<StoredKitData["templates"]>["homepageHero"]>,
  palette: NonNullable<StoredKitData["visual"]>["palette"],
  displayFont: string,
): string {
  const sections: string[] = [];

  const bg = palette.find((p) => p.role === "background")?.hex ?? "#ffffff";
  const primary = palette.find((p) => p.role === "primary")?.hex ?? "#000000";
  const accent = palette.find((p) => p.role === "accent")?.hex ?? "#0066ff";

  const icpTarget = kit.icp?.primary?.signals?.slice(0, 2).join("; ") ?? "the target audience";

  const parts: string[] = [];
  parts.push(`Build a single-page, long-scroll landing site. Full-viewport hero at top, distinct full-width sections below with alternating ${bg} / ${bg === "#ffffff" ? "#fafaf8" : "#ffffff"} backgrounds. Use subtle fade-in animations on scroll.

This page speaks to: ${icpTarget}. Every headline and CTA must resonate with this person.

CTA strategy: The primary CTA ("${hero.ctaVariants?.[0] ?? "Get started"}") appears three times — in the hero, after the method section, and in the final section. Use ${accent} ONLY for CTA buttons and interactive elements — never for decorative backgrounds or headings.

## 1. Hero — Full Viewport

- Eyebrow (small uppercase): "${hero.eyebrow}"
- H1 headline: "${hero.h1}" — set in ${displayFont}, large (clamp 3rem to 5rem), commanding
- Subheadline: "${hero.subhead}"
- Primary CTA: "${hero.ctaVariants?.[0] ?? "Get started"}" — solid ${accent} button${hero.ctaVariants?.[1] ? `\n- Secondary CTA: "${hero.ctaVariants[1]}" — ghost button, ${primary} border` : ""}
- Background: ${bg}. Text: ${primary}. Accent: ${accent}.`);

  if (kit.enemy || kit.antiPositioning?.length) {
    const lines: string[] = [];
    if (kit.enemy) lines.push(`This brand exists in opposition to: ${kit.enemy}`);
    if (kit.antiPositioning?.length) {
      lines.push("What we refuse:");
      kit.antiPositioning.forEach((a) => lines.push(`- NOT: ${a.statement}`));
    }
    parts.push(`## 2. The Problem / What We Oppose\n${lines.join("\n")}\nPresent boldly. The visitor should feel the contrast with the status quo.`);
  }

  if (kit.beforeAfter) {
    parts.push(`## ${kit.enemy || kit.antiPositioning?.length ? "3" : "2"}. Brand Story\n"${kit.beforeAfter}"\n\nTell this as a narrative arc: struggle → insight → transformation. Use the brand voice.`);
  }

  if (kit.stack) {
    parts.push(`## ${kit.beforeAfter ? (kit.enemy || kit.antiPositioning?.length ? "4" : "3") : (kit.enemy || kit.antiPositioning?.length ? "3" : "2")}. Method — How It Works\nCharacter: ${kit.stack.character}\nPromise: ${kit.stack.promise}\nMethod: ${kit.stack.method}\n\nExplain the method in 2-3 clear numbered steps. Use the brand voice. End with the primary CTA.`);
  }

  if (kit.templates?.firstMinute) {
    parts.push(`## Proof / Social Proof\nAdapt this elevator pitch for a brief proof section:\n"${kit.templates.firstMinute.script}"\n(~${kit.templates.firstMinute.wordCount} words — condense for web.)`);
  }

  parts.push(`## Contact / Final CTA\nRepeat the primary CTA with urgency. ${kit.templates?.emailSignature ? `Tone: "${kit.templates.emailSignature}"` : "Professional, direct."}`);

  parts.push(`## Footer\n${kit.templates?.socialBios ? `LinkedIn: "${kit.templates.socialBios.linkedin}"\nTwitter/X: "${kit.templates.socialBios.twitter}"\nInstagram: "${kit.templates.socialBios.instagram}"` : "Minimal footer — copyright, basic links."}`);

  const designParts: string[] = [];
  if (kit.visual?.logoDirection) designParts.push(`Visual direction: ${kit.visual.logoDirection}`);
  if (kit.visual?.characteristicComponents?.length) {
    designParts.push(`Must include these characteristic UI components:\n${kit.visual.characteristicComponents.map((c) => `- ${c.name}: ${c.description}`).join("\n")}`);
  }
  designParts.push(`The page must feel like a ${kit.stack?.character ? kit.stack.character.toLowerCase() : "premium, confident"} brand. Never generic. Never template-like.`);

  parts.push(`## Design Direction\n${designParts.join("\n\n")}`);

  return parts.join("\n\n");
}
