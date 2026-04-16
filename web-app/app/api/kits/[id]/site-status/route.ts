import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireKitRole } from "@/lib/kit-server";
import { refundTokens, syncUsageForIteration } from "@/lib/token-quota";
import { extractChatOutput, getV0Client } from "@/lib/v0-client";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const STALE_LOCK_MS = 6 * 60 * 1000;

export async function GET(
  _req: NextRequest,
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

  const { data: generation } = await access.supabase
    .from("site_generations")
    .select("id, status, demo_url, v0_chat_id, v0_version_id, error_message, created_at, updated_at, generation_settings")
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!generation) {
    return NextResponse.json({ status: "none" });
  }

  const lockIsStalePending =
    generation.v0_chat_id === "pending" &&
    generation.status === "generating" &&
    typeof generation.updated_at === "string" &&
    Date.now() - new Date(generation.updated_at).getTime() > STALE_LOCK_MS;

  if (
    generation.status === "generating" &&
    (!generation.v0_chat_id || lockIsStalePending)
  ) {
    const svc = getServiceClient();
    const staleCutoff = new Date(Date.now() - STALE_LOCK_MS).toISOString();
    const { data: locked } = await svc
      .from("site_generations")
      .update({ v0_chat_id: "pending" })
      .eq("id", generation.id)
      .or(
        `v0_chat_id.is.null,and(v0_chat_id.eq.pending,updated_at.lt.${staleCutoff})`,
      )
      .select("id")
      .maybeSingle();

    if (!locked) {
      return NextResponse.json({
        generationId: generation.id,
        status: "generating",
        createdAt: generation.created_at,
      });
    }

    const result = await executeGeneration(kitId, generation.id, generation.generation_settings);

    if (result.status === "completed") {
      return NextResponse.json({
        generationId: generation.id,
        status: "completed",
        demoUrl: result.demoUrl,
        chatId: result.chatId,
        versionId: result.versionId,
        createdAt: generation.created_at,
      });
    }

    if (result.status === "failed") {
      return NextResponse.json({
        generationId: generation.id,
        status: "failed",
        error: result.error,
        createdAt: generation.created_at,
      });
    }
  }

  if (generation.v0_chat_id === "pending" && generation.status === "generating") {
    return NextResponse.json({
      generationId: generation.id,
      status: "generating",
      createdAt: generation.created_at,
    });
  }

  return NextResponse.json({
    generationId: generation.id,
    status: generation.status,
    demoUrl: generation.demo_url,
    chatId: generation.v0_chat_id,
    versionId: generation.v0_version_id,
    error: generation.error_message,
    settings: generation.generation_settings ?? {},
    createdAt: generation.created_at,
  });
}

async function executeGeneration(
  kitId: string,
  generationId: string,
  rawSettings?: Record<string, unknown> | null,
): Promise<
  | { status: "completed"; demoUrl: string | null; chatId: string; versionId: string | null }
  | { status: "failed"; error: string }
  | { status: "generating" }
> {
  const svc = getServiceClient();

  const [{ data: kitRow }, { data: initialIteration }] = await Promise.all([
    svc.from("brand_kits").select("kit").eq("id", kitId).single(),
    svc
      .from("site_iterations")
      .select("id, actor_id, tokens_charged")
      .eq("generation_id", generationId)
      .eq("turn_index", 0)
      .maybeSingle<{ id: string; actor_id: string | null; tokens_charged: number | string }>(),
  ]);

  const kitData = (kitRow?.kit ?? {}) as StoredKitData;

  let promptResult: Awaited<ReturnType<typeof buildV0SitePrompt>>;
  try {
    promptResult = buildV0SitePrompt(kitData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cannot build prompt";
    await svc.from("site_generations").update({ status: "failed", error_message: msg }).eq("id", generationId);

    if (initialIteration) {
      await svc
        .from("site_iterations")
        .update({ status: "failed", error_message: msg })
        .eq("id", initialIteration.id);

      if (initialIteration.actor_id) {
        await refundTokens(initialIteration.actor_id, Number(initialIteration.tokens_charged ?? 0));
      }
    }

    return { status: "failed", error: msg };
  }

  const VALID_MODELS = ["v0-auto", "v0-mini", "v0-pro", "v0-max", "v0-max-fast"] as const;
  type V0Model = (typeof VALID_MODELS)[number];
  const settings = (rawSettings ?? {}) as Record<string, unknown>;
  const modelConfiguration: { modelId?: V0Model; thinking?: boolean; imageGenerations?: boolean } = {};
  if (typeof settings.modelId === "string" && VALID_MODELS.includes(settings.modelId as V0Model)) {
    modelConfiguration.modelId = settings.modelId as V0Model;
  }
  if (typeof settings.thinking === "boolean") modelConfiguration.thinking = settings.thinking;
  if (typeof settings.imageGenerations === "boolean") modelConfiguration.imageGenerations = settings.imageGenerations;

  try {
    const v0 = getV0Client();

    const chat = await v0.chats.create({
      message: promptResult.message,
      system: promptResult.system,
      responseMode: "sync",
      ...(Object.keys(modelConfiguration).length > 0 ? { modelConfiguration } : {}),
    });

    if (chat instanceof ReadableStream) {
      throw new Error("v0 returned a stream when a sync response was required");
    }

    const output = extractChatOutput(chat);

    await svc
      .from("site_generations")
      .update({
        status: "completed",
        error_message: null,
        v0_project_id: output.projectId,
        v0_chat_id: output.chatId,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
        generated_files: output.files,
      })
      .eq("id", generationId);

    if (initialIteration) {
      await svc
        .from("site_iterations")
        .update({
          status: "completed",
          error_message: null,
          source_chat_id: output.chatId,
          v0_message_id: output.messageId,
          v0_version_id: output.versionId,
          demo_url: output.demoUrl,
        })
        .eq("id", initialIteration.id);
    } else {
      const { error: insertIterationErr } = await svc.from("site_iterations").insert({
        generation_id: generationId,
        kit_id: kitId,
        turn_index: 0,
        status: "completed",
        source_chat_id: output.chatId,
        v0_message_id: output.messageId,
        v0_version_id: output.versionId,
        demo_url: output.demoUrl,
      });

      if (insertIterationErr) {
        throw insertIterationErr;
      }
    }

    if (initialIteration?.actor_id && output.messageId) {
      void syncUsageForIteration(
        initialIteration.actor_id,
        initialIteration.id,
        output.chatId,
        output.messageId,
      ).catch(() => null);
    }

    return {
      status: "completed",
      demoUrl: output.demoUrl,
      chatId: output.chatId,
      versionId: output.versionId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await svc.from("site_generations").update({ status: "failed", error_message: msg }).eq("id", generationId);

    if (initialIteration) {
      await svc
        .from("site_iterations")
        .update({ status: "failed", error_message: msg })
        .eq("id", initialIteration.id);

      if (initialIteration.actor_id) {
        await refundTokens(initialIteration.actor_id, Number(initialIteration.tokens_charged ?? 0));
      }
    }

    return { status: "failed", error: msg };
  }
}
