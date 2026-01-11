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

/**
 * Request context passed to hooks
 */
export interface RequestContext {
  /** HTTP method */
  method: string;
  /** Full URL being requested */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (if any) */
  body?: unknown;
  /** Retry attempt number (0 = first attempt) */
  attempt: number;
}

/**
 * Response context passed to hooks
 */
export interface ResponseContext {
  /** The request that was made */
  request: RequestContext;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Request ID from server */
  requestId?: string;
  /** Rate limit info from server */
  rateLimit?: RateLimitInfo;
  /** Duration of the request in milliseconds */
  durationMs: number;
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * HTTP status codes that should trigger a retry
   * @default [429, 500, 502, 503, 504]
   */
  retryableStatuses?: number[];

  /**
   * Whether to retry on network errors
   * @default true
   */
  retryOnNetworkError?: boolean;

  /**
   * Whether to retry on timeout errors
   * @default true
   */
  retryOnTimeout?: boolean;

  /**
   * Initial delay between retries in milliseconds
   * @default 1000
   */
  initialDelayMs?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Jitter factor (0-1) to add randomness to delays
   * @default 0.25
   */
  jitter?: number;
}

/**
 * Hooks for observability and customization
 */
export interface Hooks {
  /**
   * Called before each request is sent
   * Can modify the request or throw to abort
   */
  onRequest?: (context: RequestContext) => void | Promise<void>;

  /**
   * Called after each successful response
   */
  onResponse?: (context: ResponseContext) => void | Promise<void>;

  /**
   * Called when an error occurs (before retry)
   */
  onError?: (error: Error, context: RequestContext) => void | Promise<void>;

  /**
   * Called before each retry attempt
   */
  onRetry?: (context: RequestContext, error: Error, delayMs: number) => void | Promise<void>;
}

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
  /**
   * Fine-grained retry configuration
   */
  retry?: RetryConfig;
  /**
   * Hooks for observability
   */
  hooks?: Hooks;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  /**
   * AbortSignal to cancel the request
   */
  signal?: AbortSignal;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}

/**
 * Rate limit information from response headers
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the current window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the rate limit resets */
  reset: number;
}

/**
 * Response wrapper with rate limit info
 */
export interface ResponseWithRateLimit<T> {
  data: T;
  rateLimit?: RateLimitInfo;
  requestId?: string;
}

/**
 * HTTP client with retry logic, hooks, and error handling
 */
export class HttpClient {
  private readonly config: HttpClientConfig;
  private readonly fetchFn: FetchFunction;
  private readonly retryConfig: Required<RetryConfig>;

  /** Rate limit info from the last response */
  private _lastRateLimit?: RateLimitInfo;
  /** Request ID from the last response */
  private _lastRequestId?: string;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.fetchFn = config.fetch ?? fetch;

    // Merge retry config with defaults
    this.retryConfig = {
      maxRetries: config.retry?.maxRetries ?? config.maxRetries,
      retryableStatuses: config.retry?.retryableStatuses ?? [429, 500, 502, 503, 504],
      retryOnNetworkError: config.retry?.retryOnNetworkError ?? true,
      retryOnTimeout: config.retry?.retryOnTimeout ?? true,
      initialDelayMs: config.retry?.initialDelayMs ?? 1000,
      maxDelayMs: config.retry?.maxDelayMs ?? 30000,
      backoffMultiplier: config.retry?.backoffMultiplier ?? 2,
      jitter: config.retry?.jitter ?? 0.25,
    };
  }

  /**
   * Get rate limit info from the last response
   */
  get lastRateLimit(): RateLimitInfo | undefined {
    return this._lastRateLimit;
  }

  /**
   * Get request ID from the last response
   */
  get lastRequestId(): string | undefined {
    return this._lastRequestId;
  }

  /**
   * Execute an HTTP request with retry logic
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.headers, options.idempotencyKey);

    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      const requestContext: RequestContext = {
        method: options.method,
        url,
        headers,
        body: options.body,
        attempt,
      };

      try {
        // Call onRequest hook
        if (this.config.hooks?.onRequest) {
          await this.config.hooks.onRequest(requestContext);
        }

        const startTime = Date.now();
        const response = await this.executeRequest(
          url,
          options.method,
          headers,
          options.body,
          options.signal
        );
        const durationMs = Date.now() - startTime;

        const result = await this.handleResponse<T>(response, requestContext, durationMs);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Call onError hook
        if (this.config.hooks?.onError) {
          await this.config.hooks.onError(lastError, requestContext);
        }

        // Check if we should retry
        if (attempt < this.retryConfig.maxRetries && this.shouldRetry(lastError)) {
          const delay = this.calculateDelay(lastError, attempt);

          // Call onRetry hook
          if (this.config.hooks?.onRetry) {
            await this.config.hooks.onRetry(requestContext, lastError, delay);
          }

          await this.sleep(delay);
          attempt++;
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new NetworkError('Request failed after retries');
  }

  /**
   * Execute request and return response with rate limit info
   */
  async requestWithRateLimit<T>(options: RequestOptions): Promise<ResponseWithRateLimit<T>> {
    const data = await this.request<T>(options);
    return {
      data,
      rateLimit: this._lastRateLimit,
      requestId: this._lastRequestId,
    };
  }

  private shouldRetry(error: Error): boolean {
    // Never retry client errors (except rate limits handled specially)
    if (
      error instanceof AuthenticationError ||
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError
    ) {
      return false;
    }

    // Retry on rate limit (uses retry-after header for delay)
    if (error instanceof RateLimitError) {
      return true;
    }

    // Retry on configured status codes (ServerError)
    if (error instanceof ServerError && error.statusCode) {
      return this.retryConfig.retryableStatuses.includes(error.statusCode);
    }

    // Retry on network errors if configured
    if (error instanceof NetworkError) {
      return this.retryConfig.retryOnNetworkError;
    }

    // Retry on timeout if configured
    if (error instanceof TimeoutError) {
      return this.retryConfig.retryOnTimeout;
    }

    return false;
  }

  private calculateDelay(error: Error, attempt: number): number {
    // Use retry-after header for rate limits
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter * 1000;
    }

    // Exponential backoff with jitter
    const baseDelay = this.retryConfig.initialDelayMs;
    const delay = Math.min(
      baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
      this.retryConfig.maxDelayMs
    );

    // Add jitter
    const jitter = delay * this.retryConfig.jitter * Math.random();
    return delay + jitter;
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
    body?: unknown,
    userSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Create a combined signal that aborts on either timeout or user signal
    const abortHandler = () => controller.abort();
    userSignal?.addEventListener('abort', abortHandler);

    try {
      if (this.config.debug) {
        console.log(`[DispatchTickets] ${method} ${url}`);
        if (body) {
          console.log('[DispatchTickets] Body:', JSON.stringify(body, null, 2));
        }
      }

      // Check if user already aborted
      if (userSignal?.aborted) {
        throw new Error('Request aborted');
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
        // Check if it was a user abort vs timeout
        if (error.name === 'AbortError') {
          if (userSignal?.aborted) {
            throw new NetworkError('Request aborted by user');
          }
          throw new TimeoutError(`Request timed out after ${this.config.timeout}ms`);
        }
        throw new NetworkError(error.message);
      }
      throw new NetworkError('Unknown network error');
    } finally {
      clearTimeout(timeoutId);
      userSignal?.removeEventListener('abort', abortHandler);
    }
  }

  private extractRateLimitInfo(response: Response): RateLimitInfo | undefined {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return undefined;
  }

  private async handleResponse<T>(
    response: Response,
    requestContext: RequestContext,
    durationMs: number
  ): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // Extract request ID and rate limit info
    const requestId = response.headers.get('x-request-id') ?? undefined;
    const rateLimitInfo = this.extractRateLimitInfo(response);

    // Store for access via getters
    this._lastRequestId = requestId;
    this._lastRateLimit = rateLimitInfo;

    if (this.config.debug && requestId) {
      console.log(`[DispatchTickets] Request ID: ${requestId}`);
    }

    // Call onResponse hook for successful responses
    if (response.ok && this.config.hooks?.onResponse) {
      await this.config.hooks.onResponse({
        request: requestContext,
        status: response.status,
        headers: response.headers,
        requestId,
        rateLimit: rateLimitInfo,
        durationMs,
      });
    }

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
        throw new AuthenticationError(message, requestId);
      case 400:
      case 422:
        throw new ValidationError(message, errorData.errors, requestId);
      case 404:
        throw new NotFoundError(message, undefined, undefined, requestId);
      case 409:
        throw new ConflictError(message, requestId);
      case 429: {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          requestId,
          rateLimitInfo
        );
      }
      default:
        if (response.status >= 500) {
          throw new ServerError(message, response.status, requestId);
        }
        throw new DispatchTicketsError(
          message,
          'api_error',
          response.status,
          errorData as Record<string, unknown>,
          requestId
        );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
