import { BaseResource } from './base.js';
import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
  CreateCommentOptions,
} from '../types/comment.js';

/**
 * Comments resource
 */
export class CommentsResource extends BaseResource {
  /**
   * Create a new comment on a ticket
   */
  async create(
    brandId: string,
    ticketId: string,
    data: CreateCommentInput,
    options?: CreateCommentOptions
  ): Promise<Comment> {
    return this._post<Comment>(
      `/brands/${brandId}/tickets/${ticketId}/comments`,
      data,
      { idempotencyKey: options?.idempotencyKey }
    );
  }

  /**
   * List all comments on a ticket
   */
  async list(brandId: string, ticketId: string): Promise<Comment[]> {
    return this._get<Comment[]>(`/brands/${brandId}/tickets/${ticketId}/comments`);
  }

  /**
   * Get a comment by ID
   */
  async get(brandId: string, ticketId: string, commentId: string): Promise<Comment> {
    return this._get<Comment>(
      `/brands/${brandId}/tickets/${ticketId}/comments/${commentId}`
    );
  }

  /**
   * Update a comment
   */
  async update(
    brandId: string,
    ticketId: string,
    commentId: string,
    data: UpdateCommentInput
  ): Promise<Comment> {
    return this._patch<Comment>(
      `/brands/${brandId}/tickets/${ticketId}/comments/${commentId}`,
      data
    );
  }

  /**
   * Delete a comment
   */
  async delete(brandId: string, ticketId: string, commentId: string): Promise<Comment> {
    return this._delete<Comment>(
      `/brands/${brandId}/tickets/${ticketId}/comments/${commentId}`
    );
  }
}
