import { ACCESS_TOKEN_LENGTH } from "@repo/types";
import { randomBytes } from "crypto";

export function generateAccessToken(): string {
  return randomBytes(ACCESS_TOKEN_LENGTH / 2).toString("hex");
}

export function isValidAccessToken(token: string): boolean {
  return new RegExp(`^[a-f0-9]{${ACCESS_TOKEN_LENGTH}}$`).test(token);
}
