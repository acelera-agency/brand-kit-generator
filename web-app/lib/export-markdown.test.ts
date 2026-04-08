import { describe, expect, it } from "vitest";
import { exportToMarkdown } from "./export-markdown";
import type { BrandKit } from "./types";

const fixture: BrandKit = {
  id: "kit_123",
  ownerId: "user_123",
  status: "draft",
  createdAt: new Date("2026-04-08T10:00:00.000Z"),
  updatedAt: new Date("2026-04-08T10:30:00.000Z"),
  stageProgress: {
    stage_0: "passed",
    stage_1: "passed",
    stage_2: "passed",
    stage_3: "passed",
    stage_4: "passed",
    stage_5: "passed",
    stage_6: "passed",
    stage_7: "passed",
    stage_8: "passed",
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
    {
      statement: "We are not a dashboard theater shop.",
      cost: "It filters out buyers chasing optics over adoption.",
    },
    {
      statement: "We are not a strategy PDF factory.",
      cost: "It forces deeper delivery ownership from the team.",
    },
    {
      statement: "We are not a ghost team behind your AI.",
      cost: "It means some buyers choose easier vendor dependence.",
    },
    {
      statement: "We are not a cheap pilot lab.",
      cost: "It reduces volume from experimentation-first deals.",
    },
    {
      statement: "We are not a generic agency retainer.",
      cost: "It narrows the pipeline to clients with operational urgency.",
    },
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
  },
  templates: {
    homepageHero: {
      eyebrow: "AI operations for service firms",
      h1: "Operator-led strategy your team can keep",
      subhead:
        "We replace vendor dependency with systems your team can run after handoff.",
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
      linkedin:
        "We build operator-led AI systems for service firms that need capability after the vendor leaves.",
      twitter:
        "Operator-led AI systems for service firms. Built to survive after handoff.",
      instagram:
        "Operator-led AI systems for service firms that want capability, not dependency.",
    },
    firstMinute: {
      script:
        "We help service firms build AI they can run without the vendor. We do that by making ownership explicit, tightening the handoff between teams, and refusing dashboard theater. Before I talk more, tell me where the current process breaks.",
      wordCount: 39,
    },
    emailSignature:
      "Francisco Segovia | Founder | Capability your team can keep | francisco@acelera.agency",
  },
  visual: {
    palette: [
      {
        name: "Graphite",
        hex: "#111827",
        role: "primary",
        narrative: "Main editorial ink.",
      },
      {
        name: "Bone",
        hex: "#F3EFE5",
        role: "background",
        narrative: "Paper-like base.",
      },
      {
        name: "Verdant",
        hex: "#1F6E5A",
        role: "secondary",
        narrative: "Signals operating confidence.",
      },
      {
        name: "Alert Rust",
        hex: "#B45309",
        role: "accent",
        narrative: "Reserved for alerts only.",
      },
      {
        name: "Mist",
        hex: "#D1D5DB",
        role: "neutral",
        narrative: "Quiet support color.",
      },
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
      {
        name: "Metric tags",
        description: "Numbers sit inside uppercase mono tags.",
      },
      {
        name: "Citation rails",
        description: "Customer proof appears as margin citations.",
      },
      {
        name: "Comparison grids",
        description: "Before/after decisions use ruled comparison tables.",
      },
    ],
    forbiddenVisuals: [
      "No robots or circuit-board iconography.",
      "No isometric dashboard mockups.",
      "No neon gradients without a hard reason.",
      "No stock handshakes or team huddles.",
      "No floating UI cards with generic metrics.",
      "No glossy 3D blobs.",
    ],
    logoDirection:
      "Wordmark with a compressed crossbar detail that feels editorial, not startup-tech.",
  },
  rules: {
    outreach: [
      {
        rule: "Lead with the enemy, not generic capability.",
        reason: "Generic outreach sounds like every other vendor.",
      },
      {
        rule: "Name the handoff problem before mentioning AI.",
        reason: "The problem frames the credibility of the solution.",
      },
      {
        rule: "Say you will walk away if there is no clear fit.",
        reason: "Pressure erodes the operator-led stance.",
      },
    ],
    salesMeeting: [
      {
        rule: "Open with the promise the team keeps after handoff.",
        reason: "It distinguishes the method from vendor dependency.",
      },
      {
        rule: "State one anti-positioning line in the first minute.",
        reason: "Without the refusal, the brand sounds generic.",
      },
      {
        rule: "Hand the floor back with a specific diagnostic question.",
        reason: "The conversation should feel investigative, not theatrical.",
      },
    ],
    proposals: [
      {
        rule: "Show ownership by role before showing timeline.",
        reason: "Ownership is the operating mechanism, not decoration.",
      },
      {
        rule: "Do not promise transformation without adoption detail.",
        reason: "It repeats the enemy behavior in polished form.",
      },
      {
        rule: "Name what is out of scope in plain language.",
        reason: "Clear refusal builds trust in the rest of the plan.",
      },
    ],
    cases: [
      {
        rule: "Explain what changed operationally, not just outcomes.",
        reason: "The brand sells capability that lasts.",
      },
      {
        rule: "Include the cost of the old behavior.",
        reason: "Without cost, the enemy feels abstract.",
      },
      {
        rule: "Use the client's exact internal language where possible.",
        reason: "Specific language prevents case-study theater.",
      },
    ],
    visual: [
      {
        rule: "Use the alert color only for actual risk or emphasis.",
        reason: "Overusing accent breaks the restraint of the system.",
      },
      {
        rule: "Every piece must include at least one characteristic component.",
        reason: "Otherwise the work loses its recognizable signatures.",
      },
      {
        rule: "Do not use forbidden category cliches even as placeholders.",
        reason: "Cliches collapse the visual enemy stance immediately.",
      },
    ],
  },
};

describe("exportToMarkdown", () => {
  it("includes the brand context section", () => {
    const md = exportToMarkdown(fixture);

    expect(md).toContain("## Context");
    expect(md).toContain(fixture.context.beforeAfter);
  });

  it("includes all 9 stage section headers", () => {
    const md = exportToMarkdown(fixture);
    const expectedSections = [
      "Context",
      "Enemy",
      "Brand stack",
      "Anti-positioning",
      "ICP",
      "Voice",
      "Templates",
      "Visual direction",
      "Rules",
    ];

    for (const section of expectedSections) {
      expect(md).toContain(`## ${section}`);
    }
  });

  it("renders the do/don't pairs as a list", () => {
    const md = exportToMarkdown(fixture);

    expect(md).toMatch(/- ✓/);
    expect(md).toMatch(/- ✗/);
  });

  it("renders anti-positioning items with their cost", () => {
    const md = exportToMarkdown(fixture);

    expect(md).toContain(fixture.antiPositioning[0].statement);
    expect(md).toContain(`Cost: ${fixture.antiPositioning[0].cost}`);
  });

  it("renders the palette with hex values", () => {
    const md = exportToMarkdown(fixture);

    expect(md).toContain(fixture.visual.palette[0].name);
    expect(md).toContain(fixture.visual.palette[0].hex);
  });

  it("renders rules by surface", () => {
    const md = exportToMarkdown(fixture);

    expect(md).toContain("### Outreach");
    expect(md).toContain(fixture.rules.outreach[0].rule);
    expect(md).toContain(fixture.rules.visual[0].reason);
  });
});
