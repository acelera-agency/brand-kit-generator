import type { GenerationData, IterationData, DeviceFrame } from "./types";

type Props = {
  generation: GenerationData | null;
  selectedIteration: IterationData | null;
  canEdit: boolean;
  onGenerate: () => void;
  generating: boolean;
  quotaRemaining: number;
  deviceFrame: DeviceFrame;
  onDeviceFrameChange: (frame: DeviceFrame) => void;
  iterations: IterationData[];
  selectedIterationId: string | null;
  onNavigateVersion: (direction: "prev" | "next") => void;
};

const DEVICE_WIDTHS: Record<DeviceFrame, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PreviewPanel({
  generation,
  selectedIteration,
  canEdit,
  onGenerate,
  generating,
  quotaRemaining,
  deviceFrame,
  onDeviceFrameChange,
  iterations,
  selectedIterationId,
  onNavigateVersion,
}: Props) {
  const previewUrl = selectedIteration?.demoUrl ?? generation?.demoUrl ?? null;
  const selectedIndex = iterations.findIndex((i) => i.id === selectedIterationId);
  const canPrev = selectedIndex < iterations.length - 1;
  const canNext = selectedIndex > 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-rule bg-paper px-4 py-2">
        <div className="flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as DeviceFrame[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDeviceFrameChange(d)}
              className={`px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                deviceFrame === d
                  ? "text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {d === "desktop" ? "Desktop" : d === "tablet" ? "Tablet" : "Mobile"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {iterations.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigateVersion("prev")}
                disabled={!canPrev}
                className="px-1.5 py-1 text-muted hover:text-ink disabled:opacity-30 transition-colors"
              >
                ◀
              </button>
              <span className="font-mono text-[11px] text-muted-strong">
                {selectedIndex >= 0
                  ? `v${iterations[selectedIndex].turnIndex + 1} / ${iterations.length}`
                  : `${iterations.length} versions`}
              </span>
              <button
                type="button"
                onClick={() => onNavigateVersion("next")}
                disabled={!canNext}
                className="px-1.5 py-1 text-muted hover:text-ink disabled:opacity-30 transition-colors"
              >
                ▶
              </button>
            </div>
          )}

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              Open ↗
            </a>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onGenerate}
              disabled={generating || quotaRemaining <= 0}
              className="btn-primary px-3 py-1.5 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating || generation?.status === "generating"
                ? "Generating..."
                : generation
                  ? "Regenerate"
                  : "Generate"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto bg-paper-pure p-4">
        {previewUrl ? (
          <div
            className="relative overflow-hidden border border-rule-strong bg-paper shadow-[0_18px_48px_rgba(11,15,20,0.08)] transition-all duration-300"
            style={{
              width: DEVICE_WIDTHS[deviceFrame],
              maxWidth: "100%",
              height: deviceFrame === "desktop" ? "100%" : `${deviceFrame === "tablet" ? 1024 : 812}px`,
            }}
          >
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              title="Generated site preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-rule-strong mb-4 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
              </svg>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              No preview yet
            </p>
            <p className="mt-2 text-sm text-muted-strong">
              Generate the first version from the chat panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
