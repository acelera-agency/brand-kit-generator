import type { GenerationData, IterationData } from "./types";

type Props = {
  generation: GenerationData | null;
  selectedIteration: IterationData | null;
  canEdit: boolean;
  onGenerate: () => void;
  generating: boolean;
  quotaRemaining: number;
};

export function PreviewPane({
  generation,
  selectedIteration,
  canEdit,
  onGenerate,
  generating,
  quotaRemaining,
}: Props) {
  const previewUrl = selectedIteration?.demoUrl ?? generation?.demoUrl ?? null;
  const currentLabel = selectedIteration
    ? `v${selectedIteration.turnIndex + 1}`
    : generation?.versionId
      ? "Current"
      : null;

  return (
    <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-rule pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Preview
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
            {currentLabel ? `${currentLabel} workspace preview` : "Live site preview"}
          </h2>
          <p className="mt-2 text-sm text-muted-strong">
            {selectedIteration?.userMessage
              ? `Showing: ${selectedIteration.userMessage}`
              : "Review the latest generated version and branch from any previous turn."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              Open in new tab
            </a>
          ) : null}

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canEdit || generating || quotaRemaining <= 0}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating || generation?.status === "generating"
              ? "Generating..."
              : generation
                ? "Regenerate"
                : "Generate site"}
          </button>
        </div>
      </div>

      {generation?.status === "failed" && generation.error ? (
        <div className="mt-5 border border-[#d39a82] bg-[#fff2eb] px-4 py-3 text-sm text-[#7d2f14]">
          {generation.error}
        </div>
      ) : null}

      {previewUrl ? (
        <div className="mt-5 overflow-hidden border border-rule-strong bg-paper shadow-[0_18px_48px_rgba(11,15,20,0.08)]">
          <iframe
            src={previewUrl}
            className="w-full border-0"
            style={{ height: "78vh" }}
            title="Generated site preview"
          />
        </div>
      ) : (
        <div className="mt-5 border border-dashed border-rule-strong bg-paper px-6 py-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            No preview yet
          </p>
          <p className="mt-3 text-base text-muted-strong">
            Generate the first version to unlock history, iteration chat, and restore.
          </p>
        </div>
      )}
    </section>
  );
}
