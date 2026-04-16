import { describe, expect, it } from "vitest";
import type { StoredKitData, VoiceLintResult } from "./types";
import {
  FieldPathSchema,
  invalidateLintForField,
  setFieldByPath,
  stageSliceForValidation,
} from "./kit-field-paths";

describe("FieldPathSchema", () => {
  it("accepts known paths", () => {
    expect(FieldPathSchema.safeParse("beforeAfter").success).toBe(true);
    expect(
      FieldPathSchema.safeParse("templates.coldOutreach.body").success,
    ).toBe(true);
    expect(
      FieldPathSchema.safeParse("templates.socialBios.twitter").success,
    ).toBe(true);
  });

  it("rejects unknown paths", () => {
    expect(FieldPathSchema.safeParse("bogus.path").success).toBe(false);
    expect(FieldPathSchema.safeParse("icp.primary.signals").success).toBe(false);
    expect(FieldPathSchema.safeParse("").success).toBe(false);
  });
});

describe("setFieldByPath", () => {
  it("updates a top-level string without mutating input", () => {
    const kit: StoredKitData = { beforeAfter: "old" };
    const next = setFieldByPath(kit, "beforeAfter", "new");
    expect(next.beforeAfter).toBe("new");
    expect(kit.beforeAfter).toBe("old");
  });

  it("updates a deeply nested field and preserves siblings", () => {
    const kit: StoredKitData = {
      templates: {
        homepageHero: {
          eyebrow: "x",
          h1: "x",
          subhead: "x",
          ctaVariants: ["a", "b"],
        },
        coldOutreach: {
          subjects: ["s1", "s2", "s3"],
          body: "old body",
          signOff: "old signoff",
        },
        socialBios: { linkedin: "l", twitter: "t", instagram: "i" },
        firstMinute: { script: "s", wordCount: 10 },
        emailSignature: "sig",
      },
    };
    const next = setFieldByPath(kit, "templates.coldOutreach.body", "new body");
    expect(next.templates!.coldOutreach.body).toBe("new body");
    expect(next.templates!.coldOutreach.signOff).toBe("old signoff");
    expect(next.templates!.coldOutreach.subjects).toEqual(["s1", "s2", "s3"]);
    expect(kit.templates!.coldOutreach.body).toBe("old body");
  });

  it("creates missing intermediate objects safely", () => {
    const kit: StoredKitData = {};
    const next = setFieldByPath(kit, "stack.character", "Operator-led");
    expect(next.stack?.character).toBe("Operator-led");
  });
});

describe("stageSliceForValidation", () => {
  it("returns the Stage 0 shape", () => {
    expect(
      stageSliceForValidation({ beforeAfter: "x" }, "stage_0"),
    ).toEqual({ beforeAfter: "x" });
  });

  it("returns the Stage 6 shape", () => {
    const templates = {
      homepageHero: {
        eyebrow: "e",
        h1: "h",
        subhead: "s",
        ctaVariants: ["a", "b"],
      },
      coldOutreach: { subjects: ["a", "b", "c"], body: "b", signOff: "s" },
      socialBios: { linkedin: "l", twitter: "t", instagram: "i" },
      firstMinute: { script: "s", wordCount: 5 },
      emailSignature: "sig",
    };
    expect(stageSliceForValidation({ templates }, "stage_6")).toEqual({
      templates,
    });
  });
});

describe("invalidateLintForField", () => {
  const baseLint: VoiceLintResult = {
    generatedAt: "2026-04-16T00:00:00Z",
    voiceHash: "abc123",
    sections: {
      context: { target: "Context", violations: [] },
      templates: {
        coldOutreachBody: { target: "Cold outreach body", violations: [] },
        firstMinute: { target: "First minute", violations: [] },
      },
    },
  };

  it("removes the context entry when beforeAfter changes", () => {
    const kit: StoredKitData = { lint: structuredClone(baseLint) };
    const next = invalidateLintForField(kit, "beforeAfter");
    expect(next.lint?.sections.context).toBeUndefined();
    expect(next.lint?.sections.templates?.coldOutreachBody).toBeDefined();
  });

  it("removes a single template entry when that field changes", () => {
    const kit: StoredKitData = { lint: structuredClone(baseLint) };
    const next = invalidateLintForField(kit, "templates.coldOutreach.body");
    expect(next.lint?.sections.templates?.coldOutreachBody).toBeUndefined();
    expect(next.lint?.sections.templates?.firstMinute).toBeDefined();
    expect(next.lint?.sections.context).toBeDefined();
  });

  it("drops the templates map entirely when the last entry is removed", () => {
    const kit: StoredKitData = {
      lint: {
        generatedAt: "2026-04-16T00:00:00Z",
        voiceHash: "abc123",
        sections: {
          templates: {
            firstMinute: { target: "First minute", violations: [] },
          },
        },
      },
    };
    const next = invalidateLintForField(kit, "templates.firstMinute.script");
    expect(next.lint?.sections.templates).toBeUndefined();
  });

  it("is a no-op when there is no lint cached", () => {
    const kit: StoredKitData = { beforeAfter: "x" };
    const next = invalidateLintForField(kit, "beforeAfter");
    expect(next).toEqual(kit);
  });

  it("is a no-op for a field with no lint mapping", () => {
    const kit: StoredKitData = { lint: structuredClone(baseLint) };
    const next = invalidateLintForField(kit, "enemy");
    expect(next.lint?.sections.context).toBeDefined();
    expect(next.lint?.sections.templates?.coldOutreachBody).toBeDefined();
  });
});
