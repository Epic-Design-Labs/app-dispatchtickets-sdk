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
