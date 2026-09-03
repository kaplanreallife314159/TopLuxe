import type { Prisma, PrismaClient } from '@prisma/client';
import type { VerifiedPiIdentity } from '@/modules/identity/types/session';

Prisma.UserGetPayload<{ include: { userRoles: { include: { role: true } } } }>;
  include: { userRoles: { include: { role: true } } };
}>;

/**
 * Accès aux données utilisateur — TopLuxe.
 *
 * Fondation minimale posée en TLX-001 : recherche par pi_uid et par id.
 *
 * `findOrCreateByPiIdentity` ajouté en TLX-006 (authentification Pi) : implémente exactement
 * la règle déjà actée dans les spécifications (module Identité, section 1.5/1.10) — "Un compte
 * TopLuxe = un identifiant Pi unique... création automatique du profil à la première connexion."
 * L'identité passée en paramètre DOIT provenir d'une vérification déjà effectuée par
 * PiTokenVerificationService (GET /v2/me) ; ce repository ne fait aucune vérification lui-même,
 * il fait confiance à l'appelant sur ce point (frontière de responsabilité claire).
 */
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByPiUid(piUid: string) {
    return this.prisma.user.findUnique({
      where: { piUid },
      include: { userRoles: { include: { role: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
  }

  async findOrCreateByPiIdentity(
    identity: VerifiedPiIdentity,
  ): Promise<{ user: UserWithRolesRecord; isNew: boolean }> {
    const existing = await this.findByPiUid(identity.piUid);

    if (existing) {
      // Met à jour le username (peut changer côté Pi Network) et la date de dernière connexion.
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { piUsername: identity.piUsername, lastLoginAt: new Date() },
        include: { userRoles: { include: { role: true } } },
      });
      return { user, isNew: false };
    }

    // Nouvel utilisateur : statut par défaut 'active' (valeur DEFAULT du schéma Prisma),
    // aucun rôle attribué à la création — l'attribution du rôle `buyer` par défaut nécessite
    // que la table `roles` soit peuplée (seed), ce qui n'est pas du ressort de ce ticket
    // (authentification uniquement). Voir le rapport final pour ce point signalé explicitement.
    const user = await this.prisma.user.create({
      data: {
        piUid: identity.piUid,
        piUsername: identity.piUsername,
        lastLoginAt: new Date(),
      },
      include: { userRoles: { include: { role: true } } },
    });
    return { user, isNew: true };
  }
}
