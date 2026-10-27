const MIN_DEMO_CONTEXT_LENGTH = 40;
const MAX_DEMO_CONTEXT_LENGTH = 4000;
const MAX_DEMO_BRAND_NAME_LENGTH = 80;

export type DemoStartInput =
  | {
      ok: true;
      brandName: string | null;
      context: string;
    }
  | {
      ok: false;
      error: string;
    };

export function parseDemoStartInput(body: unknown): DemoStartInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body." };
  }

  const candidate = body as {
    brandName?: unknown;
    context?: unknown;
  };

  if (typeof candidate.context !== "string") {
    return { ok: false, error: "Add enough context to start the demo draft." };
  }

  const context = candidate.context.trim();
  if (context.length < MIN_DEMO_CONTEXT_LENGTH) {
    return { ok: false, error: "Add enough context to start the demo draft." };
  }

  if (context.length > MAX_DEMO_CONTEXT_LENGTH) {
    return {
      ok: false,
      error: `Keep the demo context under ${MAX_DEMO_CONTEXT_LENGTH} characters.`,
    };
  }

  if (candidate.brandName !== undefined && candidate.brandName !== null) {
    if (typeof candidate.brandName !== "string") {
      return { ok: false, error: "Brand name must be text." };
    }

    const brandName = candidate.brandName.trim();
    if (brandName.length > MAX_DEMO_BRAND_NAME_LENGTH) {
      return {
        ok: false,
        error: `Brand name must be ${MAX_DEMO_BRAND_NAME_LENGTH} characters or fewer.`,
      };
    }

    return {
      ok: true,
      brandName: brandName || null,
      context,
    };
  }

  return {
    ok: true,
    brandName: null,
    context,
  };
}

export function buildDemoKitName(brandName: string | null, now = new Date()) {
  const timestamp = now
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")
    .replace(/:/g, "");
  return `${brandName || "Hackathon live demo"} ${timestamp}`;
}
