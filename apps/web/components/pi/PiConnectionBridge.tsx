'use client';

import { useEffect, useRef } from 'react';
import type { PiAuthResult } from './pi-sdk';

/**
 * Pont d'authentification Pi Network — TLX-006.5 (décision finale après vérification approfondie).
 *
 * HISTORIQUE DE LA DÉCISION (voir ADR 0002 pour le détail complet, addenda 1 à 4) :
 *   - TLX-006/006.1/006.2 : `pi-sdk-react` (`usePiConnection()`), avec un fallback spéculatif
 *     sur l'emplacement de accessToken — rejeté par le fondateur.
 *   - TLX-006.3 : SDK fondamental (`window.Pi`) direct — jugé non conforme au tableau officiel
 *     Next.js lors d'un audit dédié.
 *   - TLX-006.4 : retour à `pi-sdk-react`, sans fallback, en faisant confiance à la source de
 *     vérité désignée (pi-sdk-docs.github.io).
 *   - TLX-006.5 (ICI) : vérification approfondie (recherche du code source réel, recherche sur
 *     unpkg/jsDelivr) montrant que `pi-sdk-react`/`pi-sdk-nextjs`/`pi-sdk-js` NE SONT TROUVABLES
 *     NULLE PART comme paquets npm publiés — seuls des dépôts GitHub existent, sans preuve de
 *     publication sur le registre npm standard. Il est donc impossible de vérifier leur code
 *     source/types réels, et impossible d'affirmer sans hypothèse la forme exacte de
 *     `usePiConnection()`. Le SDK fondamental, à l'inverse, est confirmé par des signatures
 *     TypeScript littérales ET par le code réel du dépôt de démonstration officiel
 *     `pi-apps/demo` (FLOWS.md), qui l'utilise concrètement pour obtenir et vérifier l'accessToken.
 *     C'est la seule API dont la forme peut être affirmée sans hypothèse ni fallback spéculatif —
 *     conformément à l'exigence explicite du fondateur de ne jamais utiliser de propriété
 *     hypothétique non vérifiée dans les sources/types réels.
 *
 * Séquencement garanti et vérifiable dans ce fichier :
 *   1. `window.Pi.init({ version: '2.0', sandbox })` est appelé et **entièrement attendu**
 *      (`await`) avant toute autre opération.
 *   2. `window.Pi.authenticate(['username'], onIncompletePaymentFound)` n'est appelé QU'APRÈS
 *      la résolution de la promesse d'initialisation ci-dessus.
 *   3. Le scope demandé est exactement `['username']` — aucun autre scope, en particulier pas
 *      `payments`.
 *   4. `onIncompletePaymentFound` est un paramètre OBLIGATOIRE de la signature de
 *      `Pi.authenticate()` : une fonction minimale est fournie, qui journalise uniquement
 *      l'identifiant du paiement incomplet SANS jamais tenter de le traiter — aucun U2A/A2U/escrow.
 *
 * Garde anti-double-exécution : un `useRef` (et lui seul, sans annulation au nettoyage — voir
 * l'explication détaillée dans le corps de l'effet) garantit qu'un seul cycle init→authenticate
 * s'exécute, y compris sous React.StrictMode.
 */
export interface PiConnectionState {
  ready: boolean;
  connected: boolean;
  accessToken: string | null;
  displayUsername: string | null;
}

interface PiConnectionBridgeProps {
  onStateChange: (state: PiConnectionState) => void;
}

const PI_SDK_VERSION = '2.0';
const PI_SCOPES: Array<'username'> = ['username'];

function isSandboxMode(): boolean {
  return process.env.NEXT_PUBLIC_PI_SANDBOX_MODE !== 'false';
}

/**
 * Callback obligatoire de la signature Pi.authenticate(). Ne traite AUCUN paiement — journalise
 * uniquement l'identifiant, sans jamais logger de donnée sensible. Aucun U2A/A2U/escrow.
 */
function onIncompletePaymentFound(payment: { identifier: string }): void {
  // eslint-disable-next-line no-console
  console.warn(
    `Paiement incomplet détecté par le SDK Pi (identifiant : ${payment.identifier}). ` +
      'Aucun traitement effectué — la gestion des paiements est hors périmètre de ce ticket.',
  );
}

export function PiConnectionBridge({ onStateChange }: PiConnectionBridgeProps) {
  const hasStarted = useRef(false);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    // Garde anti-double-exécution : `hasStarted` est un useRef, donc la MÊME référence persiste
    // à travers le montage/démontage/remontage synthétique de React.StrictMode. C'est
    // volontairement la SEULE garde (aucune annulation au nettoyage) : combiner cette garde avec
    // une annulation casserait le flux sous StrictMode (bug réel corrigé lors de TLX-006.3 —
    // voir l'historique Git). Une fois qu'un cycle init()→authenticate() a commencé, il va
    // jusqu'au bout et met à jour l'état via `onStateChangeRef.current` (toujours à jour).
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function run() {
      if (typeof window === 'undefined' || !window.Pi) {
        // Cas normal hors Pi Browser — pas une erreur technique, simplement "non prêt".
        return;
      }

      try {
        // Étape 1 — init() est un objet Promise, ENTIÈREMENT attendu avant toute autre étape.
        await window.Pi.init({ version: PI_SDK_VERSION, sandbox: isSandboxMode() });

        onStateChangeRef.current({
          ready: true,
          connected: false,
          accessToken: null,
          displayUsername: null,
        });

        // Étape 2 — authenticate() n'est appelé qu'après la résolution complète de init()
        // ci-dessus (ordre séquentiel explicite dans ce code, pas une hypothèse).
        const authResult: PiAuthResult = await window.Pi.authenticate(
          PI_SCOPES,
          onIncompletePaymentFound,
        );

        onStateChangeRef.current({
          ready: true,
          connected: true,
          accessToken: authResult.accessToken,
          displayUsername: authResult.user.username ?? null,
        });
      } catch {
        // Couvre à la fois l'annulation utilisateur et un éventuel échec du SDK Pi lui-même.
        // Aucune source officielle ne permet de distinguer ces deux cas depuis le résultat de
        // authenticate() — l'état reste neutre ("prêt mais non connecté").
        onStateChangeRef.current({
          ready: true,
          connected: false,
          accessToken: null,
          displayUsername: null,
        });
      }
    }

    void run();
  }, []);

  return null;
}
