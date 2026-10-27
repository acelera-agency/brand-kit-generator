import { afterEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/demo/start/route";
import { parseDemoStartInput } from "./demo-start";

const ORIGINAL_DEMO_MODE = process.env.DEMO_MODE_ENABLED;

afterEach(() => {
  if (ORIGINAL_DEMO_MODE === undefined) {
    delete process.env.DEMO_MODE_ENABLED;
  } else {
    process.env.DEMO_MODE_ENABLED = ORIGINAL_DEMO_MODE;
  }
});

describe("/api/demo/start", () => {
  it("returns 404 when demo mode is disabled", async () => {
    process.env.DEMO_MODE_ENABLED = "false";

    const response = await POST(
      new Request("http://localhost/api/demo/start", {
        method: "POST",
        body: JSON.stringify({ context: "A valid founder context." }),
      }),
    );

    expect(response.status).toBe(404);
  });
});

describe("parseDemoStartInput", () => {
  it("requires enough founder context to start a live draft", () => {
    expect(parseDemoStartInput({ context: "" })).toEqual({
      ok: false,
      error: "Add enough context to start the demo draft.",
    });
  });

  it("normalizes brand name and context", () => {
    expect(
      parseDemoStartInput({
        brandName: "  Proof Ops  ",
        context:
          "  We used to sell workshops, but founders need live assets that improve while they answer sharper questions.  ",
      }),
    ).toEqual({
      ok: true,
      brandName: "Proof Ops",
      context:
        "We used to sell workshops, but founders need live assets that improve while they answer sharper questions.",
    });
  });
});
