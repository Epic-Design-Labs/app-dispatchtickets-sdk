# @dispatchtickets/sdk

Official TypeScript SDK for the Dispatch Tickets API.

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

## Configuration

```typescript
const client = new DispatchTickets({
  apiKey: 'sk_live_...',        // Required
  baseUrl: 'https://...',        // Optional, default: production API
  timeout: 30000,                // Optional, request timeout in ms
  maxRetries: 3,                 // Optional, retry count for failed requests
  debug: false,                  // Optional, enable debug logging
  fetch: customFetch,            // Optional, custom fetch for testing
});
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

```typescript
import {
  DispatchTickets,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
} from '@dispatchtickets/sdk';

try {
  await client.tickets.get('ws_abc123', 'tkt_invalid');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Ticket not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.errors);
  }
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

## Links

- [API Reference (Swagger)](https://dispatch-tickets-api.onrender.com/docs)
- [GitHub](https://github.com/Epic-Design-Labs/app-dispatchtickets-sdk)
- [Changelog](./CHANGELOG.md)

## License

MIT
