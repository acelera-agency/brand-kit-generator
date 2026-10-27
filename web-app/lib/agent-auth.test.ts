import { describe, expect, it } from "vitest";
import { authorizeAgentRequest, getAgentAuthConfig } from "./agent-auth";

describe("agent auth", () => {
  it("requires an explicit local token", () => {
    expect(getAgentAuthConfig({})).toEqual({
      enabled: false,
      reason: "missing-token",
    });
  });

  it("uses the configured agent email when token auth is enabled", () => {
    expect(
      getAgentAuthConfig({
        BRANDKIT_AGENT_TOKEN: "secret",
        AGENT_USER_EMAIL: "Agent@BrandKit.local ",
      }),
    ).toEqual({
      enabled: true,
      token: "secret",
      email: "agent@brandkit.local",
    });
  });

  it("rejects requests without the bearer token", () => {
    const req = new Request("http://localhost/api/agent/kits", {
      headers: { Authorization: "Bearer wrong" },
    });

    expect(
      authorizeAgentRequest(req, {
        BRANDKIT_AGENT_TOKEN: "secret",
        AGENT_USER_EMAIL: "agent@brandkit.local",
      }),
    ).toEqual({
      ok: false,
      status: 401,
      error: "Unauthorized agent request",
    });
  });
});
