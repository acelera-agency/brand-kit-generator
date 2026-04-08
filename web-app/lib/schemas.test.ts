import { describe, expect, it } from "vitest";
import { Stage0Schema, Stage1Schema, Stage2Schema } from "./schemas";

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
