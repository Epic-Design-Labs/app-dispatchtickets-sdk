/**
 * When the chat widget offers to continue by email: never, only when nobody can answer
 * (the default), or also once a visitor has waited 2 minutes for a reply
 */
export type ChatEmailFollowUp = 'never' | 'unavailable' | 'waiting';

/**
 * When chat is staffed. days: 0 = Sunday. An end before start is an overnight shift.
 */
export interface ChatHours {
  start: string;
  end: string;
  days: number[];
  timezone: string;
}

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
  /** Whether the chat widget is on */
  chatEnabled?: boolean;
  /** Sites allowed to embed the chat widget */
  chatAllowedOrigins?: string[];
  /** First message a visitor sees in the widget */
  chatGreeting?: string | null;
  /** Shown when nobody is available or chat is outside its hours */
  chatOfflineMessage?: string | null;
  chatEmailFollowUp?: ChatEmailFollowUp;
  /** Turn a verified visitor's chat into an email ticket when they leave while waiting */
  chatAutoConvert?: boolean;
  /** Limit chat to chatHours */
  chatHoursEnabled?: boolean;
  chatHours?: ChatHours | null;
  /** Seconds a visitor may wait before the warning alert; null uses the default (60) */
  chatAlertWarningSeconds?: number | null;
  /** Seconds before the critical alert; null uses the default (180) */
  chatAlertCriticalSeconds?: number | null;
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
  /** Turn the chat widget on or off */
  chatEnabled?: boolean;
  /** Sites allowed to embed the chat widget. Empty array = none. */
  chatAllowedOrigins?: string[];
  /** First message a visitor sees in the widget. null clears it. */
  chatGreeting?: string | null;
  /** Shown when nobody is available or chat is outside its hours. null uses the default. */
  chatOfflineMessage?: string | null;
  /** When the widget offers to continue by email. A typed address is always confirmed first. */
  chatEmailFollowUp?: ChatEmailFollowUp;
  /** Turn a verified visitor's chat into an email ticket when they leave while waiting. Anonymous visitors are never converted. */
  chatAutoConvert?: boolean;
  /** Limit chat to chatHours; outside them the widget shows the offline message */
  chatHoursEnabled?: boolean;
  chatHours?: ChatHours;
  /** Seconds a visitor may wait before the warning alert. null uses the default (60). */
  chatAlertWarningSeconds?: number | null;
  /** Seconds before the critical alert; must be later than the warning. null uses the default (180). */
  chatAlertCriticalSeconds?: number | null;
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
