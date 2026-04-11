import {
  buildSourceMaterial,
  type SourceMaterialPart,
} from "./material-ingestion";
import { STAGE_ORDER, type StageId } from "./stage-requirements";
import type {
  DraftCheckpoint,
  InspirationItem,
  SourceMaterialMeta,
  SourceKind,
} from "./types";

type ProgressByStage = Partial<Record<StageId, "empty" | "in-progress" | "passed">>;

export function getDraftCheckpoint(progressByStage: ProgressByStage): DraftCheckpoint {
  const passedCount = STAGE_ORDER.filter(
    (stageId) => progressByStage[stageId] === "passed",
  ).length;

  if (passedCount >= STAGE_ORDER.length) {
    return "final";
  }
  if (passedCount >= 5) {
    return "positioning";
  }
  if (passedCount >= 2) {
    return "foundation";
  }
  return "none";
}

export function makeInspirationItem(
  part: SourceMaterialPart,
  warnings: string[] = [],
): InspirationItem {
  return {
    id: crypto.randomUUID(),
    kind: part.kind,
    label: part.label,
    content: part.text,
    charCount: part.text.length,
    createdAt: new Date().toISOString(),
    warnings,
  };
}

export function parseInspirationItems(value: unknown): InspirationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const candidate = item as Partial<InspirationItem>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.kind !== "string" ||
      typeof candidate.label !== "string" ||
      typeof candidate.content !== "string" ||
      typeof candidate.charCount !== "number" ||
      typeof candidate.createdAt !== "string"
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        kind: candidate.kind as SourceKind,
        label: candidate.label,
        content: candidate.content,
        charCount: candidate.charCount,
        createdAt: candidate.createdAt,
        warnings: Array.isArray(candidate.warnings)
          ? candidate.warnings.filter(
              (warning): warning is string => typeof warning === "string",
            )
          : [],
      },
    ];
  });
}

export function buildInspirationContext(items: InspirationItem[]): {
  sourceMaterial: string | null;
  sourceMaterialMeta: SourceMaterialMeta;
} {
  if (items.length === 0) {
    return {
      sourceMaterial: null,
      sourceMaterialMeta: {
        sources: [],
        totalChars: 0,
        truncated: false,
        warnings: [],
      },
    };
  }

  const { sourceMaterial, sourceMaterialMeta } = buildSourceMaterial(
    items.map((item) => ({
      kind: item.kind,
      label: item.label,
      text: item.content,
    })),
  );

  return {
    sourceMaterial,
    sourceMaterialMeta: {
      ...sourceMaterialMeta,
      warnings: [
        ...sourceMaterialMeta.warnings,
        ...items.flatMap((item) => item.warnings),
      ],
    },
  };
}
