import { HttpClient, HttpClientConfig, FetchFunction } from './utils/http.js';
import { AccountsResource } from './resources/accounts.js';
import { BrandsResource } from './resources/brands.js';
import { TicketsResource } from './resources/tickets.js';
import { CommentsResource } from './resources/comments.js';
import { AttachmentsResource } from './resources/attachments.js';
import { WebhooksResource } from './resources/webhooks.js';
import { CategoriesResource } from './resources/categories.js';
import { TagsResource } from './resources/tags.js';
import { CustomersResource } from './resources/customers.js';
import { FieldsResource } from './resources/fields.js';
import { webhookUtils } from './utils/webhooks.js';

/**
 * Configuration options for the Dispatch Tickets client
 */
export interface DispatchTicketsConfig {
  /**
   * Your API key (required)
   */
  apiKey: string;

  /**
   * Base URL for the API
   * @default 'https://dispatch-tickets-api.onrender.com/v1'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom fetch implementation for testing/mocking
   */
  fetch?: FetchFunction;
}

/**
 * Dispatch Tickets SDK client
 *
 * @example
 * ```typescript
 * import { DispatchTickets } from '@dispatchtickets/sdk';
 *
 * const client = new DispatchTickets({
 *   apiKey: 'sk_live_...',
 * });
 *
 * // List brands
 * const brands = await client.brands.list();
 *
 * // Create a ticket
 * const ticket = await client.tickets.create('ws_abc123', {
 *   title: 'Help with login',
 *   body: 'I cannot log in to my account',
 * });
 *
 * // Iterate through all tickets
 * for await (const ticket of client.tickets.list('ws_abc123', { status: 'open' })) {
 *   console.log(ticket.title);
 * }
 * ```
 */
export class DispatchTickets {
  private readonly http: HttpClient;

  /**
   * Accounts resource for managing the current account and API keys
   */
  readonly accounts: AccountsResource;

  /**
   * Brands (workspaces) resource
   */
  readonly brands: BrandsResource;

  /**
   * Tickets resource
   */
  readonly tickets: TicketsResource;

  /**
   * Comments resource
   */
  readonly comments: CommentsResource;

  /**
   * Attachments resource
   */
  readonly attachments: AttachmentsResource;

  /**
   * Webhooks resource
   */
  readonly webhooks: WebhooksResource;

  /**
   * Categories resource
   */
  readonly categories: CategoriesResource;

  /**
   * Tags resource
   */
  readonly tags: TagsResource;

  /**
   * Customers resource
   */
  readonly customers: CustomersResource;

  /**
   * Custom fields resource
   */
  readonly fields: FieldsResource;

  /**
   * Static webhook utilities
   */
  static readonly webhooks = webhookUtils;

  constructor(config: DispatchTicketsConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl || 'https://dispatch-tickets-api.onrender.com/v1',
      apiKey: config.apiKey,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      debug: config.debug ?? false,
      fetch: config.fetch,
    };

    this.http = new HttpClient(httpConfig);

    // Initialize resources
    this.accounts = new AccountsResource(this.http);
    this.brands = new BrandsResource(this.http);
    this.tickets = new TicketsResource(this.http);
    this.comments = new CommentsResource(this.http);
    this.attachments = new AttachmentsResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.categories = new CategoriesResource(this.http);
    this.tags = new TagsResource(this.http);
    this.customers = new CustomersResource(this.http);
    this.fields = new FieldsResource(this.http);
  }
}
