"use client";

import type { FounderStageConfig } from "@/lib/founder-journey";

type Props = {
  config: FounderStageConfig;
  values: Record<string, string>;
  freeText: string;
  busy: boolean;
  onFieldChange: (key: string, value: string) => void;
  onFreeTextChange: (value: string) => void;
};

export function FounderStageComposer({
  config,
  values,
  freeText,
  busy,
  onFieldChange,
  onFreeTextChange,
}: Props) {
  return (
    <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
      <div className="border-b border-rule pb-5">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Structured answer blocks
        </p>
        <p className="mt-2 max-w-[58ch] text-sm text-muted-strong">
          Use the blocks below if they help you think. You can still steer in
          your own words in the free-text field at the end.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        {config.fields.map((field) => (
          <label key={field.key} className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {field.label}
            </span>
            <textarea
              value={values[field.key] ?? ""}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
              rows={field.rows ?? 3}
              disabled={busy}
              placeholder={field.placeholder}
              className="mt-2 w-full resize-none border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
            />
            {field.hint ? (
              <p className="mt-2 text-xs text-muted">{field.hint}</p>
            ) : null}
          </label>
        ))}

        <label className="block border-t border-rule pt-5">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Free-text notes
          </span>
          <textarea
            value={freeText}
            onChange={(event) => onFreeTextChange(event.target.value)}
            rows={4}
            disabled={busy}
            placeholder="Use this if you want to override, qualify, or sharpen the structured answer."
            className="mt-2 w-full resize-none border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
          />
        </label>
      </div>
    </section>
  );
}
