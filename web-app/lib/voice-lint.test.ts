import { describe, expect, it } from "vitest";
import type { BrandKit } from "./types";
import { __internals, hashVoiceRules } from "./voice-lint";

const voice: BrandKit["voice"] = {
  principles: ["Lead with operating truth.", "Prefer sharp contrast."],
  do: [
    "Say what gets easier after handoff.",
    "Name the specific behavior we refuse.",
    "Use plain verbs.",
    "State the tradeoff we are willing to make.",
    "Write like an operator.",
  ],
  dont: [
    "Do not hide behind category jargon.",
    "Do not promise transformation without adoption detail.",
    "Do not write fluffy aspirational copy.",
    "Do not use generic SaaS phrases.",
    "Do not invoke synergy or strategic alignment.",
  ],
  writingRules: [
    "Keep most sentences under 18 words.",
    "Prefer verbs over abstract nouns.",
    "Use plain English before imported jargon.",
  ],
  beforeAfter: [
    {
      old: "We unlock innovation at scale.",
      new: "We build AI systems your team can actually run.",
    },
    {
      old: "We deliver digital transformation.",
      new: "We remove the bottleneck between decisions and execution.",
    },
    {
      old: "We create strategic clarity.",
      new: "We show who owns the next move and why.",
    },
  ],
};

describe("hashVoiceRules", () => {
  it("returns a stable 16-char hash for identical voice objects", () => {
    const a = hashVoiceRules(voice);
    const b = hashVoiceRules({ ...voice });
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it("ignores list order when hashing", () => {
    const reordered: BrandKit["voice"] = {
      ...voice,
      principles: [...voice.principles].reverse(),
      do: [...voice.do].reverse(),
    };
    expect(hashVoiceRules(voice)).toBe(hashVoiceRules(reordered));
  });

  it("changes when any voice rule changes", () => {
    const mutated: BrandKit["voice"] = {
      ...voice,
      writingRules: [...voice.writingRules, "Never open with a question."],
    };
    expect(hashVoiceRules(voice)).not.toBe(hashVoiceRules(mutated));
  });
});

describe("voice-lint user prompt", () => {
  it("embeds all voice rule categories and the target snippet", () => {
    const userPrompt = __internals.buildUserPrompt({
      voice,
      target: "We unlock synergy at scale.",
      targetLabel: "Homepage hero",
    });

    expect(userPrompt).toContain("Principles:");
    expect(userPrompt).toContain("Lead with operating truth.");
    expect(userPrompt).toContain("Do (phrases we DO write):");
    expect(userPrompt).toContain("Don't (phrases we refuse to write):");
    expect(userPrompt).toContain("Do not hide behind category jargon.");
    expect(userPrompt).toContain("Writing rules:");
    expect(userPrompt).toContain("Before / after pairs");
    expect(userPrompt).toContain('labelled "Homepage hero"');
    expect(userPrompt).toContain("We unlock synergy at scale.");
  });
});

describe("voice-lint response schema", () => {
  it("accepts a well-formed response", () => {
    const parsed = __internals.ResponseSchema.safeParse({
      violations: [
        {
          kind: "dont-phrase",
          snippet: "We unlock synergy at scale.",
          ruleReference: "Do not invoke synergy or strategic alignment.",
          suggestedRewrite: "We build systems your team can run without us.",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts an empty violations array", () => {
    const parsed = __internals.ResponseSchema.safeParse({ violations: [] });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown violation kinds", () => {
    const parsed = __internals.ResponseSchema.safeParse({
      violations: [
        {
          kind: "made-up-category",
          snippet: "x",
          ruleReference: "y",
          suggestedRewrite: "z",
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("caps at 10 violations", () => {
    const violations = Array.from({ length: 11 }, (_, i) => ({
      kind: "tone-mismatch" as const,
      snippet: `s${i}`,
      ruleReference: `r${i}`,
      suggestedRewrite: `w${i}`,
    }));
    const parsed = __internals.ResponseSchema.safeParse({ violations });
    expect(parsed.success).toBe(false);
  });
});
