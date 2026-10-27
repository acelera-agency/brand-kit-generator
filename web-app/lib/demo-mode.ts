import type { LiveSiteStatus } from "./types";

type EnvLike = Record<string, string | undefined>;

const FALLBACK_READY_STATUSES = new Set<LiveSiteStatus["status"]>([
  "queued",
  "generating",
  "running",
  "paused",
  "failed",
]);

export function isDemoModeEnabled(env: EnvLike = process.env) {
  const value = env.DEMO_MODE_ENABLED?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export function getDemoUserEmail(env: EnvLike = process.env) {
  if (!isDemoModeEnabled(env)) return null;

  const email = env.DEMO_USER_EMAIL?.trim();
  if (!email) {
    throw new Error("DEMO_USER_EMAIL is required");
  }

  return email;
}

export function getDemoFallbackUrl(env: EnvLike = process.env) {
  const value = env.DEMO_FALLBACK_DEMO_URL?.trim();
  return value || null;
}

export function getDemoFallbackPreview(
  liveSite: LiveSiteStatus,
  fallbackUrl?: string | null,
) {
  if (liveSite.demoUrl) {
    return {
      previewUrl: liveSite.demoUrl,
      usingFallback: false,
      notice: null,
    };
  }

  if (fallbackUrl && FALLBACK_READY_STATUSES.has(liveSite.status)) {
    return {
      previewUrl: fallbackUrl,
      usingFallback: true,
      notice: "Showing a saved demo preview while v0 keeps working.",
    };
  }

  return {
    previewUrl: null,
    usingFallback: false,
    notice: null,
  };
}
