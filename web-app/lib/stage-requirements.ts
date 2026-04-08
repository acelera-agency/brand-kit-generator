/**
 * Single source of truth for what each interview stage needs from the user.
 *
 * Consumed by:
 *  - The chat UI (StageHintCard) — shows `question` + `lookingFor` so the user
 *    knows what kind of answer the stage demands.
 *  - The gate-check route — `gateInstruction` is injected into the extractor
 *    LLM's system prompt to enforce that ONLY substantive user content passes.
 *
 * Source: prompt.md (the Brand Kit Generator system prompt). When prompt.md
 * changes, this file must be updated to stay in sync.
 */

export type StageId =
  | "stage_0"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "stage_5"
  | "stage_6"
  | "stage_7"
  | "stage_8";

export const STAGE_ORDER: readonly StageId[] = [
  "stage_0",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
  "stage_5",
  "stage_6",
  "stage_7",
  "stage_8",
] as const;

export const STAGE_LABELS: Record<StageId, string> = {
  stage_0: "Context & contradiction",
  stage_1: "Enemy",
  stage_2: "Three-layer stack",
  stage_3: "Anti-positioning",
  stage_4: "ICP signals",
  stage_5: "Voice constraints",
  stage_6: "Application templates",
  stage_7: "Visual direction",
  stage_8: "Non-negotiable rules",
};

type StageRequirement = {
  /** Headline question shown to the user in the hint card. */
  question: string;
  /** Short description of what makes this stage pass. User-facing. */
  lookingFor: string;
  /** Instruction injected into the gate-check LLM's system prompt. */
  gateInstruction: string;
};

const COMMON_RULES = `
- Only consider the user's replies. Never extract content from the assistant's
  questions or examples.
- If the user echoed back the assistant's question or said something filler
  ("ok", "claro", "let's start"), return an empty object {}.
- Never invent items to reach a minimum count. If the user gave fewer than the
  minimum, return only what they actually said and let validation flag it.
- If there are conflicting answers across multiple user messages, use the most
  recent one.
- Match the user's language (Spanish or English). Do not translate.`.trim();

export const STAGE_REQUIREMENTS: Record<StageId, StageRequirement> = {
  stage_0: {
    question:
      "What was your brand 12 months ago, and what changed? Tell me the contradiction in your own words.",
    lookingFor:
      "A 3-sentence before/after narrative — what category you were in, what stopped working, what you do now. About 40 to 800 characters.",
    gateInstruction: `Extract a single 'beforeAfter' string (40-800 chars) containing the user's own narrative about what their brand was vs what it became. The narrative must be substantive — not a question, not filler, not the assistant's words echoed back. If the user has not given a real before/after answer yet, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_1: {
    question:
      "What practice or mindset does your brand exist to oppose? Not a competitor — a behavior you want to make extinct.",
    lookingFor:
      "An enemy stated as a practice, mindset, or category — not a company name. One sentence, 15-200 characters, no paragraphs.",
    gateInstruction: `Extract a single 'enemy' string (15-200 chars, single sentence, no line breaks) describing a PRACTICE, MINDSET, or CATEGORY the brand opposes. Reject competitor names or company-specific callouts — the enemy must be a behavior, not a company. If the user has only named a competitor, only said "bad service" or "old tech" without specifics, or has not yet committed to one, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_2: {
    question:
      "Give me three working phrases — Character (who you are), Promise (what the customer leaves with), Method (how you do it). Each must be under 10 words.",
    lookingFor:
      "Three short phrases (3-50 chars each, max 10 words each) — one for character, one for promise, one for method. Each clearly distinct, none collapsed into another.",
    gateInstruction: `Extract a 'stack' object with three string fields: character, promise, method. Each must be the user's own short working phrase, max 10 words and 50 chars. The three must be distinct from each other — if two of them sound the same or the user is collapsing them, return only the ones that are clearly distinct (or {} if none). Reject anything that is just "we care about quality" or vague positioning. If the user has not committed to all three with specific words, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_3: {
    question:
      "List at least 5 things your brand is NOT — and for each, what it costs you to refuse it. Include at least one that costs you real money.",
    lookingFor:
      "An array of 5+ anti-positioning items. Each item has a 'statement' (what you're not) and a 'cost' (what refusing it costs you). At least one cost must be concrete (revenue, deals, scope).",
    gateInstruction: `Extract an 'antiPositioning' array with at least 5 items, each with 'statement' and 'cost' fields. Both fields must be the user's own words — never invent statements or costs to reach the minimum. If the user provided fewer than 5 real items, return only the ones they actually stated (the local validation will flag the count). Reject hedged answers ("we're not really…") and generic ones ("we're not a generic agency"). At least one cost must be concrete (deals, revenue, projects refused). If the user has not committed to any real anti-positioning items, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_4: {
    question:
      "Forget job titles. What 4-6 behavioral signals tell you a customer is a fit? Things you can verify in the first 10 minutes of a discovery call.",
    lookingFor:
      "An ICP defined by 4-6 primary behavioral signals (NOT demographics or job titles). Optionally a secondary ICP with a different role and its own signals.",
    gateInstruction: `Extract an 'icp' object with a 'primary' object containing a 'signals' array (4-6 strings, each a behavioral signal the user actually described). Optionally include a 'secondary' object with 'role' and 'signals' fields if the user explicitly named a secondary ICP. Reject demographic-only answers ("mid-market SaaS, 50-200 employees") — those are not signals. Each signal must be a behavior the user said is observable in a first call. If the user has not provided real signals, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_5: {
    question:
      "Define the brand voice as constraints a stranger could write in: principles, do/dont phrases (real lines, not categories), writing rules, and before/after pairs.",
    lookingFor:
      "A complete voice definition: principles list, do list (6+ real phrases), don't list (6+ real phrases), writing rules, and before/after pairs comparing old voice to new.",
    gateInstruction: `Extract a 'voice' object with five fields: principles (string array), do (string array, the things to write — real phrases not categories), dont (string array, the things to avoid), writingRules (string array, e.g. sentence length / verb usage), and beforeAfter (array of {old, new} pairs). Every item must be the user's own words. Reject adjective-only voice descriptions ("friendly but professional") — those are not constraints. If the user has not defined the voice with real phrases the user could write in, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_6: {
    question:
      "Generate the templates the brand will actually paste into surfaces: hero, cold outreach, social bios, first-minute-of-meeting, email signature. Each must use real phrases from earlier stages.",
    lookingFor:
      "A complete templates object with homepageHero, coldOutreach, socialBios (linkedin/twitter/instagram), firstMinute (script + word count), and emailSignature. Each populated with real phrases the brand will use, not lorem.",
    gateInstruction: `Extract a 'templates' object with all five sub-templates: homepageHero (eyebrow + h1 + subhead + ctaVariants), coldOutreach (subjects array + body + signOff), socialBios (linkedin + twitter + instagram), firstMinute (script + wordCount), emailSignature. Each must be the user's own composition using real brand phrases — never lorem, never placeholder text. If the user has only described some templates abstractly without writing them out, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_7: {
    question:
      "Pick one visual reference (consultancy report / maximalist editorial / brutalist zine / luxury fashion / industrial spec sheet) and define palette, typography, characteristic components, forbidden visuals, and logo direction.",
    lookingFor:
      "A complete visual direction: 1-7 palette colors with role enums, typography (display + body + optional mono), 3-4 characteristic components, 6+ forbidden visuals, and a logo direction concept.",
    gateInstruction: `Extract a 'visual' object with palette (array of {name, hex, role}), typography (display, body, optional mono, each with family, weights, source), characteristicComponents (array of {name, description}), forbiddenVisuals (string array), and logoDirection (string). The user must have committed to a specific reference style (not "modern" or "clean"), specific colors (with hex if given), specific font families. Reject vague answers. If the user has not committed to a visual direction with real specifics, return an empty object {}.

${COMMON_RULES}`,
  },

  stage_8: {
    question:
      "Define non-negotiable rules per surface: outreach, sales meetings, proposals, published cases, and visual pieces. 3-5 rules each, with a one-line reason for each. At least one rule per surface must reference the enemy from Stage 1.",
    lookingFor:
      "A rules object with five surfaces (outreach, salesMeeting, proposals, cases, visual), each containing 3-5 rules. Each rule has a 'rule' string and a 'reason' string explaining why breaking it degrades the brand.",
    gateInstruction: `Extract a 'rules' object with five surface arrays: outreach, salesMeeting, proposals, cases, visual. Each surface should have 3-5 items with 'rule' and 'reason' fields. Both fields must be the user's own words. Reject generic rules that could apply to any brand ("be authentic"). If the user provided fewer than 3 rules for a surface, return only what they said. If the user has not provided any real per-surface rules, return an empty object {}.

${COMMON_RULES}`,
  },
};
