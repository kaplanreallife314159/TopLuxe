import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Test d'intégration de POST /api/v1/auth/pi-login — TLX-006.
 *
 * La factory de services (modules/identity/services/factory.ts) est mockée pour isoler le Route
 * Handler de la base de données réelle (hors périmètre d'un test d'intégration "léger" tel que
 * défini pour ce module — un vrai test de bout en bout contre PostgreSQL nécessiterait
 * l'environnement réel, indisponible dans ce sandbox, voir rapport final).
 */

const authenticateWithPiMock = vi.fn();

vi.mock('../../apps/web/modules/identity/services/factory', () => ({
  getAuthenticationService: () => ({ authenticateWithPi: authenticateWithPiMock }),
  getSessionService: vi.fn(),
}));

vi.mock('../../apps/web/shared/config/env', () => ({
  getEnv: () => ({
    SESSION_COOKIE_NAME: 'topluxe_session',
    SESSION_TOKEN_PEPPER: 'test-pepper',
  }),
}));

describe('POST /api/v1/auth/pi-login', () => {
  beforeEach(() => {
    authenticateWithPiMock.mockReset();
  });

  it('rejects a request body containing extra client-supplied identity fields', async () => {
    const { POST } = await import('../../apps/web/app/api/v1/auth/pi-login/route');

    const request = new Request('http://localhost/api/v1/auth/pi-login', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'abc', piUid: 'attacker-supplied-uid' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
    expect(authenticateWithPiMock).not.toHaveBeenCalled();
  });

  it('rejects a request with a missing accessToken', async () => {
    const { POST } = await import('../../apps/web/app/api/v1/auth/pi-login/route');

    const request = new Request('http://localhost/api/v1/auth/pi-login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
    expect(authenticateWithPiMock).not.toHaveBeenCalled();
  });

  it('establishes a session cookie only after AuthenticationService succeeds', async () => {
    authenticateWithPiMock.mockResolvedValue({
      profile: { userId: 'u1', piUid: 'pi-1', piUsername: 'alice', status: 'active', roles: [] },
      session: { rawToken: 'raw-session-token', sessionId: 's1', expiresAt: new Date(Date.now() + 1000) },
    });

    const { POST } = await import('../../apps/web/app/api/v1/auth/pi-login/route');

    const request = new Request('http://localhost/api/v1/auth/pi-login', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'valid-token' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(authenticateWithPiMock).toHaveBeenCalledWith('valid-token');

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('topluxe_session=raw-session-token');
    expect(setCookie.toLowerCase()).toContain('httponly');

    const body = await response.json();
    // La réponse ne renvoie jamais le token brut dans le JSON (seul le cookie le porte).
    expect(JSON.stringify(body)).not.toContain('raw-session-token');
    expect(body.user.piUsername).toBe('alice');
  });

  it('propagates a 401 when the Pi token verification fails', async () => {
    const { UnauthorizedError } = await import('../../apps/web/shared/errors/AppError');
    authenticateWithPiMock.mockRejectedValue(new UnauthorizedError('Token Pi invalide.'));

    const { POST } = await import('../../apps/web/app/api/v1/auth/pi-login/route');

    const request = new Request('http://localhost/api/v1/auth/pi-login', {
      method: 'POST',
      body: JSON.stringify({ accessToken: 'bad-token' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(401);
  });
});
