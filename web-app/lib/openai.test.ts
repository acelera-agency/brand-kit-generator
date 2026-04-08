import { describe, it, expect } from "vitest";
import { MODEL_INTERVIEW, MODEL_GATE, MODEL_CHEAP } from "./openai";
import { SYSTEM_PROMPT } from "./prompt";
import { buildInterviewMessages } from "./interview-prompt";

describe("OpenAI constants", () => {
  it("pins the interview model", () => {
    expect(MODEL_INTERVIEW).toBe("gpt-4o-2024-08-06");
  });

  it("pins the gate model", () => {
    expect(MODEL_GATE).toBe("gpt-4o-2024-08-06");
  });

  it("uses cheap model for sub-tasks", () => {
    expect(MODEL_CHEAP).toContain("mini");
  });
});

describe("SYSTEM_PROMPT", () => {
  it("loads the brand kit generator prompt", () => {
    expect(SYSTEM_PROMPT).toContain("Brand Kit Generator");
    expect(SYSTEM_PROMPT).toContain("STAGE 0");
    expect(SYSTEM_PROMPT).toContain("STAGE 8");
  });

  it("contains all 9 stages (0-8)", () => {
    for (let i = 0; i <= 8; i++) {
      expect(SYSTEM_PROMPT).toContain(`STAGE ${i}`);
    }
  });
});

describe("buildInterviewMessages", () => {
  it("prepends the system prompt with stage context", () => {
    const messages = buildInterviewMessages({
      currentStageId: "stage_0",
      conversationHistory: [],
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("Brand Kit Generator");
    expect(messages[0].content).toContain("stage_0");
    expect(messages[0].content).toContain("Stay focused");
  });

  it("appends conversation history after the system prompt", () => {
    const messages = buildInterviewMessages({
      currentStageId: "stage_1",
      conversationHistory: [
        { role: "user", content: "Hi there" },
        { role: "assistant", content: "Hello, let's start." },
      ],
    });

    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "Hi there" });
    expect(messages[2]).toEqual({
      role: "assistant",
      content: "Hello, let's start.",
    });
  });

  it("includes the current stage id in the system prompt", () => {
    const messages = buildInterviewMessages({
      currentStageId: "stage_5",
      conversationHistory: [],
    });
    expect(messages[0].content).toContain("stage_5");
  });
});
