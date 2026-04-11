"use client";

import { type RefObject, useState } from "react";
import type {
  ChatMessage,
  GenerationSettings,
  IterationData,
  QuotaData,
  V0ModelId,
} from "./types";

type Props = {
  chatMessages: ChatMessage[];
  iterations: IterationData[];
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  onGenerate: () => void;
  onRestore: (iterationId: string) => void;
  onSelectIteration: (iterationId: string) => void;
  hasGeneration: boolean;
  disabled: boolean;
  disabledReason: string | null;
  submittingMessage: boolean;
  submittingGenerate: boolean;
  isGenerating: boolean;
  canEdit: boolean;
  quota: QuotaData | null;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  selectedIterationId: string | null;
  currentVersionId: string | null;
  restoringIterationId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

const MODEL_OPTIONS: { id: V0ModelId; label: string; description: string }[] = [
  { id: "v0-auto", label: "Auto", description: "Best balance" },
  { id: "v0-pro", label: "Pro", description: "Higher quality" },
  { id: "v0-max", label: "Max", description: "Highest quality" },
  { id: "v0-max-fast", label: "Max Fast", description: "Fast + quality" },
  { id: "v0-mini", label: "Mini", description: "Fastest" },
];

function formatQuotaShort(quota: QuotaData | null) {
  if (!quota) return "";
  const used = quota.used >= 1000 ? `${(quota.used / 1000).toFixed(1)}k` : `${quota.used}`;
  const limit = quota.limit >= 1000 ? `${(quota.limit / 1000).toFixed(0)}k` : `${quota.limit}`;
  return `${used}/${limit}`;
}

export function ChatPanel({
  chatMessages,
  iterations,
  message,
  onMessageChange,
  onSubmit,
  onGenerate,
  onRestore,
  onSelectIteration,
  hasGeneration,
  disabled,
  disabledReason,
  submittingMessage,
  submittingGenerate,
  isGenerating,
  canEdit,
  quota,
  settings,
  onSettingsChange,
  selectedIterationId,
  currentVersionId,
  restoringIterationId,
  messagesEndRef,
}: Props) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentModel =
    MODEL_OPTIONS.find((m) => m.id === (settings.modelId ?? "v0-auto")) ?? MODEL_OPTIONS[0];

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !submittingMessage && message.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex items-center justify-between border-b border-rule px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Chat
          </span>
          {isGenerating && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Working
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quota && (
            <span className="font-mono text-[11px] text-muted">
              {formatQuotaShort(quota)}
            </span>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-ink transition-colors px-2 py-1"
            >
              Settings
            </button>
            {settingsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSettingsOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 border border-rule-strong bg-paper-pure p-4 shadow-lg">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
                    Generation settings
                  </p>
                  <label className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-ink">Thinking mode</span>
                    <input
                      type="checkbox"
                      checked={settings.thinking ?? false}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, thinking: e.target.checked })
                      }
                      className="h-4 w-4 accent-accent"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-ink">Image generation</span>
                    <input
                      type="checkbox"
                      checked={settings.imageGenerations ?? false}
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          imageGenerations: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-accent"
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {!hasGeneration && chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Site generator
            </p>
            <h2 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
              Generate your branded site
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm text-muted-strong">
              Your brand kit will be used to create a landing page. Iterate through chat.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={submittingGenerate || (quota?.remaining ?? 0) <= 0}
                className="btn-primary mt-6 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingGenerate ? "Generating..." : "Generate site"}
              </button>
            )}
          </div>
        ) : null}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2.5 ${
                msg.role === "user"
                  ? "bg-ink text-paper"
                  : "bg-paper-pure border border-rule-strong text-ink"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.role === "assistant" && (
                <p className="mt-1 font-mono text-[10px] text-muted">v0 response</p>
              )}
            </div>
          </div>
        ))}

        {iterations.map((iter) => {
          if (iter.status === "pending" || iter.status === "running") {
            return (
              <div key={`pending-${iter.id}`} className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-rule-strong bg-paper-pure px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <p className="text-sm text-ink">
                      {iter.status === "running" ? "Building changes..." : "Queued..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}

        {chatMessages.length === 0 && hasGeneration && iterations.length === 0 && (
          <div className="py-8 text-center text-sm text-muted">
            Send a message to iterate on the design.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {hasGeneration && (
        <div className="border-t border-rule bg-paper p-3">
          <div className="flex items-end gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen((v) => !v)}
                className="flex items-center gap-1 rounded-md border border-rule-strong bg-paper-pure px-2.5 py-2 font-mono text-[11px] uppercase tracking-widest text-ink hover:bg-rule transition-colors"
              >
                {currentModel.label}
                <span className="text-[8px]">▾</span>
              </button>
              {modelDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setModelDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 z-20 mb-1 w-44 border border-rule-strong bg-paper-pure shadow-lg">
                    {MODEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onSettingsChange({ ...settings, modelId: opt.id });
                          setModelDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-rule transition-colors ${
                          opt.id === currentModel.id
                            ? "bg-accent-soft text-accent"
                            : "text-ink"
                        }`}
                      >
                        <span className="font-mono text-xs uppercase tracking-widest">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-muted">{opt.description}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || submittingMessage}
              placeholder={disabledReason ?? "Describe a change..."}
              rows={1}
              className="flex-1 resize-none rounded-md border border-rule-strong bg-paper-pure px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
              style={{ minHeight: "38px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />

            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || submittingMessage || !message.trim()}
              className="shrink-0 rounded-md bg-ink px-3 py-2 text-paper disabled:cursor-not-allowed disabled:opacity-50 hover:bg-ink-deep transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {disabledReason && (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              {disabledReason}
            </p>
          )}
        </div>
      )}

      {chatMessages.length > 0 && iterations.length > 0 && (
        <div className="border-t border-rule px-4 py-2">
          <details>
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink transition-colors">
              Version history ({iterations.length})
            </summary>
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {iterations.map((iter) => {
                const isCurrent = Boolean(
                  iter.versionId &&
                    currentVersionId &&
                    iter.versionId === currentVersionId,
                );
                const isSelected = iter.id === selectedIterationId;
                return (
                  <button
                    key={iter.id}
                    type="button"
                    onClick={() => onSelectIteration(iter.id)}
                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? "bg-accent-soft text-accent" : "text-ink hover:bg-rule"
                    }`}
                  >
                    <span className="font-mono font-semibold">v{iter.turnIndex + 1}</span>
                    {isCurrent && (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-accent">
                        current
                      </span>
                    )}
                    <span className="flex-1 truncate text-muted-strong">
                      {iter.userMessage ?? "Initial"}
                    </span>
                    {iter.status === "completed" && !isCurrent && canEdit && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(iter.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            onRestore(iter.id);
                          }
                        }}
                        className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted hover:text-accent"
                      >
                        {restoringIterationId === iter.id ? "..." : "restore"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
