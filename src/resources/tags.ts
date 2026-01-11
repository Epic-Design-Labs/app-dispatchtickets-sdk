import { BaseResource } from './base.js';
import type { Tag, CreateTagInput, UpdateTagInput } from '../types/tag.js';

/**
 * Tags resource
 */
export class TagsResource extends BaseResource {
  /**
   * Create a new tag
   */
  async create(brandId: string, data: CreateTagInput): Promise<Tag> {
    return this._post<Tag>(`/brands/${brandId}/tags`, data);
  }

  /**
   * List all tags for a brand
   */
  async list(brandId: string): Promise<Tag[]> {
    return this._get<Tag[]>(`/brands/${brandId}/tags`);
  }

  /**
   * Update a tag
   */
  async update(brandId: string, tagId: string, data: UpdateTagInput): Promise<Tag> {
    return this._patch<Tag>(`/brands/${brandId}/tags/${tagId}`, data);
  }

  /**
   * Delete a tag
   */
  async delete(brandId: string, tagId: string): Promise<void> {
    await this._delete<void>(`/brands/${brandId}/tags/${tagId}`);
  }

  /**
   * Merge tags into a target tag
   */
  async merge(brandId: string, targetTagId: string, sourceTagIds: string[]): Promise<Tag> {
    return this._post<Tag>(`/brands/${brandId}/tags/${targetTagId}/merge`, {
      sourceTagIds,
    });
  }
}
