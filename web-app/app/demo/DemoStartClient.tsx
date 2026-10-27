"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { LiveOutputPanel } from "@/app/interview/[kitId]/LiveOutputPanel";
import type { LiveSiteStatus } from "@/lib/types";

const STARTER_CONTEXT =
  "We used to sell brand workshops as a final deliverable, but founders now need a living workspace that turns their answers into usable assets while they are still thinking. The old way waits for a perfect brief. This version starts with one sharp contradiction, drafts in v0, and gets better with each approved milestone.";

const ACTIVE_STATUSES = new Set<LiveSiteStatus["status"]>([
  "queued",
  "generating",
  "running",
]);

type Props = {
  fallbackUrl: string | null;
};

type DemoStartResponse = {
  kitId: string;
  interviewUrl: string;
  liveSite: LiveSiteStatus;
};

export function DemoStartClient({ fallbackUrl }: Props) {
  const [brandName, setBrandName] = useState("Live Brand Demo");
  const [context, setContext] = useState(STARTER_CONTEXT);
  const [kitId, setKitId] = useState<string | null>(null);
  const [interviewUrl, setInterviewUrl] = useState<string | null>(null);
  const [liveSite, setLiveSite] = useState<LiveSiteStatus>({ status: "none" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLiveSite = useCallback(async () => {
    if (!kitId) return;
    const response = await fetch(`/api/kits/${kitId}/live-site-status`);
    if (!response.ok) return;
    const next = (await response.json()) as LiveSiteStatus;
    setLiveSite(next);
  }, [kitId]);

  useEffect(() => {
    if (!kitId || !ACTIVE_STATUSES.has(liveSite.status)) return;
    void refreshLiveSite();
    const interval = window.setInterval(() => void refreshLiveSite(), 4000);
    return () => window.clearInterval(interval);
  }, [kitId, liveSite.status, refreshLiveSite]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setLiveSite({ status: "queued", sourceStageId: "stage_0" });

    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, context }),
      });
      const body = (await response.json()) as
        | DemoStartResponse
        | { error?: string; reason?: string };

      if (!response.ok) {
        const failure = body as { error?: string; reason?: string };
        throw new Error(failure.error ?? failure.reason ?? "Failed to start demo.");
      }

      if (!("kitId" in body)) {
        throw new Error("Failed to start demo.");
      }

      setKitId(body.kitId);
      setInterviewUrl(body.interviewUrl);
      setLiveSite(body.liveSite);
    } catch (err) {
      setLiveSite({ status: "failed", sourceStageId: "stage_0" });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper py-5 sm:py-8">
      <div className="container-brand">
        <header className="flex flex-col gap-4 border-b border-rule pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3 block">Hackathon demo / v0 live draft</p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              Start with one answer. v0 drafts while you think.
            </h1>
            <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted-strong sm:text-base">
              A founder turn becomes brand signal, kit progress, and a live site draft.
            </p>
          </div>
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-xs">
            Dashboard
          </Link>
        </header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(380px,1.08fr)] xl:items-start">
          <form
            onSubmit={handleSubmit}
            className="border border-rule-strong bg-paper-pure p-4 sm:p-5 lg:p-6"
          >
            <div className="grid grid-cols-3 gap-2 border-b border-rule pb-4">
              {["Signal", "Positioning", "System"].map((step) => (
                <p
                  key={step}
                  className="border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted"
                >
                  {step}
                </p>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Demo brand
              </span>
              <input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                disabled={busy}
                className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
              />
            </label>

            <label className="mt-5 block">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Founder turn
              </span>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                rows={7}
                disabled={busy}
                placeholder="Tell me what changed, what you reject, or paste your current positioning."
                className="mt-2 min-h-[180px] w-full resize-y border border-rule bg-paper px-4 py-3 text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
              />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full px-6 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {busy ? "Starting draft..." : "Start live draft"}
              </button>
              {interviewUrl ? (
                <Link href={interviewUrl} className="btn-secondary w-full px-5 py-3 text-center text-xs sm:w-auto">
                  Open full cockpit
                </Link>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 border border-signal bg-paper px-3 py-2 text-sm text-signal">
                {error}
              </p>
            ) : null}
          </form>

          <div className="xl:sticky xl:top-5">
            <LiveOutputPanel
              kitId={kitId}
              liveSite={liveSite}
              demoFallbackUrl={fallbackUrl}
              variant="hero"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
