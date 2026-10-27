import { afterEach, describe, expect, it } from "vitest";
import { POST as createAgentKit } from "@/app/api/agent/kits/route";

const originalEnv = process.env;

describe("agent api routes", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects kit creation without a bearer token", async () => {
    process.env = {
      ...originalEnv,
      BRANDKIT_AGENT_TOKEN: "secret",
      AGENT_USER_EMAIL: "agent@brandkit.local",
    };

    const response = await createAgentKit(
      new Request("http://localhost/api/agent/kits", {
        method: "POST",
        body: JSON.stringify({ name: "Agent kit" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized agent request",
    });
  });
});
