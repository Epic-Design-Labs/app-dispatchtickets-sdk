/**
 * Presence types
 *
 * Presence is per brand and per member: who is around to take a chat.
 */

export type PresenceStatus = 'available' | 'busy' | 'away' | 'offline';

/**
 * One member's presence on one brand
 */
export interface PresenceEntry {
  memberId: string;
  name: string | null;
  email: string | null;
  brandId: string;
  /** What routing should use: `intendedStatus`, or `'offline'` once it lapsed */
  status: PresenceStatus;
  /** The status last set, kept after it lapses */
  intendedStatus: PresenceStatus;
  /** False once the status lapsed without a refresh */
  online: boolean;
  /** Conversations this member can hold at once */
  maxConcurrent: number;
  /** Conversations this member is holding now */
  activeCount: number;
  /** Available, with room for another conversation */
  hasCapacity: boolean;
  expiresAt: string;
  updatedAt: string;
}

/**
 * Input for setting a member's presence on a brand
 */
export interface SetPresenceInput {
  /** Whose presence. Required with an API key. */
  memberId: string;
  status: PresenceStatus;
  /** Conversations this member can hold at once (0-100) */
  maxConcurrent?: number;
  /** Conversations this member is holding now */
  activeCount?: number;
  /**
   * Seconds the status holds without being set again (30-86400). A status
   * that lapses reads as `'offline'`. @default 300
   */
  ttlSeconds?: number;
}

/**
 * One member's presence across the brands an API key can see
 */
export interface MemberPresence {
  memberId: string;
  name: string | null;
  email: string | null;
  /** Their best status on any brand */
  status: PresenceStatus;
  /** The status set on every brand, or `'mixed'` if the brands differ */
  intendedStatus: PresenceStatus | 'mixed';
  online: boolean;
  brands: Array<
    Pick<PresenceEntry, 'brandId' | 'status' | 'intendedStatus' | 'maxConcurrent' | 'activeCount' | 'hasCapacity'>
  >;
}
