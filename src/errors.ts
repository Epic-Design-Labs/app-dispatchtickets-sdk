/**
 * Base error class for all Dispatch Tickets SDK errors
 */
export class DispatchTicketsError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: Record<string, unknown>;
  /** Request ID for debugging with support */
  readonly requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.name = 'DispatchTicketsError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when API key is missing or invalid
 */
export class AuthenticationError extends DispatchTicketsError {
  constructor(message = 'Invalid or missing API key', requestId?: string) {
    super(message, 'authentication_error', 401, undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends DispatchTicketsError {
  readonly retryAfter?: number;
  /** Rate limit ceiling */
  readonly limit?: number;
  /** Remaining requests in current window */
  readonly remaining?: number;
  /** Unix timestamp when rate limit resets */
  readonly reset?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    requestId?: string,
    rateLimitInfo?: { limit?: number; remaining?: number; reset?: number }
  ) {
    super(message, 'rate_limit_error', 429, undefined, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = rateLimitInfo?.limit;
    this.remaining = rateLimitInfo?.remaining;
    this.reset = rateLimitInfo?.reset;
  }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends DispatchTicketsError {
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    message = 'Validation failed',
    errors?: Array<{ field: string; message: string }>,
    requestId?: string
  ) {
    super(message, 'validation_error', 400, { errors }, requestId);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Thrown when a resource is not found
 */
export class NotFoundError extends DispatchTicketsError {
  readonly resourceType?: string;
  readonly resourceId?: string;

  constructor(
    message = 'Resource not found',
    resourceType?: string,
    resourceId?: string,
    requestId?: string
  ) {
    super(message, 'not_found', 404, { resourceType, resourceId }, requestId);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Thrown when there's a conflict (e.g., duplicate resource)
 */
export class ConflictError extends DispatchTicketsError {
  constructor(message = 'Resource conflict', requestId?: string) {
    super(message, 'conflict', 409, undefined, requestId);
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when the server returns an unexpected error
 */
export class ServerError extends DispatchTicketsError {
  constructor(message = 'Internal server error', statusCode = 500, requestId?: string) {
    super(message, 'server_error', statusCode, undefined, requestId);
    this.name = 'ServerError';
  }
}

/**
 * Thrown when request times out
 */
export class TimeoutError extends DispatchTicketsError {
  constructor(message = 'Request timed out') {
    super(message, 'timeout_error');
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when network connection fails
 */
export class NetworkError extends DispatchTicketsError {
  constructor(message = 'Network error') {
    super(message, 'network_error');
    this.name = 'NetworkError';
  }
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if an error is a DispatchTicketsError
 */
export function isDispatchTicketsError(error: unknown): error is DispatchTicketsError {
  return error instanceof DispatchTicketsError;
}

/**
 * Check if an error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if an error is a RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Check if an error is a ConflictError
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Check if an error is a ServerError
 */
export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}

/**
 * Check if an error is a TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
