import { describe, it, expect } from "vitest";
import { buildV0SitePrompt } from "./v0-prompt";
import type { StoredKitData } from "./types";

const completeKit: StoredKitData = {
  beforeAfter: "We started as a small consultancy. We tried to scale by hiring. Then we realized our edge was the partner-led model.",
  enemy: "The billable-hour consultancy that optimizes for headcount, not outcomes.",
  stack: {
    character: "Partner-led precision",
    promise: "Decisions you can ship",
    method: "Founder on every engagement",
  },
  antiPositioning: [
    { statement: "We are not a staffing firm.", cost: "We refuse 80% of inbound leads that want bodies, not strategy." },
    { statement: "We don't do retainers.", cost: "We lose predictable MRR and must earn every project." },
    { statement: "We don't pitch.", cost: "We walk away from RFP processes that reward slides over proof." },
  ],
  icp: {
    primary: {
      signals: [
        "They say 'we've tried agencies before and it didn't stick'",
        "They have a clear revenue number but no clear positioning",
      ],
    },
  },
  voice: {
    principles: ["Direct", "Evidence-first", "No filler"],
    do: ["Use short sentences", "Lead with the number"],
    dont: ["Don't use 'leverage' as a verb", "Don't hedge"],
    writingRules: ["Max 20 words per sentence", "No passive voice"],
    beforeAfter: [{ old: "We leverage cutting-edge solutions", new: "We ship." }],
  },
  templates: {
    homepageHero: {
      eyebrow: "Strategy studio",
      h1: "Brands built against the grain.",
      subhead: "We help founders who refuse to blend in build the brand their market remembers.",
      ctaVariants: ["Start your kit"],
    },
    coldOutreach: {
      subjects: ["Quick question about [brand]"],
      body: "Hi — I saw what you're building.",
      signOff: "—Nacho",
    },
    socialBios: {
      linkedin: "Partner-led brand strategy studio.",
      twitter: "Brands built against the grain.",
      instagram: "Strategy studio for founders who refuse to blend in.",
    },
    firstMinute: { script: "Here's what we do.", wordCount: 150 },
    emailSignature: "Nacho Estevo · Acelera",
  },
  visual: {
    palette: [
      { name: "paper", hex: "#fafaf8", role: "background" },
      { name: "ink", hex: "#0b0f14", role: "primary" },
      { name: "accent", hex: "#0a6e3a", role: "accent" },
    ],
    typography: {
      display: { family: "Inter Tight", weights: [400, 500, 600, 700], source: "google" },
      body: { family: "Inter", weights: [400, 500], source: "google" },
    },
    characteristicComponents: [
      { name: "Split-tone hero", description: "Left text, right visual" },
    ],
    forbiddenVisuals: ["No stock photos", "No gradients", "No rounded buttons"],
    logoDirection: "A monogram in ink on paper, nothing decorative.",
  },
  rules: {
    outreach: [{ rule: "Never lead with a question.", reason: "Questions feel like a trap." }],
    salesMeeting: [{ rule: "Show the kit in the first 60 seconds.", reason: "Proof beats pitch." }],
    proposals: [{ rule: "No PDF over 5 pages.", reason: "Attention span." }],
    cases: [{ rule: "Lead with the number.", reason: "Numbers are the hook." }],
    visual: [{ rule: "No blue.", reason: "Every competitor is blue." }],
  },
};

describe("buildV0SitePrompt", () => {
  it("produces a non-empty prompt from a complete kit", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("includes the hero headline", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("Brands built against the grain.");
  });

  it("includes palette hex values", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("#fafaf8");
    expect(prompt).toContain("#0b0f14");
  });

  it("includes typography families", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("Inter Tight");
    expect(prompt).toContain("Inter");
  });

  it("includes forbidden visuals", () => {
    const prompt = buildV0SitePrompt(completeKit);
    expect(prompt).toContain("No stock photos");
  });

  it("throws if kit is empty (no templates)", () => {
    expect(() => buildV0SitePrompt({} as StoredKitData)).toThrow();
  });
});
