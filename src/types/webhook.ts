import type { WebhookEventName } from './common.js';

/**
 * Webhook resource
 */
export interface Webhook {
  id: string;
  brandId: string;
  url: string;
  events: WebhookEventName[];
  enabled: boolean;
  failureCount: number;
  lastTriggered?: string;
  lastFailure?: string;
  /** The signing secret with most of it masked. The secret itself is never listed. */
  secretPreview: string;
  hasSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A webhook as `create()` returns it: the only response, besides
 * `revealSecret()`, that carries the signing secret.
 */
export interface CreatedWebhook extends Webhook {
  secret: string;
}

/**
 * A webhook's signing secret, from `revealSecret()`
 */
export interface WebhookSecret {
  secret: string;
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
  url: string;
  /** HMAC-SHA256 signing secret, 16-256 characters */
  secret: string;
  events: WebhookEventName[];
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventName;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempts: number;
  lastAttempt?: string;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
}

/**
 * Input for updating a webhook. The secret can't be changed here: recreate the webhook.
 */
export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEventName[];
  /** Turning it on clears the failure count, so an auto-disabled webhook starts over */
  enabled?: boolean;
}

/**
 * Result of redelivering a webhook delivery
 */
export interface WebhookRedelivery {
  /** The new delivery's id */
  id: string;
  event: WebhookEventName;
  status: 'PENDING';
  createdAt: string;
  /** The delivery it repeats */
  redeliveryOf: string;
}
