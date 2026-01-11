// Main client
export { DispatchTickets } from './client.js';
export type { DispatchTicketsConfig } from './client.js';

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

// Rate limit info type
export type { RateLimitInfo } from './utils/http.js';

// Types
export * from './types/index.js';

// Utilities
export { webhookUtils } from './utils/webhooks.js';
export { collectAll } from './utils/pagination.js';
