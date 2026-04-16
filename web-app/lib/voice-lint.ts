import { createHash } from "node:crypto";
import { z } from "zod";
import { getOpenAI, MODEL_CHEAP } from "./openai";
import type {
  BrandKit,
  VoiceLintSectionResult,
  VoiceLintViolation,
} from "./types";

const ViolationSchema = z.object({
  kind: z.enum(["dont-phrase", "word-count", "tone-mismatch", "register-mismatch"]),
  snippet: z.string().min(1).max(400),
  ruleReference: z.string().min(1).max(200),
  suggestedRewrite: z.string().min(1).max(600),
});

const ResponseSchema = z.object({
  violations: z.array(ViolationSchema).max(10),
});

export function hashVoiceRules(voice: BrandKit["voice"]): string {
  const normalized = {
    principles: [...voice.principles].sort(),
    do: [...voice.do].sort(),
    dont: [...voice.dont].sort(),
    writingRules: [...voice.writingRules].sort(),
    beforeAfter: [...voice.beforeAfter]
      .map((p) => ({ old: p.old, new: p.new }))
      .sort((a, b) => a.old.localeCompare(b.old)),
  };
  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .slice(0, 16);
}

const SYSTEM_PROMPT = `You are a voice-consistency linter for a brand kit. You are given:
- A set of voice rules the brand committed to (principles, do list, dont list, writing rules, before/after pairs).
- A target piece of copy from the same brand kit (context narrative, template body, bio, script, etc.).

Your job: find specific places where the target copy violates the voice rules. For each violation:
- kind: one of "dont-phrase" (uses a banned phrase from the don't list), "word-count" (sentence exceeds a stated length limit), "tone-mismatch" (clashes with stated principles or the "new" side of before/after pairs), "register-mismatch" (wrong formality, locale, or register).
- snippet: quote the exact phrase from the target (max 400 chars).
- ruleReference: quote or paraphrase the specific rule it violates.
- suggestedRewrite: a concrete replacement that would pass the rule. Keep the original intent.

Hard rules:
- Only report real violations. Do not invent rules. Do not flag copy that is merely "could be better".
- Max 10 violations. Prioritize the most obvious and the most damaging to brand voice.
- If the copy is clean, return { "violations": [] }.
- Respond ONLY with strict JSON matching the schema: { "violations": [ { "kind": "...", "snippet": "...", "ruleReference": "...", "suggestedRewrite": "..." } ] }.`;

function buildUserPrompt(args: {
  voice: BrandKit["voice"];
  target: string;
  targetLabel: string;
}): string {
  const { voice, target, targetLabel } = args;
  return `Voice rules:

Principles:
${voice.principles.map((p) => `- ${p}`).join("\n")}

Do (phrases we DO write):
${voice.do.map((p) => `- ${p}`).join("\n")}

Don't (phrases we refuse to write):
${voice.dont.map((p) => `- ${p}`).join("\n")}

Writing rules:
${voice.writingRules.map((p) => `- ${p}`).join("\n")}

Before / after pairs (OLD is the voice we reject, NEW is what we commit to):
${voice.beforeAfter.map((p) => `- OLD: ${p.old}\n  NEW: ${p.new}`).join("\n")}

Target copy — labelled "${targetLabel}":
---
${target}
---

Return JSON: { "violations": [...] }`;
}

export async function lintAgainstVoice(args: {
  target: string;
  targetLabel: string;
  voice: BrandKit["voice"];
}): Promise<VoiceLintSectionResult> {
  const { target, targetLabel, voice } = args;

  if (!target || target.trim().length === 0) {
    return { target: targetLabel, violations: [] };
  }

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: MODEL_CHEAP,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt({ voice, target, targetLabel }) },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let violations: VoiceLintViolation[] = [];
  try {
    const raw: unknown = JSON.parse(content);
    const validated = ResponseSchema.safeParse(raw);
    if (validated.success) {
      violations = validated.data.violations;
    }
  } catch {
    // Swallow — treat as clean rather than fail the whole review.
  }

  return { target: targetLabel, violations };
}

// Exported for unit tests that want to inspect the prompt shape without hitting OpenAI.
export const __internals = { SYSTEM_PROMPT, buildUserPrompt, ResponseSchema };
