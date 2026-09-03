import { ForbiddenError } from '@/shared/errors/AppError';
import { eventBus } from '@/shared/events/EventBus';
import { PiTokenVerificationService } from '@/modules/identity/services/PiTokenVerificationService';
import { SessionService } from '@/modules/identity/services/SessionService';
import type { UserIdentityRepositoryPort } from '@/modules/identity/repositories/ports';
import type { CreateSessionResult } from '@/modules/identity/types/session';
import type { RoleCode, UserStatus } from '@/modules/identity/types/user';

export interface AuthenticatedProfile {
  userId: string;
  piUid: string;
  piUsername: string;
  status: UserStatus;
  roles: RoleCode[];
}

/**
 * Service d'orchestration de l'authentification Pi Network — TopLuxe (TLX-006).
 *
 * Ce service NE réimplémente RIEN du mécanisme de session (délègue intégralement à
 * SessionService, déjà construit et audité en TLX-001/TLX-001.2 — aucune seconde implémentation
 * de session, conformément à la consigne explicite de ce ticket) ni du mécanisme de vérification
 * Pi (délègue à PiTokenVerificationService). Son unique rôle est d'orchestrer l'enchaînement :
 *
 *   1. Vérifier l'accessToken auprès de la Pi Platform (source d'identité UNIQUE et fiable —
 *      aucune donnée d'identité envoyée librement par le navigateur n'est jamais utilisée ici).
 *   2. Retrouver ou créer l'utilisateur TopLuxe correspondant.
 *   3. Refuser explicitement la connexion si le compte est banni (cohérent avec la règle déjà
 *      appliquée dans SessionService.validateSession — voir TLX-001.2).
 *   4. Créer une session TopLuxe opaque pour cet utilisateur.
 */
export class AuthenticationService {
  constructor(
    private readonly piTokenVerificationService: PiTokenVerificationService,
    private readonly userRepository: UserIdentityRepositoryPort,
    private readonly sessionService: SessionService,
  ) {}

  async authenticateWithPi(
    accessToken: string,
  ): Promise<{ profile: AuthenticatedProfile; session: CreateSessionResult }> {
    // Étape 1 — la SEULE source d'identité acceptée est la réponse validée de /v2/me.
    const verifiedIdentity = await this.piTokenVerificationService.verifyAccessToken(accessToken);

    // Étape 2 — find-or-create, à partir de l'identité validée uniquement.
    const { user, isNew } = await this.userRepository.findOrCreateByPiIdentity(verifiedIdentity);

    // Étape 3 — même règle que SessionService.validateSession (TLX-001.2) : un compte banni ne
    // doit jamais obtenir de nouvelle session, pas seulement voir ses sessions existantes
    // invalidées.
    if (user.status === 'banned') {
      throw new ForbiddenError('Ce compte est banni de TopLuxe.');
    }

    // Étape 4 — réutilisation stricte du mécanisme de session déjà construit (opaque, hash +
    // pepper, aucune donnée sensible en clair en base). Aucune nouvelle logique de session ici.
    const session = await this.sessionService.createSession(user.id);

    if (isNew) {
      // Événement déjà prévu dans les spécifications (module Identité, table des événements) :
      // `user.registered`. Aucun consommateur n'y est encore abonné (Notifications/Audit ne sont
      // pas câblés dans ce ticket, hors périmètre "authentification uniquement") — la
      // publication elle-même ne coûte rien et prépare le câblage futur sans l'anticiper.
      await eventBus.publish('user.registered', { userId: user.id, piUid: user.piUid });
    }

    const roles = user.userRoles.map((ur) => ur.role.code) as RoleCode[];

    return {
      profile: {
        userId: user.id,
        piUid: user.piUid,
        piUsername: user.piUsername,
        status: user.status,
        roles,
      },
      session,
    };
  }
}
