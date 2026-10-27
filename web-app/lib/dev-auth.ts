type DevLoginConfig =
  | { enabled: true; email: string }
  | { enabled: false; reason: "production" | "disabled" | "missing-email" };

type DevLoginEnv = Partial<
  Pick<NodeJS.ProcessEnv, "NODE_ENV" | "DEV_AUTH_ENABLED" | "DEV_AUTH_EMAIL">
>;

export function normalizeDevNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function getDevLoginConfig(env: DevLoginEnv): DevLoginConfig {
  if (env.NODE_ENV === "production") {
    return { enabled: false, reason: "production" };
  }

  if (env.DEV_AUTH_ENABLED !== "true") {
    return { enabled: false, reason: "disabled" };
  }

  const email = env.DEV_AUTH_EMAIL?.trim().toLowerCase();
  if (!email) {
    return { enabled: false, reason: "missing-email" };
  }

  return { enabled: true, email };
}
