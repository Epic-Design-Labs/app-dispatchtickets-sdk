import type { TicketStatus, TicketPriority, TicketSource, AuthorType } from './common.js';

/**
 * All supported webhook event types
 */
export type WebhookEventType =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.comment.created'
  | 'ticket.overdue'
  | 'ticket.awaiting_reply'
  | 'chat.started'
  | 'chat.message';

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
 * Payload for ticket.overdue event: a ticket passed its due date
 */
export interface TicketOverdueData {
  id: string;
  ticketNumber: number;
  title: string;
  dueAt: string;
  /** Milliseconds past `dueAt` when the event fired */
  overdueBy: number;
}

/**
 * Payload for ticket.awaiting_reply event: a customer has been waiting for a
 * reply. Fires once at `'warning'` and once at `'critical'` for each wait.
 */
export interface TicketAwaitingReplyData {
  id: string;
  ticketNumber: number;
  /** Formatted ticket number (e.g., "ACME-123") */
  publicId: string;
  title: string;
  source: TicketSource;
  assigneeId: string | null;
  level: 'warning' | 'critical';
  awaitingReplySince: string;
  waitingSeconds: number;
}

/**
 * Payload for chat.started event: a visitor's first message opened a chat
 */
export interface ChatStartedData {
  ticketId: string;
  ticketNumber: number;
  sessionId: string;
  title: string;
  /** The visitor's first message */
  body: string | null;
  createdAt: string;
  /**
   * `'verified'`: your server vouched for this person with an identity token.
   * `'anonymous'`: anyone; `claimedEmail` is whatever they typed.
   */
  identity: 'verified' | 'anonymous';
  /** Your user id, when verified */
  externalUserId: string | null;
  /** An email an anonymous visitor typed. Never verified. */
  claimedEmail: string | null;
  /** What the widget reported about the page and browser */
  visitor: Record<string, unknown> | null;
  /** Set only for verified visitors */
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  companyId: string | null;
  companyName: string | null;
}

/**
 * Payload for chat.message event: a visitor or agent message on a chat.
 * Internal notes never fire it, and the first message arrives as chat.started.
 */
export interface ChatMessageData {
  ticketId: string;
  /** Formatted ticket number (e.g., "ACME-123") */
  ticketNumber: string;
  sessionId: string | null;
  from: 'visitor' | 'agent';
  message: {
    id: string;
    body: string;
    authorId: string | null;
    createdAt: string;
  };
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
 * Ticket overdue webhook event
 */
export type TicketOverdueEvent = WebhookEventEnvelope<'ticket.overdue', TicketOverdueData>;

/**
 * Ticket awaiting reply webhook event
 */
export type TicketAwaitingReplyEvent = WebhookEventEnvelope<'ticket.awaiting_reply', TicketAwaitingReplyData>;

/**
 * Chat started webhook event
 */
export type ChatStartedEvent = WebhookEventEnvelope<'chat.started', ChatStartedData>;

/**
 * Chat message webhook event
 */
export type ChatMessageEvent = WebhookEventEnvelope<'chat.message', ChatMessageData>;

/**
 * Union of all webhook events
 */
export type WebhookEvent =
  | TicketCreatedEvent
  | TicketUpdatedEvent
  | CommentCreatedEvent
  | TicketOverdueEvent
  | TicketAwaitingReplyEvent
  | ChatStartedEvent
  | ChatMessageEvent;

/**
 * Map of event types to their data types
 */
export interface WebhookEventMap {
  'ticket.created': TicketCreatedEvent;
  'ticket.updated': TicketUpdatedEvent;
  'ticket.comment.created': CommentCreatedEvent;
  'ticket.overdue': TicketOverdueEvent;
  'ticket.awaiting_reply': TicketAwaitingReplyEvent;
  'chat.started': ChatStartedEvent;
  'chat.message': ChatMessageEvent;
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
 * Type guard to check if event is a ticket.overdue event
 */
export function isTicketOverdueEvent(event: WebhookEvent): event is TicketOverdueEvent {
  return event.event === 'ticket.overdue';
}

/**
 * Type guard to check if event is a ticket.awaiting_reply event
 */
export function isTicketAwaitingReplyEvent(event: WebhookEvent): event is TicketAwaitingReplyEvent {
  return event.event === 'ticket.awaiting_reply';
}

/**
 * Type guard to check if event is a chat.started event
 */
export function isChatStartedEvent(event: WebhookEvent): event is ChatStartedEvent {
  return event.event === 'chat.started';
}

/**
 * Type guard to check if event is a chat.message event
 */
export function isChatMessageEvent(event: WebhookEvent): event is ChatMessageEvent {
  return event.event === 'chat.message';
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

  const validEvents: WebhookEventType[] = [
    'ticket.created',
    'ticket.updated',
    'ticket.comment.created',
    'ticket.overdue',
    'ticket.awaiting_reply',
    'chat.started',
    'chat.message',
  ];
  if (!validEvents.includes(event.event)) {
    throw new Error(`Invalid webhook payload: unknown event type "${event.event}"`);
  }

  return event as WebhookEvent;
}
