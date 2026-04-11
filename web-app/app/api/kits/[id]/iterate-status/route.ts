import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { getServiceClient } from "@/lib/supabase";
import { refundTokens, syncUsageForIteration } from "@/lib/token-quota";
import { sendIterationMessage, type ModelConfiguration } from "@/lib/v0-client";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";

type IterationRow = {
  id: string;
  generation_id: string;
  actor_id: string | null;
  source_chat_id: string | null;
  user_message: string | null;
  v0_message_id: string | null;
  v0_version_id: string | null;
  demo_url: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  tokens_charged: number | string;
  usage_synced_at: string | null;
  turn_index: number;
  created_at: string;
};

type GenerationRow = {
  id: string;
  v0_chat_id: string | null;
  generation_settings?: Record<string, unknown> | null;
};

function serializeIteration(iteration: IterationRow) {
  return {
    iterationId: iteration.id,
    turnIndex: iteration.turn_index,
    status: iteration.status,
    demoUrl: iteration.demo_url,
    versionId: iteration.v0_version_id,
    messageId: iteration.v0_message_id,
    error: iteration.error_message,
    usageSyncedAt: iteration.usage_synced_at,
    createdAt: iteration.created_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const access = await requireKitRole(kitId, "viewer");
  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!access.kit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const iterationId = new URL(req.url).searchParams.get("iterationId");
  if (!iterationId) {
    return NextResponse.json({ error: "iterationId is required" }, { status: 400 });
  }

  const svc = getServiceClient();

  let { data: iteration } = await svc
    .from("site_iterations")
    .select("id, generation_id, actor_id, source_chat_id, user_message, v0_message_id, v0_version_id, demo_url, status, error_message, tokens_charged, usage_synced_at, turn_index, created_at")
    .eq("id", iterationId)
    .eq("kit_id", kitId)
    .maybeSingle<IterationRow>();

  if (!iteration) {
    return NextResponse.json({ error: "Iteration not found" }, { status: 404 });
  }

  const { data: generation } = await svc
    .from("site_generations")
    .select("id, v0_chat_id, generation_settings")
    .eq("id", iteration.generation_id)
    .maybeSingle<GenerationRow>();

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (iteration.status === "pending") {
    const { data: locked } = await svc
      .from("site_iterations")
      .update({ status: "running" })
      .eq("id", iteration.id)
      .eq("status", "pending")
      .select("id, generation_id, actor_id, source_chat_id, user_message, v0_message_id, v0_version_id, demo_url, status, error_message, tokens_charged, usage_synced_at, turn_index, created_at")
      .maybeSingle<IterationRow>();

    if (locked) {
      if (!generation.v0_chat_id || generation.v0_chat_id === "pending") {
        await svc
          .from("site_iterations")
          .update({
            status: "failed",
            error_message: "Generate the site before iterating on it",
          })
          .eq("id", locked.id);

        if (locked.actor_id) {
          await refundTokens(locked.actor_id, Number(locked.tokens_charged ?? 0));
        }

        return NextResponse.json(
          {
            iterationId: locked.id,
            status: "failed",
            error: "Generate the site before iterating on it",
          },
          { status: 409 },
        );
      }

      try {
        let systemPrompt: string | undefined;
        try {
          const { data: kitRow } = await svc
            .from("brand_kits")
            .select("kit")
            .eq("id", kitId)
            .single();
          const kitData = (kitRow?.kit ?? {}) as StoredKitData;
          systemPrompt = buildV0SitePrompt(kitData).system;
        } catch {}

        const VALID_MODELS = ["v0-auto", "v0-mini", "v0-pro", "v0-max", "v0-max-fast"] as const;
        const genSettings = (generation?.generation_settings ?? {}) as Record<string, unknown>;
        const modelConfig: ModelConfiguration = {};
        if (typeof genSettings.modelId === "string" && VALID_MODELS.includes(genSettings.modelId as typeof VALID_MODELS[number])) {
          modelConfig.modelId = genSettings.modelId as typeof VALID_MODELS[number];
        }
        if (typeof genSettings.thinking === "boolean") modelConfig.thinking = genSettings.thinking;
        if (typeof genSettings.imageGenerations === "boolean") modelConfig.imageGenerations = genSettings.imageGenerations;

        const result = await sendIterationMessage(
          generation.v0_chat_id,
          locked.user_message ?? "",
          systemPrompt,
          Object.keys(modelConfig).length > 0 ? modelConfig : undefined,
        );

        await svc
          .from("site_generations")
          .update({
            status: "completed",
            error_message: null,
            v0_version_id: result.versionId,
            demo_url: result.demoUrl,
            generated_files: result.files,
          })
          .eq("id", generation.id);

        await svc
          .from("site_iterations")
          .update({
            status: "completed",
            error_message: null,
            source_chat_id: generation.v0_chat_id,
            v0_message_id: result.messageId,
            v0_version_id: result.versionId,
            demo_url: result.demoUrl,
          })
          .eq("id", locked.id);

        iteration = {
          ...locked,
          status: "completed",
          error_message: null,
          source_chat_id: generation.v0_chat_id,
          v0_message_id: result.messageId,
          v0_version_id: result.versionId,
          demo_url: result.demoUrl,
        };

        if (locked.actor_id && result.messageId) {
          void syncUsageForIteration(
            locked.actor_id,
            locked.id,
            generation.v0_chat_id,
            result.messageId,
          ).catch(() => null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        await svc
          .from("site_iterations")
          .update({
            status: "failed",
            error_message: errorMessage,
          })
          .eq("id", locked.id);

        if (locked.actor_id) {
          await refundTokens(locked.actor_id, Number(locked.tokens_charged ?? 0));
        }

        return NextResponse.json(
          {
            iterationId: locked.id,
            turnIndex: locked.turn_index,
            status: "failed",
            error: errorMessage,
            createdAt: locked.created_at,
          },
          { status: 200 },
        );
      }
    } else {
      const { data: refreshed } = await svc
        .from("site_iterations")
        .select("id, generation_id, actor_id, source_chat_id, user_message, v0_message_id, v0_version_id, demo_url, status, error_message, tokens_charged, usage_synced_at, turn_index, created_at")
        .eq("id", iteration.id)
        .maybeSingle<IterationRow>();

      if (refreshed) {
        iteration = refreshed;
      }
    }
  }

  if (
    iteration.status === "completed" &&
    !iteration.usage_synced_at &&
    iteration.actor_id &&
    iteration.v0_message_id &&
    generation.v0_chat_id &&
    generation.v0_chat_id !== "pending"
  ) {
    void syncUsageForIteration(
      iteration.actor_id,
      iteration.id,
      generation.v0_chat_id,
      iteration.v0_message_id,
    ).catch(() => null);
  }

  return NextResponse.json(serializeIteration(iteration));
}
