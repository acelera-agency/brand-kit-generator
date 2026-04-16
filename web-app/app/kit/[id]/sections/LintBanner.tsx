import type { VoiceLintSectionResult } from "@/lib/types";

type Props = {
  result: VoiceLintSectionResult | undefined;
};

const KIND_LABEL: Record<string, string> = {
  "dont-phrase": "Banned phrase",
  "word-count": "Sentence too long",
  "tone-mismatch": "Tone drift",
  "register-mismatch": "Wrong register",
};

export function LintBanner({ result }: Props) {
  if (!result || result.violations.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-amber-400/60 bg-amber-50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-amber-800 mb-3">
        Voice drift — {result.violations.length}{" "}
        {result.violations.length === 1 ? "item" : "items"}
      </p>
      <ul className="space-y-4">
        {result.violations.map((v, idx) => (
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
          </li>
        ))}
      </ul>
    </div>
  );
}
