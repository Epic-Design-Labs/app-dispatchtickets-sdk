import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from './http.js';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  TimeoutError,
  NetworkError,
} from '../errors.js';

function createMockFetch(responses: Array<{ status: number; body?: unknown; headers?: Record<string, string> }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex++];
    if (!response) {
      throw new Error('No more mock responses');
    }
    // Default to application/json content-type if body is provided
    const defaultHeaders: Record<string, string> = response.body !== undefined
      ? { 'content-type': 'application/json' }
      : {};
    const headers = { ...defaultHeaders, ...response.headers };

    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.status === 200 ? 'OK' : 'Error',
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
      json: () => Promise.resolve(response.body),
    });
  });
}

describe('HttpClient', () => {
  const baseConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    timeout: 5000,
    maxRetries: 2,
  };

  describe('successful requests', () => {
    it('should make a GET request', async () => {
      const mockFetch = createMockFetch([{ status: 200, body: { id: '123' } }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.request({ method: 'GET', path: '/test' });

      expect(result).toEqual({ id: '123' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make a POST request with body', async () => {
      const mockFetch = createMockFetch([{ status: 201, body: { id: '123', title: 'Test' } }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.request({
        method: 'POST',
        path: '/tickets',
        body: { title: 'Test' },
      });

      expect(result).toEqual({ id: '123', title: 'Test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/tickets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
        })
      );
    });

    it('should handle 204 No Content', async () => {
      const mockFetch = createMockFetch([{ status: 204 }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.request({ method: 'DELETE', path: '/test/123' });

      expect(result).toBeUndefined();
    });

    it('should include query parameters', async () => {
      const mockFetch = createMockFetch([{ status: 200, body: { data: [] } }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await client.request({
        method: 'GET',
        path: '/tickets',
        query: { status: 'open', limit: 10, archived: false },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/tickets?status=open&limit=10&archived=false',
        expect.anything()
      );
    });

    it('should skip undefined query parameters', async () => {
      const mockFetch = createMockFetch([{ status: 200, body: { data: [] } }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await client.request({
        method: 'GET',
        path: '/tickets',
        query: { status: 'open', limit: undefined },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/tickets?status=open',
        expect.anything()
      );
    });

    it('should include idempotency key', async () => {
      const mockFetch = createMockFetch([{ status: 200, body: {} }]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await client.request({
        method: 'POST',
        path: '/tickets',
        body: {},
        idempotencyKey: 'unique-key-123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Idempotency-Key': 'unique-key-123',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      const mockFetch = createMockFetch([
        { status: 401, body: { message: 'Invalid API key' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError on 400', async () => {
      const mockFetch = createMockFetch([
        {
          status: 400,
          body: { message: 'Validation failed', errors: [{ field: 'email', message: 'Invalid' }] },
          headers: { 'content-type': 'application/json' },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'POST', path: '/test', body: {} }))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError on 422', async () => {
      const mockFetch = createMockFetch([
        { status: 422, body: { message: 'Unprocessable' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'POST', path: '/test', body: {} }))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError on 404', async () => {
      const mockFetch = createMockFetch([
        { status: 404, body: { message: 'Ticket not found' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/tickets/123' }))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError on 409', async () => {
      const mockFetch = createMockFetch([
        { status: 409, body: { message: 'Resource already exists' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'POST', path: '/test', body: {} }))
        .rejects.toThrow(ConflictError);
    });

    it('should throw RateLimitError on 429 with retry-after', async () => {
      const mockFetch = createMockFetch([
        {
          status: 429,
          body: { message: 'Too many requests' },
          headers: { 'content-type': 'application/json', 'retry-after': '60' },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      try {
        await client.request({ method: 'GET', path: '/test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it('should throw ServerError on 500', async () => {
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Internal error' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(ServerError);
    });

    it('should throw ServerError on 503', async () => {
      const mockFetch = createMockFetch([
        { status: 503, body: { message: 'Service unavailable' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(ServerError);
    });
  });

  describe('retry logic', () => {
    it('should not retry on 401', async () => {
      const mockFetch = createMockFetch([
        { status: 401, body: { message: 'Unauthorized' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(AuthenticationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400', async () => {
      const mockFetch = createMockFetch([
        { status: 400, body: { message: 'Bad request' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'POST', path: '/test', body: {} }))
        .rejects.toThrow(ValidationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404', async () => {
      const mockFetch = createMockFetch([
        { status: 404, body: { message: 'Not found' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(NotFoundError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 500 and succeed', async () => {
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Server error' }, headers: { 'content-type': 'application/json' } },
        { status: 200, body: { success: true } },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.request({ method: 'GET', path: '/test' });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries on persistent 500', async () => {
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Error 1' }, headers: { 'content-type': 'application/json' } },
        { status: 500, body: { message: 'Error 2' }, headers: { 'content-type': 'application/json' } },
        { status: 500, body: { message: 'Error 3' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 2, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(ServerError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('network errors', () => {
    it('should throw NetworkError on fetch failure', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(NetworkError);
    });

    it('should throw TimeoutError on abort', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      await expect(client.request({ method: 'GET', path: '/test' }))
        .rejects.toThrow(TimeoutError);
    });

    it('should retry on network error and succeed', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network failure'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ success: true }),
        });
      });
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      const result = await client.request({ method: 'GET', path: '/test' });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('debug mode', () => {
    it('should log requests in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockFetch = createMockFetch([{ status: 200, body: {} }]);
      const client = new HttpClient({ ...baseConfig, debug: true, fetch: mockFetch });

      await client.request({ method: 'GET', path: '/test' });

      expect(consoleSpy).toHaveBeenCalledWith('[DispatchTickets] GET https://api.example.com/test');
      consoleSpy.mockRestore();
    });

    it('should log request body in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockFetch = createMockFetch([{ status: 200, body: {} }]);
      const client = new HttpClient({ ...baseConfig, debug: true, fetch: mockFetch });

      await client.request({ method: 'POST', path: '/test', body: { foo: 'bar' } });

      expect(consoleSpy).toHaveBeenCalledWith('[DispatchTickets] Body:', expect.stringContaining('"foo": "bar"'));
      consoleSpy.mockRestore();
    });
  });

  describe('hooks', () => {
    it('should call onRequest hook before request', async () => {
      const onRequest = vi.fn();
      const mockFetch = createMockFetch([{ status: 200, body: { id: '123' } }]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        hooks: { onRequest },
      });

      await client.request({ method: 'GET', path: '/test' });

      expect(onRequest).toHaveBeenCalledTimes(1);
      expect(onRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.example.com/test',
          attempt: 0,
        })
      );
    });

    it('should call onResponse hook after successful response', async () => {
      const onResponse = vi.fn();
      const mockFetch = createMockFetch([
        { status: 200, body: { id: '123' }, headers: { 'x-request-id': 'req_123' } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        hooks: { onResponse },
      });

      await client.request({ method: 'GET', path: '/test' });

      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          requestId: 'req_123',
          durationMs: expect.any(Number),
        })
      );
    });

    it('should call onError hook on error', async () => {
      const onError = vi.fn();
      const mockFetch = createMockFetch([
        { status: 404, body: { message: 'Not found' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        maxRetries: 0,
        fetch: mockFetch,
        hooks: { onError },
      });

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call onRetry hook before retry', async () => {
      const onRetry = vi.fn();
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Error' }, headers: { 'content-type': 'application/json' } },
        { status: 200, body: { success: true } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        hooks: { onRetry },
      });

      await client.request({ method: 'GET', path: '/test' });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', attempt: 0 }),
        expect.any(Error),
        expect.any(Number) // delay
      );
    });

    it('should allow async hooks', async () => {
      const callOrder: string[] = [];
      const onRequest = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 10));
        callOrder.push('onRequest');
      });
      const mockFetch = vi.fn().mockImplementation(() => {
        callOrder.push('fetch');
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({}),
        });
      });
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        hooks: { onRequest },
      });

      await client.request({ method: 'GET', path: '/test' });

      expect(callOrder).toEqual(['onRequest', 'fetch']);
    });
  });

  describe('abort signal', () => {
    it('should abort request when signal is aborted', async () => {
      const controller = new AbortController();
      const mockFetch = vi.fn().mockImplementation(() => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      // Abort before request
      controller.abort();

      await expect(
        client.request({ method: 'GET', path: '/test', signal: controller.signal })
      ).rejects.toThrow('aborted');
    });

    it('should distinguish user abort from timeout', async () => {
      const controller = new AbortController();
      const mockFetch = vi.fn().mockImplementation((_url, options) => {
        // Simulate user abort
        controller.abort();
        const error = new Error('Aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      try {
        await client.request({ method: 'GET', path: '/test', signal: controller.signal });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as Error).message).toContain('aborted by user');
      }
    });
  });

  describe('retry configuration', () => {
    it('should respect custom retryable statuses', async () => {
      const mockFetch = createMockFetch([
        { status: 502, body: { message: 'Bad gateway' }, headers: { 'content-type': 'application/json' } },
        { status: 200, body: { success: true } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        retry: {
          maxRetries: 2,
          retryableStatuses: [502],
        },
      });

      const result = await client.request({ method: 'GET', path: '/test' });

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry status codes not in retryableStatuses', async () => {
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Server error' }, headers: { 'content-type': 'application/json' } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        retry: {
          maxRetries: 2,
          retryableStatuses: [502, 503], // 500 not included
        },
      });

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect retryOnNetworkError=false', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        retry: {
          maxRetries: 2,
          retryOnNetworkError: false,
        },
      });

      await expect(client.request({ method: 'GET', path: '/test' })).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use custom initial delay', async () => {
      const startTime = Date.now();
      const mockFetch = createMockFetch([
        { status: 500, body: { message: 'Error' }, headers: { 'content-type': 'application/json' } },
        { status: 200, body: { success: true } },
      ]);
      const client = new HttpClient({
        ...baseConfig,
        fetch: mockFetch,
        retry: {
          maxRetries: 1,
          initialDelayMs: 100,
          jitter: 0, // No jitter for predictable timing
        },
      });

      await client.request({ method: 'GET', path: '/test' });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(100);
      expect(elapsed).toBeLessThan(500); // Should be around 100ms, not seconds
    });
  });

  describe('rate limit info', () => {
    it('should extract rate limit info from headers', async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { id: '123' },
          headers: {
            'content-type': 'application/json',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '99',
            'x-ratelimit-reset': '1704067200',
          },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await client.request({ method: 'GET', path: '/test' });

      expect(client.lastRateLimit).toEqual({
        limit: 100,
        remaining: 99,
        reset: 1704067200,
      });
    });

    it('should include rate limit info in RateLimitError', async () => {
      const mockFetch = createMockFetch([
        {
          status: 429,
          body: { message: 'Too many requests' },
          headers: {
            'content-type': 'application/json',
            'retry-after': '60',
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1704067200',
          },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      try {
        await client.request({ method: 'GET', path: '/test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const rateError = error as RateLimitError;
        expect(rateError.limit).toBe(100);
        expect(rateError.remaining).toBe(0);
        expect(rateError.reset).toBe(1704067200);
      }
    });
  });

  describe('request ID', () => {
    it('should extract request ID from headers', async () => {
      const mockFetch = createMockFetch([
        {
          status: 200,
          body: { id: '123' },
          headers: { 'content-type': 'application/json', 'x-request-id': 'req_abc123' },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, fetch: mockFetch });

      await client.request({ method: 'GET', path: '/test' });

      expect(client.lastRequestId).toBe('req_abc123');
    });

    it('should include request ID in errors', async () => {
      const mockFetch = createMockFetch([
        {
          status: 404,
          body: { message: 'Not found' },
          headers: { 'content-type': 'application/json', 'x-request-id': 'req_xyz789' },
        },
      ]);
      const client = new HttpClient({ ...baseConfig, maxRetries: 0, fetch: mockFetch });

      try {
        await client.request({ method: 'GET', path: '/test' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as NotFoundError).requestId).toBe('req_xyz789');
      }
    });
  });
});
