import type { IterationData } from "./types";

function formatTokens(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k tok`;
  }

  return `${value} tok`;
}

type Props = {
  iterations: IterationData[];
  currentVersionId: string | null;
  selectedIterationId: string | null;
  canEdit: boolean;
  restoringIterationId: string | null;
  onSelect: (iterationId: string) => void;
  onRestore: (iterationId: string) => void;
};

export function HistoryList({
  iterations,
  currentVersionId,
  selectedIterationId,
  canEdit,
  restoringIterationId,
  onSelect,
  onRestore,
}: Props) {
  return (
    <section className="border border-rule-strong bg-paper p-5 sm:p-6">
      <div className="border-b border-rule pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          History
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
          Iteration timeline
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        {iterations.length === 0 ? (
          <div className="border border-dashed border-rule-strong bg-paper-pure px-4 py-8 text-sm text-muted-strong">
            Your versions will appear here after the first generation finishes.
          </div>
        ) : null}

        {iterations.map((iteration) => {
          const isCurrent = Boolean(
            iteration.versionId && currentVersionId && iteration.versionId === currentVersionId,
          );
          const isSelected = iteration.id === selectedIterationId;

          return (
            <article
              key={iteration.id}
              className={`border px-4 py-4 transition-colors ${
                isSelected
                  ? "border-ink bg-paper-pure"
                  : "border-rule bg-paper"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-semibold text-ink">
                      v{iteration.turnIndex + 1}
                    </p>
                    {isCurrent ? (
                      <span className="process-tag process-tag-active">current</span>
                    ) : null}
                    <span className="text-sm text-muted-strong">
                      {iteration.actorEmail ?? "unknown user"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-strong">
                    {iteration.userMessage ?? "Initial generation"}
                  </p>
                </div>

                <div className="text-right text-xs text-muted">
                  {formatTokens(iteration.tokensCharged)}
                </div>
              </div>

              {iteration.error ? (
                <p className="mt-3 text-sm text-[#a13c1d]">{iteration.error}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(iteration.id)}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Preview
                </button>

                {canEdit && iteration.status === "completed" && iteration.versionId && !isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onRestore(iteration.id)}
                    disabled={restoringIterationId === iteration.id}
                    className="btn-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {restoringIterationId === iteration.id
                      ? "Restoring..."
                      : "Continue from here"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
