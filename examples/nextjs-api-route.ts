/**
 * Next.js API Route Example
 *
 * This example shows how to handle Dispatch Tickets webhooks
 * in a Next.js API route (App Router).
 *
 * File: app/api/webhooks/dispatch-tickets/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DispatchTickets,
  parseWebhookEvent,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  isCommentCreatedEvent,
  type WebhookEvent,
} from '@dispatchtickets/sdk';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // 1. Get raw body for signature verification
  const rawBody = await request.text();

  // 2. Verify signature
  const signature = request.headers.get('x-dispatch-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  const isValid = DispatchTickets.webhooks.verifySignature(
    rawBody,
    signature,
    WEBHOOK_SECRET
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // 3. Parse and handle event
  try {
    const event = parseWebhookEvent(rawBody);

    // Process the event
    await handleWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    );
  }
}

async function handleWebhookEvent(event: WebhookEvent) {
  // Use type guards for type-safe event handling
  if (isTicketCreatedEvent(event)) {
    // Sync new ticket to your database
    await syncTicketToDatabase({
      externalId: event.data.id,
      title: event.data.title,
      status: event.data.status,
      priority: event.data.priority,
      customerEmail: event.data.customerEmail,
      createdAt: new Date(event.data.createdAt),
    });
  }

  if (isTicketUpdatedEvent(event)) {
    // Update ticket in your database
    await updateTicketInDatabase(event.data.id, {
      status: event.data.status,
      priority: event.data.priority,
      assigneeId: event.data.assigneeId,
    });

    // Notify on status changes
    if (event.data.changes.includes('status')) {
      await notifyStatusChange(event.data);
    }
  }

  if (isCommentCreatedEvent(event)) {
    // Save comment to your database
    await saveCommentToDatabase({
      ticketId: event.data.ticketId,
      commentId: event.data.comment.id,
      body: event.data.comment.body,
      authorType: event.data.comment.authorType,
      createdAt: new Date(event.data.comment.createdAt),
    });
  }
}

// Placeholder functions - implement with your database/services
async function syncTicketToDatabase(data: any) {
  console.log('Syncing ticket:', data);
}

async function updateTicketInDatabase(id: string, data: any) {
  console.log('Updating ticket:', id, data);
}

async function notifyStatusChange(data: any) {
  console.log('Status changed:', data.status);
}

async function saveCommentToDatabase(data: any) {
  console.log('Saving comment:', data);
}
