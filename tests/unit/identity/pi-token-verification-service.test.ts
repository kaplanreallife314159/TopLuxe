import { describe, it, expect, vi } from 'vitest';
import { PiTokenVerificationService } from '../../../apps/web/modules/identity/services/PiTokenVerificationService';
import { UnauthorizedError } from '../../../apps/web/shared/errors/AppError';

/**
 * Tests unitaires de PiTokenVerificationService — TLX-006.
 *
 * AUCUN appel réseau réel n'est jamais effectué : `fetch` est systématiquement mocké et injecté
 * via le constructeur (voir PiTokenVerificationService, conçu précisément pour permettre cela).
 */
function makeFetchMock(response: { status: number; body?: unknown; throwNetworkError?: boolean }) {
  return vi.fn(async () => {
    if (response.throwNetworkError) throw new Error('network down');
    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      json: async () => response.body,
    } as Response;
  });
}

const VALID_USER_DTO = {
  uid: 'pi-uid-123',
  username: 'alice_pioneer',
  credentials: {
    scopes: ['username'],
    valid_until: { timestamp: 9999999999, iso8601: '2099-01-01T00:00:00Z' },
  },
};

describe('PiTokenVerificationService', () => {
  it('returns the verified identity when /v2/me responds 200 with a valid UserDTO', async () => {
    const fetchMock = makeFetchMock({ status: 200, body: VALID_USER_DTO });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    const identity = await service.verifyAccessToken('some-access-token');

    expect(identity).toEqual({ piUid: 'pi-uid-123', piUsername: 'alice_pioneer' });
    // Vérifie que l'appel utilise bien le bon endpoint et l'en-tête Authorization Bearer exact.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.minepi.com/v2/me');
    expect(options.headers.Authorization).toBe('Bearer some-access-token');
  });

  it('throws UnauthorizedError when /v2/me responds 401', async () => {
    const fetchMock = makeFetchMock({ status: 401, body: {} });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    await expect(service.verifyAccessToken('bad-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError with no accessToken supplied', async () => {
    const fetchMock = makeFetchMock({ status: 200, body: VALID_USER_DTO });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    await expect(service.verifyAccessToken('')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError on a network failure (does not leak the raw error)', async () => {
    const fetchMock = makeFetchMock({ status: 0, throwNetworkError: true });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    await expect(service.verifyAccessToken('some-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when the response body does not match UserDTO', async () => {
    const fetchMock = makeFetchMock({ status: 200, body: { unexpected: 'shape' } });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    await expect(service.verifyAccessToken('some-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when the username scope was not granted', async () => {
    const fetchMock = makeFetchMock({
      status: 200,
      body: { uid: 'pi-uid-123', credentials: { scopes: [] } }, // pas de scope 'username', pas de username
    });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);

    await expect(service.verifyAccessToken('some-token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('never includes the raw access token in a thrown error message', async () => {
    const fetchMock = makeFetchMock({ status: 401, body: {} });
    const service = new PiTokenVerificationService(fetchMock as unknown as typeof fetch);
    const secretToken = 'super-secret-access-token-value';

    try {
      await service.verifyAccessToken(secretToken);
      throw new Error('expected verifyAccessToken to throw');
    } catch (err) {
      expect((err as Error).message).not.toContain(secretToken);
    }
  });
});
