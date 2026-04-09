"use client";

import { useState, useEffect, useCallback } from "react";

type GenerationStatus = "pending" | "generating" | "completed" | "failed";

type GenerationData = {
  id: string;
  status: GenerationStatus;
  demoUrl: string | null;
  error: string | null;
};

type Props = {
  kitId: string;
  passedCount: number;
  generation: GenerationData | null;
};

export function SitePreview({ kitId, passedCount, generation }: Props) {
  const [status, setStatus] = useState<GenerationStatus | "none">(
    generation?.status ?? "none",
  );
  const [demoUrl, setDemoUrl] = useState<string | null>(generation?.demoUrl ?? null);
  const [error, setError] = useState<string | null>(generation?.error ?? null);
  const [generating, setGenerating] = useState(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/kits/${kitId}/site-status`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.status === "none") {
      setStatus("none");
      return;
    }

    setStatus(data.status);
    setDemoUrl(data.demoUrl);
    setError(data.error);
  }, [kitId]);

  useEffect(() => {
    if (status === "generating" || status === "pending") {
      const interval = setInterval(poll, 4000);
      return () => clearInterval(interval);
    }
  }, [status, poll]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setStatus("generating");

    try {
      const res = await fetch(`/api/kits/${kitId}/generate-site`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        setStatus("failed");
        return;
      }

      setStatus("generating");
      poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setStatus("failed");
    } finally {
      setGenerating(false);
    }
  }

  if (passedCount < 9) {
    return (
      <div className="border border-dashed border-rule-strong bg-paper p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {passedCount} / 9 stages complete
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          Complete your brand kit first
        </h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
          You need to finish all 9 interview stages before generating a site.
          Return to the interview or kit view to continue.
        </p>
        <a
          href={`/interview/${kitId}`}
          className="btn-primary mt-6 inline-block px-6 py-3 text-sm"
        >
          Continue interview
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={generating || status === "generating"}
          className="btn-primary px-6 py-3 text-sm"
        >
          {generating || status === "generating"
            ? "Generating..."
            : generation
              ? "Regenerate site"
              : "Generate site"}
        </button>

        {status === "generating" && (
          <p className="text-sm text-muted-strong animate-pulse">
            v0 is building your site. This takes 30-90 seconds...
          </p>
        )}

        {status === "failed" && error && (
          <p className="text-sm text-red-600">Failed: {error}</p>
        )}
      </div>

      {status === "completed" && demoUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-4">
            <h2 className="font-display text-xl font-semibold text-ink">
              Live preview
            </h2>
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              Open in new tab
            </a>
          </div>

          <div className="border border-rule-strong bg-paper-pure overflow-hidden shadow-[0_8px_28px_rgba(11,15,20,0.05)]">
            <iframe
              src={demoUrl}
              className="w-full border-0"
              style={{ height: "80vh" }}
              title="Generated site preview"
            />
          </div>
        </div>
      )}

      {status === "completed" && !demoUrl && (
        <div className="border border-rule-strong bg-paper p-8 text-center">
          <p className="text-sm text-muted-strong">
            Site generated but no preview URL available. Check the v0 dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
