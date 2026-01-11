import { describe, it, expect } from 'vitest';
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
} from './errors.js';

describe('DispatchTicketsError', () => {
  it('should create error with all properties', () => {
    const error = new DispatchTicketsError('Test error', 'test_error', 500, { foo: 'bar' });

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('test_error');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('DispatchTicketsError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should work with instanceof checks', () => {
    const error = new DispatchTicketsError('Test', 'test');
    expect(error instanceof DispatchTicketsError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('AuthenticationError', () => {
  it('should use default message', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Invalid or missing API key');
    expect(error.code).toBe('authentication_error');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('AuthenticationError');
  });

  it('should accept custom message', () => {
    const error = new AuthenticationError('Custom auth error');
    expect(error.message).toBe('Custom auth error');
  });

  it('should be instanceof DispatchTicketsError', () => {
    const error = new AuthenticationError();
    expect(error instanceof DispatchTicketsError).toBe(true);
    expect(error instanceof AuthenticationError).toBe(true);
  });
});

describe('RateLimitError', () => {
  it('should use default message', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.code).toBe('rate_limit_error');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBeUndefined();
  });

  it('should include retryAfter', () => {
    const error = new RateLimitError('Too many requests', 60);
    expect(error.retryAfter).toBe(60);
  });
});

describe('ValidationError', () => {
  it('should use default message', () => {
    const error = new ValidationError();
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('validation_error');
    expect(error.statusCode).toBe(400);
  });

  it('should include field errors', () => {
    const errors = [
      { field: 'email', message: 'Invalid email format' },
      { field: 'name', message: 'Name is required' },
    ];
    const error = new ValidationError('Validation failed', errors);
    expect(error.errors).toEqual(errors);
    expect(error.details).toEqual({ errors });
  });
});

describe('NotFoundError', () => {
  it('should use default message', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Resource not found');
    expect(error.code).toBe('not_found');
    expect(error.statusCode).toBe(404);
  });

  it('should include resource info', () => {
    const error = new NotFoundError('Ticket not found', 'ticket', 'tkt_123');
    expect(error.resourceType).toBe('ticket');
    expect(error.resourceId).toBe('tkt_123');
  });
});

describe('ConflictError', () => {
  it('should use default message', () => {
    const error = new ConflictError();
    expect(error.message).toBe('Resource conflict');
    expect(error.code).toBe('conflict');
    expect(error.statusCode).toBe(409);
  });
});

describe('ServerError', () => {
  it('should use default values', () => {
    const error = new ServerError();
    expect(error.message).toBe('Internal server error');
    expect(error.code).toBe('server_error');
    expect(error.statusCode).toBe(500);
  });

  it('should accept custom status code', () => {
    const error = new ServerError('Service unavailable', 503);
    expect(error.statusCode).toBe(503);
  });
});

describe('TimeoutError', () => {
  it('should use default message', () => {
    const error = new TimeoutError();
    expect(error.message).toBe('Request timed out');
    expect(error.code).toBe('timeout_error');
    expect(error.statusCode).toBeUndefined();
  });
});

describe('NetworkError', () => {
  it('should use default message', () => {
    const error = new NetworkError();
    expect(error.message).toBe('Network error');
    expect(error.code).toBe('network_error');
    expect(error.statusCode).toBeUndefined();
  });
});
