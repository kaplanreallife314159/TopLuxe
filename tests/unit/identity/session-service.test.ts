import { describe, it, expect, beforeEach } from 'vitest';
import { SessionService } from '../../../apps/web/modules/identity/services/SessionService';
import type {
  SessionRepositoryPort,
  UserRepositoryPort,
  SessionRecord,
  UserWithRoles,
} from '../../../apps/web/modules/identity/repositories/ports';

/**
 * Test unitaire du mécanisme de session opaque — ajouté lors de l'audit TLX-001.1 (P1).
 *
 * Avant cet audit, SessionService n'avait AUCUN test, alors qu'il s'agit du code le plus
 * sensible sur le plan sécurité de cette fondation (génération de token, hachage, expiration,
 * révocation). Rendu possible sans base de données réelle grâce au refactor vers des interfaces
 * (SessionRepositoryPort / UserRepositoryPort), également introduit lors de cet audit.
 *
 * Ces fakes en mémoire ne testent PAS Prisma/PostgreSQL (hors périmètre, nécessiterait une base
 * réelle) : ils testent la logique métier de SessionService elle-même, ce qui est le contrat
 * que ce fichier a la responsabilité de garantir.
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
    for (const record of this.records.values()) {
      if (record.tokenHash === tokenHash) return record;
    }
    return null;
  }

  async revoke(sessionId: string) {
    const record = this.records.get(sessionId);
    if (record) record.revokedAt = new Date();
    return record;
  }
}

class FakeUserRepository implements UserRepositoryPort {
  constructor(private readonly users: Map<string, UserWithRoles>) {}

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  /** Utilitaire de test uniquement — permet d'ajouter un utilisateur après construction. */
  addUser(user: UserWithRoles): void {
    this.users.set(user.id, user);
  }
}

describe('SessionService (session serveur opaque)', () => {
  let sessionRepository: FakeSessionRepository;
  let userRepository: FakeUserRepository;
  let service: SessionService;
  const USER_ID = 'user-1';

  beforeEach(() => {
    sessionRepository = new FakeSessionRepository();
    const users = new Map<string, UserWithRoles>([
      [
        USER_ID,
        {
          id: USER_ID,
          piUid: 'pi-uid-abc',
          piUsername: 'default-test-user',
          status: 'active',
          userRoles: [{ role: { code: 'buyer' } }],
        },
      ],
    ]);
    userRepository = new FakeUserRepository(users);
    service = new SessionService(sessionRepository, userRepository, 'test-pepper');
  });

  it('never stores the raw token in the repository (only its hash)', async () => {
    const { rawToken } = await service.createSession(USER_ID);
    const storedRecord = [...sessionRepository.records.values()][0];

    expect(storedRecord.tokenHash).not.toBe(rawToken);
    expect(storedRecord.tokenHash).toHaveLength(64); // SHA-256 hex digest
  });

  it('generates a high-entropy raw token (32 bytes hex-encoded = 64 chars)', async () => {
    const { rawToken } = await service.createSession(USER_ID);
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('validates a freshly created session and returns the correct user/roles', async () => {
    const { rawToken } = await service.createSession(USER_ID);
    const authenticated = await service.validateSession(rawToken);

    expect(authenticated).not.toBeNull();
    expect(authenticated?.userId).toBe(USER_ID);
    expect(authenticated?.piUid).toBe('pi-uid-abc');
    expect(authenticated?.roles).toEqual(['buyer']);
  });

  it('rejects an unknown token', async () => {
    const authenticated = await service.validateSession('does-not-exist');
    expect(authenticated).toBeNull();
  });

  it('rejects a token whose session has been revoked', async () => {
    const { rawToken, sessionId } = await service.createSession(USER_ID);
    await service.revokeSession(sessionId);

    const authenticated = await service.validateSession(rawToken);
    expect(authenticated).toBeNull();
  });

  it('rejects a token whose session has expired', async () => {
    const { rawToken } = await service.createSession(USER_ID);
    const record = [...sessionRepository.records.values()][0];
    record.expiresAt = new Date(Date.now() - 1000); // déjà expirée

    const authenticated = await service.validateSession(rawToken);
    expect(authenticated).toBeNull();
  });

  it('produces a hash that depends on the pepper (same repository, different pepper rejects a valid raw token)', async () => {
    // IMPORTANT : partage le MÊME sessionRepository/userRepository que le service d'origine.
    // Un premier jet de ce test utilisait un repository vide et distinct pour le second service,
    // ce qui le faisait passer trivialement (aucune session n'existait) sans vérifier quoi que
    // ce soit sur le pepper lui-même — corrigé lors de la revue de cet audit.
    const otherService = new SessionService(sessionRepository, userRepository, 'different-pepper');

    const { rawToken } = await service.createSession(USER_ID);

    // Le token est valide pour le service d'origine (même pepper)...
    expect(await service.validateSession(rawToken)).not.toBeNull();

    // ...mais invalide pour un service utilisant un pepper différent sur le MÊME dépôt de
    // sessions, car le hash recalculé ne correspond à aucune entrée stockée.
    expect(await otherService.validateSession(rawToken)).toBeNull();
  });

  // --- Cas ajoutés lors de l'audit TLX-001.2 (point 3) ---

  it('rejects a valid session token if the underlying user no longer exists', async () => {
    // Simule une session dont l'utilisateur a été supprimé entre-temps (cas limite, mais la
    // validation ne doit jamais planter ni renvoyer un utilisateur partiel/incohérent).
    const { rawToken } = await service.createSession('user-does-not-exist-anymore');
    const authenticated = await service.validateSession(rawToken);
    expect(authenticated).toBeNull();
  });

  it('keeps a valid session for a suspended account (spec: read-only access preserved)', async () => {
    // Conforme aux spécifications techniques (module Identité, section 1.10) : un compte
    // suspendu conserve un accès en lecture seule à son historique — sa session reste donc
    // valide. La restriction des actions sensibles (vente, paiement) relève des règles métier
    // de chaque module concerné, pas de cette validation générique de session.
    const suspendedUserId = 'user-suspended';
    userRepository.addUser({
      id: suspendedUserId,
      piUid: 'pi-uid-suspended',
      piUsername: 'suspended-test-user',
      status: 'suspended',
      userRoles: [{ role: { code: 'buyer' } }],
    });

    const { rawToken } = await service.createSession(suspendedUserId);
    const authenticated = await service.validateSession(rawToken);

    expect(authenticated).not.toBeNull();
    expect(authenticated?.status).toBe('suspended');
  });

  it('rejects a session for a banned account', async () => {
    // Un compte banni est décrit comme définitif dans les spécifications (section 1.9) ;
    // contrairement à un compte suspendu, aucune clause ne prévoit un accès en lecture
    // résiduel. Avant la correction de cet audit, ce cas n'était vérifié nulle part et le
    // service ne consultait même pas le statut du compte.
    const bannedUserId = 'user-banned';
    userRepository.addUser({
      id: bannedUserId,
      piUid: 'pi-uid-banned',
      piUsername: 'banned-test-user',
      status: 'banned',
      userRoles: [{ role: { code: 'buyer' } }],
    });

    const { rawToken } = await service.createSession(bannedUserId);
    const authenticated = await service.validateSession(rawToken);

    expect(authenticated).toBeNull();
  });
});
