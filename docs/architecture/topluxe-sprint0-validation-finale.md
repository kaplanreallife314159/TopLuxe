# TopLuxe — Sprint 0 : Version Finale Verrouillée

*Basé sur : document produit officiel, architecture technique, spécifications techniques détaillées, backlog MVP, addendum Pi Network Authentication, fondation technique v1*
*Statut : décisions verrouillées — aucun code métier produit, TLX-001 non démarré*

---

## Préambule — vérification Pi Network Next.js effectuée avant toute décision

Avant de verrouiller la section Pi Network, la documentation officielle a été revérifiée spécifiquement sur le nom exact du package Next.js. Résultat : **le package `pi-sdk-nextjs` est confirmé** — il s'agit d'un dépôt officiel de l'organisation `pi-apps`(cite index="44-1">, ce package aidant à scaffolder, configurer et intégrer rapidement tous les composants nécessaires pour utiliser les paiements Pi Network, l'authentification et les flux utilisateur dans un projet Next.js, étant conçu pour les applications Next.js modernes, que ce soit avec l'App Router ou le Pages Router</cite>. Ce n'est donc pas une supposition : le nom du package est explicitement documenté dans son propre dépôt officiel, ce qui corrobore la mention déjà trouvée dans le guide GenAI. Le détail complet est en section F.

---

## A. Décisions techniques finales

| Domaine | Décision verrouillée |
|---|---|
| Framework | Next.js, TypeScript, App Router |
| Style architectural | Monolithe modulaire, API REST via Route Handlers |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Session applicative | **Session serveur opaque** (et non JWT) — voir section E |
| Cache / jobs planifiés | **Redis explicitement exclu du MVP initial** — voir section ci-dessous |
| Tests | Vitest (unitaires/intégration), Playwright (E2E) |
| Versioning | Git, GitHub |
| CI/CD | GitHub Actions |
| Déploiement cible | Render, sous réserve de validation finale au moment du déploiement |
| Pi Network | `pi-sdk-nextjs` (package officiel confirmé) — voir section F |
| Paiements Pi | **Non développés à ce stade** — architecture à valider séparément avant tout code |
| Base de données MVP | Uniquement les modèles de fondation (Identité, Session, Audit) — pas de tables métier anticipées |

### Redis — statut verrouillé
Redis est retiré des dépendances du MVP initial. `ioredis` n'est pas installé. Les jobs planifiés (réconciliation de paiement, libération automatique d'escrow, expiration de réservation — tous hors périmètre de ce Sprint 0, cf. section « Paiements Pi » ci-dessus) devront être conçus dans une interface d'abstraction (ex. `SchedulerPort`) permettant une implémentation initiale simple (ex. tâche planifiée applicative) puis un remplacement par une implémentation Redis-backed plus tard sans réécrire la logique métier. Cette contrainte de conception est actée mais son implémentation concrète n'intervient pas au Sprint 0 (aucun job métier n'est développé à ce stade).

---

## B. Arborescence finale

*Identique à la structure déjà validée dans le document de fondation précédent, avec une clarification sur le dossier de session et la confirmation du nom exact des packages Pi.*

```
topluxe/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-staging.yml
├── apps/
│   └── web/
│       ├── app/
│       │   ├── (public)/
│       │   ├── (buyer)/
│       │   ├── (seller)/
│       │   ├── (expert)/
│       │   ├── (moderator)/
│       │   ├── (admin)/
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── auth/            # pi-login, logout (fondation uniquement)
│       │   │       ├── users/           # /users/me (fondation uniquement)
│       │   │       └── admin/           # gestion des rôles/suspension (fondation uniquement)
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── modules/
│       │   ├── identity/
│       │   │   ├── controllers/
│       │   │   ├── services/
│       │   │   │   ├── PiTokenVerificationService.ts   # emplacement préparé, logique non développée
│       │   │   │   └── SessionService.ts               # emplacement préparé, logique non développée
│       │   │   ├── repositories/
│       │   │   ├── validations/
│       │   │   └── types/
│       │   ├── audit/
│       │   └── payments/                # dossier créé, VIDE de logique — cf. section « paiements non développés »
│       │       └── pi/
│       │           ├── auth/            # emplacement du wrapper pi-sdk-nextjs côté auth
│       │           ├── u2a/             # vide
│       │           └── a2u/             # vide
│       ├── shared/
│       │   ├── middleware/
│       │   ├── events/
│       │   ├── errors/
│       │   ├── logger/
│       │   ├── scheduler/               # interface d'abstraction SchedulerPort (voir Redis ci-dessus), vide d'implémentation
│       │   └── config/
│       ├── components/
│       │   └── pi/                      # composants générés par `pi-sdk-nextjs-install` (PiButton, etc.)
│       ├── prisma/
│       │   ├── schema.prisma            # modèles fondation uniquement
│       │   └── migrations/
│       ├── public/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── architecture/
│   ├── adr/
│   └── runbooks/
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── README.md
└── package.json
```

*Seuls les modules `identity` et `audit` contiennent une logique prévue pour ce Sprint 0. Le dossier `modules/payments/` est créé pour respecter la structure cible, mais reste vide de toute implémentation, conformément à la décision de ne pas développer les paiements à ce stade.*

---

## C. Dépendances MVP finales

### Production
| Dépendance | Rôle | Statut |
|---|---|---|
| `next`, `react`, `react-dom` | Framework applicatif | Confirmé |
| `typescript` | Typage statique | Confirmé |
| `tailwindcss`, `postcss`, `autoprefixer` | Style | Confirmé |
| `@prisma/client` | Accès PostgreSQL | Confirmé |
| `zod` | Validation des entrées | Confirmé |
| `pino` | Logs structurés | Confirmé |
| `@sentry/nextjs` | Monitoring | Confirmé |
| Génération sécurisée d'identifiant (ex. module `crypto` natif Node.js) | Génération de l'identifiant de session opaque — voir section E | Confirmé, aucune dépendance externe requise (API native suffisante) |
| `pi-sdk-nextjs` | Wrapper Pi officiel pour Next.js | **Confirmé comme package officiel existant** — méthode d'installation exacte en section F |
| `pi-sdk-react`, `pi-sdk-js` | Dépendances sous-jacentes de `pi-sdk-nextjs` | Confirmées, installées conjointement selon la documentation officielle du package |
| ~~`ioredis`~~ | ~~Client Redis~~ | **Retiré du MVP** (décision verrouillée ci-dessus) |

### Développement
| Dépendance | Rôle |
|---|---|
| `eslint`, `eslint-config-next`, `prettier` | Qualité de code |
| `vitest`, `@vitest/coverage-v8` | Tests unitaires/intégration |
| `@playwright/test` | Tests E2E |
| `@types/node`, `@types/react` | Types |
| `prisma` (CLI) | Migrations |
| `tsx` | Exécution de scripts TypeScript |

---

## D. Variables d'environnement finales

### Publiques
| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_PI_SANDBOX_MODE` | Active le mode sandbox du SDK Pi côté client |
| `NEXT_PUBLIC_APP_ENV` | Identifiant d'environnement |

### Serveur uniquement
| Variable | Rôle | Statut |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | Confirmé |
| `DATABASE_CONNECTION_LIMIT` | Pool Prisma | À valider (plan Render) |
| `SESSION_COOKIE_NAME` | Nom du cookie de session TopLuxe | Nouveau — voir section E |
| `SESSION_TOKEN_PEPPER` | Valeur secrète additionnelle combinée au hash du token de session (défense en profondeur) | Nouveau — voir section E |
| `PI_API_KEY_TESTNET` / `PI_API_KEY_MAINNET` | Clés API application Pi | Confirmé, valeurs non renseignées à ce stade |
| `PI_APP_WALLET_PRIVATE_SEED_TESTNET` / `_MAINNET` | Clés privées portefeuille applicatif | **Non nécessaires au Sprint 0** — les paiements ne sont pas développés, cette variable ne doit être introduite qu'au ticket du module Paiements |
| `OBJECT_STORAGE_*` | Stockage médias | Préparé, non utilisé au Sprint 0 |
| `KYC_DOCUMENT_STORAGE_*` | Stockage documents KYC | Préparé, non utilisé au Sprint 0 |
| `EMAIL_PROVIDER_API_KEY` | E-mails transactionnels | Préparé, non utilisé au Sprint 0 |
| `SENTRY_DSN` | Monitoring | Confirmé |
| ~~`REDIS_URL`~~ | ~~Connexion Redis~~ | **Retiré, à réintroduire uniquement lors de l'évolution future** |
| `FX_RATE_SOURCE_CONFIG` | Taux de change Pi/fiat | **NON CONFIRMÉ, non renseigné, hors périmètre Sprint 0** |

---

## E. Architecture de session (session serveur opaque)

Conformément à la décision verrouillée, la session TopLuxe **n'est pas un JWT**. Mécanisme retenu :

1. À l'issue d'une authentification Pi validée (voir section F), le serveur génère un identifiant de session **aléatoire et suffisamment long** (généré côté serveur via un générateur cryptographiquement sûr, ex. l'API `crypto` native de Node.js — aucune dépendance externe nécessaire).
2. Le serveur ne conserve **jamais** cet identifiant en clair : seul son **hash** (fonction de hachage cryptographique, avec un « pepper » applicatif additionnel via `SESSION_TOKEN_PEPPER`) est stocké dans la table `sessions`, conformément au modèle déjà spécifié (`token_hash`).
3. L'identifiant en clair est transmis au navigateur via un **cookie** :
   - `HttpOnly` : systématique, aucune exception, pour empêcher tout accès depuis du JavaScript côté client.
   - `Secure` : activé en staging et production (désactivable uniquement en développement local en HTTP).
   - `SameSite` : à définir selon le contexte d'exécution réel dans le Pi Browser — **à valider techniquement au moment de l'implémentation du ticket concerné**, car le comportement du Pi Browser (WebView) vis-à-vis des cookies tiers/`SameSite=Strict` n'est pas documenté dans les sources Pi Network consultées à ce jour ; `Lax` est une valeur de départ raisonnable mais **non figée**.
   - Expiration : durée de vie contrôlée côté serveur (valeur exacte à définir avec le fondateur, cohérente avec le choix déjà acté d'authentification renforcée pour les comptes internes à privilèges).
4. **Révocation côté serveur** : chaque requête authentifiée revérifie la validité de la session en base (`revoked_at IS NULL AND expires_at > now()`). La révocation (déconnexion explicite, suspension de compte, ou action admin) consiste simplement à renseigner `revoked_at`, rendant la session immédiatement invalide sans attendre son expiration naturelle.

### Modèle Prisma `Session` (mis à jour, aucun changement structurel par rapport à la version précédente — confirmation que le modèle déjà spécifié convient strictement à une architecture de session opaque)

```prisma
model Session {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  tokenHash  String    @unique @map("token_hash") // hash(token_clair + SESSION_TOKEN_PEPPER)
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime  @map("expires_at")
  revokedAt  DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("sessions")
}
```

*Aucun champ supplémentaire n'est requis : le modèle déjà validé dans le document de spécifications techniques était déjà conçu comme une session opaque (présence de `token_hash`, absence de tout champ suggérant un JWT auto-porteur), donc cette décision ne nécessite pas de migration de schéma différente de celle déjà prévue au ticket TLX-004.*

---

## F. Architecture Pi Network officiellement confirmée

### Mécanisme officiel recommandé pour Next.js
**Confirmé** : `pi-sdk-nextjs` est un package officiel maintenu par l'organisation `pi-apps`, explicitement conçu pour scaffolder l'intégration Pi (authentification et paiements) dans un projet Next.js(cite index="44-1">, ce package aidant à scaffolder, configurer et intégrer rapidement tous les composants nécessaires pour les paiements Pi Network, l'authentification et les flux utilisateur dans un projet Next.js, étant conçu pour les applications Next.js modernes que ce soit avec l'App Router ou le Pages Router</cite>. Ceci confirme, avec une source distincte et plus précise que le guide GenAI déjà cité précédemment, que le nom du package n'est pas une invention.

### Nom exact du package
**`pi-sdk-nextjs`** — confirmé. Il dépend lui-même de `pi-sdk-react` et `pi-sdk-js`(cite index="43-1">, ce package aidant à scaffolder l'intégration Pi Network dans un projet Next.js moderne, App Router ou Pages Router, avec une expérience de paiement et d'authentification idiomatique et un minimum de code répétitif</cite>.

**Nuance à noter, pas une invention mais une précision de méthode d'installation** : la documentation officielle du package montre deux méthodes d'installation dans ses exemples — une installation standard via le registre npm (`npm install pi-sdk-nextjs`) et une installation directe depuis le dépôt GitHub (`yarn add pi-sdk-nextjs@https://github.com/pi-apps/pi-sdk-nextjs`)(cite index="43-1">, l'ajout du package se faisant via `yarn add pi-sdk-nextjs pi-sdk-react pi-sdk-js` ou `npm install pi-sdk-nextjs pi-sdk-react pi-sdk-js`, avec un exemple alternatif d'installation directement depuis le dépôt GitHub du package</cite>. **Point à vérifier au moment de l'exécution réelle de l'installation (ticket concerné)** : confirmer que la version publiée sur le registre npm public est à jour et stable, ou utiliser l'installation directe depuis GitHub si ce n'est pas le cas — ceci n'est pas un point bloquant mais une vérification pratique de dernière minute, non une incertitude sur le nom du package lui-même.

### Méthode d'installation
1. `npm install pi-sdk-nextjs` (ou `yarn add`), qui installe également ses dépendances `pi-sdk-react` et `pi-sdk-js`.
2. Exécution du scaffolder officiel : `pi-sdk-nextjs-install`, une commande CLI fournie par le package qui génère automatiquement les composants et fichiers de routes API nécessaires(cite index="43-1">, l'exécution du scaffolder de composants et d'API Pi se faisant via la commande dédiée, l'édition ultérieure des fichiers générés (composant PiButton, fichiers de routes API) étant laissée libre, les nouvelles versions du SDK ne écrasant pas les fichiers existants sauf suppression préalable ou usage d'un indicateur de forçage</cite>.
3. Chargement explicite du script SDK fondamental dans le layout de l'application, via le composant `next/script` de Next.js, avec une stratégie de chargement adaptée(cite index="43-1">, le chargement du SDK Pi sur les pages se faisant via l'ajout d'un composant Script important depuis next/script, pointant vers l'URL officielle du SDK avec une stratégie de chargement avant interaction</cite>.

### Compatibilité avec Next.js App Router
**Confirmée explicitement** : le package est conçu pour fonctionner aussi bien avec l'App Router qu'avec le Pages Router — il n'y a donc pas d'incompatibilité entre notre choix d'App Router (déjà verrouillé en section A) et l'intégration Pi Network.

### Contraintes Client Component
Non explicitement détaillées dans la documentation du package lui-même au niveau consulté, mais **cohérentes avec le principe déjà confirmé** dans l'addendum précédent : le SDK Pi (fondamental ou wrapper) ne fonctionne que côté client, à l'intérieur du Pi Browser. Le composant généré par le scaffolder (`PiButton`) est, par construction, un composant interactif — il doit donc être un Client Component (`'use client'`). **Ceci reste une règle de conception à vérifier concrètement sur le composant généré au moment de l'exécution du scaffolder**, plutôt qu'une garantie textuelle explicite trouvée dans la documentation à ce stade — elle n'est donc pas contredite, mais mérite une vérification pratique lors du ticket d'implémentation.

### Mécanisme d'authentification, scope `username`, transfert de l'`accessToken`, validation `/v2/me`
**Confirmés dans l'addendum précédent, non modifiés par cette vérification** :
- Authentification initiale avec le scope `['username']` uniquement.
- `accessToken` obtenu côté client, systématiquement transmis au backend TopLuxe.
- Validation backend obligatoire via `GET https://api.minepi.com/v2/me` avec l'en-tête `Authorization: Bearer {accessToken}`, retournant un `UserDTO` (200) ou une erreur (401).
- Création de la session TopLuxe (désormais précisée comme session opaque, section E) uniquement après validation positive.

Cette nouvelle vérification centrée sur `pi-sdk-nextjs` ne remet rien en cause sur ces points : elle confirme simplement que le package officiel encapsule ce même mécanisme sous-jacent, sans introduire de logique différente.

---

## G. Stratégie PostgreSQL / Prisma

- Seuls les modèles de fondation sont créés au Sprint 0 : `User`, `Role`, `UserRole`, `Session`, `AuditLog` — strictement identiques à ceux déjà spécifiés dans le document de spécifications techniques, sans ajout ni omission.
- Aucune table métier (produits, commandes, paiements, escrow, etc.) n'est créée à ce stade, conformément à la décision « base de données minimale ».
- Migration initiale : `prisma migrate dev` en local, correspondant exactement au ticket TLX-004 (modèle de données Identité) du backlog déjà validé.
- Le champ `SESSION_TOKEN_PEPPER` (section D) n'est pas un champ de base de données mais une variable d'environnement utilisée par le service applicatif de hachage — aucun impact sur le schéma Prisma.

---

## H. Stratégie Git/GitHub

*Inchangée par rapport à la fondation technique précédente — confirmée sans modification :*
- Branches : `main` (protégée), `develop`, `feature/TLX-XXX-description`, `hotfix/description`.
- Convention de commit : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `security:`, avec référence au ticket entre parenthèses.
- Pull request obligatoire, revue requise, CI verte obligatoire, push direct interdit sur `main`.

---

## I. CI/CD

*Inchangée dans sa structure — confirmée, avec une précision : aucune étape de la CI ne nécessite les secrets Pi Network au Sprint 0, puisque les paiements ne sont pas développés et que les tests d'authentification Pi (une fois écrits, au ticket TLX-006) s'exécuteront contre le Sandbox local, pas contre un environnement nécessitant un secret stocké en CI.*

1. Installation des dépendances.
2. Vérification TypeScript.
3. Lint.
4. Tests unitaires/intégration (Vitest).
5. Build (`next build`).
6. *(Différé)* Tests E2E Playwright, activés une fois l'environnement de staging prêt.

---

## J. Stratégie Render

*Inchangée, avec une simplification directe liée au retrait de Redis :*
- Service web Next.js + instance PostgreSQL, pour staging et production.
- **Aucune instance Redis à provisionner au MVP initial** (décision verrouillée).
- Variables d'environnement listées en section D, sans les variables liées aux paiements Pi (non nécessaires tant que ce module n'est pas développé).
- Aucun déploiement réel effectué à ce stade.

---

## K. Checklist avant le premier commit

- [ ] Arborescence conforme à la section B créée.
- [ ] `package.json` avec les dépendances de la section C (sans `ioredis`, avec `pi-sdk-nextjs`/`pi-sdk-react`/`pi-sdk-js`).
- [ ] `.env.example` conforme à la section D (sans `REDIS_URL`, sans les clés de portefeuille applicatif Pi).
- [ ] `.gitignore`, ESLint, Prettier, TypeScript, Tailwind configurés.
- [ ] Schéma Prisma limité aux modèles de fondation (section G).
- [ ] Workflow CI fonctionnel sur une pull request de test.
- [ ] Protection de la branche `main` activée.
- [ ] `SchedulerPort` (interface d'abstraction, vide d'implémentation) créée dans `shared/scheduler/`, pour permettre l'ajout futur de Redis sans réécriture.
- [ ] Documentation initiale (README, ADR) en place, mentionnant explicitement les décisions de ce Sprint 0 (session opaque, Redis différé, paiements non développés).

## L. Checklist avant installation/intégration Pi

- [ ] Confirmation que `pi-sdk-nextjs` est toujours le package recommandé au moment de l'installation réelle (la documentation Pi évoluant, une revérification rapide avant `npm install` est une bonne pratique, cf. addendum précédent section 24).
- [ ] Choix effectué entre installation registre npm standard et installation directe GitHub, selon l'état de publication constaté au moment de l'installation (section F).
- [ ] Les deux applications Pi (Testnet, Mainnet) sont enregistrées sur le Developer Portal (prérequis externe, déjà planifié au ticket TLX-002 du backlog).
- [ ] Le script fondamental Pi (`https://sdk.minepi.com/pi-sdk.js`) est chargé via `next/script` dans le layout, avec la stratégie de chargement documentée.
- [ ] Le composant généré par le scaffolder (`PiButton` ou équivalent) est vérifié comme Client Component avant toute utilisation dans une route de l'App Router.
- [ ] `NEXT_PUBLIC_PI_SANDBOX_MODE=true` est actif en développement avant tout test d'authentification.
- [ ] Aucune clé API Pi réelle ni clé privée de portefeuille applicatif n'est requise pour cette étape (l'authentification seule ne nécessite pas le scope `payments` ni le portefeuille applicatif) — leur introduction est différée au module Paiements, hors périmètre de ce Sprint 0.

---

## M. Éléments encore NON CONFIRMÉS

- **NON CONFIRMÉ — NE PAS IMPLÉMENTER** : tout mécanisme d'escrow natif Pi pour applications tierces (inchangé depuis l'addendum précédent).
- **NON CONFIRMÉ — NE PAS IMPLÉMENTER** : toute source de taux de change Pi/fiat officielle (inchangé), renforcé par l'interdiction confirmée de l'échange Pi/fiat pendant la période Enclosed Network.
- **NON CONFIRMÉ** : délai prévisible d'approbation d'une application pour le listing mainnet (inchangé).
- **NON CONFIRMÉ** : comportement exact de l'attribut `SameSite` du cookie de session TopLuxe à l'intérieur du contexte du Pi Browser (WebView) — aucune information officielle Pi Network trouvée sur ce point précis ; à valider par un test pratique lors du ticket d'implémentation de la session (TLX-006/007), pas par une hypothèse.
- **NON CONFIRMÉ** : statut exact de publication de `pi-sdk-nextjs` sur le registre npm public au moment de l'installation réelle (la documentation présente les deux méthodes d'installation sans trancher laquelle est la référence actuelle) — à vérifier au moment de l'exécution du ticket, pas anticipé ici.
- **Explicitement hors périmètre de ce Sprint 0, non traité, non développé** : cycle U2A complet, flux A2U, escrow applicatif, réconciliation, libération automatique — leur architecture doit être validée séparément avec la documentation officielle avant tout code, conformément à la décision 5.

---

*Cette version constitue la validation finale du Sprint 0. Aucun code métier n'a été produit. TLX-001 n'a pas été démarré. Le développement peut commencer une fois cette version explicitement approuvée par le fondateur.*
