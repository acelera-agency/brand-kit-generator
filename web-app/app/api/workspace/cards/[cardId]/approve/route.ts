import { NextRequest, NextResponse } from "next/server";
import { approveStage } from "@/lib/stage-approval";
import { getServerClient } from "@/lib/supabase";
import { isStageId } from "@/lib/workspace-snapshot";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await context.params;
  if (!isStageId(cardId)) {
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { kitId } = (await req.json()) as { kitId?: string };
  if (!kitId) {
    return NextResponse.json({ error: "Missing kitId" }, { status: 400 });
  }

  const result = await approveStage({
    supabase,
    kitId,
    stageId: cardId,
    userId: user.id,
    logPrefix: "[workspace/approve]",
  });

  if (!result.passed && result.status) {
    const { status, ...body } = result;
    return NextResponse.json(body, { status });
  }

  return NextResponse.json(result);
}
