import type { StoredKitData } from "./types";

export function buildV0SitePrompt(kit: StoredKitData): string {
  if (!kit.templates?.homepageHero) {
    throw new Error("Kit must have at least templates.homepageHero to generate a site.");
  }

  const hero = kit.templates.homepageHero;
  const palette = kit.visual?.palette ?? [];
  const typography = kit.visual?.typography;
  const forbidden = kit.visual?.forbiddenVisuals ?? [];
  const stackLines = kit.stack
    ? `Character: ${kit.stack.character}\nPromise: ${kit.stack.promise}\nMethod: ${kit.stack.method}`
    : "";
  const antiPosLines = kit.antiPositioning
    ?.map((a) => `- NOT: ${a.statement} (cost: ${a.cost})`)
    .join("\n") ?? "";
  const paletteLines = palette
    .map((p) => `- ${p.name}: ${p.hex} (role: ${p.role})`)
    .join("\n");
  const doLines = kit.voice?.do?.map((d) => `- ✓ ${d}`).join("\n") ?? "";
  const dontLines = kit.voice?.dont?.map((d) => `- ✗ ${d}`).join("\n") ?? "";
  const forbiddenLines = forbidden.map((f) => `- ${f}`).join("\n");
  const rulesLines = Object.entries(kit.rules ?? {})
    .flatMap(([, rules]) => (rules as Array<{ rule: string; reason: string }>).map((r) => `- ${r.rule}`))
    .join("\n");

  const displayFont = typography?.display?.family ?? "Inter";
  const bodyFont = typography?.body?.family ?? "Inter";
  const displayWeights = typography?.display?.weights ?? [400, 600];
  const bodyWeights = typography?.body?.weights ?? [400, 500];

  return `Build a single-page landing site for a brand using Next.js + Tailwind CSS. The site must be a complete, deployable Next.js app with App Router.

## Brand Identity

${kit.enemy ? `### Enemy\nThis brand exists to destroy: ${kit.enemy}\n` : ""}
${stackLines ? `### Brand Stack\n${stackLines}\n` : ""}
${antiPosLines ? `### Anti-positioning\n${antiPosLines}\n` : ""}

### Hero Section
- Eyebrow: ${hero.eyebrow}
- Headline (h1): ${hero.h1}
- Subheadline: ${hero.subhead}
- Primary CTA: ${hero.ctaVariants?.[0] ?? "Get started"}

${kit.beforeAfter ? `### Brand Story\n${kit.beforeAfter}\n` : ""}

## Visual Design

### Color Palette
${paletteLines}

### Typography
- Display font: ${displayFont} (weights: ${displayWeights.join(", ")})
- Body font: ${bodyFont} (weights: ${bodyWeights.join(", ")})
${typography?.mono ? `- Mono font: ${typography.mono.family}\n` : ""}

### Characteristic Components
${kit.visual?.characteristicComponents?.map((c) => `- ${c.name}: ${c.description}`).join("\n") ?? "None specified."}

### Logo Direction
${kit.visual?.logoDirection ?? "No direction specified."}

## Content Rules

### Voice — Do
${doLines}

### Voice — Don't
${dontLines}

### Forbidden Visuals
${forbiddenLines}

### Non-negotiable Rules
${rulesLines}

## Technical Requirements

- Use Google Fonts for ${displayFont} and ${bodyFont}
- Use the exact hex colors from the palette above as Tailwind custom colors
- Mobile-first responsive design
- Minimal animations — subtle, not distracting
- Include a footer with basic info
- The page should feel like a premium consultancy site, not a startup template
- No placeholder content — use the brand data above for all copy
- Import fonts via next/font/google

## Pages to Generate

Create a single \`app/page.tsx\` that serves as the complete landing page with these sections:
1. Hero (with headline, subheadline, CTA)
2. Brand story / about section
3. A section that illustrates the anti-positioning (what they're NOT)
4. Contact / CTA section
5. Minimal footer

Also generate \`app/layout.tsx\`, \`tailwind.config.ts\`, \`package.json\`, \`next.config.ts\`, \`app/globals.css\`, and \`tsconfig.json\`.

Produce a complete, working Next.js app. Do not use any external UI libraries — only Tailwind CSS.`;
}
