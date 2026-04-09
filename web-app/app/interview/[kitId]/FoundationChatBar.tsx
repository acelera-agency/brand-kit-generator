import { STAGE_LABELS, type StageId } from "@/lib/stage-requirements";
import type { BrandStage } from "@/lib/types";
import { AssistantBubble } from "./AssistantBubble";
import { StageHintCard } from "./StageHintCard";

type Props = {
  activeStageId: StageId;
  brandStage: BrandStage;
  hasMessages: boolean;
  hasSourceMaterial: boolean;
  latestAssistantMessage: string;
  input: string;
  quickReplies: string[];
  busy: boolean;
  onInputChange: (value: string) => void;
  onQuickReply: (value: string) => void;
  onSubmit: () => void;
  onStart: () => void;
};

export function FoundationChatBar({
  activeStageId,
  brandStage,
  hasMessages,
  hasSourceMaterial,
  latestAssistantMessage,
  input,
  quickReplies,
  busy,
  onInputChange,
  onQuickReply,
  onSubmit,
  onStart,
}: Props) {
  return (
    <section className="border border-rule-strong bg-paper-pure p-4 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow block">Intake</p>
            <h2 className="mt-2 font-display text-2xl font-medium text-ink">
              {STAGE_LABELS[activeStageId]}
            </h2>
          </div>
          {hasSourceMaterial ? (
            <p className="max-w-[40ch] border border-rule bg-accent-soft px-3 py-2 text-xs text-ink">
              Source material is loaded as context, but this workspace still waits
              for your approval card by card.
            </p>
          ) : null}
        </div>

        {!hasMessages ? (
          <div className="border border-dashed border-rule-strong bg-paper p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Start the workspace
            </p>
            <p className="mx-auto mt-3 max-w-[46ch] text-sm text-muted-strong">
              Begin with the first generator prompt, then approve or refine each
              foundation card as the workspace fills in.
            </p>
            <button
              type="button"
              onClick={onStart}
              disabled={busy}
              className="btn-primary mt-5 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Starting..." : "Start foundation"}
            </button>
          </div>
        ) : (
          <>
            <AssistantBubble content={latestAssistantMessage} streaming={busy} compact />
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => onQuickReply(reply)}
                  disabled={busy}
                  className="border border-rule-strong px-3 py-2 text-left font-mono text-[11px] uppercase tracking-widest text-ink transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
            <StageHintCard stageId={activeStageId} brandStage={brandStage} compact />
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Free-text escape hatch
              </span>
              <textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                rows={3}
                disabled={busy}
                placeholder="Answer in your own words or steer the draft somewhere sharper."
                className="mt-2 w-full resize-none border border-rule-strong bg-paper-pure px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50 sm:text-base"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    onSubmit();
                  }
                }}
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-muted">Cmd/Ctrl + Enter to send</p>
              <button
                type="button"
                onClick={onSubmit}
                disabled={busy || !input.trim()}
                className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
