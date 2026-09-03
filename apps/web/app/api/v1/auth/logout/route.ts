import { NextResponse } from 'next/server';
import { getEnv } from '@/shared/config/env';
import { withErrorHandling } from '@/shared/middleware/errorHandler';
import { getSessionService } from '@/modules/identity/services/factory';

/**
 * POST /api/v1/auth/logout — TLX-006.
 *
 * Complète le cycle de vie de la session déjà spécifié (endpoint déjà prévu dans les
 * spécifications techniques, section 1.6) — nécessaire pour que le mécanisme de session opaque
 * soit réellement utilisable de bout en bout, sans introduire de nouvelle architecture.
 * Idempotent : que le cookie soit présent/valide ou non, la réponse est toujours 204 et le
 * cookie est toujours effacé côté client.
 */
async function handler(req: Request): Promise<Response> {
  const env = getEnv();
  const rawToken = req.headers
  .get('cookie')
  ?.split(';')
  .map((cookie) => cookie.trim())
  .find((cookie) => cookie.startsWith(`${env.SESSION_COOKIE_NAME}=`))
  ?.split('=')
  .slice(1)
  .join('=');
  if (rawToken) {
    const sessionService = getSessionService();
    const authenticated = await sessionService.validateSession(rawToken);
    if (authenticated) {
      await sessionService.revokeSession(authenticated.sessionId);
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(env.SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}

export const POST = withErrorHandling(handler);
