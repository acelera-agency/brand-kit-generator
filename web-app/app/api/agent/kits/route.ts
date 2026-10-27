import { NextResponse } from "next/server";
import { authorizeAgentRequest } from "@/lib/agent-auth";
import { createAgentKit } from "@/lib/agent-kit";
import type { BrandStage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function isBrandStage(value: unknown): value is BrandStage {
  return value === "new" || value === "existing";
}

export async function POST(request: Request) {
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const candidate = body as {
    name?: unknown;
    brandStage?: unknown;
    initialContext?: unknown;
  };

  if (candidate.name !== undefined && typeof candidate.name !== "string") {
    return NextResponse.json({ error: "name must be a string." }, { status: 400 });
  }
  if (candidate.name && candidate.name.trim().length > 80) {
    return NextResponse.json(
      { error: "name must be 80 characters or fewer." },
      { status: 400 },
    );
  }
  if (
    candidate.brandStage !== undefined &&
    !isBrandStage(candidate.brandStage)
  ) {
    return NextResponse.json(
      { error: "brandStage must be 'new' or 'existing'." },
      { status: 400 },
    );
  }
  if (
    candidate.initialContext !== undefined &&
    typeof candidate.initialContext !== "string"
  ) {
    return NextResponse.json(
      { error: "initialContext must be a string." },
      { status: 400 },
    );
  }

  try {
    const result = await createAgentKit({
      email: auth.email,
      name: candidate.name,
      brandStage: candidate.brandStage,
      initialContext: candidate.initialContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[agent/kits] create failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create kit." },
      { status: 500 },
    );
  }
}
