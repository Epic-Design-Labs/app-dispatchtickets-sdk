import type { SortOrder } from './common.js';

/**
 * Customer resource
 */
export interface Customer {
  id: string;
  brandId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  companyId?: string;
  company?: Company;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tickets: number;
  };
}

/**
 * Company resource
 */
export interface Company {
  id: string;
  brandId: string;
  name: string;
  domain?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    customers: number;
  };
}

/**
 * Input for creating a customer
 */
export interface CreateCustomerInput {
  email: string;
  name?: string;
  avatarUrl?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a customer
 */
export interface UpdateCustomerInput {
  email?: string;
  name?: string;
  avatarUrl?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Filters for listing customers
 */
export interface ListCustomersFilters {
  limit?: number;
  cursor?: string;
  sort?: 'createdAt' | 'name' | 'email';
  order?: SortOrder;
}
