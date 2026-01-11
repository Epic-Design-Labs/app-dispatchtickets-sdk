import type { WebhookEvent } from './common.js';

/**
 * Webhook resource
 */
export interface Webhook {
  id: string;
  brandId: string;
  url: string;
  events: WebhookEvent[];
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
  events: WebhookEvent[];
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempts: number;
  lastAttempt?: string;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
}
