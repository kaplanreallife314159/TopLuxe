/**
 * Hiérarchie d'erreurs applicatives normalisées — TopLuxe.
 *
 * Objectif : permettre au middleware de gestion d'erreurs (shared/middleware/errorHandler.ts)
 * de mapper systématiquement une erreur applicative vers le bon code HTTP, sans dépendre du
 * message d'erreur brut. Conforme au ticket TLX-001, point 11 ("préparer le système de gestion
 * des erreurs").
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
}

export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_ERROR';
}

/**
 * Type guard utilitaire, utilisé par le error handler pour distinguer une erreur applicative
 * connue d'une erreur inattendue (auquel cas elle est traitée comme InternalError et loggée
 * avec sévérité plus élevée).
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
