// Web Crypto only: this module is bundled into the mobile app, where Node's `crypto` does not exist.
export function generateOrgSubdomain(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}
