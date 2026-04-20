"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildFounderStageMessage,
  FOUNDER_STAGE_CONFIG,
} from "@/lib/founder-journey";
import { buildProgressiveSnapshot } from "@/lib/progressive-snapshot";
import {
  getStageRequirement,
  STAGE_ORDER,
  type StageId,
} from "@/lib/stage-requirements";
import type {
  BrandStage,
  DraftCheckpoint,
  ExperienceMode,
  InspirationItem,
  StoredKitData,
} from "@/lib/types";
import {
  getActiveStageId,
  type StageProgressStatus,
  type WorkspaceState,
} from "@/lib/workspace-view";
import { FounderStageComposer } from "./FounderStageComposer";
import { InspirationLockerPanel } from "./InspirationLockerPanel";
import { PostStage5ContextReviewCard } from "./PostStage5ContextReviewCard";
import { ProgressiveSnapshotCard } from "./ProgressiveSnapshotCard";

type WorkspaceSnapshot = {
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
  draftCheckpoint?: DraftCheckpoint;
};

type Props = {
  kitId: string;
  kitName: string;
  brandStage: BrandStage;
  experienceMode: ExperienceMode;
  handoffRequestedAt: string | null;
  initialApprovedKit: StoredKitData;
  initialProgressByStage: Partial<Record<StageId, StageProgressStatus>>;
  initialWorkspaceState: WorkspaceState;
  initialDraftCheckpoint: DraftCheckpoint;
  initialInspirationItems: InspirationItem[];
};

function getStatusLabel(
  stageId: StageId,
  activeStageId: StageId,
  progressByStage: Partial<Record<StageId, StageProgressStatus>>,
) {
  const status = progressByStage[stageId] ?? "empty";
  if (status === "passed") {
    return "done";
  }
  if (stageId === activeStageId) {
    return "current";
  }
  return "next";
}

export function FounderInterviewFlow({
  kitId,
  kitName,
  brandStage,
  experienceMode,
  handoffRequestedAt,
  initialApprovedKit,
  initialProgressByStage,
  initialWorkspaceState,
  initialDraftCheckpoint,
  initialInspirationItems,
}: Props) {
  const [approvedKit, setApprovedKit] = useState(initialApprovedKit);
  const [progressByStage, setProgressByStage] = useState(initialProgressByStage);
  const [workspaceState, setWorkspaceState] = useState(initialWorkspaceState);
  const [draftCheckpoint, setDraftCheckpoint] = useState(initialDraftCheckpoint);
  const [inspirationItems, setInspirationItems] = useState(initialInspirationItems);
  const [fieldValuesByStage, setFieldValuesByStage] = useState<
    Partial<Record<StageId, Record<string, string>>>
  >({});
  const [freeTextByStage, setFreeTextByStage] = useState<
    Partial<Record<StageId, string>>
  >({});
  const [busy, setBusy] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [lockerOpen, setLockerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeStageId = getActiveStageId(progressByStage);
  const complete = STAGE_ORDER.every(
    (stageId) => progressByStage[stageId] === "passed",
  );
  const completedCount = STAGE_ORDER.filter(
    (stageId) => progressByStage[stageId] === "passed",
  ).length;
  const stageConfig = FOUNDER_STAGE_CONFIG[activeStageId];
  const stageRequirement = getStageRequirement(activeStageId, brandStage);
  const snapshot = useMemo(
    () => buildProgressiveSnapshot(draftCheckpoint, approvedKit),
    [approvedKit, draftCheckpoint],
  );
  const activeFieldValues = fieldValuesByStage[activeStageId] ?? {};
  const activeFreeText = freeTextByStage[activeStageId] ?? "";
  const latestSavedAnswer =
    workspaceState.latestUserByStage[activeStageId]?.content ?? null;

  function updateFieldValue(key: string, value: string) {
    setFieldValuesByStage((current) => ({
      ...current,
      [activeStageId]: {
        ...(current[activeStageId] ?? {}),
        [key]: value,
      },
    }));
  }

  function updateFreeText(value: string) {
    setFreeTextByStage((current) => ({
      ...current,
      [activeStageId]: value,
    }));
  }

  function applySnapshot(snapshot: WorkspaceSnapshot) {
    setApprovedKit(snapshot.approvedKit);
    setProgressByStage(snapshot.progressByStage);
    setWorkspaceState(snapshot.workspaceState);
    if (snapshot.draftCheckpoint) {
      setDraftCheckpoint(snapshot.draftCheckpoint);
    }
  }

  async function streamAssistantTurn(message: string) {
    const response = await fetch("/api/interview/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kitId, stageId: activeStageId, message }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Guided reply failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamed = "";
    let done = false;

    while (!done) {
      const { value, done: chunkDone } = await reader.read();
      if (chunkDone) {
        done = true;
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let separatorIndex: number;
      while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        for (const line of rawEvent.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as {
            delta?: string;
            error?: string;
            done?: boolean;
          };

          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.delta) {
            streamed += payload.delta;
            setCoachMessage(streamed);
          }
          if (payload.done) {
            done = true;
          }
        }
      }
    }

    return streamed.trim();
  }

  async function handleContinue() {
    const message = buildFounderStageMessage(
      activeStageId,
      activeFieldValues,
      activeFreeText,
    );

    if (!message) {
      setError("Add a structured answer or free-text note before continuing.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    setCoachMessage(null);

    const currentStageId = activeStageId;

    try {
      await streamAssistantTurn(message);

      const approvalResponse = await fetch(
        `/api/workspace/cards/${currentStageId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kitId }),
        },
      );

      const approvalBody = (await approvalResponse.json()) as
        | ({
            passed: true;
          } & WorkspaceSnapshot)
        | { passed: false; reason?: string };

      if (!approvalResponse.ok || !approvalBody.passed) {
        setError(
          "reason" in approvalBody && approvalBody.reason
            ? approvalBody.reason
            : stageRequirement.lookingFor,
        );
        return;
      }

      applySnapshot(approvalBody);
      setFieldValuesByStage((current) => {
        const next = { ...current };
        delete next[currentStageId];
        return next;
      });
      setFreeTextByStage((current) => {
        const next = { ...current };
        delete next[currentStageId];
        return next;
      });
      setCoachMessage(null);
      setExamplesOpen(false);
      setSuccess("Saved. The next milestone is ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSkipForNow() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await streamAssistantTurn(
        "I want to skip this for now. Give me the minimum viable answer structure or a simpler angle to answer this stage.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  const headerTitle = complete ? "Full brand kit complete" : stageConfig.milestone;
  const headerIntro = complete
    ? "The methodology is complete. Review the canonical kit, export it, and generate a site only if you need that next."
    : stageConfig.intro;

  return (
    <main className="container-brand min-h-screen py-10 sm:py-14">
      <header className="border-b border-rule pb-8 sm:pb-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[62ch]">
            <p className="eyebrow mb-4 block">Guided brand kit / {kitName}</p>
            <h1 className="font-display text-[clamp(2.3rem,5vw,4.3rem)] font-semibold leading-[0.95] tracking-tightest text-ink">
              {headerTitle}
            </h1>
            <p className="mt-4 text-base text-muted-strong sm:text-lg">
              {headerIntro}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {completedCount} / {STAGE_ORDER.length} complete
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm">
                Dashboard
              </Link>
              {complete ? (
                <Link href={`/kit/${kitId}`} className="btn-primary px-4 py-2 text-sm">
                  Open final kit
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {experienceMode === "expert-led" ? (
          <div className="mt-6 border border-accent bg-accent-soft p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Acelera guidance requested
            </p>
            <p className="mt-2 text-sm text-ink">
              You chose the expert-led path
              {handoffRequestedAt ? ` on ${new Date(handoffRequestedAt).toLocaleDateString("en-US")}` : ""}.
              You can still answer directly here, but you do not need to force
              every answer up front. Drop what you have and let the team carry
              more of the synthesis when needed.
            </p>
            <Link
              href={`/workspace/${kitId}`}
              className="mt-3 inline-flex text-sm text-accent underline-offset-4 hover:underline"
            >
              Open strategist workspace
            </Link>
          </div>
        ) : null}
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3 xl:grid-cols-9">
        {STAGE_ORDER.map((stageId, index) => {
          const statusLabel = getStatusLabel(stageId, activeStageId, progressByStage);
          return (
            <div
              key={stageId}
              className={`border p-3 ${
                statusLabel === "done"
                  ? "border-accent bg-accent-soft"
                  : statusLabel === "current"
                    ? "border-rule-strong bg-paper-pure"
                    : "border-rule bg-paper"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {`${index + 1}`.padStart(2, "0")}
              </p>
              <p className="mt-2 font-display text-sm font-medium text-ink">
                {FOUNDER_STAGE_CONFIG[stageId].milestone}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {statusLabel}
              </p>
            </div>
          );
        })}
      </section>

      {progressByStage["stage_5"] === "passed" && approvedKit.beforeAfter ? (
        <PostStage5ContextReviewCard kitId={kitId} />
      ) : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-6">
          {complete ? (
            <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Guided flow complete
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                The canonical kit is ready.
              </h2>
              <div className="mt-5 space-y-4 border-t border-rule pt-4 text-sm text-muted-strong">
                <p>
                  Use the full brand kit as the source of truth for voice,
                  positioning, templates, and visual direction.
                </p>
                <p>
                  Export the markdown if you need a portable artifact. Generate
                  a site only as a secondary extension of the finished kit.
                </p>
              </div>
            </section>
          ) : (
            <>
              <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-accent">
                  Current milestone
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                  {stageConfig.title}
                </h2>
                <p className="mt-4 max-w-[58ch] text-sm text-muted-strong sm:text-base">
                  {stageRequirement.question}
                </p>
                <div className="mt-5 border-t border-rule pt-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    What this step needs
                  </p>
                  <p className="mt-2 text-sm text-muted-strong">
                    {stageRequirement.lookingFor}
                  </p>
                  <p className="mt-3 text-sm text-muted-strong">{stageConfig.helper}</p>
                </div>
              </section>

              <FounderStageComposer
                config={stageConfig}
                values={activeFieldValues}
                freeText={activeFreeText}
                busy={busy}
                onFieldChange={updateFieldValue}
                onFreeTextChange={updateFreeText}
              />

              <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={busy}
                    className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Processing..." : "Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipForNow}
                    disabled={busy}
                    className="btn-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamplesOpen((open) => !open)}
                    disabled={busy}
                    className="btn-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {examplesOpen ? "Hide examples" : "Need an example"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockerOpen((open) => !open)}
                    disabled={busy}
                    className="btn-secondary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {lockerOpen ? "Hide inspiration" : "Add inspiration"}
                  </button>
                </div>

                {success ? (
                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
                    {success}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-signal">
                    {error}
                  </p>
                ) : null}

                {coachMessage ? (
                  <div className="mt-5 border border-rule bg-paper p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-accent">
                      Guide response
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-strong">
                      {coachMessage}
                    </p>
                  </div>
                ) : latestSavedAnswer ? (
                  <div className="mt-5 border border-rule bg-paper p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      Latest answer saved for this milestone
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-strong">
                      {latestSavedAnswer}
                    </p>
                  </div>
                ) : null}

                {examplesOpen ? (
                  <div className="mt-5 border border-rule bg-paper p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-accent">
                      Example directions
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-strong">
                      {stageConfig.examples.map((example) => (
                        <li key={example} className="border-l border-rule pl-3">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              {lockerOpen ? (
                <InspirationLockerPanel
                  kitId={kitId}
                  items={inspirationItems}
                  busy={busy}
                  onItemsChange={setInspirationItems}
                />
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-6">
          <ProgressiveSnapshotCard snapshot={snapshot} />

          <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Founder path
            </p>
            <div className="mt-4 space-y-4 text-sm text-muted-strong">
              <p>One milestone at a time, with the gate logic handled behind the scenes.</p>
              <p>Add context whenever you have it instead of front-loading all the prep.</p>
              <p>
                The final kit stays the primary output. Site generation remains
                secondary and only unlocks after the full methodology is complete.
              </p>
            </div>
          </section>

          {complete ? (
            <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Final outputs
              </p>
              <div className="mt-4 grid gap-3">
                <Link
                  href={`/kit/${kitId}`}
                  className="btn-primary px-6 py-3 text-sm text-center"
                >
                  Review full brand kit
                </Link>
                <a
                  href={`/api/kits/${kitId}/export-md`}
                  className="btn-secondary px-6 py-3 text-sm text-center"
                >
                  Download markdown
                </a>
                <Link
                  href={`/kit/${kitId}/site`}
                  className="btn-secondary px-6 py-3 text-sm text-center"
                >
                  Generate optional site
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
