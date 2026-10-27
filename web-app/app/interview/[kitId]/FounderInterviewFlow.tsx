"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  LiveSiteStatus,
  StoredKitData,
} from "@/lib/types";
import { getVisiblePhaseStatus } from "@/lib/visible-phase";
import {
  getActiveStageId,
  type StageProgressStatus,
  type WorkspaceState,
} from "@/lib/workspace-view";
import type { SubmitFounderTurnResult } from "@/lib/founder-turn";
import { AgentComposer } from "./AgentComposer";
import { InspirationLockerPanel } from "./InspirationLockerPanel";
import { LiveOutputPanel } from "./LiveOutputPanel";
import { PhaseStrip } from "./PhaseStrip";
import { ProgressiveSnapshotCard } from "./ProgressiveSnapshotCard";

type WorkspaceSnapshot = {
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
  draftCheckpoint?: DraftCheckpoint;
  liveSite?: LiveSiteStatus | null;
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
  initialLiveSite: LiveSiteStatus;
  demoFallbackUrl?: string | null;
};

function applyTurnToSnapshot(result: SubmitFounderTurnResult): WorkspaceSnapshot {
  return {
    approvedKit: result.approvedKit,
    progressByStage: result.progressByStage,
    workspaceState: result.workspaceState,
    draftCheckpoint: result.draftCheckpoint,
    liveSite: result.liveSite,
  };
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
  initialLiveSite,
  demoFallbackUrl,
}: Props) {
  const [approvedKit, setApprovedKit] = useState(initialApprovedKit);
  const [progressByStage, setProgressByStage] = useState(initialProgressByStage);
  const [workspaceState, setWorkspaceState] = useState(initialWorkspaceState);
  const [draftCheckpoint, setDraftCheckpoint] = useState(initialDraftCheckpoint);
  const [inspirationItems, setInspirationItems] = useState(initialInspirationItems);
  const [liveSite, setLiveSite] = useState(initialLiveSite);
  const [fieldValuesByStage, setFieldValuesByStage] = useState<
    Partial<Record<StageId, Record<string, string>>>
  >({});
  const [freeTextByStage, setFreeTextByStage] = useState<
    Partial<Record<StageId, string>>
  >({});
  const [busy, setBusy] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [lockerOpen, setLockerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeStageId = getActiveStageId(progressByStage);
  const complete = STAGE_ORDER.every(
    (stageId) => progressByStage[stageId] === "passed",
  );
  const stageConfig = FOUNDER_STAGE_CONFIG[activeStageId];
  const stageRequirement = getStageRequirement(activeStageId, brandStage);
  const visiblePhaseStatus = getVisiblePhaseStatus(progressByStage);
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
    if (snapshot.liveSite) {
      setLiveSite(snapshot.liveSite);
    }
  }

  const refreshLiveSite = useCallback(async () => {
    const response = await fetch(`/api/kits/${kitId}/live-site-status`);
    if (!response.ok) return;
    const next = (await response.json()) as LiveSiteStatus;
    setLiveSite(next);
  }, [kitId]);

  useEffect(() => {
    if (!["queued", "generating", "running"].includes(liveSite.status)) return;
    void refreshLiveSite();
    const interval = window.setInterval(() => void refreshLiveSite(), 4000);
    return () => window.clearInterval(interval);
  }, [liveSite.status, refreshLiveSite]);

  async function handleContinue() {
    const message = buildFounderStageMessage(
      activeStageId,
      activeFieldValues,
      activeFreeText,
    );

    if (!message) {
      setError("Write one founder turn before sending it to the brand agent.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    setAgentMessage(null);

    const currentStageId = activeStageId;

    try {
      const response = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, message }),
      });
      const body = (await response.json()) as SubmitFounderTurnResult | { error?: string };

      if (!response.ok || !("appliedStages" in body)) {
        throw new Error("error" in body && body.error ? body.error : "Turn failed.");
      }

      applySnapshot(applyTurnToSnapshot(body));
      setAgentMessage(body.assistantMessage);

      if (body.appliedStages.length > 0) {
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
        setSuccess(body.visiblePhaseStatus);
      } else {
        setError(body.nextPrompt ?? stageRequirement.lookingFor);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-brand min-h-screen py-5 sm:py-8">
      <header className="border-b border-rule pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[64ch]">
            <p className="eyebrow mb-3 block">Brand cockpit / {kitName}</p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              {complete ? "System ready" : visiblePhaseStatus}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-strong sm:text-base">
              One conversation feeds the brand kit and the live v0 draft.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {experienceMode === "expert-led" ? (
          <div className="mt-5 border border-accent bg-accent-soft p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Acelera guidance requested
            </p>
            <p className="mt-2 text-sm text-ink">
              Expert-led mode
              {handoffRequestedAt
                ? ` requested on ${new Date(handoffRequestedAt).toLocaleDateString("en-US")}`
                : ""}.
            </p>
            <Link
              href={`/workspace/${kitId}`}
              className="mt-3 inline-flex text-sm text-accent underline-offset-4 hover:underline"
            >
              Open strategist workspace
            </Link>
          </div>
        ) : null}

        <div className="mt-5">
          <PhaseStrip progressByStage={progressByStage} />
        </div>
      </header>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)] xl:items-start">
        <div className="space-y-5">
          {complete ? (
            <section className="border border-rule-strong bg-paper-pure p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Guided flow complete
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">
                The canonical kit is ready.
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/kit/${kitId}`}
                  className="btn-primary px-5 py-3 text-center text-sm"
                >
                  Review kit
                </Link>
                <a
                  href={`/api/kits/${kitId}/export-md`}
                  className="btn-secondary px-5 py-3 text-center text-sm"
                >
                  Export markdown
                </a>
                <Link
                  href={`/kit/${kitId}/site`}
                  className="btn-secondary px-5 py-3 text-center text-sm"
                >
                  Site workspace
                </Link>
              </div>
            </section>
          ) : (
            <>
              <AgentComposer
                config={stageConfig}
                requirement={stageRequirement}
                values={activeFieldValues}
                freeText={activeFreeText}
                busy={busy}
                latestSavedAnswer={latestSavedAnswer}
                assistantMessage={agentMessage}
                error={error}
                success={success}
                onFieldChange={updateFieldValue}
                onFreeTextChange={updateFreeText}
                onSubmit={handleContinue}
                onOpenInspiration={() => setLockerOpen((open) => !open)}
              />

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

        <div className="space-y-5 xl:sticky xl:top-5">
          <LiveOutputPanel
            kitId={kitId}
            liveSite={liveSite}
            demoFallbackUrl={demoFallbackUrl}
            variant="hero"
          />

          <ProgressiveSnapshotCard snapshot={snapshot} />
        </div>
      </section>
    </main>
  );
}
