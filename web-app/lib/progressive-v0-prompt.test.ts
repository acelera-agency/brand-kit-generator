import { describe, expect, it } from "vitest";
import {
  buildProgressiveInitialSitePrompt,
  buildProgressiveStageIterationPrompt,
} from "./progressive-v0-prompt";
import type { StoredKitData } from "./types";

const stage0OnlyKit: StoredKitData = {
  beforeAfter:
    "Founders are tired of brand workshops that end in decks. This brand exists to turn conviction into a usable system from the first working session.",
};

const stagedKit: StoredKitData = {
  ...stage0OnlyKit,
  enemy:
    "The strategy theater that rewards polished decks before anyone ships real decisions.",
  stack: {
    character: "Sharp operator",
    promise: "Brand decisions you can use",
    method: "Live working draft",
  },
};

describe("progressive v0 prompts", () => {
  it("builds the initial site prompt from only the stage 0 context", () => {
    const result = buildProgressiveInitialSitePrompt(stage0OnlyKit);

    expect(result.system).toContain("progressive brand-site draft");
    expect(result.message).toContain(stage0OnlyKit.beforeAfter);
    expect(result.message).toContain("working draft");
  });

  it("rejects an initial prompt when stage 0 context is missing", () => {
    expect(() => buildProgressiveInitialSitePrompt({})).toThrow(
      /stage 0/i,
    );
  });

  it("builds a stage iteration prompt with only the relevant stage delta", () => {
    const result = buildProgressiveStageIterationPrompt(stagedKit, "stage_1");

    expect(result.message).toContain("stage_1");
    expect(result.message).toContain(stagedKit.enemy);
    expect(result.message).not.toContain("Sharp operator");
  });
});
