import { describe, expect, it } from "vitest";
import { getDevLoginConfig, normalizeDevNextPath } from "./dev-auth";

describe("normalizeDevNextPath", () => {
  it("keeps safe relative next paths", () => {
    expect(normalizeDevNextPath("/dashboard/new")).toBe("/dashboard/new");
  });

  it("rejects external next URLs", () => {
    expect(normalizeDevNextPath("https://example.com/steal")).toBe("/dashboard");
  });

  it("rejects protocol-relative next URLs", () => {
    expect(normalizeDevNextPath("//example.com/steal")).toBe("/dashboard");
  });
});

describe("getDevLoginConfig", () => {
  it("disables dev login in production", () => {
    expect(
      getDevLoginConfig({
        NODE_ENV: "production",
        DEV_AUTH_ENABLED: "true",
        DEV_AUTH_EMAIL: "dev@example.com",
      }),
    ).toEqual({ enabled: false, reason: "production" });
  });

  it("requires an explicit env flag", () => {
    expect(
      getDevLoginConfig({
        NODE_ENV: "development",
        DEV_AUTH_EMAIL: "dev@example.com",
      }),
    ).toEqual({ enabled: false, reason: "disabled" });
  });

  it("requires a configured email", () => {
    expect(
      getDevLoginConfig({
        NODE_ENV: "development",
        DEV_AUTH_ENABLED: "true",
      }),
    ).toEqual({ enabled: false, reason: "missing-email" });
  });

  it("returns the configured email when enabled", () => {
    expect(
      getDevLoginConfig({
        NODE_ENV: "development",
        DEV_AUTH_ENABLED: "true",
        DEV_AUTH_EMAIL: "dev@example.com",
      }),
    ).toEqual({ enabled: true, email: "dev@example.com" });
  });
});
