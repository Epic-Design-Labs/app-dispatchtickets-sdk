import { HttpClient, RequestOptions } from '../utils/http.js';

/**
 * Base class for all resource classes
 */
export abstract class BaseResource {
  protected readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  protected async _get<T>(path: string, query?: RequestOptions['query']): Promise<T> {
    return this.http.request<T>({
      method: 'GET',
      path,
      query,
    });
  }

  protected async _post<T>(
    path: string,
    body?: unknown,
    options?: { idempotencyKey?: string; query?: RequestOptions['query'] }
  ): Promise<T> {
    return this.http.request<T>({
      method: 'POST',
      path,
      body,
      idempotencyKey: options?.idempotencyKey,
      query: options?.query,
    });
  }

  protected async _patch<T>(path: string, body?: unknown): Promise<T> {
    return this.http.request<T>({
      method: 'PATCH',
      path,
      body,
    });
  }

  protected async _put<T>(path: string, body?: unknown): Promise<T> {
    return this.http.request<T>({
      method: 'PUT',
      path,
      body,
    });
  }

  protected async _delete<T>(path: string, query?: RequestOptions['query']): Promise<T> {
    return this.http.request<T>({
      method: 'DELETE',
      path,
      query,
    });
  }
}
