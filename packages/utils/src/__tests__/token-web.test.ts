import { describe, it, expect } from "vitest";
import { generateAccessTokenWeb } from "../token-web";
import { isValidAccessToken } from "../token";

describe("generateAccessTokenWeb", () => {
  it("returns a 32-character hex string", () => {
    const token = generateAccessTokenWeb();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("passes isValidAccessToken", () => {
    const token = generateAccessTokenWeb();
    expect(isValidAccessToken(token)).toBe(true);
  });

  it("returns different tokens on multiple calls", () => {
    const token1 = generateAccessTokenWeb();
    const token2 = generateAccessTokenWeb();
    expect(token1).not.toBe(token2);
  });
});
