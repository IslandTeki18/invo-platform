import { z } from "zod/v4";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_INVOICE,
} from "@repo/types";

export const fileUploadSchema = z.object({
  mimeType: z.enum(ALLOWED_FILE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

export const attachmentSchema = z
  .object({
    invoiceId: z.string().min(1),
    fileId: z.string().min(1),
    currentAttachmentCount: z.number().int().nonnegative(),
  })
  .refine(
    (data) => data.currentAttachmentCount < MAX_ATTACHMENTS_PER_INVOICE,
    {
      message: `Maximum of ${MAX_ATTACHMENTS_PER_INVOICE} attachments per invoice`,
      path: ["currentAttachmentCount"],
    },
  );

export type AttachmentInput = z.infer<typeof attachmentSchema>;
