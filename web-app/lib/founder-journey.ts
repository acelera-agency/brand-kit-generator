import type { StageId } from "./stage-requirements";

export type FounderField = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  rows?: number;
};

export type FounderStageConfig = {
  milestone: string;
  title: string;
  intro: string;
  helper: string;
  fields: FounderField[];
  examples: string[];
};

export const FOUNDER_STAGE_CONFIG: Record<StageId, FounderStageConfig> = {
  stage_0: {
    milestone: "Why this brand now",
    title: "Give the brand a real reason to exist",
    intro:
      "Start with the contradiction: what is broken now, what changed, and why this brand needs to exist now instead of staying an idea.",
    helper:
      "Think in real tensions, not category labels. What became unacceptable enough that you decided to build or rework the brand?",
    fields: [
      {
        key: "before",
        label: "What is the old or broken way?",
        placeholder:
          "Describe the version of the category, offer, or story that no longer works.",
        rows: 3,
      },
      {
        key: "shift",
        label: "What changed?",
        placeholder:
          "What happened in the market, in your company, or in your conviction that made this feel insufficient?",
        rows: 3,
      },
      {
        key: "now",
        label: "Why does this brand have to exist now?",
        placeholder:
          "Write the strongest plain-language reason this brand needs to be real now.",
        rows: 3,
      },
    ],
    examples: [
      "The category optimized for speed, but the result became unowned, shallow work.",
      "We realized we were selling outputs when the customer really needed internal capability.",
      "The old positioning made us easy to compare, but impossible to remember.",
    ],
  },
  stage_1: {
    milestone: "Name the enemy",
    title: "Point at the behavior you want to make extinct",
    intro:
      "This is not a competitor. It is the practice, mindset, or category behavior your brand exists to fight.",
    helper:
      "If the sentence could appear on a competitor comparison page, it is too weak. Make it a belief or behavior.",
    fields: [
      {
        key: "enemy",
        label: "The enemy",
        placeholder:
          "Write one sharp sentence naming the practice or mindset you reject.",
        rows: 3,
      },
      {
        key: "cost",
        label: "How does that enemy hurt the customer?",
        placeholder:
          "Explain the concrete damage this behavior creates for the people you want to serve.",
        rows: 3,
      },
    ],
    examples: [
      "Teams buying AI they will never be able to operate themselves.",
      "Strategy decks that sound expensive but change nothing in the room.",
      "Visual refreshes that make a company prettier but not more specific.",
    ],
  },
  stage_2: {
    milestone: "Lock the core stack",
    title: "Define character, promise, and method",
    intro:
      "These are short working phrases, not slogans. Each one should do a different job.",
    helper:
      "Keep each phrase under 10 words and make sure no two of them sound like the same thought in disguise.",
    fields: [
      {
        key: "character",
        label: "Character",
        placeholder: "Who are you, in a phrase?",
      },
      {
        key: "promise",
        label: "Promise",
        placeholder: "What does the customer leave with?",
      },
      {
        key: "method",
        label: "Method",
        placeholder: "How do you do it differently?",
      },
    ],
    examples: [
      "Character: We tell you when not to.",
      "Promise: A team that can run the system without us.",
      "Method: Sharp constraints before shiny outputs.",
    ],
  },
  stage_3: {
    milestone: "Choose what you refuse",
    title: "Write the anti-positioning that costs you something",
    intro:
      "The fastest way to make the brand real is to define what it will not be, even when money is on the table.",
    helper:
      "Use one line per refusal. Include both the refusal and the cost or consequence of saying no.",
    fields: [
      {
        key: "anti",
        label: "Anti-positioning lines",
        placeholder:
          "One per line. Example: Not the team that sells AI theater | Cost: we will lose buyers who want optics instead of adoption.",
        hint: "Aim for at least 5 lines.",
        rows: 8,
      },
      {
        key: "painful",
        label: "Most painful refusal",
        placeholder:
          "What is the clearest project, deal, or customer you would now reject?",
        rows: 3,
      },
    ],
    examples: [
      "Not the agency that ships the pitch and disappears | Cost: slower sales for buyers who only want a deck.",
      "Not a premium-looking commodity | Cost: fewer leads from broad comparison searches.",
      "Not the partner for low-stakes experimentation | Cost: we will skip curious but non-committed buyers.",
    ],
  },
  stage_4: {
    milestone: "Recognize the right buyer",
    title: "Define your ICP through signals, not demographics",
    intro:
      "This is about what you can hear or notice quickly in a real conversation, not what appears on LinkedIn.",
    helper:
      "Think in observable behaviors, repeated phrases, urgency, internal blockers, or buying readiness.",
    fields: [
      {
        key: "signals",
        label: "Primary fit signals",
        placeholder:
          "One signal per line. Example: They already have enough volume that automation changes margin, not just convenience.",
        hint: "Aim for 4 to 6 signals.",
        rows: 7,
      },
      {
        key: "badfit",
        label: "Bad-fit signals",
        placeholder:
          "What tells you quickly that the buyer is probably not for you?",
        rows: 4,
      },
    ],
    examples: [
      "They already tried a workaround and hate how fragile it is.",
      "They ask about operational ownership, not just features.",
      "They describe repeated internal friction, not a one-off annoyance.",
    ],
  },
  stage_5: {
    milestone: "Make the voice usable",
    title: "Turn the voice into constraints people can actually write with",
    intro:
      "Avoid adjectives. Give the team principles, lines to use, lines to avoid, and clear before/after shifts.",
    helper:
      "Real voice guidance sounds like reusable phrases and writing rules, not like brand workshop wallpaper.",
    fields: [
      {
        key: "principles",
        label: "Voice principles",
        placeholder:
          "One principle per line. Example: Write like the operator is in the room.",
        rows: 4,
      },
      {
        key: "do",
        label: "Phrases we do use",
        placeholder: "One real phrase per line.",
        rows: 5,
      },
      {
        key: "dont",
        label: "Phrases we never use",
        placeholder: "One rejected phrase per line.",
        rows: 5,
      },
      {
        key: "rules",
        label: "Writing rules",
        placeholder:
          "Example: Keep sentences under 22 words. Use verbs before abstractions.",
        rows: 4,
      },
      {
        key: "beforeAfter",
        label: "Before / after examples",
        placeholder:
          "Write one transformation per line. Example: Old: innovation for modern teams -> New: systems your team can run next week.",
        rows: 4,
      },
    ],
    examples: [
      "Do: We will tell you when not to automate.",
      "Don't: Next-generation transformation for modern teams.",
      "Rule: Prefer operating language over visionary language.",
    ],
  },
  stage_6: {
    milestone: "Make it usable tomorrow",
    title: "Write the templates the brand will actually paste into real surfaces",
    intro:
      "The point is not to admire the strategy. It is to leave this step with words you could use today.",
    helper:
      "Write actual copy, not instructions about what the copy should probably do.",
    fields: [
      {
        key: "hero",
        label: "Homepage hero",
        placeholder:
          "Include eyebrow, H1, subhead, and CTA ideas in a compact block.",
        rows: 5,
      },
      {
        key: "outreach",
        label: "Cold outreach",
        placeholder:
          "Include subject lines, body, and sign-off.",
        rows: 6,
      },
      {
        key: "bios",
        label: "Social bios",
        placeholder:
          "Write LinkedIn, X/Twitter, or Instagram versions as plain text.",
        rows: 4,
      },
      {
        key: "meeting",
        label: "First-minute meeting opener",
        placeholder:
          "What does the founder actually say in the first minute of a call?",
        rows: 4,
      },
      {
        key: "signature",
        label: "Email signature",
        placeholder: "Write the final signature block in plain text.",
        rows: 3,
      },
    ],
    examples: [
      "Homepage hero: Say the promise first, then remove the category fluff.",
      "Cold outreach: Write like a peer who understands the operational cost.",
      "Meeting opener: State the enemy before describing the offer.",
    ],
  },
  stage_7: {
    milestone: "Give the designer a real brief",
    title: "Choose a visual direction with enough specificity to execute",
    intro:
      "This is where the brand stops sounding good in text only and becomes something a designer could actually build.",
    helper:
      "Choose one visual world and commit to it. Palette, type, components, forbidden visuals, logo direction.",
    fields: [
      {
        key: "reference",
        label: "Reference world",
        placeholder:
          "What should this feel like? Consultancy report, editorial system, industrial spec sheet, luxury deck, brutalist zine?",
        rows: 3,
      },
      {
        key: "palette",
        label: "Palette and role of each color",
        placeholder:
          "Example: Ink black for body copy, muted stone for surfaces, deep green for trust and action.",
        rows: 4,
      },
      {
        key: "type",
        label: "Typography direction",
        placeholder:
          "Display family, body family, optional mono, and what job each one does.",
        rows: 4,
      },
      {
        key: "components",
        label: "Characteristic components",
        placeholder:
          "List 3 or 4 recurring visual components or motifs.",
        rows: 4,
      },
      {
        key: "forbidden",
        label: "Forbidden visuals",
        placeholder:
          "List the things the brand should never look like.",
        rows: 4,
      },
      {
        key: "logo",
        label: "Logo direction",
        placeholder:
          "What kind of logo behavior or construction fits this brand?",
        rows: 3,
      },
    ],
    examples: [
      "Reference: investor memo meets industrial field guide.",
      "Forbidden: generic AI icons, violet gradients, smiling abstract blobs.",
      "Component: uppercase mono process tags with hard rule borders.",
    ],
  },
  stage_8: {
    milestone: "Make it enforceable",
    title: "Define the rules your team can actually grade against",
    intro:
      "Each surface needs explicit rules plus the reason those rules matter.",
    helper:
      "Write rules per surface. Good rules are specific enough that a reviewer could say yes or no quickly.",
    fields: [
      {
        key: "outreach",
        label: "Outreach rules",
        placeholder:
          "One per line. Example: Rule: Lead with the enemy, not our capability | Reason: it shows the buyer we see the real cost first.",
        rows: 4,
      },
      {
        key: "sales",
        label: "Sales meeting rules",
        placeholder: "One rule and reason per line.",
        rows: 4,
      },
      {
        key: "proposals",
        label: "Proposal rules",
        placeholder: "One rule and reason per line.",
        rows: 4,
      },
      {
        key: "cases",
        label: "Published case-study rules",
        placeholder: "One rule and reason per line.",
        rows: 4,
      },
      {
        key: "visual",
        label: "Visual execution rules",
        placeholder: "One rule and reason per line.",
        rows: 4,
      },
    ],
    examples: [
      "Outreach: Never open with capabilities before naming the operating cost.",
      "Proposals: Refuse decorative copy that could belong to any other firm.",
      "Visual: Every key asset must contain at least one hard working-data cue.",
    ],
  },
};

export function buildFounderStageMessage(
  stageId: StageId,
  values: Record<string, string>,
  freeText: string,
): string {
  const config = FOUNDER_STAGE_CONFIG[stageId];
  const lines = config.fields
    .map((field) => {
      const value = values[field.key]?.trim();
      if (!value) {
        return null;
      }
      return `${field.label}:\n${value}`;
    })
    .filter((value): value is string => Boolean(value));

  if (freeText.trim()) {
    lines.push(`Additional founder notes:\n${freeText.trim()}`);
  }

  return lines.join("\n\n").trim();
}
