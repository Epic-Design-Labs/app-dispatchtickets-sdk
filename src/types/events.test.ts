import { describe, it, expect } from 'vitest';
import {
  parseWebhookEvent,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  isCommentCreatedEvent,
  type WebhookEvent,
  type TicketCreatedEvent,
  type TicketUpdatedEvent,
  type CommentCreatedEvent,
} from './events.js';

describe('parseWebhookEvent', () => {
  const validTicketCreatedEvent = {
    id: 'evt_123',
    event: 'ticket.created',
    brand_id: 'br_456',
    data: {
      id: 'tkt_789',
      ticketNumber: 1,
      title: 'Test ticket',
      status: 'open',
      priority: 'normal',
      source: 'api',
      createdAt: '2024-01-01T00:00:00Z',
      customerId: 'cus_123',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
    },
    timestamp: '2024-01-01T00:00:00Z',
  };

  it('should parse a valid ticket.created event from object', () => {
    const event = parseWebhookEvent(validTicketCreatedEvent);
    expect(event.event).toBe('ticket.created');
    expect(event.data.id).toBe('tkt_789');
  });

  it('should parse a valid event from JSON string', () => {
    const event = parseWebhookEvent(JSON.stringify(validTicketCreatedEvent));
    expect(event.event).toBe('ticket.created');
  });

  it('should throw on invalid payload - not an object', () => {
    // Invalid JSON string throws JSON parse error
    expect(() => parseWebhookEvent('invalid')).toThrow();
    // Null object throws our error
    expect(() => parseWebhookEvent({ event: null } as any)).toThrow();
  });

  it('should throw on missing event type', () => {
    expect(() => parseWebhookEvent({ id: '123', data: {} })).toThrow('missing event type');
  });

  it('should throw on missing event id', () => {
    expect(() => parseWebhookEvent({ event: 'ticket.created', data: {} })).toThrow('missing event id');
  });

  it('should throw on missing data', () => {
    expect(() => parseWebhookEvent({ id: '123', event: 'ticket.created' })).toThrow('missing data');
  });

  it('should throw on unknown event type', () => {
    expect(() => parseWebhookEvent({
      id: '123',
      event: 'unknown.event',
      data: {},
    })).toThrow('unknown event type');
  });

  it('should parse ticket.updated event', () => {
    const event = parseWebhookEvent({
      id: 'evt_123',
      event: 'ticket.updated',
      brand_id: 'br_456',
      data: {
        id: 'tkt_789',
        ticketNumber: 1,
        title: 'Updated ticket',
        status: 'resolved',
        priority: 'high',
        assigneeId: 'user_123',
        updatedAt: '2024-01-01T00:00:00Z',
        changes: ['status', 'priority'],
        customerId: null,
        customerEmail: null,
        customerName: null,
      },
      timestamp: '2024-01-01T00:00:00Z',
    });
    expect(event.event).toBe('ticket.updated');
  });

  it('should parse ticket.comment.created event', () => {
    const event = parseWebhookEvent({
      id: 'evt_123',
      event: 'ticket.comment.created',
      brand_id: 'br_456',
      data: {
        ticketId: 'tkt_789',
        ticketNumber: 'ACME-1',
        customerId: 'cus_123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        comment: {
          id: 'cmt_123',
          body: 'Hello!',
          authorId: 'user_123',
          authorType: 'AGENT',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      timestamp: '2024-01-01T00:00:00Z',
    });
    expect(event.event).toBe('ticket.comment.created');
  });
});

describe('type guards', () => {
  const ticketCreatedEvent: TicketCreatedEvent = {
    id: 'evt_123',
    event: 'ticket.created',
    brand_id: 'br_456',
    data: {
      id: 'tkt_789',
      ticketNumber: 1,
      title: 'Test',
      status: 'open',
      priority: 'normal',
      source: 'api',
      createdAt: '2024-01-01T00:00:00Z',
      customerId: null,
      customerEmail: null,
      customerName: null,
    },
    timestamp: '2024-01-01T00:00:00Z',
  };

  const ticketUpdatedEvent: TicketUpdatedEvent = {
    id: 'evt_123',
    event: 'ticket.updated',
    brand_id: 'br_456',
    data: {
      id: 'tkt_789',
      ticketNumber: 1,
      title: 'Test',
      status: 'resolved',
      priority: 'normal',
      assigneeId: null,
      updatedAt: '2024-01-01T00:00:00Z',
      changes: ['status'],
      customerId: null,
      customerEmail: null,
      customerName: null,
    },
    timestamp: '2024-01-01T00:00:00Z',
  };

  const commentCreatedEvent: CommentCreatedEvent = {
    id: 'evt_123',
    event: 'ticket.comment.created',
    brand_id: 'br_456',
    data: {
      ticketId: 'tkt_789',
      ticketNumber: 'ACME-1',
      customerId: null,
      customerEmail: null,
      customerName: null,
      comment: {
        id: 'cmt_123',
        body: 'Hello',
        authorId: null,
        authorType: 'CUSTOMER',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
    timestamp: '2024-01-01T00:00:00Z',
  };

  describe('isTicketCreatedEvent', () => {
    it('should return true for ticket.created event', () => {
      expect(isTicketCreatedEvent(ticketCreatedEvent)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(isTicketCreatedEvent(ticketUpdatedEvent)).toBe(false);
      expect(isTicketCreatedEvent(commentCreatedEvent)).toBe(false);
    });

    it('should narrow the type correctly', () => {
      const event: WebhookEvent = ticketCreatedEvent;
      if (isTicketCreatedEvent(event)) {
        // TypeScript should know this is TicketCreatedEvent
        expect(event.data.ticketNumber).toBe(1);
        expect(event.data.source).toBe('api');
      }
    });
  });

  describe('isTicketUpdatedEvent', () => {
    it('should return true for ticket.updated event', () => {
      expect(isTicketUpdatedEvent(ticketUpdatedEvent)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(isTicketUpdatedEvent(ticketCreatedEvent)).toBe(false);
      expect(isTicketUpdatedEvent(commentCreatedEvent)).toBe(false);
    });

    it('should narrow the type correctly', () => {
      const event: WebhookEvent = ticketUpdatedEvent;
      if (isTicketUpdatedEvent(event)) {
        // TypeScript should know this is TicketUpdatedEvent
        expect(event.data.changes).toContain('status');
        expect(event.data.assigneeId).toBeNull();
      }
    });
  });

  describe('isCommentCreatedEvent', () => {
    it('should return true for ticket.comment.created event', () => {
      expect(isCommentCreatedEvent(commentCreatedEvent)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(isCommentCreatedEvent(ticketCreatedEvent)).toBe(false);
      expect(isCommentCreatedEvent(ticketUpdatedEvent)).toBe(false);
    });

    it('should narrow the type correctly', () => {
      const event: WebhookEvent = commentCreatedEvent;
      if (isCommentCreatedEvent(event)) {
        // TypeScript should know this is CommentCreatedEvent
        expect(event.data.comment.body).toBe('Hello');
        expect(event.data.ticketNumber).toBe('ACME-1');
      }
    });
  });
});
