"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartKitButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/kits/create", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const { id } = await res.json();
      router.push(`/interview/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3"
      >
        {pending ? "Creating…" : "Start a new kit"}
      </button>
      {error ? (
        <p className="font-mono text-xs uppercase tracking-widest text-signal">
          {error}
        </p>
      ) : null}
    </div>
  );
}
