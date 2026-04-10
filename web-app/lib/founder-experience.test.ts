import { describe, expect, it } from "vitest";
import {
  buildInspirationContext,
  getDraftCheckpoint,
  parseInspirationItems,
} from "./founder-experience";

describe("getDraftCheckpoint", () => {
  it("returns none before enough stages pass", () => {
    expect(
      getDraftCheckpoint({
        stage_0: "passed",
        stage_1: "in-progress",
      }),
    ).toBe("none");
  });

  it("returns foundation once two stages pass", () => {
    expect(
      getDraftCheckpoint({
        stage_0: "passed",
        stage_1: "passed",
      }),
    ).toBe("foundation");
  });

  it("returns positioning once five stages pass", () => {
    expect(
      getDraftCheckpoint({
        stage_0: "passed",
        stage_1: "passed",
        stage_2: "passed",
        stage_3: "passed",
        stage_4: "passed",
      }),
    ).toBe("positioning");
  });
});

describe("parseInspirationItems", () => {
  it("filters out invalid inspiration payloads", () => {
    expect(parseInspirationItems([null, { id: "x" }])).toEqual([]);
  });
});

describe("buildInspirationContext", () => {
  it("returns empty context when no items exist", () => {
    expect(buildInspirationContext([])).toEqual({
      sourceMaterial: null,
      sourceMaterialMeta: {
        sources: [],
        totalChars: 0,
        truncated: false,
        warnings: [],
      },
    });
  });
});
