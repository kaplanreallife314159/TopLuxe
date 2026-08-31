import { prisma } from '@/shared/config/prisma';
import { getEnv } from '@/shared/config/env';
import { SessionRepository } from '@/modules/identity/repositories/SessionRepository';
import { UserRepository } from '@/modules/identity/repositories/UserRepository';
import { SessionService } from '@/modules/identity/services/SessionService';
import { PiTokenVerificationService } from '@/modules/identity/services/PiTokenVerificationService';
import { AuthenticationService } from '@/modules/identity/services/AuthenticationService';

/**
 * Fabrique de services du module Identité — TLX-006.
 *
 * Objectif unique : garder les Route Handlers fins (aucune instanciation de dépendances ni
 * logique métier directement dans `app/api/v1/auth/**`, conformément à la consigne explicite de
 * ce ticket). Ce n'est PAS un conteneur d'injection de dépendances générique — juste un point de
 * composition minimal pour ce module, cohérent avec le style « monolithe modulaire » déjà
 * verrouillé (Sprint 0, section A).
 *
 * Les instances sont mémoïsées (singleton par process) pour éviter de recréer des services sans
 * état partagé à chaque requête, sans pour autant introduire un framework DI.
 */
let sessionServiceSingleton: SessionService | null = null;
let authenticationServiceSingleton: AuthenticationService | null = null;

export function getSessionService(): SessionService {
  if (!sessionServiceSingleton) {
    const sessionRepository = new SessionRepository(prisma);
    const userRepository = new UserRepository(prisma);
    sessionServiceSingleton = new SessionService(
      sessionRepository,
      userRepository,
      getEnv().SESSION_TOKEN_PEPPER,
    );
  }
  return sessionServiceSingleton;
}

export function getAuthenticationService(): AuthenticationService {
  if (!authenticationServiceSingleton) {
    const userRepository = new UserRepository(prisma);
    authenticationServiceSingleton = new AuthenticationService(
      new PiTokenVerificationService(),
      userRepository,
      getSessionService(),
    );
  }
  return authenticationServiceSingleton;
}
