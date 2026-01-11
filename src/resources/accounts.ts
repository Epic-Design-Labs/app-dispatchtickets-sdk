import { BaseResource } from './base.js';
import type {
  Account,
  AccountUsage,
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyScopeInput,
} from '../types/account.js';

/**
 * Accounts resource for managing the current account
 */
export class AccountsResource extends BaseResource {
  /**
   * Get the current account
   */
  async me(): Promise<Account> {
    return this._get<Account>('/accounts/me');
  }

  /**
   * Get usage statistics for the current account
   */
  async getUsage(): Promise<AccountUsage> {
    return this._get<AccountUsage>('/accounts/me/usage');
  }

  /**
   * List all API keys for the current account
   */
  async listApiKeys(): Promise<ApiKey[]> {
    return this._get<ApiKey[]>('/accounts/me/api-keys');
  }

  /**
   * Create a new API key
   *
   * Note: The full key value is only returned once on creation.
   * Store it securely as it cannot be retrieved again.
   */
  async createApiKey(data: CreateApiKeyInput): Promise<ApiKeyWithSecret> {
    return this._post<ApiKeyWithSecret>('/accounts/me/api-keys', data);
  }

  /**
   * Update the brand scope for an API key
   */
  async updateApiKeyScope(
    keyId: string,
    data: UpdateApiKeyScopeInput
  ): Promise<{ success: boolean }> {
    return this._patch<{ success: boolean }>(
      `/accounts/me/api-keys/${keyId}/scope`,
      data
    );
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await this._delete<void>(`/accounts/me/api-keys/${keyId}`);
  }
}
