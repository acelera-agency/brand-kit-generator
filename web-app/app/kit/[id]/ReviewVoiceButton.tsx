"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  kitId: string;
  hasVoice: boolean;
  lastReviewedAt: string | null;
};

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

export function ReviewVoiceButton({ kitId, hasVoice, lastReviewedAt }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasVoice) return null;

  const relative = formatRelative(lastReviewedAt);
  const label = pending
    ? "Reviewing…"
    : lastReviewedAt
      ? "Re-run voice review"
      : "Run voice review";

  const onClick = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch(`/api/kits/${kitId}/lint`, { method: "POST" });
        if (!res.ok) {
          const body: { error?: string } = await res
            .json()
            .catch(() => ({ error: "lint_failed" }));
          setError(body.error ?? "lint_failed");
          return;
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "lint_failed");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn-secondary px-3 py-1.5 text-[11px] disabled:opacity-60"
      >
        {label}
      </button>
      {relative && !pending && !error ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {relative}
        </span>
      ) : null}
      {error ? (
        <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
