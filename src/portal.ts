import { HttpClient, HttpClientConfig, FetchFunction } from './utils/http.js';
import { PortalTicketsResource } from './resources/portal-tickets.js';
import type { PortalTokenResponse } from './types/portal.js';

/**
 * Configuration options for the Dispatch Portal client
 *
 * @example
 * ```typescript
 * const portal = new DispatchPortal({
 *   token: 'portal_token_from_backend...',
 * });
 * ```
 */
export interface DispatchPortalConfig {
  /**
   * Portal token (required)
   *
   * Obtain this token by:
   * 1. Your backend calls `client.brands.generatePortalToken()` with the customer's email
   * 2. Pass the token to your frontend
   * 3. Frontend creates DispatchPortal with this token
   *
   * Or for self-auth mode:
   * 1. Customer clicks magic link email
   * 2. Your portal page calls `DispatchPortal.verify()` with the URL token
   * 3. Use the returned token to create DispatchPortal
   */
  token: string;

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
   * Custom fetch implementation (for testing)
   */
  fetch?: FetchFunction;
}

const DEFAULT_BASE_URL = 'https://dispatch-tickets-api.onrender.com/v1';
const DEFAULT_TIMEOUT = 30000;

/**
 * Dispatch Portal SDK client
 *
 * Customer-facing client for interacting with the portal API.
 * Use this to let customers view and manage their own tickets.
 *
 * @example Authenticated mode (backend generates token)
 * ```typescript
 * // On your backend:
 * const client = new DispatchTickets({ apiKey: 'sk_live_...' });
 * const { token } = await client.brands.generatePortalToken('br_abc123', {
 *   email: 'customer@example.com',
 *   name: 'Jane Doe',
 * });
 * // Pass token to frontend...
 *
 * // On your frontend:
 * const portal = new DispatchPortal({ token });
 * const { data: tickets } = await portal.tickets.list();
 * ```
 *
 * @example Self-auth mode (magic link)
 * ```typescript
 * // Customer clicks magic link, lands on your portal with ?token=xyz
 * const urlToken = new URLSearchParams(window.location.search).get('token');
 *
 * // Verify the magic link token
 * const { token } = await DispatchPortal.verify(urlToken);
 *
 * // Now use the portal token
 * const portal = new DispatchPortal({ token });
 * const { data: tickets } = await portal.tickets.list();
 * ```
 */
export class DispatchPortal {
  private readonly http: HttpClient;
  private readonly config: DispatchPortalConfig;

  /**
   * Tickets resource for viewing and creating tickets
   *
   * @example
   * ```typescript
   * // List tickets
   * const { data: tickets } = await portal.tickets.list();
   *
   * // Create a ticket
   * const ticket = await portal.tickets.create({
   *   title: 'Need help',
   *   body: 'Something is broken...',
   * });
   *
   * // Add a comment
   * await portal.tickets.addComment(ticket.id, 'Here is more info...');
   * ```
   */
  readonly tickets: PortalTicketsResource;

  /**
   * Create a new Dispatch Portal client
   *
   * @param config - Portal client configuration
   * @throws Error if token is not provided
   */
  constructor(config: DispatchPortalConfig) {
    if (!config.token) {
      throw new Error('Portal token is required');
    }

    this.config = config;

    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      apiKey: config.token, // HttpClient uses this as Bearer token
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      maxRetries: 2, // Fewer retries for portal (end-user experience)
      fetch: config.fetch,
    };

    this.http = new HttpClient(httpConfig);
    this.tickets = new PortalTicketsResource(this.http);
  }

  /**
   * Verify a magic link token and get a portal token
   *
   * Call this when the customer clicks the magic link and lands on your portal.
   * The magic link contains a short-lived token that can be exchanged for a
   * longer-lived portal token.
   *
   * @param magicLinkToken - The token from the magic link URL
   * @param baseUrl - Optional API base URL
   * @param fetchFn - Optional custom fetch function (for testing)
   * @returns Portal token response
   *
   * @example
   * ```typescript
   * // Customer lands on: https://yourapp.com/portal?token=xyz
   * const urlToken = new URLSearchParams(window.location.search).get('token');
   *
   * const { token, email, name } = await DispatchPortal.verify(urlToken);
   *
   * // Store token and create client
   * localStorage.setItem('portalToken', token);
   * const portal = new DispatchPortal({ token });
   * ```
   */
  static async verify(
    magicLinkToken: string,
    baseUrl: string = DEFAULT_BASE_URL,
    fetchFn: FetchFunction = fetch
  ): Promise<PortalTokenResponse> {
    const url = `${baseUrl}/portal/verify`;

    const response = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token: magicLinkToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string };
      throw new Error(errorData.message || 'Failed to verify magic link token');
    }

    return response.json() as Promise<PortalTokenResponse>;
  }

  /**
   * Refresh the current portal token
   *
   * Call this before the token expires to get a new token with extended expiry.
   * The new token will have the same customer context.
   *
   * @returns New portal token response
   *
   * @example
   * ```typescript
   * // Check if token is close to expiry and refresh
   * const { token: newToken, expiresAt } = await portal.refresh();
   *
   * // Create new client with refreshed token
   * const newPortal = new DispatchPortal({ token: newToken });
   * ```
   */
  async refresh(): Promise<PortalTokenResponse> {
    return this.http.request<PortalTokenResponse>({
      method: 'POST',
      path: '/portal/refresh',
    });
  }

  /**
   * Get the current token
   *
   * Useful for storing/passing the token.
   */
  get token(): string {
    return this.config.token;
  }
}
