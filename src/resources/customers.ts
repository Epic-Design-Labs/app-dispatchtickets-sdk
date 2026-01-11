import { BaseResource } from './base.js';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersFilters,
} from '../types/customer.js';
import type { PaginatedResponse } from '../types/common.js';

/**
 * Customers resource
 */
export class CustomersResource extends BaseResource {
  /**
   * Create a new customer
   */
  async create(brandId: string, data: CreateCustomerInput): Promise<Customer> {
    return this._post<Customer>(`/brands/${brandId}/customers`, data);
  }

  /**
   * List customers with pagination (async iterator)
   */
  async *list(
    brandId: string,
    filters?: Omit<ListCustomersFilters, 'cursor'>
  ): AsyncIterable<Customer> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await this.listPage(brandId, { ...filters, cursor });
      for (const customer of page.data) {
        yield customer;
      }
      cursor = page.pagination.cursor;
      hasMore = page.pagination.hasMore;
    }
  }

  /**
   * List a single page of customers
   */
  async listPage(
    brandId: string,
    filters?: ListCustomersFilters
  ): Promise<PaginatedResponse<Customer>> {
    const query = this.buildListQuery(filters);
    return this._get<PaginatedResponse<Customer>>(`/brands/${brandId}/customers`, query);
  }

  /**
   * Search customers (autocomplete)
   */
  async search(brandId: string, query: string): Promise<Customer[]> {
    return this._get<Customer[]>(`/brands/${brandId}/customers/search`, { q: query });
  }

  /**
   * Get a customer by ID
   */
  async get(brandId: string, customerId: string): Promise<Customer> {
    return this._get<Customer>(`/brands/${brandId}/customers/${customerId}`);
  }

  /**
   * Update a customer
   */
  async update(
    brandId: string,
    customerId: string,
    data: UpdateCustomerInput
  ): Promise<Customer> {
    return this._patch<Customer>(`/brands/${brandId}/customers/${customerId}`, data);
  }

  /**
   * Delete a customer
   */
  async delete(brandId: string, customerId: string): Promise<Customer> {
    return this._delete<Customer>(`/brands/${brandId}/customers/${customerId}`);
  }

  private buildListQuery(
    filters?: ListCustomersFilters
  ): Record<string, string | number | boolean | undefined> {
    if (!filters) return {};

    const query: Record<string, string | number | boolean | undefined> = {};

    if (filters.limit) query.limit = filters.limit;
    if (filters.cursor) query.cursor = filters.cursor;
    if (filters.sort) query.sort = filters.sort;
    if (filters.order) query.order = filters.order;

    return query;
  }
}
