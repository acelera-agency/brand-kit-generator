import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceClient } from "@/lib/supabase";
import { getV0Client } from "@/lib/v0-client";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: kitId } = await params;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: generation } = await supabase
    .from("site_generations")
    .select("id, status, demo_url, v0_chat_id, error_message, created_at")
    .eq("kit_id", kitId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!generation) {
    return NextResponse.json({ status: "none" });
  }

  if (generation.status === "generating" && !generation.v0_chat_id) {
    const result = await executeGeneration(kitId, generation.id);

    if (result.status === "completed") {
      return NextResponse.json({
        generationId: generation.id,
        status: "completed",
        demoUrl: result.demoUrl,
        chatId: result.chatId,
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

  return NextResponse.json({
    generationId: generation.id,
    status: generation.status,
    demoUrl: generation.demo_url,
    chatId: generation.v0_chat_id,
    error: generation.error_message,
    createdAt: generation.created_at,
  });
}

async function executeGeneration(
  kitId: string,
  generationId: string,
): Promise<{ status: "completed"; demoUrl: string | null; chatId: string } | { status: "failed"; error: string } | { status: "generating" }> {
  const svc = getServiceClient();

  const { data: kitRow } = await svc
    .from("brand_kits")
    .select("kit")
    .eq("id", kitId)
    .single();

  const kitData = (kitRow?.kit ?? {}) as StoredKitData;

  let prompt: string;
  try {
    prompt = buildV0SitePrompt(kitData);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cannot build prompt";
    await svc.from("site_generations").update({ status: "failed", error_message: msg }).eq("id", generationId);
    return { status: "failed", error: msg };
  }

  try {
    const v0 = getV0Client();

    const chat = await v0.chats.create({
      message: prompt,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatObj = chat as any;
    const latestVersion = chatObj.latestVersion as Record<string, unknown> | undefined;
    const demoUrl = (latestVersion as Record<string, unknown>)?.demoUrl as string | null ?? null;
    const rawFiles = (latestVersion as Record<string, unknown>)?.files as Array<Record<string, string>> | undefined;
    const files = rawFiles?.map((f) => ({
      name: f.name,
      content: f.content,
    })) ?? [];

    await svc
      .from("site_generations")
      .update({
        status: "completed",
        v0_project_id: chatObj.projectId as string | null ?? null,
        v0_chat_id: chatObj.id as string,
        v0_version_id: (latestVersion as Record<string, unknown>)?.id as string | null ?? null,
        demo_url: demoUrl,
        generated_files: files,
      })
      .eq("id", generationId);

    return { status: "completed", demoUrl, chatId: chatObj.id as string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await svc.from("site_generations").update({ status: "failed", error_message: msg }).eq("id", generationId);
    return { status: "failed", error: msg };
  }
}
