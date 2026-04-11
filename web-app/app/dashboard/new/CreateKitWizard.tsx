"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrandStage, ExperienceMode, InspirationItem } from "@/lib/types";

type Option = {
  value: BrandStage;
  number: string;
  title: string;
  description: string;
  example: string;
};

type ExtractResponse = {
  sourceMaterial: string;
  sourceMaterialMeta: unknown;
  inspirationItems: InspirationItem[];
};

const OPTIONS: readonly Option[] = [
  {
    value: "new",
    number: "01",
    title: "From scratch",
    description:
      "You are shaping the brand before the site, deck, or copy fully exists.",
    example:
      '"We know what we want to stand for, but we have not turned it into a usable brand system yet."',
  },
  {
    value: "existing",
    number: "02",
    title: "Already operating",
    description:
      "You already have customers, language, or a site and want to sharpen the brand behind it.",
    example:
      '"We are operating already, but the positioning and voice still feel blurry."',
  },
] as const;

function hasMaterialInput(opts: {
  url: string;
  rawText: string;
  githubRepo: string;
  pdfFile: File | null;
}) {
  return Boolean(
    opts.url.trim() ||
      opts.rawText.trim() ||
      opts.githubRepo.trim() ||
      opts.pdfFile,
  );
}

export function CreateKitWizard() {
  const router = useRouter();
  const [selected, setSelected] = useState<BrandStage>("new");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [creatingMode, setCreatingMode] = useState<ExperienceMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateKit(mode: ExperienceMode) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give the kit a name before starting.");
      return;
    }
    if (trimmedName.length > 80) {
      setError("Name must be 80 characters or fewer.");
      return;
    }

    setCreatingMode(mode);
    setError(null);

    try {
      let extracted:
        | Pick<
            ExtractResponse,
            "sourceMaterial" | "sourceMaterialMeta" | "inspirationItems"
          >
        | undefined;

      if (hasMaterialInput({ url, rawText, githubRepo, pdfFile })) {
        const formData = new FormData();
        if (url.trim()) formData.append("url", url.trim());
        if (rawText.trim()) formData.append("rawText", rawText.trim());
        if (githubRepo.trim()) formData.append("githubRepo", githubRepo.trim());
        if (pdfFile) formData.append("pdf", pdfFile);

        const extractRes = await fetch("/api/kits/extract-material", {
          method: "POST",
          body: formData,
        });
        const extractBody = (await extractRes.json().catch(() => ({}))) as
          | ExtractResponse
          | { error?: string };

        if (!extractRes.ok || !("sourceMaterial" in extractBody)) {
          throw new Error(
            "error" in extractBody && typeof extractBody.error === "string"
              ? extractBody.error
              : `Starter inspiration failed (${extractRes.status})`,
          );
        }

        extracted = extractBody;
      }

      const createRes = await fetch("/api/kits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          brandStage: selected,
          experienceMode: mode,
          sourceMaterial: extracted?.sourceMaterial ?? null,
          sourceMaterialMeta: extracted?.sourceMaterialMeta ?? null,
          inspirationItems: extracted?.inspirationItems ?? [],
        }),
      });

      const body = (await createRes.json().catch(() => ({}))) as
        | { id: string }
        | { error?: string };

      if (!createRes.ok || !("id" in body)) {
        throw new Error(
          "error" in body && typeof body.error === "string"
            ? body.error
            : `Kit creation failed (${createRes.status})`,
        );
      }

      router.push(`/interview/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreatingMode(null);
    }
  }

  const busy = creatingMode !== null;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8 sm:pb-10">
        <p className="eyebrow mb-4 block">New brand kit / guided kickoff</p>
        <h1 className="max-w-[14ch] font-display text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
          Start fast. Build the real kit as you go.
        </h1>
        <p className="mt-5 max-w-[62ch] text-base text-muted-strong sm:text-lg">
          The first version is founder-facing: one guided path, a usable draft
          before full completion, and a clear option to let Acelera guide the
          work with you when you want a lighter lift.
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <div className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Kit name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                maxLength={80}
                placeholder="e.g. Acelera founder-led rebrand"
                className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
              <p className="mt-2 text-xs text-muted">
                Keep it obvious enough that you can find it again on the
                dashboard without reading a UUID.
              </p>
            </label>
          </div>

          <section
            className="grid gap-4 sm:grid-cols-2"
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
                  onClick={() => {
                    setSelected(opt.value);
                    setError(null);
                  }}
                  className={`group flex flex-col border p-6 text-left transition-colors focus:outline-none focus-visible:border-accent ${
                    isSelected
                      ? "border-accent bg-accent-soft"
                      : "border-rule-strong bg-paper-pure hover:border-ink"
                  }`}
                >
                  <div className="mb-5 flex items-center justify-between border-b border-rule pb-3">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      {opt.number}
                    </p>
                    <p
                      className={`font-mono text-xs uppercase tracking-widest ${
                        isSelected ? "text-accent" : "text-muted opacity-0"
                      }`}
                    >
                      Selected
                    </p>
                  </div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {opt.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm text-muted-strong sm:text-base">
                    {opt.description}
                  </p>
                  <p className="mt-5 font-mono text-xs italic text-muted">
                    {opt.example}
                  </p>
                </button>
              );
            })}
          </section>

          <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-accent">
                  Optional inspiration before you start
                </p>
                <p className="mt-2 max-w-[58ch] text-sm text-muted-strong">
                  Add a link, pasted notes, a PDF, or a public GitHub repo now,
                  or skip this completely and bring inspiration into the flow
                  later. This no longer blocks the start of the interview.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaterialsOpen((open) => !open)}
                className="btn-secondary px-4 py-2 text-xs"
              >
                {materialsOpen ? "Hide sources" : "Add sources"}
              </button>
            </div>

            {materialsOpen ? (
              <div className="mt-6 grid gap-5">
                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Website URL
                  </span>
                  <input
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Notes, references, or copy
                  </span>
                  <textarea
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                    rows={7}
                    placeholder="Paste anything helpful: homepage copy, manifesto fragments, strategist notes, competitors you love or hate."
                    className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Public GitHub repo
                  </span>
                  <input
                    type="url"
                    value={githubRepo}
                    onChange={(event) => setGithubRepo(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    PDF upload
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-muted-strong file:mr-4 file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-xs file:font-mono file:uppercase file:tracking-widest file:text-ink"
                  />
                  <p className="mt-2 text-xs text-muted">
                    Public repos only. PDF extraction stays capped at 5 MB.
                  </p>
                </label>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            What the founder sees
          </p>
          <h2 className="mt-3 max-w-[16ch] font-display text-3xl font-semibold tracking-tight text-ink">
            A guided brand conversation, not an operator console.
          </h2>
          <div className="mt-6 space-y-4 border-t border-rule pt-5 text-sm text-muted-strong">
            <p>Reach the first real question in under a minute.</p>
            <p>Get a usable draft checkpoint before the entire methodology is done.</p>
            <p>Add inspiration anytime instead of front-loading all the prep.</p>
            <p>
              Choose whether you want the self-serve guided path or a more
              expert-led Acelera handoff from the start.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => handleCreateKit("guided")}
              disabled={busy}
              className="btn-primary w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingMode === "guided"
                ? "Starting guided flow..."
                : "Start guided brand kit"}
            </button>
            <button
              type="button"
              onClick={() => handleCreateKit("expert-led")}
              disabled={busy}
              className="btn-secondary w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingMode === "expert-led"
                ? "Opening expert-led flow..."
                : "Have Acelera guide this with me"}
            </button>
          </div>

          <p className="mt-4 text-xs text-muted">
            Both paths keep the same methodology. The difference is how much of
            the synthesis you want to actively drive yourself.
          </p>
        </aside>
      </section>

      {error ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-signal">
          {error}
        </p>
      ) : null}

      <footer className="mt-10 border-t border-rule pt-6">
        <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </footer>
    </main>
  );
}
