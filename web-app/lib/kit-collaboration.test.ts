import { describe, expect, it } from "vitest";
import { hasKitRole, normalizeEmail } from "./kit-collaboration";

describe("hasKitRole", () => {
  it("treats owner as stronger than editor and viewer", () => {
    expect(hasKitRole("owner", "viewer")).toBe(true);
    expect(hasKitRole("owner", "editor")).toBe(true);
  });

  it("blocks weaker roles", () => {
    expect(hasKitRole("viewer", "editor")).toBe(false);
    expect(hasKitRole(null, "viewer")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases invitation emails", () => {
    expect(normalizeEmail("  Team@Example.COM ")).toBe("team@example.com");
  });
});
