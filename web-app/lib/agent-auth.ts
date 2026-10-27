type EnvLike = Record<string, string | undefined>;

export type AgentAuthConfig =
  | { enabled: true; token: string; email: string }
  | { enabled: false; reason: "missing-token" | "missing-email" };

export type AgentAuthResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 500; error: string };

export function getAgentAuthConfig(env: EnvLike = process.env): AgentAuthConfig {
  const token = env.BRANDKIT_AGENT_TOKEN?.trim();
  if (!token) return { enabled: false, reason: "missing-token" };

  const email = (env.AGENT_USER_EMAIL?.trim() || "agent@brandkit.local").toLowerCase();
  if (!email) return { enabled: false, reason: "missing-email" };

  return { enabled: true, token, email };
}

export function authorizeAgentRequest(
  request: Request,
  env: EnvLike = process.env,
): AgentAuthResult {
  const config = getAgentAuthConfig(env);
  if (!config.enabled) {
    return {
      ok: false,
      status: 500,
      error: "Agent API is not configured",
    };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${config.token}`;
  if (authorization !== expected) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized agent request",
    };
  }

  return { ok: true, email: config.email };
}
