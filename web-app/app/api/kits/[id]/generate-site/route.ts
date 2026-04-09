import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceClient } from "@/lib/supabase";
import { getV0Client } from "@/lib/v0-client";
import { buildV0SitePrompt } from "@/lib/v0-prompt";
import type { StoredKitData } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
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

  const { data: kitRow } = await supabase
    .from("brand_kits")
    .select("id, owner_id, status, kit")
    .eq("id", kitId)
    .single();

  if (!kitRow || kitRow.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: progressRows } = await supabase
    .from("stage_progress")
    .select("stage_id, status")
    .eq("kit_id", kitId);

  const passedCount = (progressRows ?? []).filter(
    (r) => r.status === "passed",
  ).length;

  if (passedCount < 9) {
    return NextResponse.json(
      { error: `Kit is not complete (${passedCount}/9 stages passed). Complete all stages first.` },
      { status: 400 },
    );
  }

  const kitData = (kitRow.kit ?? {}) as StoredKitData;

  let prompt: string;
  try {
    prompt = buildV0SitePrompt(kitData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kit data insufficient for site generation" },
      { status: 400 },
    );
  }

  const svc = getServiceClient();
  const { data: generation, error: genErr } = await svc
    .from("site_generations")
    .insert({
      kit_id: kitId,
      owner_id: user.id,
      status: "generating",
      prompt_hash: prompt.length.toString(36),
    })
    .select("id")
    .single();

  if (genErr || !generation) {
    console.error("[generate-site] insert failed", genErr);
    return NextResponse.json(
      { error: "Failed to create generation record" },
      { status: 500 },
    );
  }

  const generationId = generation.id;

  generateSiteAsync(generationId, prompt).catch((err) => {
    console.error("[generate-site] async generation failed", err);
  });

  return NextResponse.json({
    generationId,
    status: "generating",
  });
}

async function generateSiteAsync(generationId: string, prompt: string) {
  const svc = getServiceClient();

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
  } catch (err) {
    console.error("[generate-site] v0 call failed", err);
    await svc
      .from("site_generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq("id", generationId);
  }
}
