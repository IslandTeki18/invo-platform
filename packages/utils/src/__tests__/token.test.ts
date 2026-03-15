import { describe, it, expect } from "vitest";
import { generateAccessToken, isValidAccessToken } from "../token";

describe("generateAccessToken", () => {
  it("returns a 32-character hex string", () => {
    const token = generateAccessToken();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("returns different tokens on multiple calls", () => {
    const token1 = generateAccessToken();
    const token2 = generateAccessToken();
    expect(token1).not.toBe(token2);
  });
});

describe("isValidAccessToken", () => {
  it("accepts valid 32-character hex string", () => {
    expect(isValidAccessToken("abcdef0123456789abcdef0123456789")).toBe(true);
  });

  it("rejects string that is too short", () => {
    expect(isValidAccessToken("abcdef0123456789")).toBe(false);
  });

  it("rejects string that is too long", () => {
    expect(isValidAccessToken("abcdef0123456789abcdef0123456789aa")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidAccessToken("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidAccessToken("")).toBe(false);
  });
});
