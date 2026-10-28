import { BaseResource } from './base.js';
import type {
  ChatVisitor,
  CreateChatIdentityTokenInput,
  ChatIdentityToken,
  ConvertChatInput,
  ConvertChatResult,
} from '../types/chat.js';

/**
 * Chat resource
 *
 * A chat conversation is a ticket and its messages are comments: list chats
 * with `client.tickets.list(brandId, { source: 'chat' })` and reply with
 * `client.comments.create()`. This resource covers what is chat-only.
 */
export class ChatResource extends BaseResource {
  /**
   * Get the visitor behind a chat ticket: whether they're on the page now,
   * and who they are (verified) or say they are (claimed).
   *
   * Throws `NotFoundError` if the ticket isn't a chat.
   */
  async getVisitor(brandId: string, ticketId: string): Promise<ChatVisitor> {
    return this._get<ChatVisitor>(`/brands/${brandId}/tickets/${ticketId}/chat`);
  }

  /**
   * Vouch for a signed-in user so their chats are verified: the chat is filed
   * under their contact and replies can be emailed to them.
   *
   * Call this from your server, never the browser, and pass the token to the
   * widget. It expires after an hour.
   *
   * @example
   * ```typescript
   * const { token } = await client.chat.createIdentityToken('ws_abc123', {
   *   userId: user.id,
   *   email: user.email,
   *   name: user.name,
   * });
   * ```
   */
  async createIdentityToken(
    brandId: string,
    data: CreateChatIdentityTokenInput
  ): Promise<ChatIdentityToken> {
    return this._post<ChatIdentityToken>(`/brands/${brandId}/chat/identity-token`, data);
  }

  /**
   * Turn a chat into an email ticket. It stays the same ticket (same id,
   * `source` still `'chat'`); your subject and description replace the
   * chat-derived ones and the conversation continues by email.
   *
   * A verified visitor, or an `email` you pass, gets the ticket and the
   * conversation now. An address the visitor only typed gets a confirmation
   * email first, and the ticket once they confirm.
   *
   * Throws `ConflictError` if it's already a ticket.
   *
   * @example
   * ```typescript
   * const { delivery } = await client.chat.convert('ws_abc123', 'tkt_xyz', {
   *   title: 'Replacement for a cracked mug',
   *   description: 'Your order #1234 arrived damaged. We are sending a replacement.',
   * });
   * ```
   */
  async convert(brandId: string, ticketId: string, data: ConvertChatInput): Promise<ConvertChatResult> {
    return this._post<ConvertChatResult>(`/brands/${brandId}/tickets/${ticketId}/chat/convert`, data);
  }

  /**
   * Send the confirmation email again to the address a visitor typed. At most
   * 3 sends, 10 minutes apart; check `getVisitor().emailConfirmation.canResend`.
   */
  async resendEmailConfirmation(brandId: string, ticketId: string): Promise<{ email: string }> {
    return this._post<{ email: string }>(
      `/brands/${brandId}/tickets/${ticketId}/chat/email-confirmation/resend`
    );
  }
}
