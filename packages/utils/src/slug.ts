import { randomBytes } from "crypto";

export function generateOrgSubdomain(): string {
  return randomBytes(8).toString("hex").slice(0, 12);
}
