import { BaseResource } from './base.js';
import type { IntegrationInstallationInfo } from '../types/integration.js';

/**
 * For an integration using a Connect to Dispatch access token as its apiKey.
 */
export class IntegrationsResource extends BaseResource {
  /** Which account and brands this access token reaches. */
  async me(): Promise<IntegrationInstallationInfo> {
    return this._get<IntegrationInstallationInfo>('/integrations/installation');
  }
}
