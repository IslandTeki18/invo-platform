export interface FileMetadata {
  id: string;
  orgId: string;
  ownerEntityType: string;
  ownerEntityId: string;
  mimeType: string;
  sizeBytes: number;
  storageId: string;
  logicalPath: string | null;
  uploadedAt: number;
}

export interface Attachment {
  id: string;
  fileId: string;
  invoiceId: string;
  displayName: string;
}
