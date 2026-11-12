/**
 * Brand (workspace) resource
 */
export interface Brand {
  id: string;
  accountId: string;
  name: string;
  slug: string;
  ticketPrefix?: string;
  nextTicketNumber: number;
  url?: string;
  iconUrl?: string;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ticketSchema?: Record<string, unknown>;
  fieldDefinitions?: Record<string, unknown>;
  inboundEmailEnabled: boolean;
  autoresponseEnabled: boolean;
  autoresponseSubject?: string;
  autoresponseBody?: string;
  fromName?: string;
  fromEmail?: string;
  /** Allowed origins for portal API CORS */
  portalOrigins: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a brand
 */
export interface CreateBrandInput {
  name: string;
  slug: string;
  ticketPrefix?: string;
  ticketNumberStart?: number;
  metadata?: Record<string, unknown>;
  ticketSchema?: Record<string, unknown>;
}

/**
 * Input for updating a brand
 */
export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  ticketPrefix?: string;
  url?: string;
  iconUrl?: string;
  fromName?: string;
  fromEmail?: string;
  autoresponseEnabled?: boolean;
  autoresponseSubject?: string;
  autoresponseBody?: string;
  metadata?: Record<string, unknown>;
  ticketSchema?: Record<string, unknown>;
  /** Allowed origins for portal API CORS. Empty array = block all cross-origin requests. */
  portalOrigins?: string[];

  // --- Chat widget ---
  /** Allow the chat widget to open conversations for this brand */
  chatEnabled?: boolean;
  /** Sites allowed to embed the chat widget. Empty array = none. */
  chatAllowedOrigins?: string[];
  /** First message a visitor sees in the chat widget. null clears it. */
  chatGreeting?: string | null;
  /** Shown when nobody is available or chat is outside its hours. null uses the default. */
  chatOfflineMessage?: string | null;
  /**
   * When the widget offers to continue by email: 'never', 'unavailable' (nobody can
   * answer; the default), or 'waiting' (also after a visitor has waited 2 minutes).
   * A typed address is always confirmed before anything is sent to it.
   */
  chatEmailFollowUp?: ChatEmailFollowUp;
  /**
   * Turn a signed-in (verified) visitor's chat into an email ticket when they leave
   * while waiting for a reply. Anonymous visitors are never auto-converted.
   */
  chatAutoConvert?: boolean;
  /** Limit chat to chatHours; outside them the widget shows the offline message */
  chatHoursEnabled?: boolean;
  /** When chat is staffed. days: 0 = Sunday. An end before start is an overnight shift. */
  chatHours?: ChatHours;
  /** Seconds a visitor may wait for a reply before the warning alert. null uses the default (60). */
  chatAlertWarningSeconds?: number | null;
  /** Seconds before the critical alert; must be later than the warning. null uses the default (180). */
  chatAlertCriticalSeconds?: number | null;
}

/** When the chat widget offers to continue the conversation by email */
export type ChatEmailFollowUp = 'never' | 'unavailable' | 'waiting';

/** Staffed chat hours */
export interface ChatHours {
  /** "HH:MM", 24-hour */
  start: string;
  /** "HH:MM", 24-hour */
  end: string;
  /** 0 = Sunday */
  days: number[];
  /** IANA time zone, e.g. "America/New_York" */
  timezone: string;
}

/**
 * Brand deletion preview result
 */
export interface DeleteBrandPreview {
  ticketCount: number;
  webhookCount: number;
  categoryCount: number;
  tagCount: number;
}
