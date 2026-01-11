import { BaseResource, ApiRequestOptions } from './base.js';
import type {
  PortalTicket,
  PortalTicketDetail,
  PortalComment,
  PortalCreateTicketInput,
  PortalListTicketsFilters,
  PortalTicketListResponse,
} from '../types/portal.js';

/**
 * Options for creating a ticket via portal
 */
export interface PortalCreateTicketOptions extends ApiRequestOptions {
  /** Idempotency key to prevent duplicate creation */
  idempotencyKey?: string;
}

/**
 * Options for adding a comment via portal
 */
export interface PortalAddCommentOptions extends ApiRequestOptions {
  /** Idempotency key to prevent duplicate creation */
  idempotencyKey?: string;
}

/**
 * Portal tickets resource
 *
 * Provides methods for customers to manage their tickets via the portal API.
 *
 * @example
 * ```typescript
 * const portal = new DispatchPortal({ token: 'portal_token...' });
 *
 * // List tickets
 * const { data: tickets } = await portal.tickets.list();
 *
 * // Create a ticket
 * const ticket = await portal.tickets.create({
 *   title: 'Need help with my order',
 *   body: 'Order #12345 has not arrived...',
 * });
 *
 * // Add a comment
 * await portal.tickets.addComment(ticket.id, 'Any update on this?');
 * ```
 */
export class PortalTicketsResource extends BaseResource {
  /**
   * List the customer's tickets
   *
   * Returns a paginated list of tickets belonging to the authenticated customer.
   *
   * @param filters - Optional filters and pagination
   * @param options - Request options
   * @returns Paginated ticket list
   *
   * @example
   * ```typescript
   * // List all tickets
   * const { data: tickets, pagination } = await portal.tickets.list();
   *
   * // Filter by status
   * const openTickets = await portal.tickets.list({ status: 'open' });
   *
   * // Paginate
   * const page2 = await portal.tickets.list({ cursor: pagination.nextCursor });
   * ```
   */
  async list(
    filters?: PortalListTicketsFilters,
    options?: ApiRequestOptions
  ): Promise<PortalTicketListResponse> {
    const query = this.buildListQuery(filters);
    return this._get<PortalTicketListResponse>('/portal/tickets', query, options);
  }

  /**
   * Iterate through all tickets with automatic pagination
   *
   * @param filters - Optional filters (cursor is managed automatically)
   * @returns Async iterator of tickets
   *
   * @example
   * ```typescript
   * for await (const ticket of portal.tickets.listAll({ status: 'open' })) {
   *   console.log(ticket.title);
   * }
   * ```
   */
  async *listAll(
    filters?: Omit<PortalListTicketsFilters, 'cursor'>
  ): AsyncIterable<PortalTicket> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({ ...filters, cursor });
      for (const ticket of response.data) {
        yield ticket;
      }
      cursor = response.pagination.nextCursor ?? undefined;
      hasMore = response.pagination.hasMore;
    }
  }

  /**
   * Get a ticket by ID
   *
   * Returns the ticket with its comments (excludes internal comments).
   *
   * @param ticketId - Ticket ID
   * @param options - Request options
   * @returns Ticket detail with comments
   *
   * @example
   * ```typescript
   * const ticket = await portal.tickets.get('tkt_abc123');
   * console.log(ticket.title);
   * console.log(`${ticket.comments.length} comments`);
   * ```
   */
  async get(ticketId: string, options?: ApiRequestOptions): Promise<PortalTicketDetail> {
    return this._get<PortalTicketDetail>(`/portal/tickets/${ticketId}`, undefined, options);
  }

  /**
   * Create a new ticket
   *
   * @param data - Ticket data
   * @param options - Request options including idempotency key
   * @returns Created ticket
   *
   * @example
   * ```typescript
   * const ticket = await portal.tickets.create({
   *   title: 'Need help with billing',
   *   body: 'I was charged twice for my subscription...',
   * });
   * ```
   */
  async create(
    data: PortalCreateTicketInput,
    options?: PortalCreateTicketOptions
  ): Promise<PortalTicket> {
    return this._post<PortalTicket>('/portal/tickets', data, {
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
    });
  }

  /**
   * Add a comment to a ticket
   *
   * @param ticketId - Ticket ID
   * @param body - Comment text
   * @param options - Request options including idempotency key
   * @returns Created comment
   *
   * @example
   * ```typescript
   * const comment = await portal.tickets.addComment(
   *   'tkt_abc123',
   *   'Here is the additional information you requested...'
   * );
   * ```
   */
  async addComment(
    ticketId: string,
    body: string,
    options?: PortalAddCommentOptions
  ): Promise<PortalComment> {
    return this._post<PortalComment>(`/portal/tickets/${ticketId}/comments`, { body }, {
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
    });
  }

  /**
   * Build query parameters from filters
   */
  private buildListQuery(
    filters?: PortalListTicketsFilters
  ): Record<string, string | number> | undefined {
    if (!filters) return undefined;

    const query: Record<string, string | number> = {};

    if (filters.status) query.status = filters.status;
    if (filters.sort) query.sort = filters.sort;
    if (filters.order) query.order = filters.order;
    if (filters.limit) query.limit = filters.limit;
    if (filters.cursor) query.cursor = filters.cursor;

    return Object.keys(query).length > 0 ? query : undefined;
  }
}
