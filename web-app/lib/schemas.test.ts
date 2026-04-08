import { describe, expect, it } from "vitest";
import { Stage0Schema, Stage1Schema, Stage2Schema, Stage3Schema, Stage4Schema } from "./schemas";

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
