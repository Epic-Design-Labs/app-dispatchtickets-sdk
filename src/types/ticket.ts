import type { Link, TicketSource, TicketStatus, TicketPriority, SortOrder } from './common.js';
import type { Category } from './category.js';
import type { Tag } from './tag.js';
import type { Customer } from './customer.js';

/**
 * Ticket resource
 */
export interface Ticket {
  id: string;
  brandId: string;
  ticketNumber: number;
  title: string;
  body?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  createdBy?: string;
  customerId?: string;
  customer?: Customer;
  categoryId?: string;
  category?: Category;
  tags?: Tag[];
  links?: Link[];
  customFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  source: TicketSource;
  sourceId?: string;
  sourceData?: Record<string, unknown>;
  commentCount: number;
  attachmentCount: number;
  isSpam: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  mergedIntoId?: string;
}

/**
 * Input for creating a ticket
 */
export interface CreateTicketInput {
  title: string;
  body?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  createdBy?: string;
  categoryId?: string;
  tags?: string[];
  links?: Link[];
  customFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  source?: TicketSource;
  sourceId?: string;
  sourceData?: Record<string, unknown>;
  notifyCustomer?: boolean;
}

/**
 * Input for updating a ticket
 */
export interface UpdateTicketInput {
  title?: string;
  body?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  categoryId?: string | null;
  tags?: string[];
  links?: Link[];
  customFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isSpam?: boolean;
}

/**
 * Filters for listing tickets
 */
export interface ListTicketsFilters {
  status?: TicketStatus | TicketStatus[] | 'active';
  priority?: TicketPriority;
  assigneeId?: string;
  customerId?: string;
  customerEmail?: string;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  hasAttachments?: boolean;
  isSpam?: boolean;
  search?: string;
  categoryId?: string;
  tagIds?: string[];
  source?: TicketSource;
  sort?: 'createdAt' | 'updatedAt' | 'priority';
  order?: SortOrder;
  limit?: number;
  cursor?: string;
}

/**
 * Options for creating a ticket
 */
export interface CreateTicketOptions {
  idempotencyKey?: string;
}

/**
 * Input for merging tickets
 */
export interface MergeTicketsInput {
  sourceTicketIds: string[];
}

/**
 * Result of a bulk action
 */
export interface BulkActionResult {
  success: boolean;
  count: number;
}
