import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PiAuthProvider } from '../../../apps/web/components/pi/PiAuthProvider';
import { PiSignInButton } from '../../../apps/web/components/pi/PiSignInButton';

/**
 * Tests du flux client d'authentification Pi — TLX-006.5 (décision finale).
 *
 * DÉCISION FINALE (voir ADR 0002, addendum 4) : `pi-sdk-react`/`pi-sdk-nextjs`/`pi-sdk-js` n'ont
 * pu être vérifiés comme paquets npm publiés sur aucune source consultée (registre npm, unpkg,
 * jsDelivr) — impossible de vérifier leur code source/types réels. TopLuxe utilise donc le SDK
 * fondamental (window.Pi), confirmé par des signatures TypeScript littérales ET par le dépôt de
 * démonstration officiel pi-apps/demo. Ce fichier mocke `window.Pi` directement.
 *
 * AUCUN appel réseau réel vers Pi Network n'est jamais effectué dans ces tests.
 *
 * AVANTAGE RETROUVÉ par rapport à la version pi-sdk-react (TLX-006.4) : le séquencement exact
 * init() → authenticate() redevient observable et démontrable directement (tests dédiés
 * ci-dessous), puisque TopLuxe implémente cette séquence lui-même plutôt que de la déléguer à
 * une boîte noire tierce non vérifiable.
 *
 * NOTE D'ENVIRONNEMENT (voir rapport final) : ce fichier nécessite jsdom et
 * @testing-library/react. Non exécutable dans le sandbox ayant produit ce code (réseau npm
 * indisponible) — écrit et relu avec le plus grand soin, non vérifié par exécution ici.
 */

function installMockPi(overrides?: {
  initDelayMs?: number;
  authResult?: { user: { uid: string; username?: string }; accessToken: string } | Error;
}) {
  const calls: string[] = [];
  const initMock = vi.fn(async () => {
    calls.push('init');
    if (overrides?.initDelayMs) {
      await new Promise((r) => setTimeout(r, overrides.initDelayMs));
    }
  });
  const authenticateMock = vi.fn(async (_scopes: string[], _cb: unknown) => {
    calls.push('authenticate');
    const result = overrides?.authResult ?? {
      user: { uid: 'pi-uid-1', username: 'alice' },
      accessToken: 'mock-access-token',
    };
    if (result instanceof Error) throw result;
    return result;
  });

  (window as unknown as { Pi: unknown }).Pi = { init: initMock, authenticate: authenticateMock };

  return { initMock, authenticateMock, calls };
}

describe('Pi authentication client flow (window.Pi, TLX-006.5 — décision finale)', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  });

  afterEach(() => {
    delete (window as unknown as { Pi?: unknown }).Pi;
    vi.restoreAllMocks();
  });

  it('calls window.Pi.init() before window.Pi.authenticate() (preuve de séquencement — point 3 du ticket)', async () => {
    const { initMock, authenticateMock, calls } = installMockPi();

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(authenticateMock).toHaveBeenCalledTimes(1));
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['init', 'authenticate']);
  });

  it('fully awaits the init() promise before calling authenticate() (pas seulement l\'ordre d\'appel)', async () => {
    const { authenticateMock } = installMockPi({ initDelayMs: 50 });

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(authenticateMock).not.toHaveBeenCalled();

    await waitFor(() => expect(authenticateMock).toHaveBeenCalledTimes(1), { timeout: 200 });
  });

  it('requests exactly the ["username"] scope, nothing else', async () => {
    const { authenticateMock } = installMockPi();

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(authenticateMock).toHaveBeenCalledTimes(1));
    const [scopesArg] = authenticateMock.mock.calls[0];
    expect(scopesArg).toEqual(['username']);
  });

  it('triggers authentication automatically on mount, without any user interaction', async () => {
    const { initMock } = installMockPi();

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(initMock).toHaveBeenCalledTimes(1));
  });

  it('sends the accessToken returned by authenticate() to the backend, unmodified (preuve — API réelle confirmée)', async () => {
    installMockPi({ authResult: { user: { uid: 'pi-uid-2', username: 'bob' }, accessToken: 'exact-token-value-123' } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    global.fetch = fetchMock;

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/auth/pi-login');
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ accessToken: 'exact-token-value-123' });
  });

  it('reaches the authenticated state only after the backend confirms (session opaque créée seulement après /v2/me)', async () => {
    installMockPi();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    expect(screen.queryByTestId('pi-auth-status')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('pi-auth-status')).toBeInTheDocument());
  });

  it('treats a rejected authenticate() (cancellation or Pi-side failure) as a neutral state, not a backend error', async () => {
    installMockPi({ authResult: new Error('User cancelled or Pi SDK error') });
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pi-auth-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('pi-sign-in-button')).not.toBeDisabled();
  });

  it('shows a distinct backend error state when the backend rejects the token (not a silent success)', async () => {
    installMockPi();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('pi-auth-error')).toBeInTheDocument());
    expect(screen.queryByTestId('pi-auth-status')).not.toBeInTheDocument();
  });

  it('never logs the raw accessToken, in success or failure paths', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    installMockPi({ authResult: { user: { uid: 'x', username: 'x' }, accessToken: 'THE-SECRET-TOKEN-VALUE' } });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('pi-auth-status')).toBeInTheDocument());

    const allLoggedText = [...warnSpy.mock.calls, ...errorSpy.mock.calls, ...logSpy.mock.calls]
      .flat()
      .map((v) => String(v))
      .join(' ');
    expect(allLoggedText).not.toContain('THE-SECRET-TOKEN-VALUE');
  });

  it('the manual sign-in button triggers the exact same init/authenticate flow as the automatic one', async () => {
    const { initMock, authenticateMock } = installMockPi();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await waitFor(() => expect(initMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('pi-auth-error')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('pi-sign-in-button'));

    await waitFor(() => expect(initMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(authenticateMock).toHaveBeenCalledTimes(2));
  });

  it('does not trigger a duplicate init/authenticate cycle under React.StrictMode double-invocation', async () => {
    const { initMock, authenticateMock } = installMockPi();

    render(
      <React.StrictMode>
        <PiAuthProvider>
          <PiSignInButton />
        </PiAuthProvider>
      </React.StrictMode>,
    );

    await waitFor(() => expect(screen.getByTestId('pi-auth-status')).toBeInTheDocument());
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(authenticateMock).toHaveBeenCalledTimes(1);
  });

  it('does nothing (no crash, ready remains false) when window.Pi is not available', async () => {
    delete (window as unknown as { Pi?: unknown }).Pi;

    render(
      <PiAuthProvider>
        <PiSignInButton />
      </PiAuthProvider>,
    );

    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId('pi-sign-in-button')).toBeDisabled();
  });
});
