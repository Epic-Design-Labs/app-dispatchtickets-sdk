import { BaseResource } from './base.js';
import type {
  TicketStatusRecord,
  TicketStatusStats,
} from '../types/status.js';

/**
 * Ticket statuses resource
 *
 * Each brand has four system statuses (open, pending, resolved, closed) seeded
 * on creation, plus any custom statuses added for that brand.
 */
export class StatusesResource extends BaseResource {
  /**
   * List all statuses for a brand (system + custom), ordered by sortOrder.
   */
  async list(brandId: string): Promise<TicketStatusRecord[]> {
    return this._get<TicketStatusRecord[]>(`/brands/${brandId}/statuses`);
  }

  /**
   * Get ticket counts per status.
   *
   * Returns every status for the brand with a `ticketCount` of the non-spam,
   * non-deleted tickets currently in it.
   */
  async getStats(brandId: string): Promise<TicketStatusStats> {
    return this._get<TicketStatusStats>(`/brands/${brandId}/statuses/stats`);
  }
}
