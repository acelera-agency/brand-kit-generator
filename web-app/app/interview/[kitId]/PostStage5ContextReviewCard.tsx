"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  kitId: string;
};

const storageKey = (kitId: string) => `voiceReviewOffered:${kitId}`;

export function PostStage5ContextReviewCard({ kitId }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(storageKey(kitId)) === "1");
  }, [kitId]);

  if (dismissed === null || dismissed) return null;

  const markOffered = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(kitId), "1");
    }
    setDismissed(true);
  };

  const onRun = () => {
    setError(null);
    start(async () => {
      try {
        const res = await fetch(`/api/kits/${kitId}/lint`, { method: "POST" });
        if (!res.ok) {
          const body: { error?: string } = await res.json().catch(() => ({}));
          setError(body.error ?? "Review failed.");
          return;
        }
        markOffered();
        router.push(`/kit/${kitId}#context`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Review failed.");
      }
    });
  };

  const onSkip = () => {
    markOffered();
  };

  return (
    <section className="mt-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-amber-800">
        Voice rules just landed
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
        Your Context was written before your voice rules existed.
      </h3>
      <p className="mt-2 text-sm text-muted-strong max-w-[60ch]">
        Run a quick voice review now to see where the Context drifts from the
        voice you just committed to. You will be able to accept or skip each
        suggested rewrite.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={pending}
          className="btn-primary px-4 py-2 text-[11px] disabled:opacity-60"
        >
          {pending ? "Reviewing…" : "Run Context review"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={pending}
          className="btn-secondary px-4 py-2 text-[11px] disabled:opacity-60"
        >
          Skip
        </button>
        {error ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">
            {error}
          </span>
        ) : null}
      </div>
    </section>
  );
}
