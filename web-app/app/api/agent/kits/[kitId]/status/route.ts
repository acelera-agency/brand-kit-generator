import { NextResponse } from "next/server";
import { authorizeAgentRequest } from "@/lib/agent-auth";
import { getAgentKitStatus } from "@/lib/agent-kit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ kitId: string }> },
) {
  const auth = authorizeAgentRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { kitId } = await context.params;

  try {
    const status = await getAgentKitStatus({
      email: auth.email,
      kitId,
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("[agent/kits/status] failed", error);
    const message = error instanceof Error ? error.message : "Failed to load kit status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
