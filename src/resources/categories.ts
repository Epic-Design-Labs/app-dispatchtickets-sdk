import { BaseResource } from './base.js';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryStats,
} from '../types/category.js';

/**
 * Categories resource
 */
export class CategoriesResource extends BaseResource {
  /**
   * Create a new category
   */
  async create(brandId: string, data: CreateCategoryInput): Promise<Category> {
    return this._post<Category>(`/brands/${brandId}/categories`, data);
  }

  /**
   * List all categories for a brand
   */
  async list(brandId: string): Promise<Category[]> {
    return this._get<Category[]>(`/brands/${brandId}/categories`);
  }

  /**
   * Get a category by ID
   */
  async get(brandId: string, categoryId: string): Promise<Category> {
    return this._get<Category>(`/brands/${brandId}/categories/${categoryId}`);
  }

  /**
   * Update a category
   */
  async update(
    brandId: string,
    categoryId: string,
    data: UpdateCategoryInput
  ): Promise<Category> {
    return this._patch<Category>(`/brands/${brandId}/categories/${categoryId}`, data);
  }

  /**
   * Delete a category
   */
  async delete(brandId: string, categoryId: string): Promise<void> {
    await this._delete<void>(`/brands/${brandId}/categories/${categoryId}`);
  }

  /**
   * Get category statistics (ticket counts)
   */
  async getStats(brandId: string): Promise<CategoryStats> {
    return this._get<CategoryStats>(`/brands/${brandId}/categories/stats`);
  }

  /**
   * Reorder categories
   */
  async reorder(brandId: string, categoryIds: string[]): Promise<void> {
    await this._post<void>(`/brands/${brandId}/categories/reorder`, { categoryIds });
  }
}
