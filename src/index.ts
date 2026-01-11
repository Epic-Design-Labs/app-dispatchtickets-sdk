// Main client
export { DispatchTickets } from './client.js';
export type { DispatchTicketsConfig } from './client.js';

// Portal client
export { DispatchPortal } from './portal.js';
export type { DispatchPortalConfig } from './portal.js';

// Errors
export {
  DispatchTicketsError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ServerError,
  TimeoutError,
  NetworkError,
  // Type guards
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

// HTTP types (hooks, retry config, etc.)
export type {
  RateLimitInfo,
  RetryConfig,
  Hooks,
  RequestContext,
  ResponseContext,
} from './utils/http.js';

// API request options
export type { ApiRequestOptions } from './resources/base.js';

// Types
export * from './types/index.js';

// Utilities
export { webhookUtils } from './utils/webhooks.js';
export { collectAll } from './utils/pagination.js';
