import type { QuotaData } from "./types";

function formatTokens(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `${value}`;
}

export function QuotaBadge({ quota }: { quota: QuotaData | null }) {
  if (!quota) {
    return (
      <div className="min-w-[180px] border border-rule-strong bg-paper px-4 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Token quota
        </p>
        <p className="mt-2 text-sm text-muted-strong">Loading...</p>
      </div>
    );
  }

  const progress = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

  return (
    <div className="min-w-[220px] border border-rule-strong bg-paper px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Token quota
        </p>
        <p className="text-sm text-ink">
          {formatTokens(quota.used)} / {formatTokens(quota.limit)}
        </p>
      </div>
      <div className="mt-3 h-2 bg-paper-pure">
        <div
          className="h-full bg-ink transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-strong">
        {formatTokens(quota.remaining)} remaining this month
      </p>
    </div>
  );
}
