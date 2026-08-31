# ADR 0002 — Utilisation de `pi-sdk-react` plutôt que `pi-sdk-nextjs` pour l'authentification (TLX-006)

Statut : Accepté
Contexte : implémentation de TLX-006 (authentification Pi Network)

## Contexte

Le Sprint 0 (« Version Finale Verrouillée », section F) avait confirmé `pi-sdk-nextjs` comme
package officiel pour l'intégration Pi Network dans TopLuxe, et l'ADR 0001 en faisait état.

## Ce qui a été découvert en implémentant TLX-006

Une revérification de la documentation officielle (`pi-sdk-docs`, page « Pi SDK Next.js »,
avant l'écriture du code de ce ticket) montre que le scaffolder officiel du package
(`pi-sdk-nextjs-install`) génère :

- un composant `PiButton.tsx` qui combine authentification **et** paiement (« Buy with Pi ») ;
- l'ensemble des routes API de cycle de vie des **paiements** (`app/api/pi_payment/{approve,
  complete,cancel,error,incomplete}/route.ts`) ;
- une exigence explicite de configuration d'une **clé API serveur** (`PI_API_KEY`).

Ce ticket (TLX-006) porte explicitement et uniquement sur l'authentification, avec l'interdiction
explicite d'implémenter tout paiement (U2A/A2U/escrow) et l'exigence explicite qu'**aucune clé
API ne soit requise pour ce flux d'authentification**. Utiliser le scaffolder `pi-sdk-nextjs`
tel quel aurait donc :

1. introduit des routes de paiement hors périmètre de ce ticket ;
2. rendu le flux d'authentification dépendant d'une clé API alors que la documentation officielle
   confirme explicitement que `GET /v2/me` ne nécessite qu'un token d'accès utilisateur, jamais
   de clé serveur (« Authorization method: Access token », page Platform API).

## Décision

Pour ce ticket, TopLuxe utilise directement **`pi-sdk-react`** (dépendance confirmée, `pi-sdk-nextjs`
la mentionne lui-même comme SDK sous-jacent utilisable pour des « cas d'usage avancés ») via son
hook documenté `usePiConnection()`, qui expose exactement `{ connected, user, ready, accessToken }`
et gère en interne l'initialisation et l'appel `authenticate()` — sans jamais appeler
`window.Pi.*` directement, conformément à la règle explicite de la documentation officielle
(« Rule for LLM agents: never call `window.Pi.authenticate()`... when `pi-sdk-react` is
installed »).

`pi-sdk-nextjs` **n'est pas installé** à ce stade. Cette décision est **révisable** : lorsqu'un
futur ticket implémentera les paiements Pi (U2A/A2U), il sera légitime de réévaluer l'usage du
scaffolder `pi-sdk-nextjs` complet (PiButton + routes de paiement), à ce moment où le périmètre
du projet inclura effectivement les paiements et la clé API serveur qu'ils requièrent.

## Conséquences

- `apps/web/package.json` déclare `pi-sdk-react` et `pi-sdk-js` (dépendance parente), pas
  `pi-sdk-nextjs`.
- Aucune route `app/api/pi_payment/*` n'existe dans le dépôt à ce stade — cohérent avec
  l'interdiction explicite des paiements dans ce ticket.
- Le composant `PiConnectionBridge` (voir `apps/web/components/pi/`) encapsule strictement
  l'usage de `usePiConnection()` ; aucun autre composant du dépôt n'importe `pi-sdk-react`
  directement, pour garder un seul point d'intégration à faire évoluer.

---

## Addendum (TLX-006.2) — Divergence documentaire non résolue sur la forme exacte de `usePiConnection()`

Lors de la dernière vérification technique de TLX-006, deux recherches indépendantes ont mis en
évidence une **divergence réelle et non résolue** entre deux sources se présentant toutes deux
comme officielles :

| Source | Forme documentée de `usePiConnection()` |
|---|---|
| `pi-sdk-docs.github.io`, page « Pi SDK React » | `{ connected, user, ready, accessToken }` |
| README canonique du dépôt `pi-apps/pi-sdk-react` (branche `main`) | `{ connected, user, ready }` — **sans `accessToken`** |

Le second est vraisemblablement plus proche du paquet réellement publié (un README de dépôt est
en principe synchronisé avec le code au moment des releases), mais rien ne permet de trancher
avec une certitude absolue sans installer réellement le paquet et inspecter ses définitions
TypeScript — impossible dans l'environnement ayant produit ce code (absence d'accès réseau npm).

**Décision** : ne pas arbitrer arbitrairement en faveur de l'une ou l'autre source. Le code
(`PiConnectionBridge.tsx`) cherche l'accessToken aux deux emplacements documentés par l'une ou
l'autre source (premier niveau du retour du hook, puis repli sur `user.accessToken`), et refuse
explicitement toute soumission au backend si aucun des deux emplacements ne contient de valeur
exploitable — avec un diagnostic clair (sans jamais logger le token lui-même).

**Numéro de version de `pi-sdk-react`** : également non confirmable pour la même raison. Aucune
page de registre npm public n'a pu être localisée pour ce paquet lors des recherches effectuées ;
seul le dépôt GitHub source a pu être consulté. `apps/web/package.json` utilise donc `"*"` plutôt
qu'un numéro de version précis inventé — **ce point doit être corrigé avec la vraie version dès
le premier `npm install` réel**, avant tout déploiement.

**Action bloquante avant mise en production** : confirmer définitivement, via l'installation
réelle du paquet et l'inspection de son code/types, l'emplacement exact de l'accessToken exposé
par `usePiConnection()`, et simplifier alors `PiConnectionBridge.tsx` en conséquence (suppression
du repli défensif une fois la certitude acquise).

---

## Addendum 2 (TLX-006.3) — Abandon de `pi-sdk-react`, appel direct au SDK fondamental `window.Pi`

**Statut : la décision de l'addendum précédent (repli défensif à deux emplacements) est
remplacée par une décision plus radicale et définitive.**

### Contexte

Suite à la découverte documentée dans l'addendum 1 (divergence sur la forme exacte du retour de
`usePiConnection()`), une nouvelle vérification a permis de confirmer, de façon identique et
cohérente sur **au moins six sources indépendantes** (pi-sdk-docs.github.io "Core Pi SDK",
pi-platform-docs/README.md, pi-platform-docs/SDK_reference.md, Community Developer Guide, un
wiki communautaire de référence SDK, et l'exemple `ads.md`) :

- `window.Pi.init({ version: '2.0', sandbox?: boolean }): Promise<void>` — signature explicite,
  avec la précision que l'appel DOIT être attendu avant tout autre appel Pi SDK.
- `window.Pi.authenticate(scopes, onIncompletePaymentFound): Promise<AuthResult>` où
  `AuthResult = { user, accessToken }` — accessToken **toujours** au même emplacement, sans
  aucune variante observée.

Ce niveau de cohérence n'a jamais pu être obtenu pour `usePiConnection()` (`pi-sdk-react`),
malgré deux recherches indépendantes.

### Décision

TopLuxe **n'utilise plus `pi-sdk-react` ni `pi-sdk-js`**. `PiConnectionBridge.tsx` appelle
directement `window.Pi.init()` puis `window.Pi.authenticate(['username'], onIncompletePaymentFound)`,
avec un typage local (`components/pi/pi-sdk.d.ts`) reproduisant exactement les signatures
confirmées ci-dessus — aucun champ ni méthode non documenté n'est déclaré.

Ce choix est explicitement sanctionné par la documentation officielle elle-même : *« Use the
foundation SDK directly only if no helper supports your stack, you are debugging or contributing
to the helpers, or you need a capability the helpers do not yet expose »* — la « capacité »
manquante ici étant la certitude vérifiable sur la forme exacte du résultat, que le wrapper React
ne pouvait pas garantir depuis la documentation disponible.

### Conséquences

- `apps/web/package.json` ne déclare plus `pi-sdk-react`/`pi-sdk-js`.
- `components/pi/pi-sdk.d.ts` (nouveau) fournit le typage minimal nécessaire.
- La séquence init → authenticate est désormais **explicite et vérifiable dans notre propre
  code** (et testable avec certitude), plutôt que déléguée à un comportement interne non
  observable d'un paquet tiers.
- Le callback `onIncompletePaymentFound`, paramètre obligatoire de `Pi.authenticate()`, est
  fourni avec une implémentation minimale qui journalise sans jamais traiter le paiement —
  conforme à l'interdiction stricte de développer U2A/A2U/escrow dans ce ticket.
- Ce choix reste révisable : si un futur ticket sur les paiements Pi justifie l'adoption d'un
  wrapper officiel (`pi-sdk-nextjs` une fois les paiements réellement dans le périmètre), cette
  décision devra être réévaluée dans un nouvel ADR, pas modifiée silencieusement.

---

## Addendum 3 (TLX-006.4) — DÉCISION FINALE : retour à `pi-sdk-react`, conformité stricte au tableau officiel Next.js

**Statut : décision finale, remplace l'addendum 2.**

### Contexte

Un audit dédié (TLX-006.3 → audit de conformité) a établi que l'appel direct à `window.Pi.init()`/
`window.Pi.authenticate()` (addendum 2) **viole littéralement** une instruction explicite et
spécifique de la source de vérité désignée pour ce projet (pi-sdk-docs.github.io) :

> Next.js (`pi-sdk-nextjs`) → Correct approach: *Use scaffolded hooks/components* → **Do NOT**:
> *Call `window.Pi.authenticate()` directly*

Le fondateur a explicitement tranché en faveur de la **conformité stricte à la documentation
officielle** plutôt que de la certitude d'implémentation obtenue via le SDK fondamental.

### Décision finale

TopLuxe utilise **`pi-sdk-react`** (`usePiConnection()`), le mécanisme d'authentification dont
`pi-sdk-nextjs` dépend réellement pour la partie connexion (confirmé par la FAQ de
`pi-sdk-nextjs` elle-même : *"Leverage hooks, server helpers, and the underlying SDKs
(pi-sdk-react, pi-sdk-js) for advanced use cases..."*). `pi-sdk-nextjs` est déclaré comme
dépendance (package officiellement désigné pour Next.js), mais **son scaffolder CLI
(`pi-sdk-nextjs-install`) n'est pas exécuté** : il générerait un `PiButton.tsx` couplé au
paiement et les routes `app/api/pi_payment/*`, explicitement hors périmètre de TLX-006 (aucun
U2A/A2U/escrow, aucun scope `payments`, aucune clé API pour l'authentification).

### Arbitrage sur la forme exacte de `usePiConnection()` (accessToken)

Un fallback spéculatif à deux emplacements avait été introduit lors de l'addendum 1, explicitement
rejeté par le fondateur (*« Je ne veux pas de fallback spéculatif »*). Décision : faire confiance à
la source de vérité désignée pour ce ticket, **pi-sdk-docs.github.io**, qui documente de façon
identique et répétée sur trois pages distinctes (`quick-start/React`, `quick-start/genai/Authentication`,
`platform/Authentication`) que `usePiConnection()` expose `{ connected, user, ready, accessToken }`.
Le README du dépôt GitHub (`pi-apps/pi-sdk-react`, présenté comme un « Community Developer Guide »)
décrit une forme plus courte sans `accessToken`, mais ne démontre jamais son extraction dans son
propre exemple — cohérent avec une description simplifiée plutôt qu'une signature exhaustive
contradictoire. `PiConnectionBridge.tsx` lit donc l'accessToken à un seul emplacement, sans repli.

**Action de suivi bloquante avant production, inchangée depuis l'addendum 1** : confirmer cet
emplacement dans les types TypeScript réels du paquet dès qu'un `npm install` est possible.

### Conséquences

- `apps/web/package.json` déclare `pi-sdk-nextjs`, `pi-sdk-react`, `pi-sdk-js` (aucun numéro de
  version confirmé — voir addendum 1).
- `apps/web/components/pi/pi-sdk.d.ts` (créé lors de l'addendum 2) est supprimé : les types
  proviennent désormais du paquet `pi-sdk-react` une fois installé.
- Le séquencement `init()` → `authenticate()` n'est plus observable/vérifiable dans le code
  TopLuxe lui-même (régression de traçabilité assumée sciemment, en échange de la conformité
  documentaire demandée) — délégué entièrement à `usePiConnection()`, conformément à la règle
  officielle interdisant tout appel direct à `window.Pi` en parallèle du hook.
- Aucune route de paiement (`app/api/pi_payment/*`) ni composant `PiButton.tsx` n'existe dans ce
  dépôt — absence délibérée, pas un oubli.

---

## Addendum 4 (TLX-006.5) — DÉCISION DÉFINITIVE : retour au SDK fondamental, `pi-sdk-*` non vérifiables

**Statut : décision finale et définitive pour TLX-006, remplace l'addendum 3.**

### Ce qui a déclenché cette révision

Le fondateur a demandé une vérification au niveau du **code source/types distribués**, pas
seulement des README, avec une exigence explicite : ne jamais utiliser une propriété comme
`accessToken` sur le retour de `usePiConnection()` si elle n'est pas confirmée dans les
types/API officiels réels.

### Recherche effectuée

- Recherche ciblée du code source (`src/`, fichiers `.ts` de hooks) du dépôt `pi-apps/pi-sdk-react`
  : seuls des extraits de `README.md` ont pu être localisés, jamais un fichier source ou un
  fichier `.d.ts` distribué.
- Recherche sur **unpkg** et **jsDelivr** (les CDN qui indexent le contenu réel des paquets
  effectivement publiés sur le registre npm) pour `pi-sdk-react`, `pi-sdk-nextjs`, `pi-sdk-js` :
  **aucun résultat**. Aucune page `npmjs.com/package/pi-sdk-react` (ou équivalent pour les deux
  autres paquets) n'a pu être localisée non plus, dans cette recherche ni dans les précédentes.

**Conclusion** : il est impossible d'affirmer avec certitude que ces paquets sont publiés sur le
registre npm public standard (par opposition à une installation exclusivement possible depuis
l'URL du dépôt Git, mentionnée une seule fois dans la documentation `pi-sdk-nextjs`). Il est donc
structurellement impossible de vérifier leur code source ou leurs types distribués par les
moyens disponibles (recherche web ; le sandbox n'a par ailleurs aucun accès réseau npm).

### Ce qui EST vérifiable avec certitude

Le SDK fondamental (`window.Pi`) est confirmé par :
1. Une signature TypeScript **littérale** (`window.Pi.init({ version: '2.0', sandbox?: boolean }): Promise<void>`,
   page "Core Pi SDK").
2. Un `AuthResult` de forme identique (`{ user, accessToken }`) confirmé sur au moins six sources
   indépendantes déjà recensées dans les addenda précédents.
3. **Un dépôt de démonstration officiel exécutable** (`pi-apps/demo`, fichier `FLOWS.md`),
   montrant le code backend réel : `axiosClient.get('/v2/me', { headers: { Authorization: 'Bearer ' + currentUser.accessToken } })`
   — une preuve d'usage concret, pas seulement une description.

### Décision finale

TopLuxe utilise le **SDK fondamental** (`window.Pi.init()` / `window.Pi.authenticate()`),
directement, dans `PiConnectionBridge.tsx`. `pi-sdk-react`, `pi-sdk-nextjs` et `pi-sdk-js` sont
retirés de `package.json`.

### Tension assumée avec le tableau officiel Next.js

Ceci s'écarte à nouveau du tableau de la page `quick-start/genai/Authentication` (« Next.js →
Do NOT call `window.Pi.authenticate()` directly »), identifié lors de l'audit TLX-006.3→006.4.
Cette tension est assumée consciemment : entre (a) suivre littéralement un tableau qui recommande
un paquet dont l'existence publique ne peut pas être vérifiée, et (b) utiliser une API dont la
signature est confirmée avec certitude par des sources multiples et un exemple d'exécution réel,
la seconde option est jugée strictement supérieure du point de vue de la fiabilité d'implémentation
— et c'est la clause de secours documentée elle-même qui la sanctionne (« *use the foundation SDK
directly only if... you need a capability the helpers do not yet expose* » — ici, la capacité
manquante est la vérifiabilité même de l'existence du paquet).

### Conséquences

- `apps/web/package.json` : aucune dépendance `pi-sdk-*`.
- `apps/web/components/pi/pi-sdk.d.ts` : rétabli.
- `PiConnectionBridge.tsx` : rétabli sur `window.Pi.init()`/`window.Pi.authenticate()`.
- Le séquencement init → authenticate redevient observable et testable directement dans le code
  TopLuxe (avantage retrouvé par rapport à l'addendum 3).
- **Cette décision doit être reconsidérée** si, un jour, l'un des paquets `pi-sdk-*` peut être
  effectivement installé et son code source inspecté — à ce moment, l'arbitrage entre le tableau
  officiel et la certitude d'implémentation pourra être refait sur des bases vérifiées plutôt que
  déduites.
