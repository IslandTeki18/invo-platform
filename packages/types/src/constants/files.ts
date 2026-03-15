export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 5_242_880 as const; // 5 MB

export const MAX_ATTACHMENTS_PER_INVOICE = 2 as const;
