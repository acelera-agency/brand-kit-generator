import { getSystemPrompt } from "./prompt";
import type { BrandStage } from "./types";

type Role = "system" | "user" | "assistant";

/**
 * Build the messages array for the interview chat.
 *
 * Picks the right system prompt variant for the brand stage (new vs existing)
 * and appends a small per-message "current stage" addendum so the model knows
 * which stage's questions to focus on for this turn.
 */
export function buildInterviewMessages(opts: {
  currentStageId: string;
  brandStage: BrandStage;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Array<{ role: Role; content: string }> {
  const systemPrompt = getSystemPrompt(opts.brandStage);
  const stageContext = `

---

You are currently in **${opts.currentStageId}** for a brand at brand stage **${opts.brandStage}**. Stay focused on this stage and use only the questions appropriate for this brand stage. Do not advance to the next stage until the gate for ${opts.currentStageId} is verifiably passed.`;

  return [
    { role: "system", content: systemPrompt + stageContext },
    ...opts.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
}
