import { BaseResource } from './base.js';
import type { Brand, CreateBrandInput, UpdateBrandInput, DeleteBrandPreview } from '../types/brand.js';

/**
 * Brands resource for managing workspaces
 */
export class BrandsResource extends BaseResource {
  /**
   * Create a new brand
   */
  async create(data: CreateBrandInput): Promise<Brand> {
    return this._post<Brand>('/brands', data);
  }

  /**
   * List all brands
   */
  async list(): Promise<Brand[]> {
    return this._get<Brand[]>('/brands');
  }

  /**
   * Get a brand by ID
   */
  async get(brandId: string): Promise<Brand> {
    return this._get<Brand>(`/brands/${brandId}`);
  }

  /**
   * Update a brand
   */
  async update(brandId: string, data: UpdateBrandInput): Promise<Brand> {
    return this._patch<Brand>(`/brands/${brandId}`, data);
  }

  /**
   * Delete a brand
   * @param brandId - The brand ID
   * @param confirm - Set to true to actually delete; false to preview what would be deleted
   */
  async delete(brandId: string, confirm = true): Promise<void | DeleteBrandPreview> {
    if (confirm) {
      await this._delete<void>(`/brands/${brandId}`, { confirm: true });
      return;
    }
    return this._delete<DeleteBrandPreview>(`/brands/${brandId}`);
  }

  /**
   * Get the ticket schema for a brand
   */
  async getSchema(brandId: string): Promise<Record<string, unknown>> {
    return this._get<Record<string, unknown>>(`/brands/${brandId}/schema`);
  }

  /**
   * Update the ticket schema for a brand
   */
  async updateSchema(brandId: string, schema: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this._put<Record<string, unknown>>(`/brands/${brandId}/schema`, schema);
  }

  /**
   * Get the inbound email address for a brand
   *
   * Emails sent to this address will automatically create tickets.
   *
   * @param brandId - The brand ID
   * @param domain - Optional custom inbound domain (default: inbound.dispatchtickets.com)
   * @returns The inbound email address
   *
   * @example
   * ```typescript
   * const email = client.brands.getInboundEmail('br_abc123');
   * // Returns: br_abc123@inbound.dispatchtickets.com
   *
   * // With custom domain:
   * const customEmail = client.brands.getInboundEmail('br_abc123', 'support.mycompany.com');
   * // Returns: br_abc123@support.mycompany.com
   * ```
   */
  getInboundEmail(brandId: string, domain = 'inbound.dispatchtickets.com'): string {
    return `${brandId}@${domain}`;
  }
}
