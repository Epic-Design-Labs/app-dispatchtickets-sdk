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
