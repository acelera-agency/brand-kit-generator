import { z } from "zod";
import type { StoredKitData } from "./types";

export const EDITABLE_FIELD_PATHS = [
  "beforeAfter",
  "enemy",
  "stack.character",
  "stack.promise",
  "stack.method",
  "templates.homepageHero.eyebrow",
  "templates.homepageHero.h1",
  "templates.homepageHero.subhead",
  "templates.coldOutreach.body",
  "templates.coldOutreach.signOff",
  "templates.socialBios.linkedin",
  "templates.socialBios.twitter",
  "templates.socialBios.instagram",
  "templates.firstMinute.script",
  "templates.emailSignature",
] as const;

export type EditableFieldPath = (typeof EDITABLE_FIELD_PATHS)[number];

export const FieldPathSchema = z.enum(EDITABLE_FIELD_PATHS);

export type StageIdForEdit = "stage_0" | "stage_1" | "stage_2" | "stage_6";

export const FIELD_TO_STAGE: Record<EditableFieldPath, StageIdForEdit> = {
  beforeAfter: "stage_0",
  enemy: "stage_1",
  "stack.character": "stage_2",
  "stack.promise": "stage_2",
  "stack.method": "stage_2",
  "templates.homepageHero.eyebrow": "stage_6",
  "templates.homepageHero.h1": "stage_6",
  "templates.homepageHero.subhead": "stage_6",
  "templates.coldOutreach.body": "stage_6",
  "templates.coldOutreach.signOff": "stage_6",
  "templates.socialBios.linkedin": "stage_6",
  "templates.socialBios.twitter": "stage_6",
  "templates.socialBios.instagram": "stage_6",
  "templates.firstMinute.script": "stage_6",
  "templates.emailSignature": "stage_6",
};

export type LintCacheKey =
  | { section: "context" }
  | { section: "templates"; key: string };

export const FIELD_TO_LINT_KEY: Partial<Record<EditableFieldPath, LintCacheKey>> = {
  beforeAfter: { section: "context" },
  "templates.homepageHero.eyebrow": { section: "templates", key: "homepageHero" },
  "templates.homepageHero.h1": { section: "templates", key: "homepageHero" },
  "templates.homepageHero.subhead": { section: "templates", key: "homepageHero" },
  "templates.coldOutreach.body": { section: "templates", key: "coldOutreachBody" },
  "templates.firstMinute.script": { section: "templates", key: "firstMinute" },
  "templates.socialBios.linkedin": { section: "templates", key: "linkedinBio" },
};

type KitRecord = Record<string, unknown>;

function isRecord(value: unknown): value is KitRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function setFieldByPath(
  kit: StoredKitData,
  path: EditableFieldPath,
  value: string,
): StoredKitData {
  const segments = path.split(".");
  const clone = structuredClone(kit) as KitRecord;
  let cursor: KitRecord = clone;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const existing = cursor[seg];
    if (!isRecord(existing)) {
      cursor[seg] = {};
    }
    cursor = cursor[seg] as KitRecord;
  }

  cursor[segments[segments.length - 1]] = value;
  return clone as unknown as StoredKitData;
}

export function stageSliceForValidation(
  kit: StoredKitData,
  stageId: StageIdForEdit,
): unknown {
  switch (stageId) {
    case "stage_0":
      return { beforeAfter: kit.beforeAfter };
    case "stage_1":
      return { enemy: kit.enemy };
    case "stage_2":
      return { stack: kit.stack };
    case "stage_6":
      return { templates: kit.templates };
  }
}

export function invalidateLintForField(
  kit: StoredKitData,
  path: EditableFieldPath,
): StoredKitData {
  const entry = FIELD_TO_LINT_KEY[path];
  if (!entry || !kit.lint) return kit;

  const next = structuredClone(kit);
  const lint = next.lint;
  if (!lint) return next;

  if (entry.section === "context") {
    delete lint.sections.context;
  } else if (entry.section === "templates" && lint.sections.templates) {
    delete lint.sections.templates[entry.key];
    if (Object.keys(lint.sections.templates).length === 0) {
      delete lint.sections.templates;
    }
  }
  return next;
}
