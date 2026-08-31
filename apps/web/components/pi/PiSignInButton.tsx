'use client';

import { usePiAuthContext } from '@/components/pi/PiAuthContext';

/**
 * Bouton de connexion manuelle — TLX-006 (exigence explicite : la connexion automatique au
 * chargement ne dispense pas de fournir un déclenchement manuel visible).
 *
 * Le libellé reflète l'état réel plutôt que de prétendre à des états non observables (voir la
 * limitation documentée dans PiAuthProvider.tsx concernant l'absence de signal d'annulation
 * explicite lors du rejet de la promesse window.Pi.authenticate()).
 */
export function PiSignInButton() {
  const { ready, piConnected, backendState, backendErrorMessage, piDisplayUsername, retry } =
    usePiAuthContext();

  if (backendState === 'authenticated') {
    return (
      <span data-testid="pi-auth-status">
        Connecté{piDisplayUsername ? ` en tant que ${piDisplayUsername}` : ''}
      </span>
    );
  }

  const label = (() => {
    if (!ready) return 'Initialisation de Pi…';
    if (backendState === 'submitting') return 'Connexion en cours…';
    if (piConnected && backendState === 'backend_error') return 'Réessayer';
    return 'Se connecter avec Pi';
  })();

  return (
    <div>
      <button
        type="button"
        data-testid="pi-sign-in-button"
        disabled={!ready || backendState === 'submitting'}
        onClick={retry}
      >
        {label}
      </button>
      {backendState === 'backend_error' && backendErrorMessage && (
        <p role="alert" data-testid="pi-auth-error">
          {backendErrorMessage}
        </p>
      )}
    </div>
  );
}
