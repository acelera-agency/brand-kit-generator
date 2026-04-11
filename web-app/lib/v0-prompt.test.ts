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
    secondary: {
      role: "Startup founder",
      signals: ["Pre-seed or seed stage", "Building first GTM motion"],
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
      ctaVariants: ["Start your kit", "Book a call"],
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
      { name: "paper", hex: "#fafaf8", role: "background", narrative: "Clean canvas for bold ideas" },
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
  it("returns { system, message } with non-empty strings", () => {
    const result = buildV0SitePrompt(completeKit);
    expect(result.system.length).toBeGreaterThan(500);
    expect(result.message.length).toBeGreaterThan(200);
  });

  it("includes the hero headline in the user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Brands built against the grain.");
  });

  it("includes palette hex values in both system and message", () => {
    const { system, message } = buildV0SitePrompt(completeKit);
    expect(system).toContain("#fafaf8");
    expect(system).toContain("#0b0f14");
    expect(message).toContain("#fafaf8");
    expect(message).toContain("#0b0f14");
  });

  it("includes typography families in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("Inter Tight");
    expect(system).toContain("Inter");
  });

  it("includes forbidden visuals in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("No stock photos");
    expect(system).toContain("No gradients");
  });

  it("includes ICP signals in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("we've tried agencies before");
    expect(system).toContain("Startup founder");
  });

  it("includes voice principles in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("Direct");
    expect(system).toContain("Evidence-first");
    expect(system).toContain("No filler");
  });

  it("includes writing rules in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("Max 20 words per sentence");
    expect(system).toContain("No passive voice");
  });

  it("includes voice before/after examples in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("We leverage cutting-edge solutions");
    expect(system).toContain("We ship.");
  });

  it("includes social bios in user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Partner-led brand strategy studio.");
    expect(message).toContain("Brands built against the grain.");
  });

  it("includes email signature in user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Nacho Estevo · Acelera");
  });

  it("includes first minute script in user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Here's what we do.");
  });

  it("includes categorized rules with reasons in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("Never lead with a question");
    expect(system).toContain("Questions feel like a trap");
    expect(system).toContain("No blue");
    expect(system).toContain("Every competitor is blue");
  });

  it("includes color narratives in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("Clean canvas for bold ideas");
  });

  it("includes secondary CTA in user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Book a call");
  });

  it("includes email signature tone in user message", () => {
    const { message } = buildV0SitePrompt(completeKit);
    expect(message).toContain("Nacho Estevo · Acelera");
  });

  it("includes enemy in system", () => {
    const { system } = buildV0SitePrompt(completeKit);
    expect(system).toContain("billable-hour consultancy");
  });

  it("throws if kit is empty (no templates)", () => {
    expect(() => buildV0SitePrompt({} as StoredKitData)).toThrow();
  });

  it("works with minimal kit (only hero)", () => {
    const minimal: StoredKitData = {
      templates: {
        homepageHero: {
          eyebrow: "Test",
          h1: "Test Headline",
          subhead: "Test sub",
          ctaVariants: ["Go"],
        },
      },
    };
    const result = buildV0SitePrompt(minimal);
    expect(result.system.length).toBeGreaterThan(100);
    expect(result.message).toContain("Test Headline");
  });
});
