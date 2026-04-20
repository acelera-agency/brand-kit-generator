"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { EditableFieldPath } from "@/lib/kit-field-paths";

type Props = {
  kitId: string;
  path: EditableFieldPath;
  value: string;
  canEdit: boolean;
  className?: string;
  textareaClassName?: string;
  minRows?: number;
};

function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function InlineEditableText({
  kitId,
  path,
  value,
  canEdit,
  className,
  textareaClassName,
  minRows = 4,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      autoSize(taRef.current);
      taRef.current?.focus();
    }
  }, [editing]);

  if (!canEdit || !editing) {
    return (
      <div className="group relative">
        <div className={className}>
          {value}
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setWarnings([]);
              setError(null);
              setEditing(true);
            }}
            className="absolute right-0 top-0 font-mono text-[10px] uppercase tracking-widest text-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
            aria-label="Edit this field"
          >
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  const onSave = () => {
    setError(null);
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      setError("Cannot save an empty value.");
      return;
    }
    start(async () => {
      try {
        const res = await fetch(`/api/kits/${kitId}/field`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, value: trimmed }),
        });
        if (!res.ok) {
          const body: { error?: string } = await res
            .json()
            .catch(() => ({ error: "save_failed" }));
          setError(body.error ?? "save_failed");
          return;
        }
        const body: { warnings?: string[] } = await res
          .json()
          .catch(() => ({}));
        setWarnings(body.warnings ?? []);
        setEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "save_failed");
      }
    });
  };

  return (
    <div>
      <textarea
        ref={(el) => {
          taRef.current = el;
          autoSize(el);
        }}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autoSize(e.currentTarget);
        }}
        rows={minRows}
        disabled={pending}
        className={
          textareaClassName ??
          "w-full min-h-[120px] rounded border border-rule-strong bg-paper-pure p-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
        }
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="btn-primary px-3 py-1.5 text-[11px] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="btn-secondary px-3 py-1.5 text-[11px] disabled:opacity-60"
        >
          Cancel
        </button>
        {error ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-rose-600">
            {error}
          </span>
        ) : null}
      </div>
      {warnings.length > 0 ? (
        <p className="mt-2 text-xs text-amber-700">
          Saved with warnings: {warnings.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
