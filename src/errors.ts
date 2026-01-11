/**
 * Base error class for all Dispatch Tickets SDK errors
 */
export class DispatchTicketsError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DispatchTicketsError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when API key is missing or invalid
 */
export class AuthenticationError extends DispatchTicketsError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 'authentication_error', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends DispatchTicketsError {
  readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'rate_limit_error', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends DispatchTicketsError {
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    message = 'Validation failed',
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 'validation_error', 400, { errors });
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

  constructor(message = 'Resource not found', resourceType?: string, resourceId?: string) {
    super(message, 'not_found', 404, { resourceType, resourceId });
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Thrown when there's a conflict (e.g., duplicate resource)
 */
export class ConflictError extends DispatchTicketsError {
  constructor(message = 'Resource conflict') {
    super(message, 'conflict', 409);
    this.name = 'ConflictError';
  }
}

/**
 * Thrown when the server returns an unexpected error
 */
export class ServerError extends DispatchTicketsError {
  constructor(message = 'Internal server error', statusCode = 500) {
    super(message, 'server_error', statusCode);
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
