import { getServiceClient } from "./supabase";

type InsertSiteIterationInput = {
  generationId: string;
  kitId: string;
  actorId: string | null;
  userMessage?: string | null;
  messageId?: string | null;
  versionId?: string | null;
  demoUrl?: string | null;
  status: "pending" | "running" | "completed" | "failed";
  tokensCharged: number;
  usageSyncedAt?: string | null;
  sourceChatId?: string | null;
};

export async function insertNextSiteIteration(
  input: InsertSiteIterationInput,
  firstTurnIndex = 1,
) {
  const svc = getServiceClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: lastIteration } = await svc
      .from("site_iterations")
      .select("turn_index")
      .eq("generation_id", input.generationId)
      .order("turn_index", { ascending: false })
      .limit(1)
      .maybeSingle<{ turn_index: number }>();

    const nextTurnIndex = lastIteration
      ? Number(lastIteration.turn_index) + 1
      : firstTurnIndex;

    const { data, error } = await svc
      .from("site_iterations")
      .insert({
        generation_id: input.generationId,
        kit_id: input.kitId,
        actor_id: input.actorId,
        turn_index: nextTurnIndex,
        user_message: input.userMessage ?? null,
        v0_message_id: input.messageId ?? null,
        v0_version_id: input.versionId ?? null,
        demo_url: input.demoUrl ?? null,
        status: input.status,
        tokens_charged: input.tokensCharged,
        usage_synced_at: input.usageSyncedAt ?? null,
        source_chat_id: input.sourceChatId ?? null,
      })
      .select("id, turn_index")
      .single<{ id: string; turn_index: number }>();

    if (!error && data) {
      return data;
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  throw new Error("Could not allocate a turn index for this iteration");
}
