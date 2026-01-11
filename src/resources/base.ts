import { HttpClient, RequestOptions } from '../utils/http.js';

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /**
   * AbortSignal to cancel the request
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * setTimeout(() => controller.abort(), 5000);
   *
   * const ticket = await client.tickets.get('ws_abc', 'tkt_xyz', {
   *   signal: controller.signal,
   * });
   * ```
   */
  signal?: AbortSignal;
}

/**
 * Base class for all resource classes
 * @internal
 */
export abstract class BaseResource {
  protected readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  protected async _get<T>(
    path: string,
    query?: RequestOptions['query'],
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.http.request<T>({
      method: 'GET',
      path,
      query,
      signal: options?.signal,
    });
  }

  protected async _post<T>(
    path: string,
    body?: unknown,
    options?: { idempotencyKey?: string; query?: RequestOptions['query']; signal?: AbortSignal }
  ): Promise<T> {
    return this.http.request<T>({
      method: 'POST',
      path,
      body,
      idempotencyKey: options?.idempotencyKey,
      query: options?.query,
      signal: options?.signal,
    });
  }

  protected async _patch<T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.http.request<T>({
      method: 'PATCH',
      path,
      body,
      signal: options?.signal,
    });
  }

  protected async _put<T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.http.request<T>({
      method: 'PUT',
      path,
      body,
      signal: options?.signal,
    });
  }

  protected async _delete<T>(
    path: string,
    query?: RequestOptions['query'],
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.http.request<T>({
      method: 'DELETE',
      path,
      query,
      signal: options?.signal,
    });
  }
}
