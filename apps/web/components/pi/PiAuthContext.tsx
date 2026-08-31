'use client';

import { createContext, useContext } from 'react';

/**
 * État d'authentification Pi exposé aux composants — TLX-006.
 *
 * `backendState` distingue explicitement :
 *  - 'idle'            : la connexion Pi n'a pas encore abouti (couvre à la fois "en cours" et
 *                         "l'utilisateur a annulé" — voir PiAuthProvider.tsx pour l'explication
 *                         détaillée de cette limitation documentée : usePiConnection() (pi-sdk-react) n'expose aucun
 *                         signal distinct pour l'annulation).
 *  - 'submitting'       : l'accessToken Pi a été obtenu et est en cours d'envoi au backend TopLuxe.
 *  - 'authenticated'    : le backend TopLuxe a validé le token et une session a été établie.
 *  - 'backend_error'    : le backend a rejeté le token, ou l'appel réseau vers le backend a échoué
 *                         — erreur technique/serveur, distincte du cas 'idle'.
 */
export type PiBackendAuthState = 'idle' | 'submitting' | 'authenticated' | 'backend_error';

export interface PiAuthContextValue {
  /** true une fois que window.Pi.init() a résolu (voir PiConnectionBridge.tsx). */
  ready: boolean;
  /** true une fois l'utilisateur authentifié côté Pi Network (avant même validation backend). */
  piConnected: boolean;
  backendState: PiBackendAuthState;
  backendErrorMessage: string | null;
  /** Nom d'affichage Pi (à but purement informatif — jamais utilisé comme identité de confiance). */
  piDisplayUsername: string | null;
  /** Force un nouveau cycle d'authentification Pi (remonte PiConnectionBridge, qui relance
   * window.Pi.init() puis window.Pi.authenticate() depuis le début — voir PiAuthProvider.tsx). */
  retry: () => void;
}

export const PiAuthContext = createContext<PiAuthContextValue | null>(null);

export function usePiAuthContext(): PiAuthContextValue {
  const ctx = useContext(PiAuthContext);
  if (!ctx) {
    throw new Error('usePiAuthContext doit être utilisé à l\'intérieur de <PiAuthProvider>.');
  }
  return ctx;
}
