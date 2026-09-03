import { describe, it, expect, vi } from 'vitest';
import { AuthenticationService } from '../../../apps/web/modules/identity/services/AuthenticationService';
import { PiTokenVerificationService } from '../../../apps/web/modules/identity/services/PiTokenVerificationService';
import { SessionService } from '../../../apps/web/modules/identity/services/SessionService';
import { ForbiddenError } from '../../../apps/web/shared/errors/AppError';
import type {
  SessionRepositoryPort,
  UserIdentityRepositoryPort,
  UserRepositoryPort,
  SessionRecord,
  UserWithRoles,
} from '../../../apps/web/modules/identity/repositories/ports';

/**
 * Tests unitaires d'AuthenticationService — TLX-006.
 *
 * Couvrent en particulier l'exigence de sécurité centrale du ticket : l'identité utilisée pour
 * créer/retrouver l'utilisateur est TOUJOURS celle renvoyée par PiTokenVerificationService
 * (mockée ici), jamais une donnée arbitraire. Aucun appel réseau réel (PiTokenVerificationService
 * est entièrement mocké, pas seulement son fetch interne).
 */

class FakeSessionRepository implements SessionRepositoryPort {
  public records = new Map<string, SessionRecord>();
  private nextId = 1;
  async create(params: { userId: string; tokenHash: string; expiresAt: Date }) {
    const id = `session-${this.nextId++}`;
    this.records.set(id, { id, revokedAt: null, ...params });
    return { id };
  }
  async findByTokenHash(tokenHash: string) {
    for (const r of this.records.values()) if (r.tokenHash === tokenHash) return r;
    return null;
  }
  async revoke(sessionId: string) {
    const r = this.records.get(sessionId);
    if (r) r.revokedAt = new Date();
    return r;
  }
}

class FakeUserRepository implements UserRepositoryPort, UserIdentityRepositoryPort {
  public usersByPiUid = new Map<string, UserWithRoles>();
  private nextId = 1;

  async findById(id: string) {
    for (const u of this.usersByPiUid.values()) if (u.id === id) return u;
    return null;
  }

  async findOrCreateByPiIdentity(identity: { piUid: string; piUsername: string }) {
    const existing = this.usersByPiUid.get(identity.piUid);
    if (existing) {
      const updated = { ...existing, piUsername: identity.piUsername };
      this.usersByPiUid.set(identity.piUid, updated);
      return { user: updated, isNew: false };
    }
    const created: UserWithRoles = {
      id: `user-${this.nextId++}`,
      piUid: identity.piUid,
      piUsername: identity.piUsername,
      status: 'active',
      userRoles: [],
    };
    this.usersByPiUid.set(identity.piUid, created);
    return { user: created, isNew: true };
  }
}

function buildService(userRepository: FakeUserRepository, verifiedIdentity: { piUid: string; piUsername: string } | Error) {
  const piVerification = {
    verifyAccessToken: vi.fn(async (_token: string) => {
      if (verifiedIdentity instanceof Error) throw verifiedIdentity;
      return verifiedIdentity;
    }),
  } as unknown as PiTokenVerificationService;

  const sessionService = new SessionService(new FakeSessionRepository(), userRepository, 'test-pepper');

  return new AuthenticationService(piVerification, userRepository, sessionService);
}

describe('AuthenticationService.authenticateWithPi', () => {
  it('creates a new TopLuxe user and session from a validated Pi identity', async () => {
    const userRepository = new FakeUserRepository();
    const service = buildService(userRepository, { piUid: 'pi-uid-1', piUsername: 'bob' });

    const result = await service.authenticateWithPi('any-token');

    expect(result.profile.piUid).toBe('pi-uid-1');
    expect(result.profile.piUsername).toBe('bob');
    expect(result.profile.status).toBe('active');
    expect(result.session.rawToken).toBeDefined();
    expect(userRepository.usersByPiUid.size).toBe(1);
  });

  it('reuses the existing user on a second authentication with the same Pi identity', async () => {
    const userRepository = new FakeUserRepository();
    const service = buildService(userRepository, { piUid: 'pi-uid-2', piUsername: 'carol' });

    const first = await service.authenticateWithPi('token-1');
    const second = await service.authenticateWithPi('token-2');

    expect(first.profile.userId).toBe(second.profile.userId);
    expect(userRepository.usersByPiUid.size).toBe(1);
  });

  it('rejects authentication for a banned account without creating a session', async () => {
    const userRepository = new FakeUserRepository();
    userRepository.usersByPiUid.set('pi-uid-banned', {
      id: 'user-banned',
      piUid: 'pi-uid-banned',
      piUsername: 'banned-fake-user',
      status: 'banned',
      userRoles: [],
    });
    const service = buildService(userRepository, { piUid: 'pi-uid-banned', piUsername: 'evil' });

    await expect(service.authenticateWithPi('any-token')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows authentication and creates a session for a suspended account (consistent with SessionService)', async () => {
    // Cohérence explicitement vérifiée en TLX-006.1 : SessionService.validateSession autorise déjà
    // les comptes suspendus (accès en lecture seule, spécifications section 1.10). Il serait
    // incohérent qu'AuthenticationService bloque la CRÉATION de cette même session alors que
    // SessionService en autoriserait la VALIDATION une fois créée.
    const userRepository = new FakeUserRepository();
    userRepository.usersByPiUid.set('pi-uid-suspended', {
      id: 'user-suspended',
      piUid: 'pi-uid-suspended',
      piUsername: 'suspended-user',
      status: 'suspended',
      userRoles: [],
    });
    const service = buildService(userRepository, { piUid: 'pi-uid-suspended', piUsername: 'suspended-user' });

    const result = await service.authenticateWithPi('any-token');

    expect(result.profile.status).toBe('suspended');
    expect(result.session.rawToken).toBeDefined();
  });

  it('propagates the verification failure without creating or updating any user', async () => {
    const userRepository = new FakeUserRepository();
    const service = buildService(userRepository, new Error('token invalide'));

    await expect(service.authenticateWithPi('any-token')).rejects.toThrow();
    expect(userRepository.usersByPiUid.size).toBe(0);
  });

  it('propagates a session creation failure rather than silently returning success', async () => {
    const userRepository = new FakeUserRepository();
    const piVerification = {
      verifyAccessToken: vi.fn(async () => ({ piUid: 'pi-uid-x', piUsername: 'x' })),
    } as unknown as PiTokenVerificationService;
    const brokenSessionService = {
      createSession: vi.fn(async () => {
        throw new Error('database unavailable');
      }),
    } as unknown as SessionService;

    const service = new AuthenticationService(piVerification, userRepository, brokenSessionService);

    await expect(service.authenticateWithPi('any-token')).rejects.toThrow('database unavailable');
    // L'utilisateur a bien été créé (find-or-create précède la session), mais AUCUNE session
    // n'est retournée en cas d'échec — pas de faux succès partiel.
    expect(userRepository.usersByPiUid.size).toBe(1);
  });

  it('never uses any identity other than the one returned by PiTokenVerificationService', async () => {
    // Simule un scénario où un attaquant enverrait un accessToken quelconque : quel que soit le
    // token fourni à authenticateWithPi, la SEULE identité utilisée est celle que
    // PiTokenVerificationService (mocké ici) a validée — jamais une valeur dérivée du token lui-même.
    const userRepository = new FakeUserRepository();
    const service = buildService(userRepository, { piUid: 'pi-uid-real', piUsername: 'real-user' });

    const result = await service.authenticateWithPi('this-token-string-is-never-parsed-for-identity');

    expect(result.profile.piUid).toBe('pi-uid-real');
    expect(result.profile.piUid).not.toContain('this-token-string');
  });
});
