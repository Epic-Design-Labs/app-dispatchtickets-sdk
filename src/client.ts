import {
  HttpClient,
  HttpClientConfig,
  FetchFunction,
  RetryConfig,
  Hooks,
} from './utils/http.js';
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
 *
 * @example
 * ```typescript
 * const client = new DispatchTickets({
 *   apiKey: 'sk_live_...',
 *   timeout: 30000,
 *   retry: {
 *     maxRetries: 5,
 *     retryableStatuses: [429, 500, 502, 503, 504],
 *   },
 *   hooks: {
 *     onRequest: (ctx) => console.log(`${ctx.method} ${ctx.url}`),
 *     onResponse: (ctx) => console.log(`${ctx.status} in ${ctx.durationMs}ms`),
 *   },
 * });
 * ```
 */
export interface DispatchTicketsConfig {
  /**
   * Your API key (required)
   *
   * Get your API key from the Dispatch Tickets dashboard.
   * Keys starting with `sk_live_` are production keys.
   * Keys starting with `sk_test_` are test keys.
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
   * @deprecated Use `retry.maxRetries` instead for fine-grained control
   */
  maxRetries?: number;

  /**
   * Enable debug logging
   *
   * When enabled, logs all requests, responses, and request IDs to console.
   * @default false
   */
  debug?: boolean;

  /**
   * Custom fetch implementation for testing/mocking
   *
   * @example
   * ```typescript
   * const mockFetch = vi.fn().mockResolvedValue({
   *   ok: true,
   *   status: 200,
   *   headers: { get: () => 'application/json' },
   *   json: () => Promise.resolve({ id: 'test' }),
   * });
   *
   * const client = new DispatchTickets({
   *   apiKey: 'sk_test_...',
   *   fetch: mockFetch,
   * });
   * ```
   */
  fetch?: FetchFunction;

  /**
   * Fine-grained retry configuration
   *
   * @example
   * ```typescript
   * const client = new DispatchTickets({
   *   apiKey: 'sk_live_...',
   *   retry: {
   *     maxRetries: 5,
   *     retryableStatuses: [429, 500, 502, 503, 504],
   *     initialDelayMs: 500,
   *     maxDelayMs: 60000,
   *     backoffMultiplier: 2,
   *     jitter: 0.25,
   *   },
   * });
   * ```
   */
  retry?: RetryConfig;

  /**
   * Hooks for observability and customization
   *
   * @example
   * ```typescript
   * const client = new DispatchTickets({
   *   apiKey: 'sk_live_...',
   *   hooks: {
   *     onRequest: (ctx) => {
   *       console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url}`);
   *     },
   *     onResponse: (ctx) => {
   *       console.log(`[${ctx.requestId}] ${ctx.status} in ${ctx.durationMs}ms`);
   *     },
   *     onError: (error, ctx) => {
   *       console.error(`Request failed: ${error.message}`);
   *       // Send to error tracking service
   *       Sentry.captureException(error);
   *     },
   *     onRetry: (ctx, error, delayMs) => {
   *       console.log(`Retrying in ${delayMs}ms (attempt ${ctx.attempt + 1})`);
   *     },
   *   },
   * });
   * ```
   */
  hooks?: Hooks;
}

/**
 * Dispatch Tickets SDK client
 *
 * The main entry point for interacting with the Dispatch Tickets API.
 * Create a client instance with your API key and use the resource methods
 * to manage tickets, comments, attachments, and more.
 *
 * @example Basic usage
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
 *
 * @example With request cancellation
 * ```typescript
 * const controller = new AbortController();
 *
 * // Cancel after 5 seconds
 * setTimeout(() => controller.abort(), 5000);
 *
 * try {
 *   const tickets = await client.tickets.listPage('ws_abc123', {}, {
 *     signal: controller.signal,
 *   });
 * } catch (error) {
 *   if (error.message === 'Request aborted by user') {
 *     console.log('Request was cancelled');
 *   }
 * }
 * ```
 *
 * @example With hooks for logging
 * ```typescript
 * const client = new DispatchTickets({
 *   apiKey: 'sk_live_...',
 *   hooks: {
 *     onRequest: (ctx) => console.log(`→ ${ctx.method} ${ctx.url}`),
 *     onResponse: (ctx) => console.log(`← ${ctx.status} (${ctx.durationMs}ms)`),
 *   },
 * });
 * ```
 */
export class DispatchTickets {
  private readonly http: HttpClient;

  /**
   * Accounts resource for managing the current account and API keys
   *
   * @example
   * ```typescript
   * // Get current account
   * const account = await client.accounts.me();
   *
   * // Get usage statistics
   * const usage = await client.accounts.getUsage();
   *
   * // Create a new API key
   * const newKey = await client.accounts.createApiKey({
   *   name: 'Production',
   *   allBrands: true,
   * });
   * ```
   */
  readonly accounts: AccountsResource;

  /**
   * Brands (workspaces) resource
   *
   * Brands are isolated containers for tickets. Each brand can have its own
   * email address, categories, tags, and settings.
   *
   * @example
   * ```typescript
   * // List all brands
   * const brands = await client.brands.list();
   *
   * // Create a new brand
   * const brand = await client.brands.create({
   *   name: 'Acme Support',
   *   slug: 'acme',
   * });
   *
   * // Get inbound email address
   * const email = client.brands.getInboundEmail('br_abc123');
   * // Returns: br_abc123@inbound.dispatchtickets.com
   * ```
   */
  readonly brands: BrandsResource;

  /**
   * Tickets resource
   *
   * @example
   * ```typescript
   * // Create a ticket
   * const ticket = await client.tickets.create('ws_abc123', {
   *   title: 'Issue with billing',
   *   body: 'I was charged twice...',
   *   priority: 'high',
   * });
   *
   * // Iterate through all tickets
   * for await (const ticket of client.tickets.list('ws_abc123', { status: 'open' })) {
   *   console.log(ticket.title);
   * }
   * ```
   */
  readonly tickets: TicketsResource;

  /**
   * Comments resource
   *
   * @example
   * ```typescript
   * // Add a comment
   * const comment = await client.comments.create('ws_abc123', 'tkt_xyz', {
   *   body: 'Thanks for your patience!',
   *   authorType: 'AGENT',
   * });
   *
   * // List comments
   * const comments = await client.comments.list('ws_abc123', 'tkt_xyz');
   * ```
   */
  readonly comments: CommentsResource;

  /**
   * Attachments resource
   *
   * @example
   * ```typescript
   * // Simple upload
   * const attachment = await client.attachments.upload(
   *   'ws_abc123',
   *   'tkt_xyz',
   *   fileBuffer,
   *   'document.pdf',
   *   'application/pdf'
   * );
   *
   * // Get download URL
   * const { downloadUrl } = await client.attachments.get('ws_abc123', 'tkt_xyz', 'att_abc');
   * ```
   */
  readonly attachments: AttachmentsResource;

  /**
   * Webhooks resource
   *
   * @example
   * ```typescript
   * // Create a webhook
   * const webhook = await client.webhooks.create('ws_abc123', {
   *   url: 'https://example.com/webhook',
   *   secret: 'your-secret',
   *   events: ['ticket.created', 'ticket.updated'],
   * });
   * ```
   */
  readonly webhooks: WebhooksResource;

  /**
   * Categories resource
   *
   * @example
   * ```typescript
   * // Create a category
   * await client.categories.create('ws_abc123', { name: 'Billing', color: '#ef4444' });
   *
   * // Get category stats
   * const stats = await client.categories.getStats('ws_abc123');
   * ```
   */
  readonly categories: CategoriesResource;

  /**
   * Tags resource
   *
   * @example
   * ```typescript
   * // Create a tag
   * await client.tags.create('ws_abc123', { name: 'urgent', color: '#f59e0b' });
   *
   * // Merge tags
   * await client.tags.merge('ws_abc123', 'tag_target', ['tag_source1', 'tag_source2']);
   * ```
   */
  readonly tags: TagsResource;

  /**
   * Customers resource
   *
   * @example
   * ```typescript
   * // Create a customer
   * const customer = await client.customers.create('ws_abc123', {
   *   email: 'user@example.com',
   *   name: 'Jane Doe',
   * });
   *
   * // Search customers
   * const results = await client.customers.search('ws_abc123', 'jane');
   * ```
   */
  readonly customers: CustomersResource;

  /**
   * Custom fields resource
   *
   * @example
   * ```typescript
   * // Get all field definitions
   * const fields = await client.fields.getAll('ws_abc123');
   *
   * // Create a field
   * await client.fields.create('ws_abc123', 'ticket', {
   *   key: 'order_id',
   *   label: 'Order ID',
   *   type: 'text',
   *   required: true,
   * });
   * ```
   */
  readonly fields: FieldsResource;

  /**
   * Static webhook utilities
   *
   * @example
   * ```typescript
   * // Verify webhook signature
   * const isValid = DispatchTickets.webhooks.verifySignature(
   *   rawBody,
   *   req.headers['x-dispatch-signature'],
   *   'your-secret'
   * );
   *
   * // Generate signature for testing
   * const signature = DispatchTickets.webhooks.generateSignature(
   *   JSON.stringify(payload),
   *   'your-secret'
   * );
   * ```
   */
  static readonly webhooks = webhookUtils;

  /**
   * Create a new Dispatch Tickets client
   *
   * @param config - Client configuration options
   * @throws Error if API key is not provided
   *
   * @example
   * ```typescript
   * const client = new DispatchTickets({
   *   apiKey: 'sk_live_...',
   * });
   * ```
   */
  constructor(config: DispatchTicketsConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl || 'https://dispatch-tickets-api.onrender.com/v1',
      apiKey: config.apiKey,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? config.retry?.maxRetries ?? 3,
      debug: config.debug ?? false,
      fetch: config.fetch,
      retry: config.retry,
      hooks: config.hooks,
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
