import type { FoundationCardView } from "@/lib/workspace-view";

type Props = {
  card: FoundationCardView;
  busy: boolean;
  onApprove: (stageId: FoundationCardView["stageId"]) => void;
  onAdjust: (stageId: FoundationCardView["stageId"]) => void;
  onRegenerate: (stageId: FoundationCardView["stageId"]) => void;
};

const STATUS_STYLES: Record<FoundationCardView["status"], string> = {
  passed: "border-accent text-accent",
  active: "border-rule-strong text-ink",
  locked: "border-rule text-muted",
};

export function FoundationCard({
  card,
  busy,
  onApprove,
  onAdjust,
  onRegenerate,
}: Props) {
  const locked = card.status === "locked";
  const passed = card.progress === "passed";

  return (
    <article
      className={`flex h-full flex-col border bg-paper-pure p-4 sm:p-5 ${
        locked ? "border-rule opacity-70" : "border-rule-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-rule pb-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Foundation
          </p>
          <h2 className="mt-2 font-display text-lg font-medium text-ink">
            {card.title}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLES[card.status]}`}
          >
            {passed ? "passed" : card.status}
          </span>
          {card.hasFreshDraft ? (
            <span className="inline-flex border border-accent bg-accent-soft px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
              New draft ready
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 pt-4">
        <ul className="space-y-2 text-sm leading-relaxed text-muted-strong">
          {card.preview.map((line, index) => (
            <li key={`${card.stageId}-${index}`} className="border-l border-rule pl-3">
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4">
        <button
          type="button"
          disabled={busy || locked || passed}
          onClick={() => onApprove(card.stageId)}
          className="btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy || locked}
          onClick={() => onAdjust(card.stageId)}
          className="btn-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Adjust
        </button>
        <button
          type="button"
          disabled={busy || locked}
          onClick={() => onRegenerate(card.stageId)}
          className="btn-secondary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Regenerate
        </button>
      </div>
    </article>
  );
}
