import { NextResponse } from "next/server";
import { authorizeAgentRequest } from "@/lib/agent-auth";
import { submitAgentKitTurn } from "@/lib/agent-kit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ kitId: string }> },
) {
  const auth = authorizeAgentRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { message?: unknown }).message
      : null;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const { kitId } = await context.params;

  try {
    const result = await submitAgentKitTurn({
      email: auth.email,
      kitId,
      message,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[agent/kits/turn] failed", error);
    const message = error instanceof Error ? error.message : "Failed to submit turn.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
