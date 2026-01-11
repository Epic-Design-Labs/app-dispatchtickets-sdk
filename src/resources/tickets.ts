import { BaseResource } from './base.js';
import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  ListTicketsFilters,
  CreateTicketOptions,
  MergeTicketsInput,
  BulkActionResult,
} from '../types/ticket.js';
import type { PaginatedResponse, BulkAction } from '../types/common.js';

/**
 * Tickets resource
 */
export class TicketsResource extends BaseResource {
  /**
   * Create a new ticket
   */
  async create(
    brandId: string,
    data: CreateTicketInput,
    options?: CreateTicketOptions
  ): Promise<Ticket> {
    return this._post<Ticket>(`/brands/${brandId}/tickets`, data, {
      idempotencyKey: options?.idempotencyKey,
    });
  }

  /**
   * List tickets with pagination (async iterator)
   * Automatically fetches all pages
   */
  async *list(
    brandId: string,
    filters?: Omit<ListTicketsFilters, 'cursor'>
  ): AsyncIterable<Ticket> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await this.listPage(brandId, { ...filters, cursor });
      for (const ticket of page.data) {
        yield ticket;
      }
      cursor = page.pagination.cursor;
      hasMore = page.pagination.hasMore;
    }
  }

  /**
   * List a single page of tickets
   */
  async listPage(
    brandId: string,
    filters?: ListTicketsFilters
  ): Promise<PaginatedResponse<Ticket>> {
    const query = this.buildListQuery(filters);
    return this._get<PaginatedResponse<Ticket>>(`/brands/${brandId}/tickets`, query);
  }

  /**
   * Get a ticket by ID
   */
  async get(brandId: string, ticketId: string): Promise<Ticket> {
    return this._get<Ticket>(`/brands/${brandId}/tickets/${ticketId}`);
  }

  /**
   * Update a ticket
   */
  async update(
    brandId: string,
    ticketId: string,
    data: UpdateTicketInput
  ): Promise<Ticket> {
    return this._patch<Ticket>(`/brands/${brandId}/tickets/${ticketId}`, data);
  }

  /**
   * Delete a ticket
   */
  async delete(brandId: string, ticketId: string): Promise<Ticket> {
    return this._delete<Ticket>(`/brands/${brandId}/tickets/${ticketId}`);
  }

  /**
   * Mark a ticket as spam or not spam
   */
  async markAsSpam(brandId: string, ticketId: string, isSpam: boolean): Promise<Ticket> {
    return this._post<Ticket>(`/brands/${brandId}/tickets/${ticketId}/spam`, { isSpam });
  }

  /**
   * Merge tickets into a target ticket
   */
  async merge(
    brandId: string,
    targetTicketId: string,
    sourceTicketIds: string[]
  ): Promise<Ticket> {
    return this._post<Ticket>(`/brands/${brandId}/tickets/${targetTicketId}/merge`, {
      sourceTicketIds,
    } satisfies MergeTicketsInput);
  }

  /**
   * Perform a bulk action on multiple tickets
   */
  async bulk(
    brandId: string,
    action: BulkAction,
    ticketIds: string[],
    options?: {
      assigneeId?: string | null;
      categoryId?: string | null;
      tags?: string[];
    }
  ): Promise<BulkActionResult> {
    return this._post<BulkActionResult>(`/brands/${brandId}/tickets/bulk`, {
      action,
      ticketIds,
      ...options,
    });
  }

  private buildListQuery(
    filters?: ListTicketsFilters
  ): Record<string, string | number | boolean | undefined> {
    if (!filters) return {};

    const query: Record<string, string | number | boolean | undefined> = {};

    if (filters.status) {
      query.status = Array.isArray(filters.status)
        ? filters.status.join(',')
        : filters.status;
    }
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.customerId) query.customerId = filters.customerId;
    if (filters.customerEmail) query.customerEmail = filters.customerEmail;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.createdAfter) query.createdAfter = filters.createdAfter;
    if (filters.createdBefore) query.createdBefore = filters.createdBefore;
    if (filters.hasAttachments !== undefined) query.hasAttachments = filters.hasAttachments;
    if (filters.isSpam !== undefined) query.isSpam = filters.isSpam;
    if (filters.search) query.search = filters.search;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.tagIds) query.tagIds = filters.tagIds.join(',');
    if (filters.source) query.source = filters.source;
    if (filters.sort) query.sort = filters.sort;
    if (filters.order) query.order = filters.order;
    if (filters.limit) query.limit = filters.limit;
    if (filters.cursor) query.cursor = filters.cursor;

    return query;
  }
}
