/**
 * Enrichment types
 *
 * Enrichment is a context endpoint you host. Dispatch Tickets POSTs the
 * ticket to it (signed like a webhook, `X-Dispatch-Signature: sha256=<hex>`)
 * and shows the sections you return beside the ticket.
 */

/**
 * Events that trigger a fetch. `ticket.opened` is a re-fetch when an agent
 * opens a ticket whose snapshot has gone stale.
 */
export type EnrichmentEvent = 'ticket.created' | 'ticket.opened';

/** Colors a field's value */
export type EnrichmentFieldStatus = 'ok' | 'warn' | 'error' | 'neutral';

export interface EnrichmentField {
  label: string;
  value: string;
  /** Makes the value a link (http or https only) */
  href?: string;
  status?: EnrichmentFieldStatus;
}

export interface EnrichmentSection {
  title: string;
  fields: EnrichmentField[];
}

/**
 * What your endpoint returns. Anything outside this shape is dropped.
 */
export interface EnrichmentPayload {
  sections: EnrichmentSection[];
}

/**
 * A brand's enrichment endpoint. The secret itself is never included; use
 * `revealSecret()` or `rotateSecret()` to get it.
 */
export interface EnrichmentConfig {
  id: string;
  brandId: string;
  url: string;
  enabled: boolean;
  events: EnrichmentEvent[];
  timeoutMs: number;
  failureCount: number;
  lastTriggered: string | null;
  lastFailure: string | null;
  lastError: string | null;
  /** The secret with most of it masked */
  secretPreview: string;
  hasSecret: boolean;
  supportedEvents: EnrichmentEvent[];
  /** Server-side ceiling on `timeoutMs` */
  maxTimeoutMs: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating or updating the endpoint
 */
export interface UpsertEnrichmentInput {
  url: string;
  /**
   * HMAC-SHA256 signing secret (16-256 characters). Omit to keep the current
   * one, or to have one generated on first save.
   */
  secret?: string;
  /** @default true */
  enabled?: boolean;
  /** @default ['ticket.created'] */
  events?: EnrichmentEvent[];
  /** Request budget in ms, 250-2000. @default 2000 */
  timeoutMs?: number;
}

/**
 * Input for a test probe. With no input, the saved config is probed with a
 * sample ticket.
 */
export interface TestEnrichmentInput {
  /** Probe this URL instead of the saved one */
  url?: string;
  /** Sign with this secret instead of the saved one */
  secret?: string;
  /** Send a real ticket instead of a sample */
  ticketId?: string;
}

/**
 * What one call to your endpoint produced, whether or not it worked
 */
export interface EnrichmentProbeResult {
  ok: boolean;
  /** HTTP status, if a response came back */
  status?: number;
  durationMs: number;
  error?: string;
  /** Your endpoint's response body, truncated */
  rawBody?: string;
  /** The sections as they will be shown, after anything invalid was dropped */
  payload?: EnrichmentPayload;
  /** What was dropped from your response, and why */
  warnings: string[];
}
