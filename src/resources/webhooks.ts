import { BaseResource } from './base.js';
import type {
  Webhook,
  CreatedWebhook,
  CreateWebhookInput,
  WebhookDelivery,
  WebhookSecret,
} from '../types/webhook.js';

/**
 * Webhooks resource
 */
export class WebhooksResource extends BaseResource {
  /**
   * Create a new webhook. The response is the only one that echoes the secret.
   */
  async create(brandId: string, data: CreateWebhookInput): Promise<CreatedWebhook> {
    return this._post<CreatedWebhook>(`/brands/${brandId}/webhooks`, data);
  }

  /**
   * List all webhooks for a brand
   */
  async list(brandId: string): Promise<Webhook[]> {
    return this._get<Webhook[]>(`/brands/${brandId}/webhooks`);
  }

  /**
   * Get a webhook by ID
   */
  async get(brandId: string, webhookId: string): Promise<Webhook> {
    return this._get<Webhook>(`/brands/${brandId}/webhooks/${webhookId}`);
  }

  /**
   * Read a webhook's signing secret back. Needs an account-wide API key or an
   * owner/admin session, and is recorded in the audit log.
   */
  async revealSecret(brandId: string, webhookId: string): Promise<WebhookSecret> {
    return this._post<WebhookSecret>(`/brands/${brandId}/webhooks/${webhookId}/reveal-secret`);
  }

  /**
   * Delete a webhook
   */
  async delete(brandId: string, webhookId: string): Promise<void> {
    await this._delete<void>(`/brands/${brandId}/webhooks/${webhookId}`);
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveries(brandId: string, webhookId: string): Promise<WebhookDelivery[]> {
    return this._get<WebhookDelivery[]>(
      `/brands/${brandId}/webhooks/${webhookId}/deliveries`
    );
  }
}
