"use client";

import { useState, useTransition } from "react";
import type { VoiceLintSectionResult, VoiceLintViolation } from "@/lib/types";

export type ApplyResult = { applied: boolean; reason?: string };

type Props = {
  result: VoiceLintSectionResult | undefined;
  onApply?: (v: VoiceLintViolation) => Promise<ApplyResult>;
};

const KIND_LABEL: Record<string, string> = {
  "dont-phrase": "Banned phrase",
  "word-count": "Sentence too long",
  "tone-mismatch": "Tone drift",
  "register-mismatch": "Wrong register",
};

export function LintBanner({ result, onApply }: Props) {
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [isPending, start] = useTransition();

  if (!result || result.violations.length === 0) return null;

  const handleApply = (v: VoiceLintViolation, idx: number) => {
    if (!onApply) return;
    setReasons((r) => {
      const next = { ...r };
      delete next[idx];
      return next;
    });
    setPendingIdx(idx);
    start(async () => {
      try {
        const res = await onApply(v);
        if (!res.applied && res.reason) {
          setReasons((r) => ({ ...r, [idx]: res.reason! }));
        }
      } catch (e) {
        setReasons((r) => ({
          ...r,
          [idx]: e instanceof Error ? e.message : "apply_failed",
        }));
      } finally {
        setPendingIdx(null);
      }
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-amber-400/60 bg-amber-50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-amber-800 mb-3">
        Voice drift — {result.violations.length}{" "}
        {result.violations.length === 1 ? "item" : "items"}
      </p>
      <ul className="space-y-4">
        {result.violations.map((v, idx) => {
          const busy = isPending && pendingIdx === idx;
          const reason = reasons[idx];
          return (
            <li key={idx} className="text-sm text-ink">
              <p className="font-mono text-[11px] uppercase tracking-wide text-amber-700">
                {KIND_LABEL[v.kind] ?? v.kind} · {v.ruleReference}
              </p>
              <p className="mt-1">
                <span className="bg-amber-200/60 px-1">&ldquo;{v.snippet}&rdquo;</span>
              </p>
              <p className="mt-1 text-muted-strong">
                Try: <span className="text-ink">{v.suggestedRewrite}</span>
              </p>
              {onApply ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApply(v, idx)}
                    disabled={busy || isPending}
                    className="rounded bg-amber-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-paper hover:bg-amber-900 disabled:opacity-60"
                  >
                    {busy ? "Applying…" : "Apply rewrite"}
                  </button>
                  {reason ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rose-700">
                      {reason}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
