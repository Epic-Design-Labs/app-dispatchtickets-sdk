import type { IntegrationTokens } from './types/integration.js';

const DEFAULT_APP_URL = 'https://app.dispatchtickets.com';
const DEFAULT_API_URL = 'https://api.dispatchtickets.com/v1';

export interface ConnectUrlOptions {
  /** Your integration's client id (iap_...) */
  clientId: string;
  /** Must exactly match one you registered */
  redirectUri: string;
  /** Opaque value returned to your redirect unchanged; use it against CSRF */
  state?: string;
  /** PKCE S256 challenge, if you use PKCE */
  codeChallenge?: string;
  /** Override for testing */
  appUrl?: string;
}

/**
 * The "Connect to Dispatch" link: send the customer's admin here. They sign in,
 * pick brands and approve; Dispatch redirects to `redirectUri` with `code` and
 * `state` (or `error=access_denied` if they cancel).
 */
export function connectUrl(options: ConnectUrlOptions): string {
  const url = new URL('/integrations/authorize', options.appUrl ?? DEFAULT_APP_URL);
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  if (options.state !== undefined) url.searchParams.set('state', options.state);
  if (options.codeChallenge) {
    url.searchParams.set('code_challenge', options.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  return url.toString();
}

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
  /** Override for testing */
  baseUrl?: string;
  /** Custom fetch (e.g. for tests). Defaults to the global fetch, called unbound. */
  fetch?: typeof fetch;
}

/** Error from the token endpoint, with the OAuth `error` code (invalid_grant, invalid_client, ...). */
export class IntegrationTokenError extends Error {
  constructor(
    readonly error: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'IntegrationTokenError';
  }
}

async function tokenRequest(creds: ClientCredentials, body: Record<string, string | undefined>): Promise<IntegrationTokens> {
  const doFetch = creds.fetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...body, client_id: creds.clientId, client_secret: creds.clientSecret })) {
    if (v !== undefined) params.set(k, v);
  }
  const res = await doFetch(`${creds.baseUrl ?? DEFAULT_API_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new IntegrationTokenError(
      String(data.error ?? 'server_error'),
      String(data.error_description ?? data.message ?? `Token request failed (${res.status})`),
      res.status,
    );
  }
  return data as unknown as IntegrationTokens;
}

/** Swap the `code` from your redirect for tokens. Call from your server: it uses your client secret. */
export function exchangeCode(
  options: ClientCredentials & { code: string; redirectUri: string; codeVerifier?: string },
): Promise<IntegrationTokens> {
  return tokenRequest(options, {
    grant_type: 'authorization_code',
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });
}

/**
 * New tokens before the access token expires. Store the returned refresh_token:
 * the one you sent is now spent, and sending it again revokes everything.
 */
export function refreshAccessToken(options: ClientCredentials & { refreshToken: string }): Promise<IntegrationTokens> {
  return tokenRequest(options, { grant_type: 'refresh_token', refresh_token: options.refreshToken });
}
