import type { RoleCode, UserStatus } from '@/modules/identity/types/user';

/**
 * Interfaces (ports) pour les dépendances du module Identité.
 *
 * Introduites lors de l'audit TLX-001.1 (P1) : SessionService dépendait directement des
 * classes concrètes SessionRepository/UserRepository, ce qui rendait impossible tout test
 * unitaire réel sans base de données. Ces interfaces ne décrivent que ce dont SessionService a
 * réellement besoin (principe de ségrégation des interfaces) ; SessionRepository et
 * UserRepository les satisfont déjà structurellement (TypeScript structural typing), sans
 * modification de leur code.
 *
 * `UserWithRoles.status` ajouté lors de l'audit TLX-001.2 : nécessaire pour que SessionService
 * puisse appliquer la règle métier déjà actée dans les spécifications (module Identité,
 * section 1.10) sur les comptes suspendus/bannis — voir SessionService.ts pour le détail.
 */
export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface UserWithRoles {
  id: string;
  piUid: string;
  /**
   * Ajouté en TLX-006 après détection d'un bug réel par exécution des tests : AuthenticationService
   * accède à `user.piUsername` pour construire le profil retourné au client, mais ce champ était
   * absent de cette interface. Le repository Prisma réel renvoie bien ce champ (colonne
   * `pi_username`, non nullable), donc le bug ne se serait jamais manifesté en production avec
   * le vrai repository — mais l'absence du champ dans l'interface masquait ce besoin réel et a
   * concrètement fait échouer un test utilisant un faux repository construit contre ce type.
   * C'est exactement le genre d'erreur qu'une vérification de type complète (avec résolution de
   * module réelle) aurait détectée immédiatement ; elle a été trouvée ici par exécution réelle
   * des tests plutôt que par typecheck, faute d'environnement npm complet (voir rapport final).
   */
  piUsername: string;
  status: UserStatus;
  userRoles: Array<{ role: { code: RoleCode } }>;
}

export interface SessionRepositoryPort {
  create(params: { userId: string; tokenHash: string; expiresAt: Date }): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  revoke(sessionId: string): Promise<unknown>;
}

export interface UserRepositoryPort {
  findById(id: string): Promise<UserWithRoles | null>;
}

/**
 * Port dédié à l'authentification Pi (TLX-006) : find-or-create d'un utilisateur à partir d'une
 * identité Pi déjà validée par PiTokenVerificationService. Séparé de UserRepositoryPort
 * (utilisé par SessionService) par souci de ségrégation des interfaces — AuthenticationService
 * n'a besoin que de cette capacité, pas de `findById`.
 *
 * Retourne explicitement `isNew` plutôt que de le faire déduire par l'appelant à partir d'une
 * comparaison de timestamps (createdAt/updatedAt), qui serait fragile — seul le repository sait
 * avec certitude s'il vient de créer ou de mettre à jour l'enregistrement.
 */
export interface UserIdentityRepositoryPort {
  findOrCreateByPiIdentity(identity: {
    piUid: string;
    piUsername: string;
  }): Promise<{ user: UserWithRoles; isNew: boolean }>;
}
