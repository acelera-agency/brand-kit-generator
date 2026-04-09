"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  kitId: string;
  kitName: string;
};

export function DeleteKitButton({ kitId, kitName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm(
      `Delete "${kitName}"? This removes the interview history and the kit. This cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/kits/${kitId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${kitName}`}
        className="inline-flex items-center gap-1.5 border border-rule-strong bg-paper px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink transition-colors hover:border-signal hover:bg-signal hover:text-paper-pure disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="h-3.5 w-3.5"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A1.75 1.75 0 0 0 7 2.75V3H4.25a.75.75 0 0 0 0 1.5h.34l.86 11.16A2.25 2.25 0 0 0 7.7 18h4.6a2.25 2.25 0 0 0 2.25-2.09l.86-11.16h.34a.75.75 0 0 0 0-1.5H13v-.25A1.75 1.75 0 0 0 11.25 1h-2.5ZM8.5 2.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3v-.25ZM8.5 7a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 8.5 7Zm3.75.75a.75.75 0 0 0-1.5 0v6a.75.75 0 0 0 1.5 0v-6Z"
            clipRule="evenodd"
          />
        </svg>
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {error ? (
        <p className="max-w-[16ch] text-right font-mono text-[10px] uppercase tracking-widest text-signal">
          {error}
        </p>
      ) : null}
    </div>
  );
}
