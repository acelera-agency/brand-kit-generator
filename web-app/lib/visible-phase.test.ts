import { describe, expect, it } from "vitest";
import { getVisiblePhase, getVisiblePhaseStatus } from "./visible-phase";
import type { StageId } from "./stage-requirements";
import type { StageProgressStatus } from "./workspace-view";

function progress(
  passed: StageId[],
): Partial<Record<StageId, StageProgressStatus>> {
  return Object.fromEntries(passed.map((stageId) => [stageId, "passed"]));
}

describe("visible phase helpers", () => {
  it("groups the nine internal stages into three visible phases", () => {
    expect(getVisiblePhase(progress([])).id).toBe("signal");
    expect(getVisiblePhase(progress(["stage_0", "stage_1", "stage_2"])).id).toBe(
      "positioning",
    );
    expect(
      getVisiblePhase(
        progress(["stage_0", "stage_1", "stage_2", "stage_3", "stage_4", "stage_5"]),
      ).id,
    ).toBe("system");
  });

  it("returns user-facing status without exposing 1 of 9 copy", () => {
    expect(getVisiblePhaseStatus(progress(["stage_0"]))).toBe(
      "Draft signal captured",
    );
    expect(
      getVisiblePhaseStatus(
        progress(["stage_0", "stage_1", "stage_2", "stage_3"]),
      ),
    ).toBe("Positioning sharpening");
    expect(
      getVisiblePhaseStatus(
        progress([
          "stage_0",
          "stage_1",
          "stage_2",
          "stage_3",
          "stage_4",
          "stage_5",
          "stage_6",
          "stage_7",
          "stage_8",
        ]),
      ),
    ).toBe("System ready");
  });
});
