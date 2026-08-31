import { ForbiddenError } from '@/shared/errors/AppError';
import type { AuthenticatedUser } from '@/modules/identity/types/session';
import type { RoleCode } from '@/modules/identity/types/user';

/**
 * Vérification de rôle minimale — TopLuxe.
 *
 * Conforme au ticket TLX-001, point 14 : "préparer le middleware d'authentification et
 * d'autorisation, mais sans implémenter encore les règles métier complexes". Cette fonction ne
 * fait qu'une vérification d'appartenance simple à un rôle ; la matrice de permissions détaillée
 * par module (cf. spécifications techniques, section 10) sera implémentée module par module, au
 * fur et à mesure du backlog.
 */
export function requireRole(user: AuthenticatedUser, allowedRoles: RoleCode[]): void {
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    throw new ForbiddenError('Rôle insuffisant pour cette action.');
  }
}
