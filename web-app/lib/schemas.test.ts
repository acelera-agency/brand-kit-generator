import { describe, expect, it } from "vitest";
import { BrandKitSchema, Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema, Stage4Schema, Stage5Schema, Stage6Schema, Stage7Schema, Stage8Schema } from "./schemas";

describe("Stage0Schema", () => {
  it("accepts a valid 3-sentence beforeAfter narrative", () => {
    const result = Stage0Schema.safeParse({
      beforeAfter:
        "We started as a small consultancy. We tried to scale by hiring. Then we realized our edge was the partner-led model.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty beforeAfter", () => {
    const result = Stage0Schema.safeParse({ beforeAfter: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a beforeAfter that is too short", () => {
    const result = Stage0Schema.safeParse({ beforeAfter: "Short." });

    expect(result.success).toBe(false);
  });
});

describe("Stage1Schema", () => {
  it("accepts a sharp single-sentence enemy", () => {
    const result = Stage1Schema.safeParse({
      enemy: "We exist because too many agencies sell strategy nobody can operate.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty enemy", () => {
    const result = Stage1Schema.safeParse({ enemy: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a multi-paragraph enemy", () => {
    const result = Stage1Schema.safeParse({
      enemy:
        "We exist because too many AI vendors create dependency instead of capability.\n\nThat second paragraph turns the enemy into a mini-essay.",
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage2Schema", () => {
  it("accepts three short working phrases", () => {
    const result = Stage2Schema.safeParse({
      stack: {
        character: "Operator-led strategy",
        promise: "Capability your team can keep",
        method: "Partner-built systems",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a phrase longer than 10 words", () => {
    const result = Stage2Schema.safeParse({
      stack: {
        character: "Operator-led strategy that keeps stretching beyond the allowed word count",
        promise: "Capability your team can keep",
        method: "Partner-built systems",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty fields", () => {
    const result = Stage2Schema.safeParse({
      stack: {
        character: "",
        promise: "Capability your team can keep",
        method: "Partner-built systems",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage3Schema", () => {
  it("accepts 5 valid anti-positioning statements", () => {
    const result = Stage3Schema.safeParse({
      antiPositioning: [
        { statement: "We are not an outsourced content mill.", cost: "It turns away volume retainers." },
        { statement: "We are not a dashboard-deck agency.", cost: "It narrows the pipeline to operator-led buyers." },
        { statement: "We are not a strategy PDF factory.", cost: "It forces deeper delivery involvement from partners." },
        { statement: "We are not a cheap pilot shop.", cost: "It disqualifies buyers who only want experimentation theater." },
        { statement: "We are not a ghost team behind your AI.", cost: "It means some clients will choose easier vendor lock-in." },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects only 4 items", () => {
    const result = Stage3Schema.safeParse({
      antiPositioning: [
        { statement: "We are not an outsourced content mill.", cost: "It turns away volume retainers." },
        { statement: "We are not a dashboard-deck agency.", cost: "It narrows the pipeline to operator-led buyers." },
        { statement: "We are not a strategy PDF factory.", cost: "It forces deeper delivery involvement from partners." },
        { statement: "We are not a cheap pilot shop.", cost: "It disqualifies buyers who only want experimentation theater." },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects items without a cost", () => {
    const result = Stage3Schema.safeParse({
      antiPositioning: [
        { statement: "We are not an outsourced content mill.", cost: "It turns away volume retainers." },
        { statement: "We are not a dashboard-deck agency.", cost: "It narrows the pipeline to operator-led buyers." },
        { statement: "We are not a strategy PDF factory.", cost: "It forces deeper delivery involvement from partners." },
        { statement: "We are not a cheap pilot shop.", cost: "It disqualifies buyers who only want experimentation theater." },
        { statement: "We are not a ghost team behind your AI.", cost: "" },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage4Schema", () => {
  it("accepts 4 qualifying signals", () => {
    const result = Stage4Schema.safeParse({
      icp: {
        primary: {
          signals: [
            "They own a messy handoff between sales and delivery.",
            "They can name the internal metric they need to shrink.",
            "They ask how the team will keep the system after launch.",
            "They have already tried tooling without changing behavior.",
          ],
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects only 3 primary signals", () => {
    const result = Stage4Schema.safeParse({
      icp: {
        primary: {
          signals: [
            "They own a messy handoff between sales and delivery.",
            "They can name the internal metric they need to shrink.",
            "They ask how the team will keep the system after launch.",
          ],
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts an optional secondary ICP", () => {
    const result = Stage4Schema.safeParse({
      icp: {
        primary: {
          signals: [
            "They own a messy handoff between sales and delivery.",
            "They can name the internal metric they need to shrink.",
            "They ask how the team will keep the system after launch.",
            "They have already tried tooling without changing behavior.",
          ],
        },
        secondary: {
          role: "Head of Revenue Operations",
          signals: [
            "They care about proof the process survives after the vendor leaves.",
            "They ask for examples of internal adoption, not just deployment.",
          ],
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty signals", () => {
    const result = Stage4Schema.safeParse({
      icp: {
        primary: {
          signals: [
            "",
            "They can name the internal metric they need to shrink.",
            "They ask how the team will keep the system after launch.",
            "They have already tried tooling without changing behavior.",
          ],
        },
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage5Schema", () => {
  const validVoice = {
    voice: {
      principles: [
        "Lead with the operating truth, not the slogan.",
        "Use verbs that imply action the client can repeat.",
        "Prefer sharp contrast over soft positioning language.",
      ],
      do: [
        "Say what gets easier after the engagement ends.",
        "Use concrete nouns from the buyer's daily work.",
        "State the tradeoff we are willing to make.",
        "Write like an operator explaining a decision.",
        "Name the specific behavior we refuse to reward.",
      ],
      dont: [
        "Do not hide behind category jargon.",
        "Do not promise speed without naming the cost.",
        "Do not sound like a startup manifesto.",
        "Do not use fluffy transformation language.",
        "Do not write like the work disappears after launch.",
      ],
      writingRules: [
        "Keep most sentences under 18 words.",
        "Prefer verbs over abstract nouns.",
        "Use plain English before imported jargon.",
      ],
      beforeAfter: [
        { old: "We unlock innovation at scale.", new: "We build AI systems your team can actually run." },
        { old: "We deliver digital transformation.", new: "We remove the bottleneck between decisions and execution." },
        { old: "We create strategic clarity.", new: "We show who owns the next move and why." },
      ],
    },
  };

  it("accepts a usable voice constraints section", () => {
    const result = Stage5Schema.safeParse(validVoice);

    expect(result.success).toBe(true);
  });

  it("rejects fewer than 3 principles", () => {
    const result = Stage5Schema.safeParse({
      voice: {
        ...validVoice.voice,
        principles: validVoice.voice.principles.slice(0, 2),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 5 do statements", () => {
    const result = Stage5Schema.safeParse({
      voice: {
        ...validVoice.voice,
        do: validVoice.voice.do.slice(0, 4),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 before/after examples", () => {
    const result = Stage5Schema.safeParse({
      voice: {
        ...validVoice.voice,
        beforeAfter: validVoice.voice.beforeAfter.slice(0, 2),
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage6Schema", () => {
  const validTemplates = {
    templates: {
      homepageHero: {
        eyebrow: "AI operations for service firms",
        h1: "Operator-led strategy your team can keep",
        subhead: "We replace vendor dependency with systems your team can run after handoff.",
        ctaVariants: ["See the operator audit", "Book a working session"],
      },
      coldOutreach: {
        subjects: [
          "Your handoff problem looks expensive",
          "A better way to keep the system after launch",
          "If there is no clear fit, I will say so",
        ],
        body:
          "Hi [Name],\n\nI noticed your team is adding AI into delivery while sales still frames it as a feature. We help service firms close that gap with systems operators can actually keep.\n\nTwo places we usually help: tightening the first handoff from sales to delivery, and making ownership explicit before automation spreads. If I do not see a clear case here, I will tell you and not insist.",
        signOff: "Francisco\nAcelera",
      },
      socialBios: {
        linkedin: "We build operator-led AI systems for service firms that need capability after the vendor leaves.",
        twitter: "Operator-led AI systems for service firms. Built to survive after handoff.",
        instagram: "Operator-led AI systems for service firms that want capability, not dependency.",
      },
      firstMinute: {
        script:
          "We help service firms build AI they can run without the vendor. We do that by making ownership explicit, tightening the handoff between teams, and refusing dashboard theater. Before I talk more, tell me where the current process breaks.",
        wordCount: 39,
      },
      emailSignature: "Francisco Segovia | Founder | Capability your team can keep | francisco@acelera.agency",
    },
  };

  it("accepts a complete set of application templates", () => {
    const result = Stage6Schema.safeParse(validTemplates);

    expect(result.success).toBe(true);
  });

  it("rejects homepage heroes without 2 CTAs", () => {
    const result = Stage6Schema.safeParse({
      templates: {
        ...validTemplates.templates,
        homepageHero: {
          ...validTemplates.templates.homepageHero,
          ctaVariants: ["See the operator audit"],
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects outreach without 3 subject variants", () => {
    const result = Stage6Schema.safeParse({
      templates: {
        ...validTemplates.templates,
        coldOutreach: {
          ...validTemplates.templates.coldOutreach,
          subjects: validTemplates.templates.coldOutreach.subjects.slice(0, 2),
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects social bios that exceed channel limits", () => {
    const result = Stage6Schema.safeParse({
      templates: {
        ...validTemplates.templates,
        socialBios: {
          ...validTemplates.templates.socialBios,
          twitter:
            "This version is intentionally much longer than a practical X bio because it keeps stacking extra clauses until it breaks the 160 character limit that the template should respect.",
        },
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage7Schema", () => {
  const validVisual = {
    visual: {
      palette: [
        { name: "Graphite", hex: "#111827", role: "primary", narrative: "Main editorial ink." },
        { name: "Bone", hex: "#F3EFE5", role: "background", narrative: "Paper-like base." },
        { name: "Verdant", hex: "#1F6E5A", role: "secondary", narrative: "Signals operating confidence." },
        { name: "Alert Rust", hex: "#B45309", role: "accent", narrative: "Reserved for alerts only." },
        { name: "Mist", hex: "#D1D5DB", role: "neutral", narrative: "Quiet support color." },
      ],
      typography: {
        display: {
          family: "Inter Tight",
          weights: [500, 600, 700],
          source: "google",
        },
        body: {
          family: "Inter",
          weights: [400, 500, 600],
          source: "google",
        },
        mono: {
          family: "JetBrains Mono",
          weights: [400, 500],
          source: "google",
        },
      },
      characteristicComponents: [
        { name: "Metric tags", description: "Numbers sit inside uppercase mono tags." },
        { name: "Citation rails", description: "Customer proof appears as margin citations." },
        { name: "Comparison grids", description: "Before/after decisions use ruled comparison tables." },
      ],
      forbiddenVisuals: [
        "No robots or circuit-board iconography.",
        "No isometric dashboard mockups.",
        "No neon gradients without a hard reason.",
        "No stock handshakes or team huddles.",
        "No floating UI cards with generic metrics.",
        "No glossy 3D blobs.",
      ],
      logoDirection: "Wordmark with a compressed crossbar detail that feels editorial, not startup-tech.",
    },
  };

  it("accepts a complete visual direction", () => {
    const result = Stage7Schema.safeParse(validVisual);

    expect(result.success).toBe(true);
  });

  it("rejects invalid palette hex values", () => {
    const result = Stage7Schema.safeParse({
      visual: {
        ...validVisual.visual,
        palette: [
          { ...validVisual.visual.palette[0], hex: "111827" },
          ...validVisual.visual.palette.slice(1),
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 characteristic components", () => {
    const result = Stage7Schema.safeParse({
      visual: {
        ...validVisual.visual,
        characteristicComponents: validVisual.visual.characteristicComponents.slice(0, 2),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 6 forbidden visuals", () => {
    const result = Stage7Schema.safeParse({
      visual: {
        ...validVisual.visual,
        forbiddenVisuals: validVisual.visual.forbiddenVisuals.slice(0, 5),
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("Stage8Schema", () => {
  const validRules = {
    rules: {
      outreach: [
        { rule: "Lead with the enemy, not generic capability.", reason: "Generic outreach sounds like every other vendor." },
        { rule: "Name the handoff problem before mentioning AI.", reason: "The problem frames the credibility of the solution." },
        { rule: "Say you will walk away if there is no clear fit.", reason: "Pressure erodes the operator-led stance." },
      ],
      salesMeeting: [
        { rule: "Open with the promise the team keeps after handoff.", reason: "It distinguishes the method from vendor dependency." },
        { rule: "State one anti-positioning line in the first minute.", reason: "Without the refusal, the brand sounds generic." },
        { rule: "Hand the floor back with a specific diagnostic question.", reason: "The conversation should feel investigative, not theatrical." },
      ],
      proposals: [
        { rule: "Show ownership by role before showing timeline.", reason: "Ownership is the operating mechanism, not decoration." },
        { rule: "Do not promise transformation without adoption detail.", reason: "It repeats the enemy behavior in polished form." },
        { rule: "Name what is out of scope in plain language.", reason: "Clear refusal builds trust in the rest of the plan." },
      ],
      cases: [
        { rule: "Explain what changed operationally, not just outcomes.", reason: "The brand sells capability that lasts." },
        { rule: "Include the cost of the old behavior.", reason: "Without cost, the enemy feels abstract." },
        { rule: "Use the client's exact internal language where possible.", reason: "Specific language prevents case-study theater." },
      ],
      visual: [
        { rule: "Use the alert color only for actual risk or emphasis.", reason: "Overusing accent breaks the restraint of the system." },
        { rule: "Every piece must include at least one characteristic component.", reason: "Otherwise the work loses its recognizable signatures." },
        { rule: "Do not use forbidden category cliches even as placeholders.", reason: "Cliches collapse the visual enemy stance immediately." },
      ],
    },
  };

  it("accepts 3 rules per surface", () => {
    const result = Stage8Schema.safeParse(validRules);

    expect(result.success).toBe(true);
  });

  it("rejects surfaces with fewer than 3 rules", () => {
    const result = Stage8Schema.safeParse({
      rules: {
        ...validRules.rules,
        outreach: validRules.rules.outreach.slice(0, 2),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects rules without reasons", () => {
    const result = Stage8Schema.safeParse({
      rules: {
        ...validRules.rules,
        proposals: [
          validRules.rules.proposals[0],
          validRules.rules.proposals[1],
          { rule: "Name what is out of scope in plain language.", reason: "" },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects surfaces with more than 5 rules", () => {
    const result = Stage8Schema.safeParse({
      rules: {
        ...validRules.rules,
        visual: [
          ...validRules.rules.visual,
          { rule: "Prefer ruled layouts over floating cards.", reason: "Ruled layouts reinforce the editorial system." },
          { rule: "Keep gradients out unless explicitly justified.", reason: "Unjustified gradients soften the stance." },
          { rule: "Avoid decorative shadows on utility elements.", reason: "Decorative polish weakens the industrial tone." },
        ],
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("BrandKitSchema", () => {
  const validBrandKit = {
    id: "kit_123",
    ownerId: "user_123",
    status: "draft" as const,
    createdAt: new Date("2026-04-08T10:00:00.000Z"),
    updatedAt: new Date("2026-04-08T10:30:00.000Z"),
    stageProgress: {
      stage_0: "passed" as const,
      stage_1: "passed" as const,
      stage_2: "passed" as const,
      stage_3: "passed" as const,
      stage_4: "passed" as const,
      stage_5: "passed" as const,
      stage_6: "passed" as const,
      stage_7: "passed" as const,
      stage_8: "passed" as const,
    },
    context: {
      beforeAfter:
        "We used to sell strategy decks as the deliverable. Then we realized the client needed operating capability, not more documents. Now the brand centers on systems the team can keep after handoff.",
    },
    enemy: "We exist because too many agencies sell AI the client cannot operate.",
    stack: {
      character: "Operator-led strategy",
      promise: "Capability your team can keep",
      method: "Partner-built systems",
    },
    antiPositioning: [
      { statement: "We are not a dashboard theater shop.", cost: "It filters out buyers chasing optics over adoption." },
      { statement: "We are not a strategy PDF factory.", cost: "It forces deeper delivery ownership from the team." },
      { statement: "We are not a ghost team behind your AI.", cost: "It means some buyers choose easier vendor dependence." },
      { statement: "We are not a cheap pilot lab.", cost: "It reduces volume from experimentation-first deals." },
      { statement: "We are not a generic agency retainer.", cost: "It narrows the pipeline to clients with operational urgency." },
    ],
    icp: {
      primary: {
        signals: [
          "They own a messy handoff between sales and delivery.",
          "They can name the internal metric they need to shrink.",
          "They ask how the team will keep the system after launch.",
          "They have already tried tooling without changing behavior.",
        ],
      },
      secondary: {
        role: "Head of Revenue Operations",
        signals: [
          "They care about proof the process survives after the vendor leaves.",
          "They ask for examples of internal adoption, not just deployment.",
        ],
      },
    },
    voice: {
      principles: [
        "Lead with the operating truth, not the slogan.",
        "Use verbs that imply action the client can repeat.",
        "Prefer sharp contrast over soft positioning language.",
      ],
      do: [
        "Say what gets easier after the engagement ends.",
        "Use concrete nouns from the buyer's daily work.",
        "State the tradeoff we are willing to make.",
        "Write like an operator explaining a decision.",
        "Name the specific behavior we refuse to reward.",
      ],
      dont: [
        "Do not hide behind category jargon.",
        "Do not promise speed without naming the cost.",
        "Do not sound like a startup manifesto.",
        "Do not use fluffy transformation language.",
        "Do not write like the work disappears after launch.",
      ],
      writingRules: [
        "Keep most sentences under 18 words.",
        "Prefer verbs over abstract nouns.",
        "Use plain English before imported jargon.",
      ],
      beforeAfter: [
        { old: "We unlock innovation at scale.", new: "We build AI systems your team can actually run." },
        { old: "We deliver digital transformation.", new: "We remove the bottleneck between decisions and execution." },
        { old: "We create strategic clarity.", new: "We show who owns the next move and why." },
      ],
    },
    templates: {
      homepageHero: {
        eyebrow: "AI operations for service firms",
        h1: "Operator-led strategy your team can keep",
        subhead: "We replace vendor dependency with systems your team can run after handoff.",
        ctaVariants: ["See the operator audit", "Book a working session"],
      },
      coldOutreach: {
        subjects: [
          "Your handoff problem looks expensive",
          "A better way to keep the system after launch",
          "If there is no clear fit, I will say so",
        ],
        body:
          "Hi [Name],\n\nI noticed your team is adding AI into delivery while sales still frames it as a feature. We help service firms close that gap with systems operators can actually keep.\n\nTwo places we usually help: tightening the first handoff from sales to delivery, and making ownership explicit before automation spreads. If I do not see a clear case here, I will tell you and not insist.",
        signOff: "Francisco\nAcelera",
      },
      socialBios: {
        linkedin: "We build operator-led AI systems for service firms that need capability after the vendor leaves.",
        twitter: "Operator-led AI systems for service firms. Built to survive after handoff.",
        instagram: "Operator-led AI systems for service firms that want capability, not dependency.",
      },
      firstMinute: {
        script:
          "We help service firms build AI they can run without the vendor. We do that by making ownership explicit, tightening the handoff between teams, and refusing dashboard theater. Before I talk more, tell me where the current process breaks.",
        wordCount: 39,
      },
      emailSignature: "Francisco Segovia | Founder | Capability your team can keep | francisco@acelera.agency",
    },
    visual: {
      palette: [
        { name: "Graphite", hex: "#111827", role: "primary" as const, narrative: "Main editorial ink." },
        { name: "Bone", hex: "#F3EFE5", role: "background" as const, narrative: "Paper-like base." },
        { name: "Verdant", hex: "#1F6E5A", role: "secondary" as const, narrative: "Signals operating confidence." },
        { name: "Alert Rust", hex: "#B45309", role: "accent" as const, narrative: "Reserved for alerts only." },
        { name: "Mist", hex: "#D1D5DB", role: "neutral" as const, narrative: "Quiet support color." },
      ],
      typography: {
        display: { family: "Inter Tight", weights: [500, 600, 700], source: "google" as const },
        body: { family: "Inter", weights: [400, 500, 600], source: "google" as const },
        mono: { family: "JetBrains Mono", weights: [400, 500], source: "google" as const },
      },
      characteristicComponents: [
        { name: "Metric tags", description: "Numbers sit inside uppercase mono tags." },
        { name: "Citation rails", description: "Customer proof appears as margin citations." },
        { name: "Comparison grids", description: "Before/after decisions use ruled comparison tables." },
      ],
      forbiddenVisuals: [
        "No robots or circuit-board iconography.",
        "No isometric dashboard mockups.",
        "No neon gradients without a hard reason.",
        "No stock handshakes or team huddles.",
        "No floating UI cards with generic metrics.",
        "No glossy 3D blobs.",
      ],
      logoDirection: "Wordmark with a compressed crossbar detail that feels editorial, not startup-tech.",
    },
    rules: {
      outreach: [
        { rule: "Lead with the enemy, not generic capability.", reason: "Generic outreach sounds like every other vendor." },
        { rule: "Name the handoff problem before mentioning AI.", reason: "The problem frames the credibility of the solution." },
        { rule: "Say you will walk away if there is no clear fit.", reason: "Pressure erodes the operator-led stance." },
      ],
      salesMeeting: [
        { rule: "Open with the promise the team keeps after handoff.", reason: "It distinguishes the method from vendor dependency." },
        { rule: "State one anti-positioning line in the first minute.", reason: "Without the refusal, the brand sounds generic." },
        { rule: "Hand the floor back with a specific diagnostic question.", reason: "The conversation should feel investigative, not theatrical." },
      ],
      proposals: [
        { rule: "Show ownership by role before showing timeline.", reason: "Ownership is the operating mechanism, not decoration." },
        { rule: "Do not promise transformation without adoption detail.", reason: "It repeats the enemy behavior in polished form." },
        { rule: "Name what is out of scope in plain language.", reason: "Clear refusal builds trust in the rest of the plan." },
      ],
      cases: [
        { rule: "Explain what changed operationally, not just outcomes.", reason: "The brand sells capability that lasts." },
        { rule: "Include the cost of the old behavior.", reason: "Without cost, the enemy feels abstract." },
        { rule: "Use the client's exact internal language where possible.", reason: "Specific language prevents case-study theater." },
      ],
      visual: [
        { rule: "Use the alert color only for actual risk or emphasis.", reason: "Overusing accent breaks the restraint of the system." },
        { rule: "Every piece must include at least one characteristic component.", reason: "Otherwise the work loses its recognizable signatures." },
        { rule: "Do not use forbidden category cliches even as placeholders.", reason: "Cliches collapse the visual enemy stance immediately." },
      ],
    },
  };

  it("accepts a complete BrandKit object", () => {
    const result = BrandKitSchema.safeParse(validBrandKit);

    expect(result.success).toBe(true);
  });

  it("rejects a BrandKit missing the context section", () => {
    const { context: _context, ...withoutContext } = validBrandKit;
    const result = BrandKitSchema.safeParse(withoutContext);

    expect(result.success).toBe(false);
  });
});
