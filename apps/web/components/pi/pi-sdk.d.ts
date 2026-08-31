/**
 * Déclarations de types pour le SDK Pi fondamental (window.Pi) — TLX-006.5.
 *
 * RÉTABLI après vérification approfondie (TLX-006.5) : ni `pi-sdk-react`, ni `pi-sdk-nextjs`, ni
 * `pi-sdk-js` n'ont pu être localisés sur le registre npm public ni sur unpkg/jsDelivr (les CDN
 * qui indexent le contenu réel des paquets publiés) lors de recherches web dédiées. Seuls des
 * dépôts GitHub existent pour ces paquets. Il est donc impossible de vérifier leur code
 * source/types distribués, et impossible de confirmer avec certitude qu'ils sont même
 * installables depuis le registre npm standard (par opposition à une installation directe
 * depuis l'URL du dépôt Git, mentionnée une fois dans la documentation `pi-sdk-nextjs`).
 *
 * Le SDK fondamental (`window.Pi`), à l'inverse, est documenté avec des signatures TypeScript
 * littérales et confirmées de façon identique sur de multiples sources indépendantes, ET utilisé
 * concrètement dans le dépôt de démonstration officiel `pi-apps/demo` (fichier FLOWS.md), qui
 * montre le code backend réel validant l'accessToken via `/v2/me`. C'est la seule API dont la
 * forme peut être affirmée sans hypothèse — voir ADR 0002, addendum 4.
 *
 *   - window.Pi.init({ version: '2.0', sandbox?: boolean }): Promise<void>
 *     (page "Core Pi SDK", pi-sdk-docs.github.io/pi-sdk/Core — signature donnée littéralement)
 *
 *   - window.Pi.authenticate(scopes, onIncompletePaymentFound): Promise<AuthResult>
 *     où AuthResult = { user: PiUser; accessToken: string }
 *     (confirmé de façon identique sur : pi-platform-docs/README.md, pi-platform-docs/SDK_reference.md,
 *      Community Developer Guide, GenAI Authentication guide, ET le code réel de pi-apps/demo)
 *
 * Volontairement minimal : seuls les champs et méthodes réellement utilisés par TopLuxe sont
 * déclarés.
 */

export interface PiUser {
  uid: string;
  username?: string;
}

export interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

export interface PiIncompletePayment {
  identifier: string;
  [key: string]: unknown;
}

export type PiScope = 'username' | 'payments' | 'wallet_address';

export interface PiInitOptions {
  version: '2.0';
  sandbox?: boolean;
}

declare global {
  interface Window {
    Pi?: {
      init(options: PiInitOptions): Promise<void>;
      authenticate(
        scopes: PiScope[],
        onIncompletePaymentFound: (payment: PiIncompletePayment) => void,
      ): Promise<PiAuthResult>;
    };
  }
}
