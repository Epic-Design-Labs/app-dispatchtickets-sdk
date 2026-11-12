/**
 * Chat types
 *
 * A chat conversation is a ticket (source `'chat'`) and its messages are
 * comments, so reading and replying use `client.tickets` and `client.comments`.
 * These types cover what is chat-only: the visitor behind a chat ticket, and
 * identity tokens for signed-in users.
 */

/**
 * Who a verified chat visitor is: the user your server vouched for with an
 * identity token.
 */
export interface ChatVerifiedIdentity {
  /** Your own user id, as passed to `chat.createIdentityToken()` */
  userId: string;
  email: string | null;
  name: string | null;
}

/**
 * The visitor behind a chat ticket
 */
export interface ChatVisitor {
  /** True if the visitor's widget was seen in the last minute */
  present: boolean;
  lastSeenAt: string;
  startedAt: string;
  /** What the widget reported about the page and browser (free-form) */
  visitor: Record<string, unknown>;
  /**
   * An email the visitor typed. Never verified: anyone can type any address,
   * so don't treat it as who they are.
   */
  claimedEmail: string | null;
  /** Set when the chat was started with an identity token; null if anonymous */
  verified: ChatVerifiedIdentity | null;
  /**
   * The ticket was marked as spam. The visitor isn't told: what they send is
   * kept, but no webhook, notification or live event fires.
   */
  blocked: boolean;
  /**
   * Once the chat is a ticket and the visitor's typed address was asked to
   * confirm: where that stands. Null otherwise.
   */
  emailConfirmation: ChatEmailConfirmation | null;
}

/**
 * A confirmation email sent to an address a chat visitor typed
 */
export interface ChatEmailConfirmation {
  email: string;
  sentAt: string;
  confirmedAt: string | null;
  /** Unconfirmed and past its 7 days */
  expired: boolean;
  /** `resendEmailConfirmation()` would be accepted now (max 3 sends, 10 minutes apart) */
  canResend: boolean;
}

/**
 * Input for turning a chat into an email ticket
 */
export interface ConvertChatInput {
  /** The ticket's new subject (up to 255 characters) */
  title: string;
  /** What the customer needs, in your words. They see it. Up to 20,000 characters. */
  description: string;
  /** Saved as an internal note. Never sent. */
  internalNote?: string;
  /**
   * An address you know is the customer's. Used as-is and linked as the
   * contact. Omit it to use the verified address, or to have a typed one confirmed first.
   */
  email?: string;
  /** Email the customer now (default true) */
  notifyCustomer?: boolean;
}

/**
 * What happened to the customer when the chat became a ticket
 */
export interface ConvertChatResult {
  ticketId: string;
  /**
   * `emailed`: a known address got the ticket and conversation.
   * `confirmation_sent`: a typed address was asked to confirm first; the ticket follows.
   * `no_email`: nothing to send to; add the customer to reply by email.
   * `not_requested`: `notifyCustomer` was false, or the customer opted out of email.
   */
  delivery: 'emailed' | 'confirmation_sent' | 'no_email' | 'not_requested';
  email: string | null;
}

/**
 * Input for minting an identity token
 */
export interface CreateChatIdentityTokenInput {
  /** Your own, stable id for the user */
  userId: string;
  email: string;
  name?: string;
  /** A company in this brand that the user is acting for */
  companyId?: string;
  /** Alternative to `companyId`: your own id for the company, created with `name` if new */
  company?: {
    sourceOrgId?: string;
    name?: string;
  };
}

/**
 * A signed identity token. Hand it to the widget; it expires after an hour.
 */
export interface ChatIdentityToken {
  token: string;
  expiresAt: string;
}

/**
 * A chat widget button configured on a brand. Pressing it makes Dispatch POST a
 * signed `chat.action` payload ({@link ChatActionPayload}) to `url`.
 */
export interface ChatAction {
  id: string;
  brandId: string;
  /** Button text (max 40) */
  label: string;
  url: string;
  enabled: boolean;
  /** Order among the brand's buttons, lowest first */
  position: number;
  secretPreview: string | null;
  hasSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Returned by create and rotateSecret: the only times the signing secret is shown. */
export interface ChatActionWithSecret extends ChatAction {
  secret: string;
}

export interface CreateChatActionInput {
  label: string;
  url: string;
  enabled?: boolean;
  position?: number;
}

export type UpdateChatActionInput = Partial<CreateChatActionInput>;

/**
 * What Dispatch POSTs to a chat action's URL. Verify `X-Dispatch-Signature`
 * with `DispatchTickets.webhooks.verifySignature(rawBody, header, secret)`.
 * Reply with JSON `{ "message": "..." }` (max 200 chars) to show the visitor a
 * line in the widget; a non-2xx reply may still carry one. 5 second budget.
 */
export interface ChatActionPayload {
  /** Event id */
  id: string;
  event: 'chat.action';
  brand_id: string;
  timestamp: string;
  data: {
    actionId: string;
    label: string;
    brandId: string;
    sessionId: string;
    /** Null until the visitor sends a first message (that opens the ticket) */
    ticketId: string | null;
    ticketNumber: number | null;
    visitor: {
      /** 'verified' only for an identity your server vouched for (chat identity token) */
      identity: 'verified' | 'anonymous';
      externalUserId: string | null;
      email: string | null;
      name: string | null;
      pageUrl: string | null;
    };
  };
}
