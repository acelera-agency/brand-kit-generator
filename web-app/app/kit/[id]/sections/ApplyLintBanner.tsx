"use client";

import { useRouter } from "next/navigation";
import type {
  VoiceLintSectionResult,
  VoiceLintViolation,
} from "@/lib/types";
import type { EditableFieldPath } from "@/lib/kit-field-paths";
import { LintBanner, type ApplyResult } from "./LintBanner";

type Props = {
  kitId: string;
  result: VoiceLintSectionResult | undefined;
  // Map a violation to the field path and current text to patch. For sections
  // whose lint key covers multiple sub-fields (e.g. the homepage hero block),
  // resolve which sub-field contains the snippet at apply time.
  resolve: (v: VoiceLintViolation) => { path: EditableFieldPath; currentValue: string } | null;
};

export function ApplyLintBanner({ kitId, result, resolve }: Props) {
  const router = useRouter();

  const onApply = async (v: VoiceLintViolation): Promise<ApplyResult> => {
    const target = resolve(v);
    if (!target) {
      return {
        applied: false,
        reason: "Could not locate the field for this snippet.",
      };
    }
    if (!target.currentValue.includes(v.snippet)) {
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
