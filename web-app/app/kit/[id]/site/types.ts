import type { KitRole } from "@/lib/kit-collaboration";

export type GenerationStatus = "pending" | "generating" | "completed" | "failed";

export type V0ModelId = "v0-auto" | "v0-mini" | "v0-pro" | "v0-max" | "v0-max-fast";

export type GenerationSettings = {
  modelId?: V0ModelId;
  thinking?: boolean;
  imageGenerations?: boolean;
};

export type GenerationData = {
  id: string;
  status: GenerationStatus;
  demoUrl: string | null;
  chatId: string | null;
  versionId: string | null;
  error: string | null;
  settings: GenerationSettings;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  iterationId?: string;
  iterationStatus?: "pending" | "running" | "completed" | "failed";
  demoUrl?: string | null;
  versionId?: string | null;
};

export type DeviceFrame = "desktop" | "tablet" | "mobile";

export type IterationData = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  turnIndex: number;
  userMessage: string | null;
  messageId: string | null;
  versionId: string | null;
  demoUrl: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
  tokensCharged: number;
  usageSyncedAt: string | null;
  createdAt: string;
};

export type QuotaData = {
  used: number;
  limit: number;
  remaining: number;
  monthStart: string;
};

export type MemberData = {
  userId: string;
  email: string | null;
  role: KitRole;
  createdAt: string;
  isCurrentUser: boolean;
};

export type InviteData = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  expiresAt: string;
  error: string | null;
  createdAt: string;
};

export type MembersData = {
  members: MemberData[];
  invites: InviteData[];
};
