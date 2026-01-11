# @dispatchtickets/sdk

[![npm version](https://img.shields.io/npm/v/@dispatchtickets/sdk.svg)](https://www.npmjs.com/package/@dispatchtickets/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript SDK for the [Dispatch Tickets](https://dispatchtickets.com) API.

## Installation

```bash
npm install @dispatchtickets/sdk
```

## Requirements

- Node.js 18 or later

## Quick Start

```typescript
import { DispatchTickets } from '@dispatchtickets/sdk';

const client = new DispatchTickets({
  apiKey: 'sk_live_...',
});

// List brands
const brands = await client.brands.list();

// Create a ticket
const ticket = await client.tickets.create('ws_abc123', {
  title: 'Help with login',
  body: 'I cannot log in to my account',
});

// Add a comment
await client.comments.create('ws_abc123', ticket.id, {
  body: 'Thanks for reaching out! Let me help you with that.',
  authorType: 'AGENT',
});
```

## Portal API (End-User Access)

For customer-facing integrations, use `DispatchPortal` to let end-users view and manage their own tickets:

```typescript
import { DispatchTickets, DispatchPortal } from '@dispatchtickets/sdk';

// 1. Backend: Generate a portal token for your user
const admin = new DispatchTickets({ apiKey: 'sk_live_xxx' });
const { token } = await admin.brands.generatePortalToken('br_xxx', {
  email: user.email,
  name: user.name,
});

// 2. Frontend: Use the token to access tickets
const portal = new DispatchPortal({ token });

// List user's tickets
const { data: tickets } = await portal.tickets.list();

// Create a new ticket
const ticket = await portal.tickets.create({
  title: 'Help with my order',
  body: 'Order #12345 has not arrived...',
});

// Add a comment
await portal.tickets.addComment(ticket.id, 'Here is more information...');
```

Portal tokens are scoped to a single customer and expire after 1 hour. See the [Integration Guide](https://dispatchtickets.com/docs/integration) for complete examples.

## Configuration

```typescript
const client = new DispatchTickets({
  apiKey: 'sk_live_...',        // Required
  baseUrl: 'https://...',        // Optional, default: production API
  timeout: 30000,                // Optional, request timeout in ms
  debug: false,                  // Optional, enable debug logging
  fetch: customFetch,            // Optional, custom fetch for testing
  retry: {                       // Optional, fine-grained retry config
    maxRetries: 3,
    retryableStatuses: [429, 500, 502, 503, 504],
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
  hooks: {                       // Optional, observability hooks
    onRequest: (ctx) => console.log(`${ctx.method} ${ctx.url}`),
    onResponse: (ctx) => console.log(`${ctx.status} in ${ctx.durationMs}ms`),
    onError: (error) => Sentry.captureException(error),
    onRetry: (ctx, error, delay) => console.log(`Retrying in ${delay}ms`),
  },
});
```

### Request Cancellation

Cancel long-running requests with an AbortController:

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const page = await client.tickets.listPage('ws_abc', {}, {
    signal: controller.signal,
  });
} catch (error) {
  if (error.message.includes('aborted')) {
    console.log('Request was cancelled');
  }
}
```

## Resources

### Accounts

```typescript
// Get current account
const account = await client.accounts.me();

// Get usage statistics
const usage = await client.accounts.getUsage();
console.log(`${usage.ticketsThisMonth}/${usage.plan?.ticketLimit} tickets used`);

// List API keys
const apiKeys = await client.accounts.listApiKeys();

// Create a new API key
const newKey = await client.accounts.createApiKey({
  name: 'Production',
  allBrands: true,  // or brandIds: ['br_123']
});
console.log('Save this key:', newKey.key); // Only shown once!

// Update API key scope
await client.accounts.updateApiKeyScope('key_abc', {
  allBrands: false,
  brandIds: ['br_123', 'br_456'],
});

// Revoke an API key
await client.accounts.revokeApiKey('key_abc');
```

### Brands

```typescript
// Get inbound email address for a brand
const inboundEmail = client.brands.getInboundEmail('br_abc123');
// Returns: br_abc123@inbound.dispatchtickets.com

// Create a brand
const brand = await client.brands.create({
  name: 'Acme Support',
  slug: 'acme',
});

// List all brands
const brands = await client.brands.list();

// Get a brand
const brand = await client.brands.get('ws_abc123');

// Update a brand
await client.brands.update('ws_abc123', { name: 'New Name' });

// Delete a brand
await client.brands.delete('ws_abc123');
```

### Tickets

```typescript
// Create a ticket
const ticket = await client.tickets.create('ws_abc123', {
  title: 'Issue with billing',
  body: 'I was charged twice...',
  priority: 'high',
});

// Create with idempotency key (prevents duplicates)
const ticket = await client.tickets.create(
  'ws_abc123',
  { title: 'Issue' },
  { idempotencyKey: 'unique-request-id' }
);

// List tickets (paginated)
for await (const ticket of client.tickets.list('ws_abc123', { status: 'open' })) {
  console.log(ticket.title);
}

// Get a single page
const page = await client.tickets.listPage('ws_abc123', { limit: 50 });

// Get a ticket
const ticket = await client.tickets.get('ws_abc123', 'tkt_xyz');

// Update a ticket
await client.tickets.update('ws_abc123', 'tkt_xyz', {
  status: 'resolved',
});

// Delete a ticket
await client.tickets.delete('ws_abc123', 'tkt_xyz');

// Mark as spam
await client.tickets.markAsSpam('ws_abc123', 'tkt_xyz', true);

// Merge tickets
await client.tickets.merge('ws_abc123', 'tkt_target', ['tkt_source1', 'tkt_source2']);

// Bulk actions
await client.tickets.bulk('ws_abc123', 'close', ['tkt_1', 'tkt_2']);
await client.tickets.bulk('ws_abc123', 'assign', ['tkt_1'], { assigneeId: 'user_123' });
```

### Comments

```typescript
// Add a comment
const comment = await client.comments.create('ws_abc123', 'tkt_xyz', {
  body: 'Thanks for your patience!',
  authorType: 'AGENT',
});

// List comments
const comments = await client.comments.list('ws_abc123', 'tkt_xyz');

// Update a comment
await client.comments.update('ws_abc123', 'tkt_xyz', 'cmt_abc', {
  body: 'Updated message',
});

// Delete a comment
await client.comments.delete('ws_abc123', 'tkt_xyz', 'cmt_abc');
```

### Attachments

```typescript
// Simple upload (handles the full flow)
const attachment = await client.attachments.upload(
  'ws_abc123',
  'tkt_xyz',
  fileBuffer,
  'document.pdf',
  'application/pdf'
);

// Manual upload flow
const { uploadUrl, attachmentId } = await client.attachments.initiateUpload(
  'ws_abc123',
  'tkt_xyz',
  { filename: 'doc.pdf', contentType: 'application/pdf', size: 1024 }
);
// Upload to presigned URL...
await client.attachments.confirmUpload('ws_abc123', 'tkt_xyz', attachmentId);

// List attachments
const attachments = await client.attachments.list('ws_abc123', 'tkt_xyz');

// Get download URL
const { downloadUrl } = await client.attachments.get('ws_abc123', 'tkt_xyz', 'att_abc');
```

### Webhooks

```typescript
// Create a webhook
const webhook = await client.webhooks.create('ws_abc123', {
  url: 'https://example.com/webhook',
  secret: 'your-secret',
  events: ['ticket.created', 'ticket.updated'],
});

// List webhooks
const webhooks = await client.webhooks.list('ws_abc123');

// Get delivery history
const deliveries = await client.webhooks.getDeliveries('ws_abc123', 'whk_abc');

// Verify webhook signature
const isValid = DispatchTickets.webhooks.verifySignature(
  rawBody,
  req.headers['x-dispatch-signature'],
  'your-secret'
);
```

### Categories

```typescript
// Create a category
await client.categories.create('ws_abc123', { name: 'Billing', color: '#ef4444' });

// List categories
const categories = await client.categories.list('ws_abc123');

// Get stats
const stats = await client.categories.getStats('ws_abc123');

// Reorder
await client.categories.reorder('ws_abc123', ['cat_1', 'cat_2', 'cat_3']);
```

### Tags

```typescript
// Create a tag
await client.tags.create('ws_abc123', { name: 'urgent', color: '#f59e0b' });

// List tags
const tags = await client.tags.list('ws_abc123');

// Merge tags
await client.tags.merge('ws_abc123', 'tag_target', ['tag_source1', 'tag_source2']);
```

### Customers

```typescript
// Create a customer
const customer = await client.customers.create('ws_abc123', {
  email: 'user@example.com',
  name: 'Jane Doe',
});

// List customers (paginated)
for await (const customer of client.customers.list('ws_abc123')) {
  console.log(customer.email);
}

// Search customers
const results = await client.customers.search('ws_abc123', 'jane');
```

### Custom Fields

```typescript
// Get all field definitions
const fields = await client.fields.getAll('ws_abc123');

// Get ticket fields
const ticketFields = await client.fields.list('ws_abc123', 'ticket');

// Create a field
await client.fields.create('ws_abc123', 'ticket', {
  key: 'order_id',
  label: 'Order ID',
  type: 'text',
  required: true,
});

// Update a field
await client.fields.update('ws_abc123', 'ticket', 'order_id', {
  required: false,
});

// Delete a field
await client.fields.delete('ws_abc123', 'ticket', 'order_id');
```

## Error Handling

Use type guards for clean error handling:

```typescript
import {
  DispatchTickets,
  isNotFoundError,
  isAuthenticationError,
  isRateLimitError,
  isValidationError,
} from '@dispatchtickets/sdk';

try {
  await client.tickets.get('ws_abc123', 'tkt_invalid');
} catch (error) {
  if (isNotFoundError(error)) {
    console.log('Ticket not found');
    console.log('Request ID:', error.requestId); // For debugging with support
  } else if (isAuthenticationError(error)) {
    console.log('Invalid API key');
  } else if (isRateLimitError(error)) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    console.log(`Limit: ${error.limit}, Remaining: ${error.remaining}`);
  } else if (isValidationError(error)) {
    console.log('Validation errors:', error.errors);
  }
}
```

All errors include a `requestId` for debugging with support.

## Webhook Events

Handle webhook events with full type safety:

```typescript
import {
  DispatchTickets,
  parseWebhookEvent,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  isCommentCreatedEvent,
} from '@dispatchtickets/sdk';

// Parse and validate webhook payload
const event = parseWebhookEvent(req.body);

// Use type guards for type-safe event handling
if (isTicketCreatedEvent(event)) {
  // event.data is typed as TicketCreatedData
  console.log('New ticket:', event.data.title);
  console.log('Priority:', event.data.priority);
  console.log('Customer:', event.data.customerEmail);
}

if (isTicketUpdatedEvent(event)) {
  // event.data is typed as TicketUpdatedData
  console.log('Ticket updated:', event.data.id);
  console.log('Changed fields:', event.data.changes);
}

if (isCommentCreatedEvent(event)) {
  // event.data is typed as CommentCreatedData
  console.log('New comment on', event.data.ticketNumber);
  console.log('Author:', event.data.comment.authorType);
}
```

## Webhook Verification

```typescript
import express from 'express';
import { DispatchTickets } from '@dispatchtickets/sdk';

const app = express();

// Use raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-dispatch-signature'] as string;
  const isValid = DispatchTickets.webhooks.verifySignature(
    req.body.toString(),
    signature,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  console.log('Received event:', event.type);

  res.status(200).send('OK');
});
```

## Testing

Use the custom `fetch` option to mock API responses in tests:

```typescript
import { DispatchTickets } from '@dispatchtickets/sdk';
import { vi } from 'vitest';

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: () => Promise.resolve([{ id: 'br_123', name: 'Test' }]),
});

const client = new DispatchTickets({
  apiKey: 'sk_test_123',
  fetch: mockFetch,
});

const brands = await client.brands.list();
expect(brands).toHaveLength(1);
expect(mockFetch).toHaveBeenCalled();
```

## Examples

See the `/examples` directory for complete working examples:

- **[express-webhook.ts](./examples/express-webhook.ts)** - Express.js webhook handler with signature verification
- **[nextjs-api-route.ts](./examples/nextjs-api-route.ts)** - Next.js App Router webhook handler
- **[basic-usage.ts](./examples/basic-usage.ts)** - Common SDK operations (tickets, comments, pagination)

## API Documentation

Generate TypeDoc API documentation locally:

```bash
npm run docs
```

This creates a `docs/` folder with HTML documentation for all exported types and methods.

## Links

- [Website](https://dispatchtickets.com)
- [Integration Guide](https://dispatchtickets.com/docs/integration)
- [API Reference (Swagger)](https://dispatch-tickets-api.onrender.com/docs)
- [GitHub](https://github.com/Epic-Design-Labs/app-dispatchtickets-sdk)
- [Changelog](./CHANGELOG.md)

## License

MIT
