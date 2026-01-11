/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
  };
}

/**
 * Link object for ticket/comment links
 */
export interface Link {
  url: string;
  title?: string;
  type?: string;
}

/**
 * Ticket source channels
 */
export type TicketSource =
  | 'api'
  | 'web'
  | 'email'
  | 'slack'
  | 'sms'
  | 'discord'
  | 'instagram'
  | 'twitter'
  | 'whatsapp'
  | 'custom';

/**
 * Ticket status values
 */
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

/**
 * Ticket priority values
 */
export type TicketPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';

/**
 * Comment author types
 */
export type AuthorType = 'CUSTOMER' | 'AGENT' | 'SYSTEM';

/**
 * Attachment status values
 */
export type AttachmentStatus = 'PENDING' | 'UPLOADED' | 'FAILED';

/**
 * Webhook event type strings (for subscription)
 * @deprecated Use WebhookEventType from events.ts for typed event handling
 */
export type WebhookEventName =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.deleted'
  | 'ticket.comment.created'
  | 'comment.created'
  | 'comment.updated'
  | 'comment.deleted'
  | 'attachment.created'
  | 'attachment.deleted';

/**
 * Custom field types
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'array'
  | 'object';

/**
 * Entity types for custom fields
 */
export type EntityType = 'ticket' | 'customer' | 'company';

/**
 * Bulk action types
 */
export type BulkAction =
  | 'spam'
  | 'resolve'
  | 'close'
  | 'delete'
  | 'assign'
  | 'setCategory'
  | 'setTags';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';
