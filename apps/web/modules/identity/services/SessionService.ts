import { randomBytes, createHash } from 'node:crypto';
import type {
  SessionRepositoryPort,
  UserRepositoryPort,
} from '@/modules/identity/repositories/ports';
import type { AuthenticatedUser, CreateSessionResult } from '@/modules/identity/types/session';
import type { RoleCode } from '@/modules/identity/types/user';

/**
 * Service de session serveur opaque — TopLuxe.
 *
 * Implémente exactement le mécanisme verrouillé au Sprint 0 (section E) :
 *   1. Génération d'un identifiant aléatoire cryptographiquement sûr (crypto.randomBytes).
 *   2. Stockage UNIQUEMENT du hash de ce token (SHA-256 + pepper applicatif), jamais en clair.
 *   3. Le token en clair est destiné à être transmis via un cookie HttpOnly par l'appelant
 *      (Route Handler) — ce service ne manipule pas directement les cookies HTTP.
 *   4. Révocation côté serveur via `revokedAt`.
 *
 * IMPORTANT : ce service ne contient AUCUNE logique d'authentification Pi Network. Il ne fait
 * que gérer le cycle de vie d'une session TopLuxe une fois qu'un utilisateur est déjà identifié
 * (par un mécanisme externe à ce ticket). L'appel à `createSession` depuis le flux
 * d'authentification Pi complet sera câblé au ticket dédié (TLX-006), pas ici.
 */
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours — valeur par défaut, À VALIDER avec le fondateur (cf. Sprint 0, section E, point 3)

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly pepper: string,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(`${rawToken}${this.pepper}`).digest('hex');
  }

  async createSession(userId: string): Promise<CreateSessionResult> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const session = await this.sessionRepository.create({ userId, tokenHash, expiresAt });

    return { rawToken, sessionId: session.id, expiresAt };
  }

  async validateSession(rawToken: string): Promise<AuthenticatedUser | null> {
    const tokenHash = this.hashToken(rawToken);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;

    const user = await this.userRepository.findById(session.userId);
    if (!user) return null;

    // Règle métier déjà actée dans les spécifications techniques (module Identité &
    // Authentification, section 1.10) : "Un compte suspendu ne peut plus initier de paiement ni
    // soumettre de produit, mais conserve un accès en lecture seule à son historique." Un compte
    // suspendu doit donc pouvoir obtenir une session valide (sinon il ne pourrait même plus
    // consulter son historique) ; c'est aux règles métier de chaque module (ex. Catalogue,
    // Paiements) de refuser les actions sensibles pour un statut `suspended`, pas à cette
    // validation générique de session.
    //
    // En revanche, aucune clause équivalente n'existe pour le statut `banned`, qui est décrit
    // comme définitif (section 1.9). Un compte banni doit donc perdre tout accès, y compris en
    // lecture — sans quoi le bannissement n'aurait aucun effet réel. C'est la correction
    // apportée lors de l'audit TLX-001.2 : avant cette correction, ce service ne vérifiait le
    // statut du compte d'aucune façon, ce qui aurait permis à un compte banni de continuer à
    // s'authentifier normalement.
    if (user.status === 'banned') return null;

    const roles = user.userRoles.map((ur) => ur.role.code) as RoleCode[];

    return {
      userId: user.id,
      piUid: user.piUid,
      status: user.status,
      roles,
      sessionId: session.id,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.revoke(sessionId);
  }
}
