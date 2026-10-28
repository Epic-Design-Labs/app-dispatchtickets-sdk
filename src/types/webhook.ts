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
