import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  // TODO: wire up to a real provider before launch.
  // Recommended: Resend (transactional email), Loops.so (waitlist),
  // or a Notion DB via the official integration.
  // For now we just log the submission so the form is functional during
  // development and preview deployments.
  console.log(`[waitlist] new signup: ${email}`);

  return NextResponse.json({ ok: true });
}
