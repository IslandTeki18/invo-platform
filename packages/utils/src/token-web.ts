import { ACCESS_TOKEN_LENGTH } from "@repo/types";

export function generateAccessTokenWeb(): string {
  const bytes = new Uint8Array(ACCESS_TOKEN_LENGTH / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
