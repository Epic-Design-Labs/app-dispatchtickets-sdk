import { BaseResource } from './base.js';
import type {
  Attachment,
  AttachmentWithUrl,
  InitiateUploadInput,
  InitiateUploadResponse,
} from '../types/attachment.js';

/**
 * Attachments resource
 */
export class AttachmentsResource extends BaseResource {
  /**
   * Initiate an upload and get a presigned URL
   */
  async initiateUpload(
    brandId: string,
    ticketId: string,
    data: InitiateUploadInput
  ): Promise<InitiateUploadResponse> {
    return this._post<InitiateUploadResponse>(
      `/brands/${brandId}/tickets/${ticketId}/attachments`,
      data
    );
  }

  /**
   * Confirm that an upload has completed
   */
  async confirmUpload(
    brandId: string,
    ticketId: string,
    attachmentId: string
  ): Promise<Attachment> {
    return this._post<Attachment>(
      `/brands/${brandId}/tickets/${ticketId}/attachments/${attachmentId}/confirm`
    );
  }

  /**
   * List all attachments on a ticket
   */
  async list(brandId: string, ticketId: string): Promise<Attachment[]> {
    return this._get<Attachment[]>(`/brands/${brandId}/tickets/${ticketId}/attachments`);
  }

  /**
   * Get an attachment with its download URL
   */
  async get(
    brandId: string,
    ticketId: string,
    attachmentId: string
  ): Promise<AttachmentWithUrl> {
    return this._get<AttachmentWithUrl>(
      `/brands/${brandId}/tickets/${ticketId}/attachments/${attachmentId}`
    );
  }

  /**
   * Delete an attachment
   */
  async delete(
    brandId: string,
    ticketId: string,
    attachmentId: string
  ): Promise<void> {
    await this._delete<void>(
      `/brands/${brandId}/tickets/${ticketId}/attachments/${attachmentId}`
    );
  }

  /**
   * Convenience method: Upload a file in one step
   * Handles: initiate -> upload to presigned URL -> confirm
   */
  async upload(
    brandId: string,
    ticketId: string,
    file: Blob | Buffer | ArrayBuffer,
    filename: string,
    contentType: string
  ): Promise<Attachment> {
    // Get file size
    let size: number;
    if (file instanceof Blob) {
      size = file.size;
    } else if (Buffer.isBuffer(file)) {
      size = file.length;
    } else {
      size = file.byteLength;
    }

    // Initiate upload
    const { uploadUrl, attachmentId } = await this.initiateUpload(brandId, ticketId, {
      filename,
      contentType,
      size,
    });

    // Upload to presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(size),
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    // Confirm upload
    return this.confirmUpload(brandId, ticketId, attachmentId);
  }
}
