import {
  DispatchTicketsError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServerError,
  TimeoutError,
  NetworkError,
} from '../errors.js';

/**
 * Custom fetch function type
 */
export type FetchFunction = typeof fetch;

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  debug?: boolean;
  /**
   * Custom fetch implementation for testing/mocking
   */
  fetch?: FetchFunction;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}

/**
 * HTTP client with retry logic and error handling
 */
export class HttpClient {
  private readonly config: HttpClientConfig;
  private readonly fetchFn: FetchFunction;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.fetchFn = config.fetch ?? fetch;
  }

  /**
   * Execute an HTTP request with retry logic
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.headers, options.idempotencyKey);

    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const response = await this.executeRequest(url, options.method, headers, options.body);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (except rate limits)
        if (error instanceof DispatchTicketsError) {
          if (
            error instanceof AuthenticationError ||
            error instanceof ValidationError ||
            error instanceof NotFoundError ||
            error instanceof ConflictError
          ) {
            throw error;
          }

          // Retry on rate limit with backoff
          if (error instanceof RateLimitError && error.retryAfter) {
            if (attempt < this.config.maxRetries) {
              await this.sleep(error.retryAfter * 1000);
              attempt++;
              continue;
            }
          }

          // Retry on server errors
          if (error instanceof ServerError) {
            if (attempt < this.config.maxRetries) {
              await this.sleep(this.calculateBackoff(attempt));
              attempt++;
              continue;
            }
          }
        }

        // Retry on network/timeout errors
        if (error instanceof NetworkError || error instanceof TimeoutError) {
          if (attempt < this.config.maxRetries) {
            await this.sleep(this.calculateBackoff(attempt));
            attempt++;
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new NetworkError('Request failed after retries');
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    idempotencyKey?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  private async executeRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      if (this.config.debug) {
        console.log(`[DispatchTickets] ${method} ${url}`);
        if (body) {
          console.log('[DispatchTickets] Body:', JSON.stringify(body, null, 2));
        }
      }

      const response = await this.fetchFn(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(`Request timed out after ${this.config.timeout}ms`);
        }
        throw new NetworkError(error.message);
      }
      throw new NetworkError('Unknown network error');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (response.ok) {
      if (response.status === 204 || !isJson) {
        return undefined as T;
      }
      return (await response.json()) as T;
    }

    // Handle error responses
    let errorData: ApiErrorResponse = {};
    if (isJson) {
      try {
        errorData = (await response.json()) as ApiErrorResponse;
      } catch {
        // Ignore JSON parse errors for error responses
      }
    }

    const message = errorData.message || errorData.error || response.statusText;

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 400:
      case 422:
        throw new ValidationError(message, errorData.errors);
      case 404:
        throw new NotFoundError(message);
      case 409:
        throw new ConflictError(message);
      case 429: {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : undefined);
      }
      default:
        if (response.status >= 500) {
          throw new ServerError(message, response.status);
        }
        throw new DispatchTicketsError(message, 'api_error', response.status, errorData as Record<string, unknown>);
    }
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, ...
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (0-25% of delay)
    return delay + Math.random() * delay * 0.25;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
