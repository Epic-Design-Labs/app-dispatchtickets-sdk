# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-01-10

### Added

- **Request/Response Hooks** - Callbacks for observability, logging, and custom behavior
  ```typescript
  const client = new DispatchTickets({
    apiKey: 'sk_live_...',
    hooks: {
      onRequest: (ctx) => console.log(`→ ${ctx.method} ${ctx.url}`),
      onResponse: (ctx) => console.log(`← ${ctx.status} (${ctx.durationMs}ms)`),
      onError: (error, ctx) => Sentry.captureException(error),
      onRetry: (ctx, error, delayMs) => console.log(`Retrying in ${delayMs}ms`),
    },
  });
  ```

- **AbortController Support** - Cancel requests with an abort signal
  ```typescript
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  try {
    await client.tickets.listPage('ws_abc', {}, { signal: controller.signal });
  } catch (error) {
    if (error.message.includes('aborted')) {
      console.log('Request cancelled');
    }
  }
  ```

- **Fine-grained Retry Configuration** - Customize retry behavior per client
  ```typescript
  const client = new DispatchTickets({
    apiKey: 'sk_live_...',
    retry: {
      maxRetries: 5,
      retryableStatuses: [429, 500, 502, 503, 504],
      retryOnNetworkError: true,
      retryOnTimeout: true,
      initialDelayMs: 500,
      maxDelayMs: 60000,
      backoffMultiplier: 2,
      jitter: 0.25,
    },
  });
  ```

- **TypeDoc API Documentation** - Generate API docs with `npm run docs`
  - All public methods now have comprehensive JSDoc comments
  - Includes examples, parameter descriptions, and return types
  - Run `npm run docs` to generate HTML documentation

- **Enhanced JSDoc Comments** - Rich IDE tooltips and autocomplete
  - All resources, methods, and types are fully documented
  - Examples included in documentation

### Changed

- `maxRetries` option is now deprecated in favor of `retry.maxRetries` for fine-grained control

## [0.4.0] - 2026-01-10

### Added

- **Request ID in errors** - All API errors now include `requestId` for debugging with support
  ```typescript
  try {
    await client.tickets.get(brandId, 'invalid');
  } catch (error) {
    if (isNotFoundError(error)) {
      console.log('Request ID:', error.requestId);
    }
  }
  ```

- **Rate limit info** - Full rate limit details in `RateLimitError` and accessible via `client` after requests
  - `error.limit` - Maximum requests allowed
  - `error.remaining` - Remaining requests in window
  - `error.reset` - Unix timestamp when limit resets

- **Error type guards** - Runtime type checking for all error classes
  - `isDispatchTicketsError()`, `isAuthenticationError()`, `isRateLimitError()`
  - `isValidationError()`, `isNotFoundError()`, `isConflictError()`
  - `isServerError()`, `isTimeoutError()`, `isNetworkError()`
  ```typescript
  import { isNotFoundError, isValidationError } from '@dispatchtickets/sdk';

  try {
    await client.tickets.get(brandId, ticketId);
  } catch (error) {
    if (isNotFoundError(error)) {
      console.log('Ticket not found');
    } else if (isValidationError(error)) {
      console.log('Validation errors:', error.errors);
    }
  }
  ```

## [0.3.0] - 2026-01-10

### Added

- **Typed webhook events** - Full TypeScript types for webhook payloads
  - `TicketCreatedEvent`, `TicketUpdatedEvent`, `CommentCreatedEvent`
  - Type guards: `isTicketCreatedEvent()`, `isTicketUpdatedEvent()`, `isCommentCreatedEvent()`
  - `parseWebhookEvent()` - Parse and validate webhook payloads with full type inference
  ```typescript
  const event = parseWebhookEvent(req.body);
  if (isTicketCreatedEvent(event)) {
    console.log(event.data.title); // Fully typed!
  }
  ```

- **Examples** - Real-world usage examples in `/examples`
  - `express-webhook.ts` - Express.js webhook handler with signature verification
  - `nextjs-api-route.ts` - Next.js App Router webhook handler
  - `basic-usage.ts` - Common SDK operations (tickets, comments, pagination)

- **Inbound email helper** - Get inbound email addresses for brands
  ```typescript
  const email = client.brands.getInboundEmail('br_123');
  // Returns: br_123@inbound.dispatchtickets.com
  ```

## [0.2.0] - 2026-01-10

### Added

- **Accounts resource** - Manage current account, usage stats, and API keys
  - `client.accounts.me()` - Get current account
  - `client.accounts.getUsage()` - Get usage statistics
  - `client.accounts.listApiKeys()` - List API keys
  - `client.accounts.createApiKey()` - Create new API key
  - `client.accounts.updateApiKeyScope()` - Update API key brand scope
  - `client.accounts.revokeApiKey()` - Revoke an API key

- **Custom fetch support** - Inject custom fetch implementation for testing/mocking
  ```typescript
  const client = new DispatchTickets({
    apiKey: 'sk_...',
    fetch: myCustomFetch,
  });
  ```

- **Test suite** - Comprehensive tests using Vitest
  - Error classes tests
  - HTTP client tests (retry logic, error handling)
  - Webhook signature verification tests
  - Pagination iterator tests
  - Client initialization tests

- **CI/CD workflows**
  - Automated testing on push/PR (Node 18, 20, 22)
  - Automated npm publishing on version tags

## [0.1.0] - 2026-01-10

### Added

- Initial release
- **Client** - Main `DispatchTickets` class with configurable options
  - `apiKey` - Required API key
  - `baseUrl` - Custom API base URL
  - `timeout` - Request timeout (default 30s)
  - `maxRetries` - Retry count (default 3)
  - `debug` - Enable request logging

- **Resources**
  - `brands` - Brand/workspace management (list, get, create, update, delete)
  - `tickets` - Ticket operations with async pagination
  - `comments` - Comment CRUD
  - `attachments` - File upload with presigned URLs
  - `webhooks` - Webhook subscription management
  - `categories` - Category management
  - `tags` - Tag management
  - `customers` - Customer management
  - `fields` - Custom field definitions

- **Error classes**
  - `DispatchTicketsError` - Base error class
  - `AuthenticationError` - 401 errors
  - `RateLimitError` - 429 errors with retry-after
  - `ValidationError` - 400/422 errors with field details
  - `NotFoundError` - 404 errors
  - `ConflictError` - 409 errors
  - `ServerError` - 5xx errors
  - `TimeoutError` - Request timeout
  - `NetworkError` - Network failures

- **Utilities**
  - `DispatchTickets.webhooks.verifySignature()` - HMAC-SHA256 webhook verification
  - `DispatchTickets.webhooks.generateSignature()` - Generate signatures for testing
  - Async pagination iterator for ticket listing
  - Automatic retry with exponential backoff

- **Build**
  - Dual ESM/CJS output
  - TypeScript declarations
  - Zero runtime dependencies
