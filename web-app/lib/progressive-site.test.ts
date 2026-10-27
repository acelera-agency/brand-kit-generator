import { describe, expect, it } from "vitest";
import {
  buildProgressiveInputHash,
  resolveProgressiveQueueIntent,
} from "./progressive-site";
import type { StoredKitData } from "./types";

const kit: StoredKitData = {
  beforeAfter:
    "The category keeps selling one-off deliverables. This brand exists to create a live system that gets sharper while the founder works.",
  enemy: "The agency process that hides behind research before shipping.",
};

describe("progressive site queue intent", () => {
  it("creates the first progressive generation after stage 0", () => {
    const inputHash = buildProgressiveInputHash(kit, "stage_0");

    expect(
      resolveProgressiveQueueIntent({
        stageId: "stage_0",
        inputHash,
        generation: null,
        existingIteration: null,
        quotaReserved: true,
      }),
    ).toEqual({
      action: "create-generation",
      modelId: "v0-mini",
      status: "queued",
    });
  });

  it("deduplicates an unchanged stage update before spending another job", () => {
    const inputHash = buildProgressiveInputHash(kit, "stage_1");

    expect(
      resolveProgressiveQueueIntent({
        stageId: "stage_1",
        inputHash,
        generation: {
          id: "gen_1",
          status: "completed",
          v0ChatId: "chat_1",
        },
        existingIteration: {
          id: "iter_1",
          status: "completed",
          inputHash,
        },
        quotaReserved: true,
      }),
    ).toEqual({
      action: "reuse-existing",
      status: "completed",
      iterationId: "iter_1",
    });
  });

  it("can deduplicate from stable source messages instead of gate extraction wording", () => {
    const sourceMessages = [
      "The enemy is treating brand strategy like a moodboard exercise.",
    ];
    const firstHash = buildProgressiveInputHash(kit, "stage_1", sourceMessages);
    const secondHash = buildProgressiveInputHash(
      { ...kit, enemy: "Treating strategy like moodboards." },
      "stage_1",
      sourceMessages,
    );
    const changedHash = buildProgressiveInputHash(kit, "stage_1", [
      ...sourceMessages,
      "Also, it hides behind research instead of shipping.",
    ]);

    expect(secondHash).toBe(firstHash);
    expect(changedHash).not.toBe(firstHash);
  });

  it("queues a stage iteration against an existing progressive generation", () => {
    const inputHash = buildProgressiveInputHash(kit, "stage_1");

    expect(
      resolveProgressiveQueueIntent({
        stageId: "stage_1",
        inputHash,
        generation: {
          id: "gen_1",
          status: "completed",
          v0ChatId: "chat_1",
        },
        existingIteration: null,
        quotaReserved: true,
      }),
    ).toEqual({
      action: "insert-iteration",
      modelId: "v0-auto",
      status: "queued",
    });
  });

  it("pauses queueing when quota was not reserved", () => {
    const inputHash = buildProgressiveInputHash(kit, "stage_0");

    expect(
      resolveProgressiveQueueIntent({
        stageId: "stage_0",
        inputHash,
        generation: null,
        existingIteration: null,
        quotaReserved: false,
      }),
    ).toEqual({
      action: "pause",
      status: "paused",
      error: "Token quota exceeded",
    });
  });
});
