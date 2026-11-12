/** Tokens from POST /v1/oauth/token (Connect to Dispatch). */
export interface IntegrationTokens {
  /** Use as the SDK's `apiKey`: `new DispatchTickets({ apiKey: tokens.access_token })` */
  access_token: string;
  token_type: 'Bearer';
  /** Seconds until access_token expires (3600) */
  expires_in: number;
  /** Single use: every refresh returns a new one. Presenting a spent one revokes all tokens. */
  refresh_token: string;
  installation_id: string;
  account_id: string;
  /** Brands the customer approved */
  brand_ids: string[];
}

/** GET /v1/integrations/installation, with an integration access token. */
export interface IntegrationInstallationInfo {
  installationId: string;
  app: { id: string; name: string };
  account: { id: string; name: string } | null;
  brands: Array<{ id: string; name: string }>;
}
