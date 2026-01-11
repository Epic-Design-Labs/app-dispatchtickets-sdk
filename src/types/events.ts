import type { TicketStatus, TicketPriority, TicketSource, AuthorType } from './common.js';

/**
 * All supported webhook event types
 */
export type WebhookEventType =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.comment.created';

/**
 * Base webhook event envelope
 */
export interface WebhookEventEnvelope<T extends WebhookEventType, D> {
  /** Unique event ID */
  id: string;
  /** Event type */
  event: T;
  /** Brand ID that triggered the event */
  brand_id: string;
  /** Event data */
  data: D;
  /** ISO timestamp when event was created */
  timestamp: string;
}

/**
 * Customer info included in events
 */
export interface EventCustomerInfo {
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
}

/**
 * Payload for ticket.created event
 */
export interface TicketCreatedData extends EventCustomerInfo {
  id: string;
  ticketNumber: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  createdAt: string;
}

/**
 * Payload for ticket.updated event
 */
export interface TicketUpdatedData extends EventCustomerInfo {
  id: string;
  ticketNumber: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  updatedAt: string;
  /** List of field names that were changed */
  changes: string[];
}

/**
 * Comment data in ticket.comment.created event
 */
export interface EventCommentData {
  id: string;
  body: string;
  authorId: string | null;
  authorType: AuthorType;
  createdAt: string;
}

/**
 * Payload for ticket.comment.created event
 */
export interface CommentCreatedData extends EventCustomerInfo {
  ticketId: string;
  /** Formatted ticket number (e.g., "ACME-123") */
  ticketNumber: string;
  comment: EventCommentData;
}

/**
 * Ticket created webhook event
 */
export type TicketCreatedEvent = WebhookEventEnvelope<'ticket.created', TicketCreatedData>;

/**
 * Ticket updated webhook event
 */
export type TicketUpdatedEvent = WebhookEventEnvelope<'ticket.updated', TicketUpdatedData>;

/**
 * Comment created webhook event
 */
export type CommentCreatedEvent = WebhookEventEnvelope<'ticket.comment.created', CommentCreatedData>;

/**
 * Union of all webhook events
 */
export type WebhookEvent = TicketCreatedEvent | TicketUpdatedEvent | CommentCreatedEvent;

/**
 * Map of event types to their data types
 */
export interface WebhookEventMap {
  'ticket.created': TicketCreatedEvent;
  'ticket.updated': TicketUpdatedEvent;
  'ticket.comment.created': CommentCreatedEvent;
}

/**
 * Type guard to check if event is a ticket.created event
 */
export function isTicketCreatedEvent(event: WebhookEvent): event is TicketCreatedEvent {
  return event.event === 'ticket.created';
}

/**
 * Type guard to check if event is a ticket.updated event
 */
export function isTicketUpdatedEvent(event: WebhookEvent): event is TicketUpdatedEvent {
  return event.event === 'ticket.updated';
}

/**
 * Type guard to check if event is a ticket.comment.created event
 */
export function isCommentCreatedEvent(event: WebhookEvent): event is CommentCreatedEvent {
  return event.event === 'ticket.comment.created';
}

/**
 * Parse and validate a webhook payload
 *
 * @param payload - Raw JSON payload string or parsed object
 * @returns Typed webhook event
 * @throws Error if payload is invalid
 *
 * @example
 * ```typescript
 * import { parseWebhookEvent, isTicketCreatedEvent } from '@dispatchtickets/sdk';
 *
 * app.post('/webhooks', (req, res) => {
 *   const event = parseWebhookEvent(req.body);
 *
 *   if (isTicketCreatedEvent(event)) {
 *     console.log('New ticket:', event.data.title);
 *   }
 * });
 * ```
 */
export function parseWebhookEvent(payload: string | object): WebhookEvent {
  const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

  if (!event || typeof event !== 'object') {
    throw new Error('Invalid webhook payload: expected object');
  }

  if (!event.event || typeof event.event !== 'string') {
    throw new Error('Invalid webhook payload: missing event type');
  }

  if (!event.id || typeof event.id !== 'string') {
    throw new Error('Invalid webhook payload: missing event id');
  }

  if (!event.data || typeof event.data !== 'object') {
    throw new Error('Invalid webhook payload: missing data');
  }

  const validEvents: WebhookEventType[] = ['ticket.created', 'ticket.updated', 'ticket.comment.created'];
  if (!validEvents.includes(event.event)) {
    throw new Error(`Invalid webhook payload: unknown event type "${event.event}"`);
  }

  return event as WebhookEvent;
}
