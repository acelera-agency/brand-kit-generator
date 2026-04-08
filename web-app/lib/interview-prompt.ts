import { SYSTEM_PROMPT } from "./prompt";

type Role = "system" | "user" | "assistant";

/**
 * Build the messages array for the interview chat.
 * Includes: the prompt.md system prompt, a stage-specific addendum,
 * and the conversation history so far.
 */
export function buildInterviewMessages(opts: {
  currentStageId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Array<{ role: Role; content: string }> {
  const stageContext = `

---

You are currently in **${opts.currentStageId}**. Stay focused on this stage. Do not advance to the next stage until the gate for ${opts.currentStageId} is verifiably passed.`;

  return [
    { role: "system", content: SYSTEM_PROMPT + stageContext },
    ...opts.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
}
