"use client";

import type { FormEvent } from "react";
import type { FounderStageConfig } from "@/lib/founder-journey";
import type { StageRequirement } from "@/lib/stage-requirements";

type Props = {
  config: FounderStageConfig;
  requirement: StageRequirement;
  values: Record<string, string>;
  freeText: string;
  busy: boolean;
  latestSavedAnswer: string | null;
  assistantMessage: string | null;
  error: string | null;
  success: string | null;
  onFieldChange: (key: string, value: string) => void;
  onFreeTextChange: (value: string) => void;
  onSubmit: () => void;
  onOpenInspiration: () => void;
};

export function AgentComposer({
  config,
  requirement,
  values,
  freeText,
  busy,
  latestSavedAnswer,
  assistantMessage,
  error,
  success,
  onFieldChange,
  onFreeTextChange,
  onSubmit,
  onOpenInspiration,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-rule-strong bg-paper-pure p-4 sm:p-5 lg:p-6"
    >
      <div className="border-b border-rule pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Brand agent
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
          {config.title}
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-strong">
          {requirement.question}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Founder turn
        </span>
        <textarea
          value={freeText}
          onChange={(event) => onFreeTextChange(event.target.value)}
          rows={7}
          disabled={busy}
          placeholder="Tell me what changed, what you reject, or paste your current positioning."
          className="mt-2 min-h-[180px] w-full resize-y border border-rule bg-paper px-4 py-3 text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
        />
      </label>

      <details className="mt-4 border border-rule bg-paper">
        <summary className="cursor-pointer px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted">
          Need structure?
        </summary>
        <div className="grid gap-4 border-t border-rule p-4">
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
                className="mt-2 w-full resize-y border border-rule bg-paper-pure px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50"
              />
              {field.hint ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">{field.hint}</p>
              ) : null}
            </label>
          ))}
        </div>
      </details>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Sending..." : "Send to brand agent"}
        </button>
        <button
          type="button"
          onClick={onOpenInspiration}
          disabled={busy}
          className="btn-secondary w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Add inspiration
        </button>
      </div>

      {success ? (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-signal bg-paper px-3 py-2 text-sm text-signal">
          {error}
        </p>
      ) : null}

      {assistantMessage ? (
        <div className="mt-5 border border-rule bg-paper p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Agent response
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-strong">
            {assistantMessage}
          </p>
        </div>
      ) : latestSavedAnswer ? (
        <div className="mt-5 border border-rule bg-paper p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Last saved signal
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-strong">
            {latestSavedAnswer}
          </p>
        </div>
      ) : null}
    </form>
  );
}
