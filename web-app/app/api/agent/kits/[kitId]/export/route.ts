import { NextResponse } from "next/server";
import { authorizeAgentRequest } from "@/lib/agent-auth";
import { exportAgentKit } from "@/lib/agent-kit";
import type { AgentExportFormat } from "@/lib/agent-export";

export const runtime = "nodejs";

function parseFormat(value: string | null): AgentExportFormat | null {
  if (value === null || value === "json") return "json";
  if (value === "markdown") return "markdown";
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kitId: string }> },
) {
  const auth = authorizeAgentRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      { error: "format must be json or markdown." },
      { status: 400 },
    );
  }

  const { kitId } = await context.params;

  try {
    const exported = await exportAgentKit({
      email: auth.email,
      kitId,
      format,
    });

    if (format === "markdown") {
      return new Response(exported as string, {
        headers: {
          "content-type": "text/markdown; charset=utf-8",
        },
      });
    }

    return NextResponse.json(exported);
  } catch (error) {
    console.error("[agent/kits/export] failed", error);
    const message = error instanceof Error ? error.message : "Failed to export kit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
