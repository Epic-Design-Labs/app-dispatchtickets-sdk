/**
 * Express.js Webhook Handler Example
 *
 * This example shows how to:
 * - Verify webhook signatures
 * - Parse typed webhook events
 * - Handle different event types
 *
 * Run: npx ts-node examples/express-webhook.ts
 */

import express from 'express';
import {
  DispatchTickets,
  parseWebhookEvent,
  isTicketCreatedEvent,
  isTicketUpdatedEvent,
  isCommentCreatedEvent,
} from '@dispatchtickets/sdk';

const app = express();

// IMPORTANT: Use raw body parser for webhook routes
// This preserves the raw request body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Regular JSON parser for other routes
app.use(express.json());

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

app.post('/webhooks/dispatch-tickets', async (req, res) => {
  // 1. Get the signature from headers
  const signature = req.headers['x-dispatch-signature'] as string;

  if (!signature) {
    console.warn('Missing webhook signature');
    return res.status(401).json({ error: 'Missing signature' });
  }

  // 2. Verify the signature
  const rawBody = req.body.toString();
  const isValid = DispatchTickets.webhooks.verifySignature(
    rawBody,
    signature,
    WEBHOOK_SECRET
  );

  if (!isValid) {
    console.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 3. Parse and handle the event
  try {
    const event = parseWebhookEvent(rawBody);

    console.log(`Received ${event.event} event (${event.id})`);

    // Handle different event types with full type safety
    if (isTicketCreatedEvent(event)) {
      // event.data is typed as TicketCreatedData
      console.log('New ticket created:', {
        id: event.data.id,
        title: event.data.title,
        priority: event.data.priority,
        customer: event.data.customerEmail,
      });

      // Example: Send a Slack notification
      // await sendSlackNotification({
      //   text: `New ticket: ${event.data.title}`,
      //   priority: event.data.priority,
      // });
    }

    if (isTicketUpdatedEvent(event)) {
      // event.data is typed as TicketUpdatedData
      console.log('Ticket updated:', {
        id: event.data.id,
        changes: event.data.changes,
        status: event.data.status,
      });

      // Example: Update your CRM when ticket is resolved
      if (event.data.status === 'resolved' && event.data.customerId) {
        // await updateCRMTicketStatus(event.data.customerId, 'resolved');
      }
    }

    if (isCommentCreatedEvent(event)) {
      // event.data is typed as CommentCreatedData
      console.log('New comment:', {
        ticketId: event.data.ticketId,
        author: event.data.comment.authorType,
        body: event.data.comment.body.substring(0, 100),
      });

      // Example: Send email notification for customer replies
      if (event.data.comment.authorType === 'CUSTOMER') {
        // await notifyAgents(event.data.ticketId, event.data.comment);
      }
    }

    // Always respond quickly - do heavy processing async
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ error: 'Invalid payload' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
