import { BaseResource } from './base.js';
import type {
  ChatVisitor,
  CreateChatIdentityTokenInput,
  ChatIdentityToken,
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
}
