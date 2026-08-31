import { NextResponse, type NextRequest } from 'next/server';
import { getEnv } from '@/shared/config/env';
import { ValidationError } from '@/shared/errors/AppError';
import { withErrorHandling } from '@/shared/middleware/errorHandler';
import { getAuthenticationService } from '@/modules/identity/services/factory';
import { piLoginRequestSchema } from '@/modules/identity/validations/piAuth';

/**
 * POST /api/v1/auth/pi-login — TLX-006.
 *
 * Route Handler volontairement fin : validation du corps de la requête, délégation complète à
 * AuthenticationService (module Identité), puis pose du cookie de session. Aucune logique
 * métier (vérification Pi, création utilisateur, gestion de session) n'est présente ici.
 *
 * Sécurité : le corps de la requête n'accepte QUE `accessToken` (schéma `.strict()`) — toute
 * tentative d'envoyer une identité Pi directement (piUid/username) est rejetée en amont, avant
 * même d'atteindre le service. La seule source d'identité utilisée est la validation serveur de
 * l'accessToken auprès de la Pi Platform (GET /v2/me), effectuée par AuthenticationService.
 */
async function handler(req: Request): Promise<Response> {
  const rawBody: unknown = await req.json().catch(() => {
    throw new ValidationError('Corps de requête JSON invalide.');
  });

  const parsedBody = piLoginRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    throw new ValidationError('Requête invalide.', parsedBody.error.flatten());
  }

  const authenticationService = getAuthenticationService();
  const { profile, session } = await authenticationService.authenticateWithPi(
    parsedBody.data.accessToken,
  );

  const env = getEnv();
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json(
    {
      user: {
        piUsername: profile.piUsername,
        status: profile.status,
        roles: profile.roles,
      },
    },
    { status: 200 },
  );

  // Cookie de session opaque — conforme au mécanisme verrouillé au Sprint 0 (section E) et déjà
  // implémenté par SessionService (TLX-001/001.2). Ce Route Handler ne fait que poser le cookie
  // avec le token en clair reçu de SessionService.createSession ; il ne le stocke jamais lui-même.
  response.cookies.set(env.SESSION_COOKIE_NAME, session.rawToken, {
    httpOnly: true,
    secure: isProduction,
    // SameSite: 'lax' est un point de conception documenté comme NON CONFIRMÉ pour le contexte
    // du Pi Browser (WebView) — voir Sprint 0 (section M) et l'ADR 0002. 'lax' est retenu comme
    // valeur de départ raisonnable, à valider par un test réel dans le Pi Browser avant le
    // lancement mainnet, pas comme une certitude technique.
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt,
  });

  return response;
}

export const POST = withErrorHandling(handler);
