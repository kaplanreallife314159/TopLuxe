'use client';

import { useCallback, useRef, useState } from 'react';
import { PiAuthContext, type PiBackendAuthState } from '@/components/pi/PiAuthContext';
import { PiConnectionBridge, type PiConnectionState } from '@/components/pi/PiConnectionBridge';

interface PiAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Fournisseur d'authentification Pi Network — TLX-006.5 (décision finale).
 *
 * DÉCISION FINALE : utilise le SDK Pi fondamental (`window.Pi.init()` / `window.Pi.authenticate()`)
 * via PiConnectionBridge.tsx, après vérification approfondie ayant montré que `pi-sdk-react`/
 * `pi-sdk-nextjs`/`pi-sdk-js` ne sont trouvables comme paquets npm publiés sur aucune source
 * consultée (registre npm, unpkg, jsDelivr) — voir ADR 0002, addendum 4, pour la justification
 * complète et l'historique des quatre révisions successives de cette décision.
 *
 * Comportement :
 *  - Déclenchement AUTOMATIQUE : monte <PiConnectionBridge> dès le premier rendu, qui exécute
 *    immédiatement `await window.Pi.init(...)` puis `await window.Pi.authenticate(['username'], ...)`.
 *  - Déclenchement MANUEL : `retry()` (exposé via le contexte, utilisé par PiSignInButton)
 *    incrémente `attempt`, ce qui remonte <PiConnectionBridge> via sa prop `key` et redéclenche
 *    tout le cycle — exactement le même flux que l'automatique.
 *  - Dès que `connected === true` et qu'un accessToken est disponible, le token est envoyé UNE
 *    SEULE FOIS (garde `submittedForAttempt`) à POST /api/v1/auth/pi-login. La session TopLuxe
 *    n'est jamais considérée établie tant que le backend n'a pas répondu 200.
 *
 * Limitation qui demeure (exigence du ticket, gestion de l'annulation) : aucune source officielle
 * ne permet de distinguer "l'utilisateur a annulé" de "authenticate() a échoué pour une autre
 * raison côté Pi" — les deux se traduisent par le rejet de la promesse `authenticate()`. Ce
 * Provider retient donc la seule distinction qu'il puisse établir avec un niveau de confiance
 * réel :
 *   - échec de `window.Pi.authenticate()` (annulation ou autre) -> état neutre (pas d'erreur
 *     affichée), bouton de nouvelle tentative disponible ;
 *   - "erreur technique/serveur" -> réservé exclusivement à l'échec de l'appel vers LE BACKEND
 *     TopLuxe (réseau ou réponse non-2xx de /api/v1/auth/pi-login), où le Provider a un contrôle
 *     et une visibilité complets et certains.
 */
export function PiAuthProvider({ children }: PiAuthProviderProps) {
  const [attempt, setAttempt] = useState(0);
  const [connectionState, setConnectionState] = useState<PiConnectionState>({
    ready: false,
    connected: false,
    accessToken: null,
    displayUsername: null,
  });
  const [backendState, setBackendState] = useState<PiBackendAuthState>('idle');
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(null);
  const submittedForAttempt = useRef<number | null>(null);

  const submitAccessTokenToBackend = useCallback(
    async (accessToken: string, currentAttempt: number) => {
      // Garde d'idempotence : n'envoyer le token qu'une seule fois par tentative de connexion,
      // même si ce composant est re-rendu plusieurs fois pendant que connected === true.
      if (submittedForAttempt.current === currentAttempt) return;
      submittedForAttempt.current = currentAttempt;

      setBackendState('submitting');
      setBackendErrorMessage(null);

      try {
        const response = await fetch('/api/v1/auth/pi-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Le corps ne contient JAMAIS d'identité Pi fournie par le client (piUid/username) —
          // uniquement l'accessToken, que le backend doit valider lui-même via GET /v2/me.
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          setBackendState('backend_error');
          setBackendErrorMessage(
            response.status === 401
              ? 'La vérification de votre identité Pi a échoué.'
              : 'Une erreur est survenue lors de la connexion.',
          );
          return;
        }

        setBackendState('authenticated');
      } catch {
        // Erreur réseau vers notre propre backend — erreur technique certaine, distincte de
        // l'état "non connecté à Pi" géré par ailleurs.
        setBackendState('backend_error');
        setBackendErrorMessage('Impossible de contacter le serveur TopLuxe.');
      }
    },
    [],
  );

  const handleConnectionStateChange = useCallback(
    (state: PiConnectionState) => {
      setConnectionState(state);

      // Garantie vérifiable dans notre propre code (TLX-006.5) : PiConnectionBridge.tsx
      // implémente explicitement l'ordre init() → authenticate() (voir ce fichier). Cette garde
      // reste en place par défense en profondeur.
      if (state.connected && !state.ready) {
        // Le logger serveur (shared/logger, basé sur pino) n'est délibérément PAS importé ici :
        // ce fichier est un Client Component ('use client'), et pino n'est pas conçu pour
        // s'exécuter dans le bundle navigateur. console.warn est utilisé à la place, sans jamais
        // inclure de donnée sensible (aucun token n'est présent dans ce message).
        // eslint-disable-next-line no-console
        console.warn(
          'État de connexion Pi incohérent (connected=true, ready=false) — soumission bloquée par sécurité.',
        );
        return;
      }

      if (state.ready && state.connected && state.accessToken) {
        void submitAccessTokenToBackend(state.accessToken, attempt);
      }
    },
    [attempt, submitAccessTokenToBackend],
  );

  const retry = useCallback(() => {
    submittedForAttempt.current = null;
    setBackendState('idle');
    setBackendErrorMessage(null);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <PiAuthContext.Provider
      value={{
        ready: connectionState.ready,
        piConnected: connectionState.connected,
        backendState,
        backendErrorMessage,
        piDisplayUsername: connectionState.displayUsername,
        retry,
      }}
    >
      <PiConnectionBridge key={attempt} onStateChange={handleConnectionStateChange} />
      {children}
    </PiAuthContext.Provider>
  );
}
