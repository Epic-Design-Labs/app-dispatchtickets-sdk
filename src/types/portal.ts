/**
 * Portal API Types
 *
 * Types for the customer-facing portal API.
 * Used with the DispatchPortal client.
 */

// ============================================================================
// Token Types
// ============================================================================

/**
 * Response from portal token generation or verification
 */
export interface PortalTokenResponse {
  /** JWT portal token for Authorization header */
  token: string;
  /** ISO 8601 expiration timestamp */
  expiresAt: string;
  /** Customer ID */
  customerId: string;
  /** Customer email */
  email: string;
  /** Customer name (if provided) */
  name?: string;
}

/**
 * Input for generating a portal token
 */
export interface GeneratePortalTokenInput {
  /** Customer email address */
  email: string;
  /** Customer name (optional) */
  name?: string;
}

/**
 * Input for sending a magic link email
 */
export interface SendMagicLinkInput {
  /** Customer email address */
  email: string;
  /** URL to redirect to after verification (your portal URL) */
  portalUrl: string;
}

// ============================================================================
// Ticket Types
// ============================================================================

/**
 * Ticket summary (returned in list views)
 */
export interface PortalTicket {
  /** Ticket ID */
  id: string;
  /** Formatted ticket number (e.g., "TKT-1001") */
  ticketNumber: string;
  /** Ticket title */
  title: string;
  /** Current status */
  status: string;
  /** Priority level */
  priority: string;
  /** Number of comments on the ticket */
  commentCount: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Ticket detail with body and comments
 */
export interface PortalTicketDetail extends PortalTicket {
  /** Ticket body/description */
  body: string;
  /** Brand information */
  brand: {
    /** Brand name */
    name: string;
  };
  /** Comments on the ticket (excludes internal comments) */
  comments: PortalComment[];
}

/**
 * Comment on a ticket
 */
export interface PortalComment {
  /** Comment ID */
  id: string;
  /** Comment body */
  body: string;
  /** Author type */
  authorType: 'CUSTOMER' | 'STAFF';
  /** Author display name */
  authorName: string;
  /** Creation timestamp */
  createdAt: string;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for creating a ticket via portal
 */
export interface PortalCreateTicketInput {
  /** Ticket title */
  title: string;
  /** Ticket body/description (optional) */
  body?: string;
  /** IDs of pending attachments to associate with the ticket */
  attachmentIds?: string[];
}

/**
 * Filters for listing tickets
 */
export interface PortalListTicketsFilters {
  /** Filter by status */
  status?: string;
  /** Sort field */
  sort?: 'createdAt' | 'updatedAt';
  /** Sort order */
  order?: 'asc' | 'desc';
  /** Maximum results per page (1-50, default 20) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Paginated list of tickets
 */
export interface PortalTicketListResponse {
  /** Array of tickets */
  data: PortalTicket[];
  /** Pagination info */
  pagination: {
    /** Whether more results are available */
    hasMore: boolean;
    /** Cursor for next page (null if no more) */
    nextCursor: string | null;
  };
}

// ============================================================================
// Attachment Types
// ============================================================================

/**
 * Input for initiating an attachment upload
 */
export interface PortalCreateAttachmentInput {
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  contentType: string;
  /** File size in bytes (max 50MB) */
  size: number;
}

/**
 * Response from initiating an attachment upload
 */
export interface PortalAttachmentUploadResponse {
  /** The created attachment record */
  attachment: PortalAttachment;
  /** Presigned URL for uploading the file (PUT request) */
  uploadUrl: string;
  /** URL expiration timestamp */
  expiresAt: string;
}

/**
 * Attachment record
 */
export interface PortalAttachment {
  /** Attachment ID */
  id: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  contentType: string;
  /** File size in bytes */
  size: number;
  /** Upload status */
  status: 'PENDING' | 'UPLOADED' | 'FAILED';
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Attachment with download URL
 */
export interface PortalAttachmentWithUrl extends PortalAttachment {
  /** Presigned download URL */
  downloadUrl: string;
  /** Download URL expiration timestamp */
  expiresAt: string;
}
