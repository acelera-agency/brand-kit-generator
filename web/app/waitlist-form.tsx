"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-accent bg-accent-soft p-6">
        <p className="font-display text-lg text-ink">
          You&apos;re on the list.
        </p>
        <p className="text-sm text-muted-strong mt-2">
          We&apos;ll send one email when the hosted version is ready. No
          newsletter, no marketing sequence.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        disabled={status === "loading"}
        className="flex-1 px-4 py-4 bg-paper-pure border border-rule-strong text-ink font-body text-base placeholder:text-muted focus:outline-none focus:border-accent disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary disabled:opacity-50"
      >
        {status === "loading" ? "Joining..." : "Join the waitlist"}
      </button>
      {status === "error" && error && (
        <p className="text-signal text-sm font-mono basis-full mt-2">
          {error}
        </p>
      )}
    </form>
  );
}
