import { describe, expect, it } from "vitest";
import { Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema, Stage4Schema, Stage5Schema, Stage6Schema } from "./schemas";

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
