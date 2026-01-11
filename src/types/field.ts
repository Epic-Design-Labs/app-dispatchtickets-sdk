import type { FieldType, EntityType } from './common.js';

/**
 * Custom field definition
 */
export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  placeholder?: string;
  options?: string[];
  visible: boolean;
  sortOrder: number;
  source?: string;
  createdAt?: string;
}

/**
 * Field definitions grouped by entity type
 */
export interface FieldDefinitions {
  ticket: FieldDefinition[];
  customer: FieldDefinition[];
  company: FieldDefinition[];
}

/**
 * Input for creating a field definition
 */
export interface CreateFieldInput {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  placeholder?: string;
  options?: string[];
  visible?: boolean;
  sortOrder?: number;
  source?: string;
}

/**
 * Input for updating a field definition
 */
export interface UpdateFieldInput {
  label?: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  placeholder?: string;
  options?: string[];
  visible?: boolean;
  sortOrder?: number;
}

export type { EntityType };
