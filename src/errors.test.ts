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
  isDispatchTicketsError,
  isAuthenticationError,
  isRateLimitError,
  isValidationError,
  isNotFoundError,
  isConflictError,
  isServerError,
  isTimeoutError,
  isNetworkError,
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

describe('Request ID support', () => {
  it('should include requestId in errors', () => {
    const authError = new AuthenticationError('Invalid key', 'req_123');
    expect(authError.requestId).toBe('req_123');

    const validationError = new ValidationError('Bad input', [], 'req_456');
    expect(validationError.requestId).toBe('req_456');

    const notFoundError = new NotFoundError('Not found', 'ticket', 'tkt_1', 'req_789');
    expect(notFoundError.requestId).toBe('req_789');

    const conflictError = new ConflictError('Conflict', 'req_abc');
    expect(conflictError.requestId).toBe('req_abc');

    const serverError = new ServerError('Server error', 500, 'req_def');
    expect(serverError.requestId).toBe('req_def');
  });

  it('should include rate limit info in RateLimitError', () => {
    const error = new RateLimitError('Too many requests', 60, 'req_123', {
      limit: 100,
      remaining: 0,
      reset: 1704067200,
    });
    expect(error.retryAfter).toBe(60);
    expect(error.requestId).toBe('req_123');
    expect(error.limit).toBe(100);
    expect(error.remaining).toBe(0);
    expect(error.reset).toBe(1704067200);
  });
});

describe('Type Guards', () => {
  const errors = {
    base: new DispatchTicketsError('base', 'base'),
    auth: new AuthenticationError(),
    rateLimit: new RateLimitError(),
    validation: new ValidationError(),
    notFound: new NotFoundError(),
    conflict: new ConflictError(),
    server: new ServerError(),
    timeout: new TimeoutError(),
    network: new NetworkError(),
  };

  describe('isDispatchTicketsError', () => {
    it('should return true for all SDK errors', () => {
      for (const error of Object.values(errors)) {
        expect(isDispatchTicketsError(error)).toBe(true);
      }
    });

    it('should return false for non-SDK errors', () => {
      expect(isDispatchTicketsError(new Error('regular'))).toBe(false);
      expect(isDispatchTicketsError('string')).toBe(false);
      expect(isDispatchTicketsError(null)).toBe(false);
      expect(isDispatchTicketsError(undefined)).toBe(false);
    });
  });

  describe('isAuthenticationError', () => {
    it('should return true only for AuthenticationError', () => {
      expect(isAuthenticationError(errors.auth)).toBe(true);
      expect(isAuthenticationError(errors.base)).toBe(false);
      expect(isAuthenticationError(errors.notFound)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should return true only for RateLimitError', () => {
      expect(isRateLimitError(errors.rateLimit)).toBe(true);
      expect(isRateLimitError(errors.base)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true only for ValidationError', () => {
      expect(isValidationError(errors.validation)).toBe(true);
      expect(isValidationError(errors.base)).toBe(false);
    });
  });

  describe('isNotFoundError', () => {
    it('should return true only for NotFoundError', () => {
      expect(isNotFoundError(errors.notFound)).toBe(true);
      expect(isNotFoundError(errors.base)).toBe(false);
    });
  });

  describe('isConflictError', () => {
    it('should return true only for ConflictError', () => {
      expect(isConflictError(errors.conflict)).toBe(true);
      expect(isConflictError(errors.base)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should return true only for ServerError', () => {
      expect(isServerError(errors.server)).toBe(true);
      expect(isServerError(errors.base)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should return true only for TimeoutError', () => {
      expect(isTimeoutError(errors.timeout)).toBe(true);
      expect(isTimeoutError(errors.base)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true only for NetworkError', () => {
      expect(isNetworkError(errors.network)).toBe(true);
      expect(isNetworkError(errors.base)).toBe(false);
    });
  });

  it('should narrow types correctly', () => {
    const error: unknown = new NotFoundError('Not found', 'ticket', 'tkt_123');

    if (isNotFoundError(error)) {
      // TypeScript should know error is NotFoundError
      expect(error.resourceType).toBe('ticket');
      expect(error.resourceId).toBe('tkt_123');
    } else {
      throw new Error('Should have matched');
    }
  });
});
