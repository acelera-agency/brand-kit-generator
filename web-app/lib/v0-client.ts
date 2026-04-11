import { createClient } from "v0-sdk";

type V0Client = ReturnType<typeof createClient>;

type V0FilePayload = {
  name: string;
  content: string;
};

type ChatOutputInput = {
  id: string;
  projectId?: string | null;
  messages?: Array<{ id: string }>;
  latestVersion?: {
    id: string;
    demoUrl?: string;
    files?: Array<V0FilePayload>;
  };
};

type UsageEventInput = Array<{
  promptCost?: string;
  completionCost?: string;
  totalCost: string;
}>;

export type V0UsageCosts = {
  promptCost: number;
  completionCost: number;
  totalCost: number;
};

export type V0HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

let _client: V0Client | null = null;

export function getV0Client(): V0Client {
  if (!_client) {
    if (!process.env.V0_API_KEY) {
      throw new Error("V0_API_KEY is not set");
    }
    _client = createClient({ apiKey: process.env.V0_API_KEY });
  }
  return _client;
}

export function extractChatOutput(chat: ChatOutputInput) {
  return {
    chatId: chat.id,
    projectId: chat.projectId ?? null,
    messageId: chat.messages?.at(-1)?.id ?? null,
    versionId: chat.latestVersion?.id ?? null,
    demoUrl: chat.latestVersion?.demoUrl ?? null,
    files: (chat.latestVersion?.files ?? []).map((file) => ({
      name: file.name,
      content: file.content,
    })),
  };
}

export function extractUsageCosts(events: UsageEventInput): V0UsageCosts | null {
  const usage = events[0];
  if (!usage) {
    return null;
  }

  return {
    promptCost: Number(usage.promptCost ?? 0),
    completionCost: Number(usage.completionCost ?? 0),
    totalCost: Number(usage.totalCost),
  };
}

function isStreamResponse(value: unknown): value is ReadableStream<Uint8Array> {
  return value instanceof ReadableStream;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export type ModelConfiguration = {
  modelId?: "v0-auto" | "v0-mini" | "v0-pro" | "v0-max" | "v0-max-fast";
  thinking?: boolean;
  imageGenerations?: boolean;
};

export async function sendIterationMessage(
  chatId: string,
  message: string,
  system?: string,
  modelConfiguration?: ModelConfiguration,
) {
  const response = await getV0Client().chats.sendMessage({
    chatId,
    message,
    ...(system ? { system } : {}),
    ...(modelConfiguration && Object.keys(modelConfiguration).length > 0 ? { modelConfiguration } : {}),
    responseMode: "sync",
  });

  if (isStreamResponse(response)) {
    throw new Error("v0 returned a stream when a sync response was required");
  }

  return extractChatOutput(response);
}

export async function getVersion(chatId: string, versionId: string) {
  const response = await getV0Client().chats.getVersion({
    chatId,
    versionId,
    includeDefaultFiles: true,
  });

  return {
    demoUrl: response.demoUrl ?? null,
    files: response.files.map((file) => ({
      name: file.name,
      content: file.content,
    })),
  };
}

export async function fetchInitialHistory(chatId: string): Promise<V0HistoryMessage[]> {
  const response = await getV0Client().chats.findMessages({
    chatId,
    limit: 100,
  });

  return response.data
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
}

export async function getUsageForMessage(
  chatId: string,
  messageId: string,
): Promise<V0UsageCosts | null> {
  const delays = [0, 1000, 2000, 4000, 8000, 16000];

  for (const delay of delays) {
    if (delay > 0) {
      await sleep(delay);
    }

    const response = await getV0Client().reports.getUsage({
      chatId,
      messageId,
      limit: 1,
    });
    const usage = extractUsageCosts(response.data);

    if (usage) {
      return usage;
    }
  }

  return null;
}
