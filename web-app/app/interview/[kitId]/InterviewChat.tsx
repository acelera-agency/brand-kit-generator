"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STAGE_ORDER = [
  "stage_0",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
  "stage_5",
  "stage_6",
  "stage_7",
  "stage_8",
] as const;

type StageId = (typeof STAGE_ORDER)[number];

const STAGE_LABELS: Record<StageId, string> = {
  stage_0: "Context & contradiction",
  stage_1: "Enemy",
  stage_2: "Three-layer stack",
  stage_3: "Anti-positioning",
  stage_4: "ICP signals",
  stage_5: "Voice constraints",
  stage_6: "Application templates",
  stage_7: "Visual direction",
  stage_8: "Non-negotiable rules",
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  kitId: string;
  initialMessages: ChatMessage[];
  initialStage: StageId;
  initialPassedCount: number;
};

type ToastState =
  | { kind: "passed"; stage: StageId }
  | { kind: "failed"; reason: string }
  | { kind: "error"; reason: string }
  | null;

function nextStage(s: StageId): StageId | null {
  const idx = STAGE_ORDER.indexOf(s);
  return idx === -1 || idx === STAGE_ORDER.length - 1
    ? null
    : STAGE_ORDER[idx + 1];
}

export function InterviewChat({
  kitId,
  initialMessages,
  initialStage,
  initialPassedCount,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageId>(initialStage);
  const [passedCount, setPassedCount] = useState(initialPassedCount);
  const [toast, setToast] = useState<ToastState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Auto-dismiss toasts after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const isComplete = passedCount >= 9;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming || isComplete) return;

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    const assistantPlaceholder: ChatMessage = {
      id: `local-asst-${Date.now()}`,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setStreaming(true);

    try {
      // Open the SSE stream
      const res = await fetch("/api/interview/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, message: userMessage.content }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream request failed (${res.status})`);
      }

      const reader = res.body.getReader();
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

        // Parse SSE events: blocks separated by "\n\n", each line "data: ..."
        let sepIdx;
        while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);

          for (const line of rawEvent.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            try {
              const evt = JSON.parse(payload) as {
                delta?: string;
                done?: boolean;
                error?: string;
              };

              if (evt.error) {
                throw new Error(evt.error);
              }
              if (evt.delta) {
                // Append delta to the last assistant message
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (copy[lastIdx]?.role === "assistant") {
                    copy[lastIdx] = {
                      ...copy[lastIdx],
                      content: copy[lastIdx].content + evt.delta,
                    };
                  }
                  return copy;
                });
              }
              if (evt.done) {
                done = true;
              }
            } catch (parseErr) {
              console.error("[interview] SSE parse failed", parseErr, payload);
            }
          }
        }
      }

      // Stream complete — now check the gate
      const gateRes = await fetch("/api/interview/check-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitId, stageId: currentStage }),
      });

      const gateBody = (await gateRes.json()) as {
        passed: boolean;
        error?: string;
        validationErrors?: Array<{ path: string; message: string }>;
      };

      if (gateBody.passed) {
        const advanced = nextStage(currentStage);
        const newPassed = passedCount + 1;
        setPassedCount(newPassed);
        setToast({ kind: "passed", stage: currentStage });

        if (advanced) {
          setCurrentStage(advanced);
          // Mark the next stage as in-progress so persistence picks it up
          // on next reload. (Server-side fallback covers this too.)
        }
      } else {
        const reason =
          gateBody.error ??
          (gateBody.validationErrors?.length
            ? `Missing: ${gateBody.validationErrors.map((v) => v.path).join(", ")}`
            : "Stage gate not yet met. Keep going.");
        setToast({ kind: "failed", reason });
      }
    } catch (err) {
      console.error("[interview] submit failed", err);
      setToast({
        kind: "error",
        reason: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="border-b border-rule bg-paper-pure">
        <div className="container-brand flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Interview / kit {kitId.slice(0, 8)}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              {STAGE_LABELS[currentStage]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {passedCount} / 9 passed
            </p>
            <Link
              href="/dashboard"
              className="btn-secondary px-3 py-2 text-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast ? (
        <div
          className={`border-b px-5 py-3 text-sm sm:px-8 ${
            toast.kind === "passed"
              ? "border-accent bg-accent-soft text-ink"
              : toast.kind === "failed"
                ? "border-rule-strong bg-paper text-muted-strong"
                : "border-signal/40 bg-[#fff3ed] text-ink"
          }`}
        >
          <div className="container-brand">
            {toast.kind === "passed" ? (
              <>
                <span className="font-mono text-xs uppercase tracking-widest">
                  {STAGE_LABELS[toast.stage]} passed
                </span>
                {nextStage(toast.stage) ? (
                  <>
                    {" — "}
                    advancing to {STAGE_LABELS[nextStage(toast.stage)!]}
                  </>
                ) : (
                  <> — final stage complete. Your kit is ready.</>
                )}
              </>
            ) : toast.kind === "failed" ? (
              <>
                <span className="font-mono text-xs uppercase tracking-widest">
                  Not yet
                </span>
                {" — "}
                {toast.reason}
              </>
            ) : (
              <>
                <span className="font-mono text-xs uppercase tracking-widest">
                  Error
                </span>
                {" — "}
                {toast.reason}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="container-brand mx-auto max-w-[80ch] py-8">
          {messages.length === 0 ? (
            <div className="border border-dashed border-rule-strong bg-paper-pure p-8 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Stage 0 — Context & contradiction
              </p>
              <h2 className="mt-3 font-display text-xl font-medium text-ink">
                Start when you&apos;re ready.
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-sm text-muted-strong">
                The interview takes 60 to 90 minutes. Type your first answer
                below — say hi, or describe what your brand is right now.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`${
                    m.role === "user" ? "ml-12" : "mr-12"
                  }`}
                >
                  <div
                    className={`border p-4 ${
                      m.role === "user"
                        ? "border-rule-strong bg-paper-pure text-ink"
                        : "border-rule bg-paper text-ink"
                    }`}
                  >
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                      {m.role === "user" ? "You" : "Generator"}
                    </p>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
                      {m.content || (
                        <span className="text-muted">…</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-rule bg-paper-pure">
        <div className="container-brand mx-auto max-w-[80ch] py-5">
          {isComplete ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-display text-lg text-ink">
                All 9 stages passed.
              </p>
              <Link
                href={`/kit/${kitId}`}
                className="btn-primary px-6 py-3 text-sm"
              >
                View kit & download markdown
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  Your answer
                </span>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={streaming}
                  rows={3}
                  placeholder={
                    streaming
                      ? "Generator is responding…"
                      : "Type your answer. Be specific. The generator will push back if you're vague."
                  }
                  className="mt-2 w-full resize-none border border-rule-strong bg-paper-pure px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-50 sm:text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-muted">
                  ⌘/Ctrl + Enter to send
                </p>
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  {streaming ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
