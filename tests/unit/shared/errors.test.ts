import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
  isAppError,
} from '../../../apps/web/shared/errors/AppError';

describe('AppError hierarchy', () => {
  it('maps ValidationError to status 400', () => {
    const err = new ValidationError('champ invalide');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(isAppError(err)).toBe(true);
  });

  it('maps UnauthorizedError to status 401', () => {
    expect(new UnauthorizedError('non authentifié').statusCode).toBe(401);
  });

  it('maps ForbiddenError to status 403', () => {
    expect(new ForbiddenError('interdit').statusCode).toBe(403);
  });

  it('maps NotFoundError to status 404', () => {
    expect(new NotFoundError('introuvable').statusCode).toBe(404);
  });

  it('maps ConflictError to status 409', () => {
    expect(new ConflictError('conflit').statusCode).toBe(409);
  });

  it('maps InternalError to status 500', () => {
    expect(new InternalError('erreur interne').statusCode).toBe(500);
  });

  it('isAppError returns false for a plain Error', () => {
    expect(isAppError(new Error('erreur générique'))).toBe(false);
  });

  it('preserves the error message and details', () => {
    const err = new ValidationError('message précis', { field: 'email' });
    expect(err.message).toBe('message précis');
    expect(err.details).toEqual({ field: 'email' });
  });
});
