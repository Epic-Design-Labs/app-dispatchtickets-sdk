import { BaseResource } from './base.js';
import type { Webhook, CreateWebhookInput, WebhookDelivery } from '../types/webhook.js';

/**
 * Webhooks resource
 */
export class WebhooksResource extends BaseResource {
  /**
   * Create a new webhook
   */
  async create(brandId: string, data: CreateWebhookInput): Promise<Webhook> {
    return this._post<Webhook>(`/brands/${brandId}/webhooks`, data);
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
