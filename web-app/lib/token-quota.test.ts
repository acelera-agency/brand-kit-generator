import { describe, expect, it } from "vitest";
import { costToTokens } from "./token-quota";

describe("costToTokens", () => {
  it("rounds numeric usage up to the next whole token", () => {
    expect(costToTokens(1000)).toBe(1000);
    expect(costToTokens(1000.1)).toBe(1001);
  });

  it("never returns a negative number", () => {
    expect(costToTokens(-5)).toBe(0);
  });
});
