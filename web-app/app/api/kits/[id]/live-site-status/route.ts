import { NextRequest, NextResponse } from "next/server";
import { requireKitRole } from "@/lib/kit-server";
import { executeNextProgressiveSiteJob } from "@/lib/progressive-site";

export const runtime = "nodejs";
export const maxDuration = 300;

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

  const status = await executeNextProgressiveSiteJob(kitId);
  return NextResponse.json(status);
}
