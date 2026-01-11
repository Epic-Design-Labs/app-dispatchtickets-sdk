import { BaseResource } from './base.js';
import type {
  FieldDefinition,
  FieldDefinitions,
  CreateFieldInput,
  UpdateFieldInput,
  EntityType,
} from '../types/field.js';

/**
 * Custom fields resource
 */
export class FieldsResource extends BaseResource {
  /**
   * Get all field definitions for a brand
   */
  async getAll(brandId: string): Promise<FieldDefinitions> {
    return this._get<FieldDefinitions>(`/brands/${brandId}/fields`);
  }

  /**
   * Get field definitions for a specific entity type
   */
  async list(brandId: string, entityType: EntityType): Promise<FieldDefinition[]> {
    return this._get<FieldDefinition[]>(`/brands/${brandId}/fields/${entityType}`);
  }

  /**
   * Create a new field definition
   */
  async create(
    brandId: string,
    entityType: EntityType,
    data: CreateFieldInput
  ): Promise<FieldDefinition> {
    return this._post<FieldDefinition>(`/brands/${brandId}/fields/${entityType}`, data);
  }

  /**
   * Update a field definition
   */
  async update(
    brandId: string,
    entityType: EntityType,
    key: string,
    data: UpdateFieldInput
  ): Promise<FieldDefinition> {
    return this._patch<FieldDefinition>(
      `/brands/${brandId}/fields/${entityType}/${key}`,
      data
    );
  }

  /**
   * Delete a field definition
   */
  async delete(brandId: string, entityType: EntityType, key: string): Promise<void> {
    await this._delete<void>(`/brands/${brandId}/fields/${entityType}/${key}`);
  }

  /**
   * Reorder field definitions
   */
  async reorder(brandId: string, entityType: EntityType, keys: string[]): Promise<void> {
    await this._post<void>(`/brands/${brandId}/fields/${entityType}/reorder`, { keys });
  }
}
