import { BaseResource } from './base.js';
import type {
  EnrichmentConfig,
  UpsertEnrichmentInput,
  TestEnrichmentInput,
  EnrichmentProbeResult,
} from '../types/enrichment.js';

/**
 * Enrichment resource
 *
 * One context endpoint per brand. Dispatch Tickets calls it when a ticket is
 * created and shows what it returns beside the ticket.
 */
export class EnrichmentResource extends BaseResource {
  /**
   * Get the brand's endpoint, or null if none is set up
   */
  async get(brandId: string): Promise<EnrichmentConfig | null> {
    // No endpoint comes back as an empty body.
    const config = await this._get<EnrichmentConfig | undefined>(`/brands/${brandId}/enrichment`);
    return config ?? null;
  }

  /**
   * Create or update the endpoint. A new endpoint gets a generated secret
   * unless you pass one; read it with `revealSecret()`.
   */
  async upsert(brandId: string, data: UpsertEnrichmentInput): Promise<EnrichmentConfig> {
    return this._put<EnrichmentConfig>(`/brands/${brandId}/enrichment`, data);
  }

  /**
   * Remove the endpoint. Snapshots already on tickets stay.
   */
  async delete(brandId: string): Promise<{ success: boolean }> {
    return this._delete<{ success: boolean }>(`/brands/${brandId}/enrichment`);
  }

  /**
   * Replace the signing secret. The old one stops working at once.
   */
  async rotateSecret(brandId: string): Promise<EnrichmentConfig & { secret: string }> {
    return this._post<EnrichmentConfig & { secret: string }>(
      `/brands/${brandId}/enrichment/rotate-secret`
    );
  }

  /**
   * Read the signing secret. Each read is recorded in the audit log.
   */
  async revealSecret(brandId: string): Promise<{ secret: string }> {
    return this._post<{ secret: string }>(`/brands/${brandId}/enrichment/reveal-secret`);
  }

  /**
   * Call the endpoint once without changing any ticket, and see the raw
   * response and anything that was dropped from it.
   *
   * @example
   * ```typescript
   * const result = await client.enrichment.test('ws_abc123', {
   *   url: 'https://your-app.com/dispatch/context',
   * });
   * if (!result.ok) console.error(result.error, result.rawBody);
   * result.warnings.forEach((w) => console.warn(w));
   * ```
   */
  async test(brandId: string, data: TestEnrichmentInput = {}): Promise<EnrichmentProbeResult> {
    return this._post<EnrichmentProbeResult>(`/brands/${brandId}/enrichment/test`, data);
  }

  /**
   * Fetch a ticket's enrichment again now and store it on the ticket
   */
  async refresh(brandId: string, ticketId: string): Promise<EnrichmentProbeResult> {
    return this._post<EnrichmentProbeResult>(
      `/brands/${brandId}/tickets/${ticketId}/enrichment/refresh`
    );
  }
}
