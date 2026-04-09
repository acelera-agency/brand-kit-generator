/**
 * Single source of truth for what each interview stage needs from the user.
 *
 * Consumed by:
 *  - The chat UI (StageHintCard) — shows `question` + `lookingFor` so the user
 *    knows what kind of answer the stage demands.
 *  - The gate-check route — `gateInstruction` is injected into the extractor
 *    LLM's system prompt to enforce that ONLY substantive user content passes.
 *
 * Phase B Batch 1: requirements vary by `BrandStage` because the questions
 * a founder building from scratch can answer are NOT the same as the
 * questions a founder refining an existing brand can answer. The shape is
 * Record<StageId, Record<BrandStage, StageRequirement>>.
 *
 * Source: lib/prompt.ts (the Brand Kit Generator system prompt) — which is
 * itself sourced from prompt.md at repo root. When prompt.md changes, BOTH
 * this file and lib/prompt.ts must be updated to stay in sync.
 */

import type { BrandStage } from "./types";

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

export type StageRequirement = {
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

const NEW_BRAND_ANTI_FABRICATION = `
- The user is at brand stage NEW. They have NO past clients, NO past copy,
  NO operating history, NO team. Reject any answer that claims fictional past
  experiences ("I had 50 customers", "we wrote that last quarter") and treat
  them as filler. Accept forward-looking commitments and present-tense
  convictions about what the brand WILL be and WILL refuse.`.trim();

export const STAGE_REQUIREMENTS: Record<
  StageId,
  Record<BrandStage, StageRequirement>
> = {
  stage_0: {
    new: {
      question:
        "What's the spark? Why does this brand need to exist, and what's wrong with what's already out there?",
      lookingFor:
        "A 3-sentence narrative on what this brand is built for, what current options get wrong, and why you have to build it now. About 40 to 800 characters.",
      gateInstruction: `Extract a single 'beforeAfter' string (40-800 chars) containing the user's own narrative about why this brand needs to exist. For a NEW brand the narrative is forward-looking: it states the friction with current options and the founder's commitment. The narrative must be substantive — not a question, not filler, not the assistant's words echoed back. If the user has not given a real "why now" answer yet, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "What was your brand 12 months ago, and what changed? Tell me the contradiction in your own words.",
      lookingFor:
        "A 3-sentence before/after narrative — what category you were in, what stopped working, what you do now. About 40 to 800 characters.",
      gateInstruction: `Extract a single 'beforeAfter' string (40-800 chars) containing the user's own narrative about what their brand was vs what it became. The narrative must be substantive — not a question, not filler, not the assistant's words echoed back. If the user has not given a real before/after answer yet, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_1: {
    new: {
      question:
        "What practice in your category do you want to make extinct? Not a competitor — a behavior the whole category gets wrong.",
      lookingFor:
        "An enemy stated as a practice, mindset, or category — not a company name. One sentence, 15-200 characters, no paragraphs.",
      gateInstruction: `Extract a single 'enemy' string (15-200 chars, single sentence, no line breaks) describing a PRACTICE, MINDSET, or CATEGORY the brand opposes. Reject competitor names or company-specific callouts — the enemy must be a behavior, not a company. If the user has only named a competitor, only said "bad service" or "old tech" without specifics, or has not yet committed to one, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "What practice in your industry makes you angry on behalf of customers? Not a competitor — a behavior you want to make extinct.",
      lookingFor:
        "An enemy stated as a practice, mindset, or category — not a company name. One sentence, 15-200 characters, no paragraphs.",
      gateInstruction: `Extract a single 'enemy' string (15-200 chars, single sentence, no line breaks) describing a PRACTICE, MINDSET, or CATEGORY the brand opposes. Reject competitor names or company-specific callouts — the enemy must be a behavior, not a company. If the user has only named a competitor, only said "bad service" or "old tech" without specifics, or has not yet committed to one, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_2: {
    new: {
      question:
        "Commit to three working phrases — Character (who you are), Promise (what the customer leaves with), Method (how you do it). Each must be under 10 words.",
      lookingFor:
        "Three short phrases (3-50 chars each, max 10 words each) — one for character, one for promise, one for method. Each clearly distinct, none collapsed into another.",
      gateInstruction: `Extract a 'stack' object with three string fields: character, promise, method. Each must be the user's own short working phrase, max 10 words and 50 chars. The three must be distinct from each other — if two of them sound the same or the user is collapsing them, return only the ones that are clearly distinct (or {} if none). Reject anything that is just "we care about quality" or vague positioning. If the user has not committed to all three with specific words, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Give me three working phrases — Character (who you are), Promise (what the customer leaves with), Method (how you do it). Each must be under 10 words.",
      lookingFor:
        "Three short phrases (3-50 chars each, max 10 words each) — one for character, one for promise, one for method. Each clearly distinct, none collapsed into another.",
      gateInstruction: `Extract a 'stack' object with three string fields: character, promise, method. Each must be the user's own short working phrase, max 10 words and 50 chars. The three must be distinct from each other — if two of them sound the same or the user is collapsing them, return only the ones that are clearly distinct (or {} if none). Reject anything that is just "we care about quality" or vague positioning. If the user has not committed to all three with specific words, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_3: {
    new: {
      question:
        "Commit to at least 5 things this brand will NOT be — and for each, name what saying no will cost you. Include at least one cost that's painful (a deal you'd refuse, a market you'll skip).",
      lookingFor:
        "An array of 5+ anti-positioning items. Each item has a 'statement' (what you're not) and a 'cost' (what refusing it will cost). At least one cost must be concrete (revenue, deals, market segments).",
      gateInstruction: `Extract an 'antiPositioning' array with at least 5 items, each with 'statement' and 'cost' fields. Both fields must be the user's own words — never invent statements or costs to reach the minimum. If the user provided fewer than 5 real items, return only the ones they actually stated. Reject hedged answers ("we're not really…") and generic ones ("we're not a generic agency"). For a NEW brand the costs are forward-looking ("we'd refuse this kind of project") rather than retrospective. At least one cost must be concrete. If the user has not committed to any real anti-positioning items, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "List at least 5 things your brand is NOT — and for each, what it costs you to refuse it. Include at least one that costs you real money.",
      lookingFor:
        "An array of 5+ anti-positioning items. Each item has a 'statement' (what you're not) and a 'cost' (what refusing it costs you). At least one cost must be concrete (revenue, deals, scope).",
      gateInstruction: `Extract an 'antiPositioning' array with at least 5 items, each with 'statement' and 'cost' fields. Both fields must be the user's own words — never invent statements or costs to reach the minimum. If the user provided fewer than 5 real items, return only the ones they actually stated (the local validation will flag the count). Reject hedged answers ("we're not really…") and generic ones ("we're not a generic agency"). At least one cost must be concrete (deals, revenue, projects refused). If the user has not committed to any real anti-positioning items, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_4: {
    new: {
      question:
        "Forget job titles. What 4-6 behaviors would tell you, in the first 10 minutes of a conversation, that someone is your ideal customer? Things you can verify by listening, not by checking LinkedIn.",
      lookingFor:
        "An ICP defined by 4-6 primary behavioral signals (NOT demographics or job titles). Optionally a secondary ICP with a different role and its own signals.",
      gateInstruction: `Extract an 'icp' object with a 'primary' object containing a 'signals' array (4-6 strings, each a behavioral signal the user actually described). Optionally include a 'secondary' object with 'role' and 'signals' fields if the user explicitly named a secondary ICP. Reject demographic-only answers ("mid-market SaaS, 50-200 employees") — those are not signals. Each signal must be a behavior the user said is observable in a first conversation. For NEW brands the user is committing to who they WILL serve, not describing who they HAVE served. If the user has not provided real signals, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Forget job titles. What 4-6 behavioral signals tell you a customer is a fit? Things you can verify in the first 10 minutes of a discovery call.",
      lookingFor:
        "An ICP defined by 4-6 primary behavioral signals (NOT demographics or job titles). Optionally a secondary ICP with a different role and its own signals.",
      gateInstruction: `Extract an 'icp' object with a 'primary' object containing a 'signals' array (4-6 strings, each a behavioral signal the user actually described). Optionally include a 'secondary' object with 'role' and 'signals' fields if the user explicitly named a secondary ICP. Reject demographic-only answers ("mid-market SaaS, 50-200 employees") — those are not signals. Each signal must be a behavior the user said is observable in a first call. If the user has not provided real signals, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_5: {
    new: {
      question:
        "Name 3 brands whose copy you envy and 3 you actively dislike — then define how YOUR voice will work as constraints (principles, real do/don't phrases, writing rules, before/after pairs).",
      lookingFor:
        "A complete voice definition: principles list, do list (6+ real phrases), don't list (6+ real phrases), writing rules, and before/after pairs comparing the voice you reject to the one you commit to.",
      gateInstruction: `Extract a 'voice' object with five fields: principles (string array), do (string array — real phrases the brand WILL write, not categories), dont (string array — real phrases the brand will refuse), writingRules (string array, e.g. sentence length / verb usage), and beforeAfter (array of {old, new} pairs). For a NEW brand, the "old" side of beforeAfter pairs can be a generic-category line the founder rejects, and the "new" side is the brand's committed voice. Every item must be the user's own words. Reject adjective-only voice descriptions ("friendly but professional") — those are not constraints. If the user has not defined the voice with real phrases, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Define the brand voice as constraints a stranger could write in: principles, do/dont phrases (real lines, not categories), writing rules, and before/after pairs from copy your team has actually written.",
      lookingFor:
        "A complete voice definition: principles list, do list (6+ real phrases), don't list (6+ real phrases), writing rules, and before/after pairs comparing old voice to new.",
      gateInstruction: `Extract a 'voice' object with five fields: principles (string array), do (string array, the things to write — real phrases not categories), dont (string array, the things to avoid), writingRules (string array, e.g. sentence length / verb usage), and beforeAfter (array of {old, new} pairs). Every item must be the user's own words. Reject adjective-only voice descriptions ("friendly but professional") — those are not constraints. If the user has not defined the voice with real phrases the user could write in, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_6: {
    new: {
      question:
        "Write the templates this brand will paste into actual surfaces from day one: hero, cold outreach, social bios, first-minute-of-meeting, email signature. Each must use the working phrases you committed to in earlier stages.",
      lookingFor:
        "A complete templates object with homepageHero, coldOutreach, socialBios (linkedin/twitter/instagram), firstMinute (script + word count), and emailSignature. Each populated with real phrases the brand will use, not lorem.",
      gateInstruction: `Extract a 'templates' object with all five sub-templates: homepageHero (eyebrow + h1 + subhead + ctaVariants), coldOutreach (subjects array + body + signOff), socialBios (linkedin + twitter + instagram), firstMinute (script + wordCount), emailSignature. Each must be the user's own composition using real brand phrases — never lorem, never placeholder text. If the user has only described some templates abstractly without writing them out, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Generate the templates the brand will actually paste into surfaces: hero, cold outreach, social bios, first-minute-of-meeting, email signature. Each must use real phrases from earlier stages.",
      lookingFor:
        "A complete templates object with homepageHero, coldOutreach, socialBios (linkedin/twitter/instagram), firstMinute (script + word count), and emailSignature. Each populated with real phrases the brand will use, not lorem.",
      gateInstruction: `Extract a 'templates' object with all five sub-templates: homepageHero (eyebrow + h1 + subhead + ctaVariants), coldOutreach (subjects array + body + signOff), socialBios (linkedin + twitter + instagram), firstMinute (script + wordCount), emailSignature. Each must be the user's own composition using real brand phrases — never lorem, never placeholder text. If the user has only described some templates abstractly without writing them out, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_7: {
    new: {
      question:
        "Pick one visual reference (consultancy report / maximalist editorial / brutalist zine / luxury fashion / industrial spec sheet) and define palette, typography, characteristic components, forbidden visuals, and logo direction.",
      lookingFor:
        "A complete visual direction: 1-7 palette colors with role enums, typography (display + body + optional mono), 3-4 characteristic components, 6+ forbidden visuals, and a logo direction concept.",
      gateInstruction: `Extract a 'visual' object with palette (array of {name, hex, role}), typography (display, body, optional mono, each with family, weights, source), characteristicComponents (array of {name, description}), forbiddenVisuals (string array), and logoDirection (string). The user must have committed to a specific reference style (not "modern" or "clean"), specific colors (with hex if given), specific font families. Reject vague answers. If the user has not committed to a visual direction with real specifics, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Pick one visual reference (consultancy report / maximalist editorial / brutalist zine / luxury fashion / industrial spec sheet) and define palette, typography, characteristic components, forbidden visuals, and logo direction.",
      lookingFor:
        "A complete visual direction: 1-7 palette colors with role enums, typography (display + body + optional mono), 3-4 characteristic components, 6+ forbidden visuals, and a logo direction concept.",
      gateInstruction: `Extract a 'visual' object with palette (array of {name, hex, role}), typography (display, body, optional mono, each with family, weights, source), characteristicComponents (array of {name, description}), forbiddenVisuals (string array), and logoDirection (string). The user must have committed to a specific reference style (not "modern" or "clean"), specific colors (with hex if given), specific font families. Reject vague answers. If the user has not committed to a visual direction with real specifics, return an empty object {}.

${COMMON_RULES}`,
    },
  },

  stage_8: {
    new: {
      question:
        "Define non-negotiable rules per surface: outreach, sales meetings, proposals, published cases, and visual pieces. 3-5 rules each, with a one-line reason for each. At least one rule per surface must reference the enemy from Stage 1.",
      lookingFor:
        "A rules object with five surfaces (outreach, salesMeeting, proposals, cases, visual), each containing 3-5 rules. Each rule has a 'rule' string and a 'reason' string explaining why breaking it would degrade the brand.",
      gateInstruction: `Extract a 'rules' object with five surface arrays: outreach, salesMeeting, proposals, cases, visual. Each surface should have 3-5 items with 'rule' and 'reason' fields. Both fields must be the user's own words. Reject generic rules that could apply to any brand ("be authentic"). If the user provided fewer than 3 rules for a surface, return only what they said. If the user has not provided any real per-surface rules, return an empty object {}.

${NEW_BRAND_ANTI_FABRICATION}

${COMMON_RULES}`,
    },
    existing: {
      question:
        "Define non-negotiable rules per surface: outreach, sales meetings, proposals, published cases, and visual pieces. 3-5 rules each, with a one-line reason for each. At least one rule per surface must reference the enemy from Stage 1.",
      lookingFor:
        "A rules object with five surfaces (outreach, salesMeeting, proposals, cases, visual), each containing 3-5 rules. Each rule has a 'rule' string and a 'reason' string explaining why breaking it degrades the brand.",
      gateInstruction: `Extract a 'rules' object with five surface arrays: outreach, salesMeeting, proposals, cases, visual. Each surface should have 3-5 items with 'rule' and 'reason' fields. Both fields must be the user's own words. Reject generic rules that could apply to any brand ("be authentic"). If the user provided fewer than 3 rules for a surface, return only what they said. If the user has not provided any real per-surface rules, return an empty object {}.

${COMMON_RULES}`,
    },
  },
};

/**
 * Resolve the requirement for a specific (stage, brand_stage) combination.
 * Use this everywhere instead of indexing STAGE_REQUIREMENTS directly so the
 * type system enforces that callers know which brand stage they're in.
 */
export function getStageRequirement(
  stageId: StageId,
  brandStage: BrandStage,
): StageRequirement {
  return STAGE_REQUIREMENTS[stageId][brandStage];
}
