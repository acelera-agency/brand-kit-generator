import Link from "next/link";
import { getDemoFallbackPreview } from "@/lib/demo-mode";
import type { LiveSiteStatus } from "@/lib/types";

type Props = {
  kitId?: string | null;
  liveSite: LiveSiteStatus;
  demoFallbackUrl?: string | null;
  variant?: "default" | "hero";
};

const ACTIVE_STATUSES = new Set<LiveSiteStatus["status"]>([
  "queued",
  "generating",
  "running",
]);

function getStatusCopy(liveSite: LiveSiteStatus) {
  if (liveSite.status === "none") {
    return {
      label: "Not started",
      title: "Your first answer starts the v0 draft.",
      body: "Save the first milestone and the working site starts from real founder context instead of an empty template.",
    };
  }

  if (ACTIVE_STATUSES.has(liveSite.status)) {
    return {
      label: liveSite.status === "queued" ? "Queued" : "v0 working",
      title: "v0 is shaping the working site.",
      body: "Keep answering. Each approved milestone becomes a tighter instruction for the same live draft.",
    };
  }

  if (liveSite.status === "completed") {
    return {
      label: liveSite.sourceStageId
        ? `Updated from ${liveSite.sourceStageId.replace("_", " ")}`
        : "Live draft ready",
      title: "The live draft is taking shape.",
      body: "Use it as the visible artifact while the brand kit gets sharper. The final site can still be generated later.",
    };
  }

  return {
    label: liveSite.status === "paused" ? "Paused" : "Needs attention",
    title: liveSite.status === "paused" ? "v0 drafting is paused." : "The latest v0 draft failed.",
    body:
      liveSite.error ??
      "The interview is still saved. You can keep moving and retry the draft later.",
  };
}

function ProgressChecklist({ status }: { status: LiveSiteStatus["status"] }) {
  const items = [
    {
      label: "Signal saved",
      done: status !== "none",
    },
    {
      label: "v0 drafting",
      done: ["generating", "running", "completed"].includes(status),
    },
    {
      label: "Preview ready",
      done: status === "completed",
    },
  ];

  return (
    <div className="mt-5 grid gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between border border-rule bg-paper px-3 py-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {item.label}
          </span>
          <span
            className={`h-2.5 w-2.5 ${
              item.done ? "bg-accent" : "bg-rule-strong"
            }`}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}

function WireframePreview() {
  return (
    <div className="mt-5 border border-rule bg-paper p-4">
      <div className="grid gap-3">
        <div className="h-4 w-24 bg-rule-strong" />
        <div className="h-10 w-3/4 bg-rule" />
        <div className="h-3 w-full bg-rule" />
        <div className="h-3 w-2/3 bg-rule" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="h-16 bg-paper-pure" />
          <div className="h-16 bg-paper-pure" />
          <div className="h-16 bg-paper-pure" />
        </div>
      </div>
    </div>
  );
}

export function LiveOutputPanel({
  kitId,
  liveSite,
  demoFallbackUrl,
  variant = "default",
}: Props) {
  const copy = getStatusCopy(liveSite);
  const active = ACTIVE_STATUSES.has(liveSite.status);
  const preview = getDemoFallbackPreview(liveSite, demoFallbackUrl);
  const previewHeight =
    variant === "hero" ? "h-[220px] sm:h-[360px] xl:h-[520px]" : "h-[260px] sm:h-[320px]";

  return (
    <section className="border border-rule-strong bg-paper-pure p-4 sm:p-5 lg:p-6" aria-live="polite">
      <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Live output
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold leading-tight text-ink sm:text-2xl">
            {copy.title}
          </h2>
        </div>
        <p className="shrink-0 border border-rule bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          {copy.label}
        </p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-strong">{copy.body}</p>

      {active ? (
        <ProgressChecklist status={liveSite.status} />
      ) : null}

      {liveSite.status === "none" ? <WireframePreview /> : null}

      {preview.previewUrl ? (
        <div className="mt-5 overflow-hidden border border-rule-strong bg-paper">
          <iframe
            src={preview.previewUrl}
            className={`${previewHeight} w-full border-0`}
            title="Live v0 draft preview"
          />
        </div>
      ) : null}

      {preview.notice ? (
        <p className="mt-3 border border-rule bg-paper px-3 py-2 text-xs text-muted-strong">
          {preview.notice}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {preview.previewUrl ? (
          <a
            href={preview.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-4 py-2 text-xs"
          >
            {preview.usingFallback ? "Open saved preview" : "Open live draft"}
          </a>
        ) : null}
        {kitId ? (
          <Link href={`/kit/${kitId}/site`} className="btn-secondary px-4 py-2 text-xs">
            Site workspace
          </Link>
        ) : null}
      </div>
    </section>
  );
}
