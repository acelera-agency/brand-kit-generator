"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrandStage } from "@/lib/types";

type Option = {
  value: BrandStage;
  number: string;
  title: string;
  description: string;
  example: string;
};

const OPTIONS: readonly Option[] = [
  {
    value: "new",
    number: "01",
    title: "From scratch",
    description:
      "Pre-launch. No clients yet, no copy, no website. You're designing the brand before the first asset exists.",
    example:
      "“I want to start a brand for X but I haven't shipped anything yet.”",
  },
  {
    value: "existing",
    number: "02",
    title: "Already operating",
    description:
      "You have clients, copy, maybe a site. You're refining or rebranding what's already there.",
    example:
      "“We've been operating for 18 months and we want to redo the brand kit.”",
  },
] as const;

export function CreateKitWizard() {
  const router = useRouter();
  const [selected, setSelected] = useState<BrandStage | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/kits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandStage: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/interview/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8 sm:pb-10">
        <p className="eyebrow mb-4 block">New brand kit / Step 1 of 1</p>
        <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-tightest text-ink max-w-[18ch]">
          What kind of brand are you building?
        </h1>
        <p className="mt-5 max-w-[60ch] text-base text-muted-strong sm:text-lg">
          The interview adapts to your starting point. Pick the case that fits
          — it changes which questions you&apos;ll be asked and how the
          generator pushes back.
        </p>
      </header>

      <section
        className="mt-10 grid gap-6 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Brand stage"
      >
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(opt.value)}
              className={`group flex flex-col text-left border p-6 sm:p-8 transition-colors focus:outline-none focus-visible:border-accent ${
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-rule-strong bg-paper-pure hover:border-ink"
              }`}
            >
              <div className="flex items-center justify-between border-b border-rule pb-3 mb-5">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  {opt.number}
                </p>
                <p
                  className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                    isSelected ? "text-accent" : "text-muted opacity-0"
                  }`}
                >
                  Selected
                </p>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {opt.title}
              </h2>
              <p className="mt-3 text-sm text-muted-strong sm:text-base flex-1">
                {opt.description}
              </p>
              <p className="mt-5 font-mono text-xs italic text-muted">
                {opt.example}
              </p>
            </button>
          );
        })}
      </section>

      {error ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-signal">
          {error}
        </p>
      ) : null}

      <footer className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm self-start sm:self-auto">
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || pending}
          className="btn-primary px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Creating…" : "Continue"}
        </button>
      </footer>
    </main>
  );
}
