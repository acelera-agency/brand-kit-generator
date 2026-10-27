import { describe, expect, it } from "vitest";
import { exportStoredKitForAgent } from "./agent-export";
import type { StoredKitData } from "./types";

const kit: StoredKitData = {
  beforeAfter:
    "Founders used to wait for a final brand deck. Now one sharp answer should create a live working draft.",
  enemy: "Long brand questionnaires that hide the value until the end.",
};

describe("agent export", () => {
  it("returns partial JSON without requiring a complete brand kit", () => {
    expect(exportStoredKitForAgent(kit, "json")).toEqual(kit);
  });

  it("returns readable markdown for partial kits", () => {
    expect(exportStoredKitForAgent(kit, "markdown")).toContain(
      "## Context\n\nFounders used to wait",
    );
    expect(exportStoredKitForAgent(kit, "markdown")).toContain(
      "## Enemy\n\nLong brand questionnaires",
    );
  });
});
