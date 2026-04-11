import { describe, expect, it } from "vitest";
import { extractChatOutput, extractUsageCosts } from "./v0-client";

describe("extractChatOutput", () => {
  it("picks the latest version, files, and last message id", () => {
    const result = extractChatOutput({
      id: "chat_123",
      projectId: "project_123",
      messages: [
        { id: "msg_1" },
        { id: "msg_2" },
      ],
      latestVersion: {
        id: "version_123",
        demoUrl: "https://demo.example.com",
        files: [
          { name: "app/page.tsx", content: "export default function Page() {}" },
          { name: "app/layout.tsx", content: "export default function Layout() {}" },
        ],
      },
    });

    expect(result).toEqual({
      chatId: "chat_123",
      projectId: "project_123",
      messageId: "msg_2",
      versionId: "version_123",
      demoUrl: "https://demo.example.com",
      files: [
        { name: "app/page.tsx", content: "export default function Page() {}" },
        { name: "app/layout.tsx", content: "export default function Layout() {}" },
      ],
    });
  });

  it("keeps nulls when the response has no message or version yet", () => {
    const result = extractChatOutput({
      id: "chat_456",
      messages: [],
    });

    expect(result).toEqual({
      chatId: "chat_456",
      projectId: null,
      messageId: null,
      versionId: null,
      demoUrl: null,
      files: [],
    });
  });
});

describe("extractUsageCosts", () => {
  it("parses numeric usage totals from the first event", () => {
    expect(
      extractUsageCosts([
        {
          promptCost: "125",
          completionCost: "875",
          totalCost: "1000",
        },
      ]),
    ).toEqual({
      promptCost: 125,
      completionCost: 875,
      totalCost: 1000,
    });
  });

  it("returns null when usage is not available yet", () => {
    expect(extractUsageCosts([])).toBeNull();
  });
});
