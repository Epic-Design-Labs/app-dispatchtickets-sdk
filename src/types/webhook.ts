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
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
  url: string;
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
