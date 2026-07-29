/**
 * Ticket status resource
 *
 * A brand's ticket statuses (both the four system statuses —
 * open/pending/resolved/closed — and any custom statuses added per brand).
 *
 * Note: this is the rich status *record* returned by the statuses API. It is
 * distinct from the `TicketStatus` string union in `common.ts`, which is the
 * status *key* used on tickets (e.g. `'open'`).
 */
export interface TicketStatusRecord {
  id: string;
  brandId: string;
  name: string;
  /** Stable key used on tickets, e.g. `'open'` or a custom `'in_progress'` */
  key: string;
  /** Hex color for UI badges */
  color: string;
  description?: string | null;
  /** True for the seeded system statuses (open/pending/resolved/closed) */
  isSystem: boolean;
  /** Inactive statuses are hidden from dropdowns */
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A status record with the number of (non-spam, non-deleted) tickets in it.
 */
export interface TicketStatusWithCount extends TicketStatusRecord {
  ticketCount: number;
}

/**
 * Ticket counts per status — one entry per status, ordered by `sortOrder`.
 */
export type TicketStatusStats = TicketStatusWithCount[];
