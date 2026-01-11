import type { AttachmentStatus } from './common.js';

/**
 * Attachment resource
 */
export interface Attachment {
  id: string;
  ticketId: string;
  commentId?: string;
  filename: string;
  contentType: string;
  size: number;
  status: AttachmentStatus;
  uploadedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Attachment with download URL
 */
export interface AttachmentWithUrl extends Attachment {
  downloadUrl: string;
}

/**
 * Input for initiating an upload
 */
export interface InitiateUploadInput {
  filename: string;
  contentType: string;
  size: number;
  uploadedBy?: string;
}

/**
 * Response from initiating an upload
 */
export interface InitiateUploadResponse {
  attachmentId: string;
  uploadUrl: string;
  expiresIn: number;
}
