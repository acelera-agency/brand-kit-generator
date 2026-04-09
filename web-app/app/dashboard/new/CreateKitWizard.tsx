"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrandStage, SourceMaterialMeta } from "@/lib/types";

type Option = {
  value: BrandStage;
  number: string;
  title: string;
  description: string;
  example: string;
};

type ExtractResponse = {
  sourceMaterial: string;
  sourceMaterialMeta: SourceMaterialMeta;
};

const OPTIONS: readonly Option[] = [
  {
    value: "new",
    number: "01",
    title: "From scratch",
    description:
      "Pre-launch. No clients yet, no copy, no website. You're designing the brand before the first asset exists.",
    example:
      '"I want to start a brand for X but I have not shipped anything yet."',
  },
  {
    value: "existing",
    number: "02",
    title: "Already operating",
    description:
      "You have clients, copy, maybe a site. You're refining or rebranding what already exists.",
    example:
      '"We have been operating for 18 months and want to redo the brand kit."',
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
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<BrandStage | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sourceMaterialPreview, setSourceMaterialPreview] = useState("");
  const [lastExtractedMaterial, setLastExtractedMaterial] = useState("");
  const [sourceMaterialMeta, setSourceMaterialMeta] =
    useState<SourceMaterialMeta | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearExtractedMaterial() {
    setSourceMaterialPreview("");
    setLastExtractedMaterial("");
    setSourceMaterialMeta(null);
    setWarnings([]);
  }

  function handleMaterialInputChange(updater: () => void) {
    updater();
    if (sourceMaterialMeta || sourceMaterialPreview) {
      clearExtractedMaterial();
    }
    setError(null);
  }

  async function handleExtractMaterials() {
    if (extracting) return;

    if (!hasMaterialInput({ url, rawText, githubRepo, pdfFile })) {
      setError("Add at least one source before extracting materials.");
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (url.trim()) formData.append("url", url.trim());
      if (rawText.trim()) formData.append("rawText", rawText.trim());
      if (githubRepo.trim()) formData.append("githubRepo", githubRepo.trim());
      if (pdfFile) formData.append("pdf", pdfFile);

      const res = await fetch("/api/kits/extract-material", {
        method: "POST",
        body: formData,
      });

      const body = (await res.json().catch(() => ({}))) as
        | ExtractResponse
        | { error?: string; warnings?: string[] };

      if (!res.ok || !("sourceMaterial" in body) || !("sourceMaterialMeta" in body)) {
        const errorMessage =
          "error" in body && typeof body.error === "string"
            ? body.error
            : `Request failed (${res.status})`;
        throw new Error(errorMessage);
      }

      setSourceMaterialPreview(body.sourceMaterial);
      setLastExtractedMaterial(body.sourceMaterial);
      setSourceMaterialMeta(body.sourceMaterialMeta);
      setWarnings(body.sourceMaterialMeta.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExtracting(false);
    }
  }

  async function handleCreateKit() {
    if (!selected || creating) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give the kit a name before starting the interview.");
      setStep(1);
      return;
    }
    if (trimmedName.length > 80) {
      setError("Name must be 80 characters or fewer.");
      setStep(1);
      return;
    }

    if (
      hasMaterialInput({ url, rawText, githubRepo, pdfFile }) &&
      !sourceMaterialPreview.trim()
    ) {
      setError(
        "Extract the materials first, or clear the fields if you want to skip this step.",
      );
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const preview = sourceMaterialPreview.trim();
      const previewWasEdited =
        Boolean(lastExtractedMaterial) && preview !== lastExtractedMaterial;
      const meta =
        preview && sourceMaterialMeta
          ? {
              ...sourceMaterialMeta,
              totalChars: preview.length,
              warnings: previewWasEdited
                ? [
                    ...sourceMaterialMeta.warnings,
                    "Imported material was manually edited before the interview started.",
                  ]
                : sourceMaterialMeta.warnings,
            }
          : null;

      const res = await fetch("/api/kits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          brandStage: selected,
          sourceMaterial: preview || null,
          sourceMaterialMeta: meta,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/interview/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  }

  const materialsAdded = hasMaterialInput({ url, rawText, githubRepo, pdfFile });

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8 sm:pb-10">
        <p className="eyebrow mb-4 block">
          New brand kit / Step {step} of 2
        </p>
        <h1 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-tightest text-ink max-w-[18ch]">
          {step === 1
            ? "What kind of brand are you building?"
            : "Add any materials worth mining before the interview."}
        </h1>
        <p className="mt-5 max-w-[60ch] text-base text-muted-strong sm:text-lg">
          {step === 1
            ? "The interview adapts to your starting point. Pick the case that fits - it changes which questions you will be asked and how the generator pushes back."
            : "Optional, but useful. Import a website, pasted notes, a PDF, or a public GitHub repo. The interview will treat them as background context and still ask you to confirm or correct the final answers."}
        </p>
      </header>

      {step === 1 ? (
        <>
        <section className="mt-10 border border-rule-strong bg-paper-pure p-5 sm:p-6">
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
              placeholder="e.g. Acme rebrand 2026"
              className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
            />
            <p className="mt-2 text-xs text-muted">
              Required. Must be unique across your workspace so you can find it again on the dashboard.
            </p>
          </label>
        </section>
        <section
          className="mt-6 grid gap-6 sm:grid-cols-2"
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
                className={`group flex flex-col text-left border p-6 sm:p-8 transition-colors focus:outline-none focus-visible:border-accent ${
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
        </>
      ) : (
        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-5">
            <div className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
              <div className="grid gap-5">
                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Website URL
                  </span>
                  <input
                    type="url"
                    value={url}
                    onChange={(event) =>
                      handleMaterialInputChange(() => setUrl(event.target.value))
                    }
                    placeholder="https://example.com"
                    className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="block">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    Pasted notes or copy
                  </span>
                  <textarea
                    value={rawText}
                    onChange={(event) =>
                      handleMaterialInputChange(() => setRawText(event.target.value))
                    }
                    rows={8}
                    placeholder="Paste any manifesto, website copy, strategist notes, or sales language here."
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
                    onChange={(event) =>
                      handleMaterialInputChange(() =>
                        setGithubRepo(event.target.value),
                      )
                    }
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
                    onChange={(event) =>
                      handleMaterialInputChange(() =>
                        setPdfFile(event.target.files?.[0] ?? null),
                      )
                    }
                    className="mt-2 block w-full text-sm text-muted-strong file:mr-4 file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-xs file:font-mono file:uppercase file:tracking-widest file:text-ink"
                  />
                  <p className="mt-2 text-xs text-muted">
                    Public repos only. PDF extraction is capped at 5 MB.
                  </p>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExtractMaterials}
                disabled={extracting || !materialsAdded}
                className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extracting ? "Extracting..." : "Extract materials"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl("");
                  setRawText("");
                  setGithubRepo("");
                  setPdfFile(null);
                  clearExtractedMaterial();
                  setError(null);
                }}
                disabled={extracting || creating || !materialsAdded}
                className="btn-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear materials
              </button>
            </div>
          </div>

          <div className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Imported context preview
            </p>
            <p className="mt-3 max-w-[52ch] text-sm text-muted-strong">
              The interview will quote from this context when helpful, but it
              will still ask you to confirm, sharpen, or reject the final answer
              at each stage.
            </p>

            {warnings.length > 0 ? (
              <div className="mt-5 space-y-2 border border-rule bg-paper p-4">
                {warnings.map((warning) => (
                  <p
                    key={warning}
                    className="font-mono text-[11px] uppercase tracking-widest text-signal"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}

            {sourceMaterialPreview ? (
              <label className="mt-5 block">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  Edit before continuing
                </span>
                <textarea
                  value={sourceMaterialPreview}
                  onChange={(event) => {
                    setSourceMaterialPreview(event.target.value);
                    setError(null);
                  }}
                  rows={18}
                  className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-accent"
                />
              </label>
            ) : (
              <div className="mt-5 border border-dashed border-rule-strong bg-paper p-6 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Nothing extracted yet
                </p>
                <p className="mx-auto mt-3 max-w-[40ch] text-sm text-muted-strong">
                  Add one or more materials, then run extraction to preview the
                  combined context that will be saved with the kit.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {error ? (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-signal">
          {error}
        </p>
      ) : null}

      <footer className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="btn-secondary self-start px-4 py-2 text-sm"
          >
            Cancel
          </Link>
          {step === 2 ? (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              disabled={extracting || creating}
              className="btn-secondary self-start px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
        </div>

        {step === 1 ? (
          <button
            type="button"
            onClick={() => {
              const trimmedName = name.trim();
              if (!trimmedName) {
                setError("Give the kit a name before continuing.");
                return;
              }
              if (trimmedName.length > 80) {
                setError("Name must be 80 characters or fewer.");
                return;
              }
              if (!selected) {
                setError("Pick the brand stage before continuing.");
                return;
              }
              setStep(2);
              setError(null);
            }}
            disabled={!selected || !name.trim()}
            className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to materials
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreateKit}
            disabled={extracting || creating}
            className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating..." : "Start interview"}
          </button>
        )}
      </footer>
    </main>
  );
}
