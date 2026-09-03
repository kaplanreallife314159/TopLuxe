import { NextRequest } from 'next/server';
import { UnauthorizedError } from '@/shared/errors/AppError';
import { SessionService } from '@/modules/identity/services/SessionService';
import type { AuthenticatedUser } from '@/modules/identity/types/session';

/**
 * Middleware de vérification de session — TopLuxe.
 *
 * IMPORTANT (cf. Sprint 0 et consigne explicite du ticket TLX-001) : ce middleware vérifie
 * UNIQUEMENT la validité d'une session TopLuxe déjà émise (cookie opaque + hash en base). Il ne
 * contient AUCUNE logique d'authentification Pi Network (pas d'appel à /v2/me, pas de gestion
 * de l'accessToken Pi) — ce mécanisme est développé dans un ticket séparé, comme demandé.
 * Il ne contient pas non plus de règle métier de permission fine (RBAC détaillé) : voir
 * withRole.ts pour l'étape suivante, elle aussi volontairement minimale à ce stade.
 */
export async function requireSession(
  req: NextRequest,
  sessionService: SessionService,
): Promise<AuthenticatedUser> {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? 'topluxe_session';
  const rawToken = req.cookies.get(cookieName)?.value;

  if (!rawToken) {
    throw new UnauthorizedError('Aucune session active.');
  }

  const session = await sessionService.validateSession(rawToken);
  if (!session) {
    throw new UnauthorizedError('Session invalide ou expirée.');
  }

  return session;
}
