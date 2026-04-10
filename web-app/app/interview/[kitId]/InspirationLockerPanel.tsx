"use client";

import { useState } from "react";
import type { InspirationItem } from "@/lib/types";

type Props = {
  kitId: string;
  items: InspirationItem[];
  busy: boolean;
  onItemsChange: (items: InspirationItem[]) => void;
};

export function InspirationLockerPanel({
  kitId,
  items,
  busy,
  onItemsChange,
}: Props) {
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [noteLabel, setNoteLabel] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving || busy) return;

    const formData = new FormData();
    if (url.trim()) formData.append("url", url.trim());
    if (rawText.trim()) formData.append("rawText", rawText.trim());
    if (noteLabel.trim()) formData.append("noteLabel", noteLabel.trim());
    if (githubRepo.trim()) formData.append("githubRepo", githubRepo.trim());
    if (pdfFile) formData.append("pdf", pdfFile);

    if ([...formData.keys()].length === 0) {
      setError("Add a link, notes, a PDF, or a public GitHub repo first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/kits/${kitId}/inspiration`, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => ({}))) as
        | { inspirationItems: InspirationItem[]; error?: string }
        | { error?: string };

      if (!response.ok || !("inspirationItems" in body)) {
        throw new Error(
          "error" in body && typeof body.error === "string"
            ? body.error
            : `Could not save inspiration (${response.status})`,
        );
      }

      onItemsChange(body.inspirationItems);
      setUrl("");
      setRawText("");
      setNoteLabel("");
      setGithubRepo("");
      setPdfFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-rule pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Inspiration locker
          </p>
          <p className="mt-2 max-w-[58ch] text-sm text-muted-strong">
            Add context whenever you have it. The interview treats this as raw
            material, not as unquestioned truth.
          </p>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {items.length} saved
        </span>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Website URL
          </span>
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={saving || busy}
            placeholder="https://example.com"
            className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Notes or inspiration
          </span>
          <input
            type="text"
            value={noteLabel}
            onChange={(event) => setNoteLabel(event.target.value)}
            disabled={saving || busy}
            placeholder="Optional label, e.g. founder notes"
            className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
          />
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            rows={5}
            disabled={saving || busy}
            placeholder="Paste notes, reference copy, inspiration, or the vibe you want the brand to lean into."
            className="mt-2 w-full resize-none border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
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
            disabled={saving || busy}
            placeholder="https://github.com/owner/repo"
            className="mt-2 w-full border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
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
            disabled={saving || busy}
            className="mt-2 block w-full text-sm text-muted-strong file:mr-4 file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-xs file:font-mono file:uppercase file:tracking-widest file:text-ink disabled:opacity-50"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || busy}
          className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving inspiration..." : "Save to locker"}
        </button>
        {error ? (
          <p className="font-mono text-xs uppercase tracking-widest text-signal">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted">
            You can add more context later without restarting the kit.
          </p>
        )}
      </div>

      {items.length > 0 ? (
        <div className="mt-6 space-y-3 border-t border-rule pt-5">
          {items
            .slice()
            .reverse()
            .map((item) => (
              <article
                key={item.id}
                className="border border-rule bg-paper p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-accent">
                      {item.kind}
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-ink">
                      {item.label}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted">
                    {item.charCount} chars
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-strong">
                  {item.content.length > 280
                    ? `${item.content.slice(0, 280)}...`
                    : item.content}
                </p>
              </article>
            ))}
        </div>
      ) : null}
    </section>
  );
}
