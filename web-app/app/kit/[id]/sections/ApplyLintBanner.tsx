"use client";

import { useRouter } from "next/navigation";
import type {
  VoiceLintSectionResult,
  VoiceLintViolation,
} from "@/lib/types";
import type { EditableFieldPath } from "@/lib/kit-field-paths";
import { LintBanner, type ApplyResult } from "./LintBanner";

export type FieldCandidate = {
  path: EditableFieldPath;
  currentValue: string;
};

type Props = {
  kitId: string;
  result: VoiceLintSectionResult | undefined;
  // Ordered list of candidate fields the snippet might live in. The first one
  // that contains the snippet wins; if none match, we fall back to editing
  // manually. Fully serializable so this component can be mounted from a
  // server component.
  candidates: FieldCandidate[];
};

export function ApplyLintBanner({ kitId, result, candidates }: Props) {
  const router = useRouter();

  const onApply = async (v: VoiceLintViolation): Promise<ApplyResult> => {
    const target = candidates.find((c) => c.currentValue.includes(v.snippet));
    if (!target) {
      return {
        applied: false,
        reason: "Snippet no longer present — edit manually.",
      };
    }
    const nextValue = target.currentValue.replace(v.snippet, v.suggestedRewrite);
    const res = await fetch(`/api/kits/${kitId}/field`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: target.path, value: nextValue }),
    });
    if (!res.ok) {
      const body: { error?: string } = await res.json().catch(() => ({}));
      return { applied: false, reason: body.error ?? "Save failed." };
    }
    router.refresh();
    return { applied: true };
  };

  return <LintBanner result={result} onApply={onApply} />;
}
