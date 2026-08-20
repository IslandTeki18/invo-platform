import { ACCESS_TOKEN_LENGTH } from "@repo/types";
import { generateAccessTokenWeb } from "./token-web";

// Web Crypto only: this module is bundled into the mobile app, where Node's `crypto` does not exist.
export function generateAccessToken(): string {
  return generateAccessTokenWeb();
}

export function isValidAccessToken(token: string): boolean {
  return new RegExp(`^[a-f0-9]{${ACCESS_TOKEN_LENGTH}}$`).test(token);
}
