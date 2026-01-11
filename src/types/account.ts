/**
 * Account represents the organization/company using Dispatch Tickets
 */
export interface Account {
  id: string;
  stackbeCustomerId: string;
  stackbeOrganizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Usage statistics for the account
 */
export interface AccountUsage {
  ticketsThisMonth: number;
  ticketsTotal: number;
  brandsCount: number;
  plan?: {
    name: string;
    ticketLimit: number;
    brandLimit: number | null;
  };
}

/**
 * API key for programmatic access
 */
export interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  allBrands: boolean;
  brandIds: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * API key with the full key value (only returned on creation)
 */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

/**
 * Input for creating an API key
 */
export interface CreateApiKeyInput {
  name: string;
  /**
   * If true, the API key can access all brands (current and future)
   */
  allBrands?: boolean;
  /**
   * Specific brand IDs this key can access (ignored if allBrands is true)
   */
  brandIds?: string[];
}

/**
 * Input for updating API key scope
 */
export interface UpdateApiKeyScopeInput {
  allBrands?: boolean;
  brandIds?: string[];
}
