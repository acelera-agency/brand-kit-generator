import type { EditableCardView } from "@/lib/workspace-view";

type Props = {
  open: boolean;
  card: EditableCardView | null;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function CardEditorSheet({
  open,
  card,
  value,
  busy,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open || !card) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 sm:p-6">
      <div className="w-full max-w-3xl border border-rule-strong bg-paper-pure p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Adjust {card.title}
            </p>
            <h2 className="mt-2 font-display text-xl font-medium text-ink">
              Refine this card
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-3 py-2 text-xs"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="border border-rule bg-paper p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Current preview
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-strong">
              {card.preview.map((line, index) => (
                <li key={`${card.stageId}-preview-${index}`} className="border-l border-rule pl-3">
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              What should change?
            </span>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              rows={8}
              disabled={busy}
              placeholder="Give the generator a sharper instruction for this card."
              className="mt-2 w-full resize-none border border-rule-strong bg-paper-pure px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-4">
          <p className="font-mono text-xs text-muted">
            The refinement is sent back into this stage only.
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !value.trim()}
            className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending..." : "Send refinement"}
          </button>
        </div>
      </div>
    </div>
  );
}
