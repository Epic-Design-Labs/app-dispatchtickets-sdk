/**
 * Basic SDK Usage Examples
 *
 * This example demonstrates common SDK operations:
 * - Listing brands
 * - Creating tickets
 * - Adding comments
 * - Handling pagination
 * - Error handling
 *
 * Run: npx ts-node examples/basic-usage.ts
 */

import {
  DispatchTickets,
  NotFoundError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
} from '@dispatchtickets/sdk';

// Initialize the client
const client = new DispatchTickets({
  apiKey: process.env.DISPATCH_API_KEY!,
  // Optional configuration:
  // baseUrl: 'https://dispatch-tickets-api.onrender.com/v1',
  // timeout: 30000,
  // maxRetries: 3,
  // debug: true,  // Enable request logging
});

async function main() {
  try {
    // ==========================================
    // Account & Usage
    // ==========================================

    // Get current account info
    const account = await client.accounts.me();
    console.log('Account ID:', account.id);

    // Check usage stats
    const usage = await client.accounts.getUsage();
    console.log(`Tickets this month: ${usage.ticketsThisMonth}/${usage.plan?.ticketLimit}`);

    // ==========================================
    // Brands (Workspaces)
    // ==========================================

    // List all brands
    const brands = await client.brands.list();
    console.log(`Found ${brands.length} brands`);

    if (brands.length === 0) {
      // Create a brand if none exist
      const newBrand = await client.brands.create({
        name: 'My Support',
        slug: 'support',
      });
      console.log('Created brand:', newBrand.id);
      brands.push(newBrand);
    }

    const brandId = brands[0].id;
    console.log('Using brand:', brandId);

    // ==========================================
    // Tickets
    // ==========================================

    // Create a ticket
    const ticket = await client.tickets.create(brandId, {
      title: 'Cannot access my account',
      body: 'I forgot my password and the reset email never arrived.',
      priority: 'high',
      customerEmail: 'jane@example.com',
      customerName: 'Jane Doe',
      source: 'api',
      customFields: {
        orderId: 'ORD-12345',
        plan: 'pro',
      },
    });
    console.log('Created ticket:', ticket.id, ticket.title);

    // Create with idempotency key (safe retries)
    const idempotentTicket = await client.tickets.create(
      brandId,
      { title: 'Idempotent ticket' },
      { idempotencyKey: `ticket-${Date.now()}` }
    );

    // Get a ticket
    const fetchedTicket = await client.tickets.get(brandId, ticket.id);
    console.log('Fetched ticket status:', fetchedTicket.status);

    // Update a ticket
    const updatedTicket = await client.tickets.update(brandId, ticket.id, {
      status: 'pending',
      priority: 'urgent',
    });
    console.log('Updated status to:', updatedTicket.status);

    // ==========================================
    // Pagination
    // ==========================================

    // Iterate through all open tickets
    console.log('\nOpen tickets:');
    let count = 0;
    for await (const t of client.tickets.list(brandId, { status: 'open' })) {
      console.log(`  - ${t.id}: ${t.title}`);
      count++;
      if (count >= 5) break; // Limit for demo
    }

    // Or get a single page
    const page = await client.tickets.listPage(brandId, {
      status: 'open',
      limit: 10,
    });
    console.log(`Page has ${page.data.length} tickets, hasMore: ${page.pagination.hasMore}`);

    // ==========================================
    // Comments
    // ==========================================

    // Add a comment
    const comment = await client.comments.create(brandId, ticket.id, {
      body: 'Hi Jane, I\'ve sent you a password reset link. Please check your spam folder.',
      authorType: 'AGENT',
      authorName: 'Support Team',
    });
    console.log('Added comment:', comment.id);

    // List comments
    const comments = await client.comments.list(brandId, ticket.id);
    console.log(`Ticket has ${comments.length} comments`);

    // ==========================================
    // Categories & Tags
    // ==========================================

    // Create a category
    const category = await client.categories.create(brandId, {
      name: 'Account Issues',
      color: '#ef4444',
    });

    // Create a tag
    const tag = await client.tags.create(brandId, {
      name: 'password-reset',
      color: '#3b82f6',
    });

    // Update ticket with category and tags
    await client.tickets.update(brandId, ticket.id, {
      categoryId: category.id,
      tagIds: [tag.id],
    });

    // ==========================================
    // Cleanup (for demo purposes)
    // ==========================================

    // Resolve and close the ticket
    await client.tickets.update(brandId, ticket.id, { status: 'resolved' });

    console.log('\nDemo completed successfully!');
  } catch (error) {
    // ==========================================
    // Error Handling
    // ==========================================

    if (error instanceof AuthenticationError) {
      console.error('Invalid API key. Check your DISPATCH_API_KEY.');
    } else if (error instanceof NotFoundError) {
      console.error('Resource not found:', error.message);
    } else if (error instanceof ValidationError) {
      console.error('Validation failed:', error.message);
      if (error.errors) {
        for (const e of error.errors) {
          console.error(`  - ${e.field}: ${e.message}`);
        }
      }
    } else if (error instanceof RateLimitError) {
      console.error(`Rate limited. Retry after ${error.retryAfter} seconds.`);
    } else {
      throw error;
    }
  }
}

main();
