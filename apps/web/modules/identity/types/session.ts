import type { RoleCode, UserStatus } from './user';

export interface AuthenticatedUser {
  userId: string;
  piUid: string;
  status: UserStatus;
  roles: RoleCode[];
  sessionId: string;
}

export interface CreateSessionResult {
  /** Token en clair, à transmettre au client via cookie — jamais stocké tel quel. */
  rawToken: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Identité Pi Network validée — TLX-006.
 *
 * Ce type ne doit JAMAIS être construit à partir de données envoyées librement par le
 * navigateur. Il ne doit être produit que par PiTokenVerificationService, à l'issue d'un appel
 * réussi à GET https://api.minepi.com/v2/me avec l'accessToken de l'utilisateur.
 */
export interface VerifiedPiIdentity {
  piUid: string;
  piUsername: string;
}
