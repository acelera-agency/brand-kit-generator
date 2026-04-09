"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import type { StageId } from "@/lib/stage-requirements";
import type { BrandStage, StoredKitData } from "@/lib/types";
import {
  buildWorkspaceView,
  type StageProgressStatus,
  type WorkspaceState,
  type WorkspaceView,
} from "@/lib/workspace-view";
import { CardEditorSheet } from "./CardEditorSheet";
import { FoundationCard } from "./FoundationCard";
import { FoundationChatBar } from "./FoundationChatBar";
import { HomepageDraftSection } from "./HomepageDraftSection";
import { ManualModulesSection } from "./ManualModulesSection";
import { WorkspaceShell } from "./WorkspaceShell";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  kitId: string;
  brandStage: BrandStage;
  hasSourceMaterial: boolean;
  initialMessages: ChatMessage[];
  initialPassedCount: number;
  initialApprovedKit: StoredKitData;
  initialWorkspaceState: WorkspaceState;
  initialProgressByStage: Partial<Record<StageId, StageProgressStatus>>;
  initialWorkspaceView: WorkspaceView;
};

type ToastState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

type WorkspaceSnapshot = {
  approvedKit: StoredKitData;
  progressByStage: Partial<Record<StageId, StageProgressStatus>>;
  workspaceState: WorkspaceState;
};

const QUICK_REPLY_MAP: Record<StageId, string[]> = {
  stage_0: ["The old way breaks because...", "We need this brand now because...", "The contradiction is..."],
  stage_1: ["The category keeps rewarding...", "We want to make this behavior extinct...", "The real enemy is..."],
  stage_2: ["Character: ...", "Promise: ...", "Method: ..."],
  stage_3: ["We are not for clients who...", "Saying no will cost us...", "We refuse to be the brand that..."],
  stage_4: ["A fit customer says...", "In the first 10 minutes we listen for...", "A bad-fit signal is..."],
  stage_5: ["The voice must sound like...", "We never write phrases like...", "A before/after pair is..."],
  stage_6: ["Homepage hero draft...", "Cold outreach subject lines...", "First-minute script..."],
  stage_7: ["The visual reference should feel like...", "Forbidden visuals include...", "Typography direction..."],
  stage_8: ["Outreach rule...", "Sales-meeting rule...", "Proposal rule..."],
};

function shallowMergeApprovedKit(
  current: StoredKitData,
  patch: Record<string, unknown>,
): StoredKitData {
  return { ...current, ...patch };
}

export function InterviewChat({
  kitId,
  brandStage,
  hasSourceMaterial,
  initialMessages,
  initialPassedCount,
  initialApprovedKit,
  initialWorkspaceState,
  initialProgressByStage,
  initialWorkspaceView,
}: Props) {
  const [approvedKit, setApprovedKit] = useState(initialApprovedKit);
  const [workspaceState, setWorkspaceState] = useState(initialWorkspaceState);
  const [, setProgressByStage] = useState(initialProgressByStage);
  const [workspaceView, setWorkspaceView] = useState(initialWorkspaceView);
  const [passedCount, setPassedCount] = useState(initialPassedCount);
  const [input, setInput] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [editorStageId, setEditorStageId] = useState<StageId | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [streamDraft, setStreamDraft] = useState("");
  const [hasMessages, setHasMessages] = useState(initialMessages.length > 0);
  const [toast, setToast] = useState<ToastState>(null);

  const busy = streaming || syncing;
  const activeStageId = workspaceView.activeStageId;
  const activeCard =
    workspaceView.foundationCards.find((card) => card.stageId === editorStageId) ??
    workspaceView.manualModules.find((module) => module.stageId === editorStageId) ??
    null;

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  function applyWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
    startTransition(() => {
      setApprovedKit(snapshot.approvedKit);
      setWorkspaceState(snapshot.workspaceState);
      setProgressByStage(snapshot.progressByStage);
      setWorkspaceView(
        buildWorkspaceView({
          approvedKit: snapshot.approvedKit,
          workspaceState: snapshot.workspaceState,
          progressByStage: snapshot.progressByStage,
        }),
      );
      setPassedCount(
        Object.values(snapshot.progressByStage).filter(
          (status) => status === "passed",
        ).length,
      );
    });
  }

  async function syncWorkspace(): Promise<WorkspaceSnapshot> {
    const response = await fetch("/api/workspace/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kitId }),
    });

    if (!response.ok) {
      throw new Error(`Workspace sync failed (${response.status})`);
    }

    return (await response.json()) as WorkspaceSnapshot;
  }

  async function streamAssistantTurn({
    stageId,
    message,
  }: {
    stageId: StageId;
    message?: string;
  }) {
    setStreaming(true);
    setSyncing(false);
    setStreamDraft("");
    setToast(null);
    setHasMessages(true);

    try {
      const response = await fetch("/api/interview/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, stageId, message }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
              done?: boolean;
              error?: string;
            };

            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.delta) {
              setStreamDraft((current) => current + payload.delta);
            }
            if (payload.done) {
              done = true;
            }
          }
        }
      }

      setStreaming(false);
      setSyncing(true);
      const snapshot = await syncWorkspace();
      applyWorkspaceSnapshot(snapshot);
      setStreamDraft("");
      return snapshot;
    } catch (error) {
      console.error("[interview/workspace] stream failed", error);
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setStreaming(false);
      setSyncing(false);
    }
  }

  async function handleSubmit() {
    if (!input.trim() || busy) return;
    const message = input.trim();
    setInput("");
    await streamAssistantTurn({ stageId: activeStageId, message });
  }

  async function handleApprove(stageId: StageId) {
    if (busy) return;
    setSyncing(true);
    setToast(null);

    try {
      const response = await fetch(`/api/workspace/cards/${stageId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId }),
      });
      const body = (await response.json()) as
        | ({
            passed: true;
            gateResult: { data: Record<string, unknown> };
          } & WorkspaceSnapshot)
        | { passed: false; reason?: string };

      if (!response.ok || !body.passed) {
        const reason = "reason" in body ? body.reason : undefined;
        throw new Error(reason ?? `Approval failed (${response.status})`);
      }

      const mergedApprovedKit = shallowMergeApprovedKit(
        approvedKit,
        body.gateResult.data,
      );
      const mergedSnapshot: WorkspaceSnapshot = {
        approvedKit: mergedApprovedKit,
        progressByStage: body.progressByStage,
        workspaceState: body.workspaceState,
      };

      applyWorkspaceSnapshot(mergedSnapshot);
      setToast({ kind: "success", message: "Card approved and workspace advanced." });

      const updatedView = buildWorkspaceView({
        approvedKit: mergedApprovedKit,
        workspaceState: body.workspaceState,
        progressByStage: body.progressByStage,
      });

      if (updatedView.activeStageId !== stageId) {
        await streamAssistantTurn({ stageId: updatedView.activeStageId });
      }
    } catch (error) {
      console.error("[interview/workspace] approve failed", error);
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleRegenerate(stageId: StageId) {
    if (busy) return;
    setSyncing(true);
    setToast(null);

    try {
      const response = await fetch(`/api/workspace/cards/${stageId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId }),
      });
      if (!response.ok) {
        throw new Error(`Regeneration failed (${response.status})`);
      }

      applyWorkspaceSnapshot((await response.json()) as WorkspaceSnapshot);
      setToast({ kind: "success", message: "Fresh draft generated for this card." });
    } catch (error) {
      console.error("[interview/workspace] regenerate failed", error);
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleEditorSubmit() {
    if (!editorStageId || !editorValue.trim() || busy) return;

    try {
      await streamAssistantTurn({
        stageId: editorStageId,
        message: editorValue.trim(),
      });
      setEditorStageId(null);
      setEditorValue("");
      setToast({ kind: "success", message: "Refinement sent back into the card." });
    } catch {
      return;
    }
  }

  const latestAssistantMessage =
    streamDraft ||
    workspaceState.latestAssistantByStage[activeStageId]?.content ||
    "The workspace is ready when you are.";

  return (
    <WorkspaceShell kitId={kitId} passedCount={passedCount} toast={toast}>
      <div className="space-y-8">
        <FoundationChatBar
          activeStageId={activeStageId}
          brandStage={brandStage}
          hasMessages={hasMessages}
          hasSourceMaterial={hasSourceMaterial}
          latestAssistantMessage={latestAssistantMessage}
          input={input}
          quickReplies={QUICK_REPLY_MAP[activeStageId]}
          busy={busy}
          onInputChange={setInput}
          onQuickReply={setInput}
          onSubmit={handleSubmit}
          onStart={() => streamAssistantTurn({ stageId: activeStageId })}
        />

        <section>
          <p className="eyebrow mb-4 block">Foundation</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {workspaceView.foundationCards.map((card) => (
              <FoundationCard
                key={card.stageId}
                card={card}
                busy={busy}
                onApprove={handleApprove}
                onAdjust={(stageId) => {
                  setEditorStageId(stageId);
                  setEditorValue("");
                }}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        </section>

        {workspaceView.homepageDraft ? (
          <HomepageDraftSection draft={workspaceView.homepageDraft} />
        ) : null}

        <ManualModulesSection
          modules={workspaceView.manualModules}
          busy={busy}
          onApprove={handleApprove}
          onAdjust={(stageId) => {
            setEditorStageId(stageId);
            setEditorValue("");
          }}
          onRegenerate={handleRegenerate}
        />

        {passedCount >= 9 ? (
          <div className="border-t border-rule pt-6">
            <Link href={`/kit/${kitId}`} className="btn-primary px-6 py-3 text-sm">
              View kit and download markdown
            </Link>
          </div>
        ) : null}
      </div>

      <CardEditorSheet
        open={Boolean(editorStageId)}
        card={activeCard}
        value={editorValue}
        busy={busy}
        onChange={setEditorValue}
        onClose={() => {
          setEditorStageId(null);
          setEditorValue("");
        }}
        onSubmit={handleEditorSubmit}
      />
    </WorkspaceShell>
  );
}
