import { describe, expect, it } from "vitest";
import { Stage0Schema } from "./schemas";

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
