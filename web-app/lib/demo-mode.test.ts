import { describe, expect, it } from "vitest";
import {
  getDemoFallbackPreview,
  getDemoUserEmail,
  isDemoModeEnabled,
} from "./demo-mode";
import type { LiveSiteStatus } from "./types";

describe("demo mode helpers", () => {
  it("keeps demo mode disabled unless the env flag is explicit", () => {
    expect(isDemoModeEnabled({})).toBe(false);
    expect(isDemoModeEnabled({ DEMO_MODE_ENABLED: "false" })).toBe(false);
    expect(isDemoModeEnabled({ DEMO_MODE_ENABLED: "true" })).toBe(true);
    expect(isDemoModeEnabled({ DEMO_MODE_ENABLED: "1" })).toBe(true);
  });

  it("requires a demo user email when demo mode creates sessions", () => {
    expect(() => getDemoUserEmail({ DEMO_MODE_ENABLED: "true" })).toThrow(
      "DEMO_USER_EMAIL is required",
    );
    expect(
      getDemoUserEmail({
        DEMO_MODE_ENABLED: "true",
        DEMO_USER_EMAIL: "founder@example.com",
      }),
    ).toBe("founder@example.com");
  });

  it("uses the real live site preview before falling back", () => {
    const completed: LiveSiteStatus = {
      status: "completed",
      demoUrl: "https://real.example.com",
    };

    expect(getDemoFallbackPreview(completed, "https://fallback.example.com")).toEqual({
      previewUrl: "https://real.example.com",
      usingFallback: false,
      notice: null,
    });
  });

  it("shows a saved fallback only while v0 is active or blocked", () => {
    expect(
      getDemoFallbackPreview(
        { status: "queued" },
        "https://fallback.example.com",
      ),
    ).toEqual({
      previewUrl: "https://fallback.example.com",
      usingFallback: true,
      notice: "Showing a saved demo preview while v0 keeps working.",
    });

    expect(
      getDemoFallbackPreview(
        { status: "none" },
        "https://fallback.example.com",
      ),
    ).toEqual({
      previewUrl: null,
      usingFallback: false,
      notice: null,
    });
  });
});
