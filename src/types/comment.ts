import type { Link, TicketSource, AuthorType, TicketStatus } from './common.js';

/**
 * Comment resource
 */
export interface Comment {
  id: string;
  ticketId: string;
  body: string;
  authorId?: string;
  authorName?: string;
  authorType: AuthorType;
  parentId?: string;
  links?: Link[];
  metadata?: Record<string, unknown>;
  source: TicketSource;
  sourceId?: string;
  sourceData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  replies?: Comment[];
}

/**
 * Input for creating a comment
 */
export interface CreateCommentInput {
  body: string;
  authorId?: string;
  authorName?: string;
  authorType?: AuthorType;
  parentId?: string;
  links?: Link[];
  metadata?: Record<string, unknown>;
  source?: TicketSource;
  sourceId?: string;
  sourceData?: Record<string, unknown>;
  setStatus?: Exclude<TicketStatus, 'closed'>;
  connectionId?: string;
  cc?: string[];
}

/**
 * Input for updating a comment
 */
export interface UpdateCommentInput {
  body?: string;
  links?: Link[];
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating a comment
 */
export interface CreateCommentOptions {
  idempotencyKey?: string;
}
