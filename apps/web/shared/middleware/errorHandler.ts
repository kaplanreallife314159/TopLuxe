import { NextResponse } from 'next/server';
import { isAppError } from '@/shared/errors/AppError';
import { logger } from '@/shared/logger/logger';

/**
 * Gestion d'erreurs centralisée pour les Route Handlers — TopLuxe.
 *
 * Enveloppe un handler de route et mappe systématiquement les erreurs applicatives connues
 * (AppError et sous-classes) vers le bon code HTTP + un corps de réponse normalisé. Toute
 * erreur non reconnue est traitée comme une erreur interne (500) et loggée avec sévérité
 * élevée, sans jamais exposer de détail d'implémentation au client.
 *
 * Conforme au ticket TLX-001, point 11. Ne contient aucune règle métier.
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (isAppError(error)) {
        logger.warn({ code: error.code, details: error.details }, error.message);
        return NextResponse.json(
          { error: { code: error.code, message: error.message } },
          { status: error.statusCode },
        );
      }

      logger.error({ err: error }, 'Erreur interne non gérée');
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' } },
        { status: 500 },
      );
    }
  };
}
