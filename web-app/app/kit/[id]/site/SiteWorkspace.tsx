"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { hasKitRole, type KitRole } from "@/lib/kit-collaboration";
import { ITERATION_TOKEN_ESTIMATE } from "@/lib/site-constants";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import type {
  GenerationData,
  GenerationSettings,
  IterationData,
  QuotaData,
  ChatMessage,
  DeviceFrame,
} from "./types";

type Props = {
  kitId: string;
  currentUserEmail: string | null;
  currentUserRole: KitRole | null;
  initialGeneration: GenerationData | null;
  initialQuota: QuotaData;
};

function pickSelectedIterationId(
  iterations: IterationData[],
  currentVersionId: string | null,
  previousSelection: string | null,
) {
  if (previousSelection && iterations.some((i) => i.id === previousSelection)) {
    return previousSelection;
  }
  const current = iterations.find(
    (i) => i.versionId && currentVersionId && i.versionId === currentVersionId,
  );
  return current?.id ?? iterations[0]?.id ?? null;
}

function replaceIteration(
  iterations: IterationData[],
  iterationId: string,
  updater: (current: IterationData) => IterationData,
) {
  return iterations.map((i) => (i.id === iterationId ? updater(i) : i));
}

export function SiteWorkspace({
  kitId,
  currentUserEmail,
  currentUserRole,
  initialGeneration,
  initialQuota,
}: Props) {
  const [generation, setGeneration] = useState<GenerationData | null>(initialGeneration);
  const [iterations, setIterations] = useState<IterationData[]>([]);
  const [quota, setQuota] = useState<QuotaData | null>(initialQuota);
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [pendingIterationId, setPendingIterationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState<GenerationSettings>(
    initialGeneration?.settings ?? {},
  );
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>("desktop");
  const [, setWorkspaceError] = useState<string | null>(
    initialGeneration?.error ?? null,
  );
  const [submittingGenerate, setSubmittingGenerate] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  const [restoringIterationId, setRestoringIterationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevGenerationStatus = useRef(generation?.status);

  const canEdit = hasKitRole(currentUserRole, "editor");
  const selectedIteration =
    iterations.find((i) => i.id === selectedIterationId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const refreshWorkspace = useCallback(
    async (preferredSelection?: string | null) => {
      const [iterationsRes, quotaRes, chatHistoryRes] = await Promise.all([
        fetch(`/api/kits/${kitId}/iterations`),
        fetch("/api/users/me/token-quota"),
        generation?.chatId ? fetch(`/api/kits/${kitId}/chat-history`) : null,
      ]);

      const nextIterations = iterationsRes.ok
        ? ((await iterationsRes.json()).iterations as IterationData[])
        : null;
      const nextQuota = quotaRes.ok
        ? ((await quotaRes.json()) as QuotaData)
        : null;
      const nextChatHistory = chatHistoryRes?.ok
        ? ((await chatHistoryRes.json()) as { messages: ChatMessage[] })
        : null;

      startTransition(() => {
        if (nextIterations) {
          setIterations(nextIterations);
          setSelectedIterationId((current) =>
            pickSelectedIterationId(
              nextIterations,
              generation?.versionId ?? null,
              preferredSelection ?? current,
            ),
          );
          const pending = nextIterations.find(
            (i) => i.status === "pending" || i.status === "running",
          );
          setPendingIterationId(pending?.id ?? null);
        }

        if (nextQuota) setQuota(nextQuota);

        if (nextChatHistory) {
          setChatMessages(
            nextChatHistory.messages.map((m) => ({
              ...m,
              iterationId: undefined,
              iterationStatus: undefined,
              demoUrl: undefined,
              versionId: undefined,
            })),
          );
        }
      });
    },
    [generation?.chatId, generation?.versionId, kitId],
  );

  const pollGeneration = useCallback(async () => {
    const res = await fetch(`/api/kits/${kitId}/site-status`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "none") return;

    startTransition(() => {
      setGeneration((current) => ({
        id: data.generationId ?? current?.id ?? "",
        status: data.status,
        demoUrl: data.demoUrl ?? null,
        chatId: data.chatId ?? null,
        versionId: data.versionId ?? null,
        error: data.error ?? null,
        settings: data.settings ?? current?.settings ?? {},
      }));
      if (data.settings) setSettings(data.settings as GenerationSettings);
      setWorkspaceError(data.error ?? null);
    });

    if (data.status === "completed" || data.status === "failed") {
      setSubmittingGenerate(false);
      await refreshWorkspace();
    }
  }, [kitId, refreshWorkspace]);

  const pollIteration = useCallback(
    async (iterationId: string) => {
      const res = await fetch(
        `/api/kits/${kitId}/iterate-status?iterationId=${encodeURIComponent(iterationId)}`,
      );
      if (!res.ok) return;
      const data = await res.json();

      startTransition(() => {
        setIterations((current) =>
          replaceIteration(current, iterationId, (i) => ({
            ...i,
            status: data.status,
            demoUrl: data.demoUrl ?? i.demoUrl,
            versionId: data.versionId ?? i.versionId,
            messageId: data.messageId ?? i.messageId,
            error: data.error ?? null,
            usageSyncedAt: data.usageSyncedAt ?? i.usageSyncedAt,
          })),
        );
      });

      if (data.status === "completed") {
        startTransition(() => {
          setGeneration((current) =>
            current
              ? {
                  ...current,
                  status: "completed",
                  demoUrl: data.demoUrl ?? current.demoUrl,
                  versionId: data.versionId ?? current.versionId,
                  error: null,
                  settings: current.settings,
                }
              : current,
          );
          setPendingIterationId(null);
          setSelectedIterationId(iterationId);
          setWorkspaceError(null);
        });
        setSubmittingMessage(false);
        await refreshWorkspace(iterationId);
      }

      if (data.status === "failed") {
        startTransition(() => {
          setPendingIterationId(null);
          setWorkspaceError(data.error ?? "Iteration failed");
        });
        setSubmittingMessage(false);
        await refreshWorkspace();
      }
    },
    [kitId, refreshWorkspace],
  );

  useEffect(() => {
    void refreshWorkspace();
  }, [kitId, refreshWorkspace]);

  useEffect(() => {
    if (generation?.status !== "generating" && generation?.status !== "pending") return;
    void pollGeneration();
    const interval = window.setInterval(() => void pollGeneration(), 4000);
    return () => window.clearInterval(interval);
  }, [generation?.id, generation?.status, pollGeneration]);

  useEffect(() => {
    if (!pendingIterationId) return;
    void pollIteration(pendingIterationId);
    const interval = window.setInterval(
      () => void pollIteration(pendingIterationId),
      4000,
    );
    return () => window.clearInterval(interval);
  }, [pendingIterationId, pollIteration]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, iterations, scrollToBottom]);

  useEffect(() => {
    if (prevGenerationStatus.current === "generating" && generation?.status === "completed") {
      setMobileTab("preview");
    }
    prevGenerationStatus.current = generation?.status;
  }, [generation?.status]);

  async function handleGenerate() {
    if (!canEdit) return;
    setSubmittingGenerate(true);
    setWorkspaceError(null);

    const res = await fetch(`/api/kits/${kitId}/generate-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmittingGenerate(false);
      setWorkspaceError(data.error ?? "Could not start generation");
      return;
    }

    startTransition(() => {
      setGeneration({
        id: data.generationId,
        status: "generating",
        demoUrl: null,
        chatId: null,
        versionId: null,
        error: null,
        settings,
      });
      setIterations([]);
      setSelectedIterationId(null);
      setChatMessages([]);
    });
  }

  async function handleSendMessage() {
    if (!canEdit || !message.trim()) return;
    setSubmittingMessage(true);
    setWorkspaceError(null);

    const trimmed = message.trim();
    const res = await fetch(`/api/kits/${kitId}/iterate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmittingMessage(false);
      setWorkspaceError(data.error ?? "Could not create iteration");
      return;
    }

    startTransition(() => {
      setIterations((current) => [
        {
          id: data.iterationId,
          actorId: null,
          actorEmail: currentUserEmail,
          turnIndex: data.turnIndex,
          userMessage: trimmed,
          messageId: null,
          versionId: null,
          demoUrl: generation?.demoUrl ?? null,
          status: "pending",
          error: null,
          tokensCharged: ITERATION_TOKEN_ESTIMATE,
          usageSyncedAt: null,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      setPendingIterationId(data.iterationId);
      setSelectedIterationId(data.iterationId);
      setChatMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          role: "user" as const,
          content: trimmed,
          createdAt: new Date().toISOString(),
          iterationId: data.iterationId,
          iterationStatus: "pending",
        },
      ]);
      setMessage("");
      setQuota((current) =>
        current
          ? {
              ...current,
              used: current.used + ITERATION_TOKEN_ESTIMATE,
              remaining: Math.max(current.remaining - ITERATION_TOKEN_ESTIMATE, 0),
            }
          : current,
      );
    });
  }

  async function handleRestore(iterationId: string) {
    setRestoringIterationId(iterationId);
    setWorkspaceError(null);

    const res = await fetch(`/api/kits/${kitId}/iterations/${iterationId}/restore`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      setRestoringIterationId(null);
      setWorkspaceError(data.error ?? "Could not restore that version");
      return;
    }

    startTransition(() => {
      setGeneration((current) =>
        current
          ? {
              ...current,
              status: "completed",
              demoUrl: data.demoUrl ?? current.demoUrl,
              versionId: data.versionId ?? current.versionId,
              error: null,
              settings: current.settings,
            }
          : current,
      );
    });

    setRestoringIterationId(null);
    await refreshWorkspace(data.iterationId ?? null);
  }

  function handleSelectIteration(iterationId: string) {
    setSelectedIterationId(iterationId);
  }

  function navigateVersion(direction: "prev" | "next") {
    const idx = iterations.findIndex((i) => i.id === selectedIterationId);
    if (idx < 0) return;
    const next = direction === "prev" ? idx + 1 : idx - 1;
    if (next >= 0 && next < iterations.length) {
      setSelectedIterationId(iterations[next].id);
    }
  }

  const disabledReason = !canEdit
    ? "Viewer access"
    : quota && quota.remaining <= 0
      ? "Quota reached"
      : generation?.status === "generating"
        ? "Generating..."
        : pendingIterationId
          ? "v0 is working..."
          : null;

  const isGenerating =
    submittingGenerate || generation?.status === "generating" || Boolean(pendingIterationId);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Mobile tab bar */}
      <div className="flex lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-rule bg-paper-pure">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-3 text-center font-mono text-[11px] uppercase tracking-widest transition-colors ${
            mobileTab === "chat" ? "text-ink border-t-2 border-accent" : "text-muted"
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-3 text-center font-mono text-[11px] uppercase tracking-widest transition-colors ${
            mobileTab === "preview" ? "text-ink border-t-2 border-accent" : "text-muted"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Chat panel */}
      <div className={`flex w-full flex-col border-r border-rule lg:flex lg:w-[440px] lg:shrink-0 ${
        mobileTab === "chat" ? "flex" : "hidden lg:flex"
      }`}>
        <ChatPanel
          chatMessages={chatMessages}
          iterations={iterations}
          message={message}
          onMessageChange={setMessage}
          onSubmit={() => void handleSendMessage()}
          onGenerate={() => void handleGenerate()}
          onRestore={(id) => void handleRestore(id)}
          onSelectIteration={handleSelectIteration}
          hasGeneration={Boolean(generation)}
          disabled={Boolean(disabledReason)}
          disabledReason={disabledReason}
          submittingMessage={submittingMessage}
          submittingGenerate={submittingGenerate}
          isGenerating={isGenerating}
          canEdit={canEdit}
          quota={quota}
          settings={settings}
          onSettingsChange={setSettings}
          selectedIterationId={selectedIterationId}
          currentVersionId={generation?.versionId ?? null}
          restoringIterationId={restoringIterationId}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Preview panel */}
      <div className={`flex-1 flex-col lg:flex ${mobileTab === "preview" ? "flex" : "hidden lg:flex"} pb-14 lg:pb-0`}>
        <PreviewPanel
        generation={generation}
        selectedIteration={selectedIteration}
        canEdit={canEdit}
        onGenerate={() => void handleGenerate()}
        generating={submittingGenerate}
        quotaRemaining={quota?.remaining ?? 0}
        deviceFrame={deviceFrame}
        onDeviceFrameChange={setDeviceFrame}
        iterations={iterations}
        selectedIterationId={selectedIterationId}
        onNavigateVersion={navigateVersion}
        />
      </div>
    </div>
  );
}
