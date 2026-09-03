# TopLuxe — Fondation Technique du Repository (Sprint 0)

*Basé sur : document produit officiel, architecture technique, spécifications techniques détaillées, backlog MVP, addendum Pi Network Authentication*
*Statut : préparation de la fondation technique — aucune fonctionnalité métier développée, conforme à la consigne*

---

## 0. Vérification préalable de cohérence de la stack

Format utilisé pour tout point problématique : **PROBLÈME DÉTECTÉ / CAUSE / IMPACT / SOLUTION RECOMMANDÉE**. Aucune incompatibilité bloquante n'a été identifiée entre la stack proposée et les documents de référence. Trois points d'attention (non bloquants) sont toutefois signalés.

### Point d'attention 1 — Pi SDK et rendu côté serveur (Next.js App Router)

**PROBLÈME DÉTECTÉ** : le Pi SDK (et ses wrappers, y compris `pi-sdk-nextjs`) ne peut fonctionner que côté client, dans le Pi Browser, comme confirmé dans l'addendum précédent.
**CAUSE** : l'App Router de Next.js privilégie par défaut les Server Components, qui ne peuvent pas exécuter de code SDK Pi.
**IMPACT** : toute page/section impliquant l'authentification ou le paiement Pi doit être explicitement un Client Component (`'use client'`), ce qui n'est pas une incompatibilité en soi mais une contrainte de conception à respecter systématiquement.
**SOLUTION RECOMMANDÉE** : isoler l'intégration Pi dans des composants clients dédiés (ex. `PiAuthProvider`, `PiPaymentButton`), consommés par des pages par ailleurs majoritairement Server Components. À documenter comme règle de conception (voir section E).

### Point d'attention 2 — Prisma et connexions PostgreSQL sur Render

**PROBLÈME DÉTECTÉ** : aucun, mais un point à valider.
**CAUSE** : le nombre de connexions simultanées supportées par une instance PostgreSQL Render dépend du plan choisi, information non présente dans nos documents de référence (qui ne fixent pas de plan Render précis).
**IMPACT** : un mauvais dimensionnement du pool de connexions Prisma pourrait saturer la base en cas de montée en charge, même limitée.
**SOLUTION RECOMMANDÉE** : **À VALIDER** — le plan Render PostgreSQL et la configuration du pool Prisma (`connection_limit`) devront être choisis ensemble lors du Sprint 0, en fonction du plan retenu.

### Point d'attention 3 — Redis « si nécessaire »

**PROBLÈME DÉTECTÉ** : aucun, mais une clarification est nécessaire.
**CAUSE** : nos documents précédents identifient des jobs planifiés (réconciliation de paiement, libération automatique d'escrow, expiration de réservation) qui nécessitent un ordonnanceur, mais ne tranchent pas explicitement si Redis est requis pour cela au MVP ou si un ordonnanceur plus simple suffit.
**IMPACT** : impact sur la liste de dépendances (section B) et sur la configuration Render (section J).
**SOLUTION RECOMMANDÉE** : **À VALIDER** — Redis est préparé comme dépendance optionnelle (section B), non activée par défaut tant que le mécanisme exact des jobs planifiés n'est pas tranché avec l'équipe technique.

Aucun autre point de friction identifié entre TypeScript/Next.js/Tailwind, PostgreSQL/Prisma, Vitest/Playwright, GitHub Actions et le monolithe modulaire déjà recommandé dans l'architecture technique validée.

---

## A. Arborescence complète du repository

```
topluxe/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy-staging.yml
├── .vscode/
│   └── settings.json
├── apps/
│   └── web/                          # Application Next.js unique (frontend + API routes backend)
│       ├── app/                      # App Router
│       │   ├── (public)/             # Routes accessibles sans authentification
│       │   │   ├── page.tsx          # Accueil / catalogue public
│       │   │   └── products/[id]/page.tsx
│       │   ├── (buyer)/              # Routes acheteur authentifié
│       │   │   ├── orders/
│       │   │   └── profile/
│       │   ├── (seller)/             # Routes vendeur
│       │   │   ├── dashboard/
│       │   │   ├── products/
│       │   │   └── kyc/
│       │   ├── (expert)/             # Routes expert authentificateur
│       │   │   └── reviews/
│       │   ├── (moderator)/          # Routes modérateur
│       │   │   └── disputes/
│       │   ├── (admin)/              # Routes back-office admin
│       │   │   ├── users/
│       │   │   ├── settings/
│       │   │   └── audit-logs/
│       │   ├── api/                  # Route handlers (backend REST, monolithe modulaire)
│       │   │   └── v1/
│       │   │       ├── auth/
│       │   │       ├── users/
│       │   │       ├── verifications/
│       │   │       ├── products/
│       │   │       ├── expert/
│       │   │       ├── payments/
│       │   │       ├── internal/     # Endpoints internes (jamais exposés publiquement, cf. spec Escrow/A2U)
│       │   │       ├── orders/
│       │   │       ├── conversations/
│       │   │       ├── disputes/
│       │   │       ├── notifications/
│       │   │       └── admin/
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── modules/                  # Cœur métier, séparé strictement par module (cf. architecture validée)
│       │   ├── identity/
│       │   │   ├── controllers/
│       │   │   ├── services/
│       │   │   ├── repositories/
│       │   │   ├── validations/
│       │   │   └── types/
│       │   ├── audit/
│       │   ├── kyc/
│       │   ├── catalog/
│       │   ├── curation/
│       │   ├── payments/
│       │   │   └── pi/               # Intégration Pi Network isolée dans le module Paiements
│       │   │       ├── auth/         # Emplacement authentification Pi (voir section I)
│       │   │       ├── u2a/
│       │   │       └── a2u/
│       │   ├── escrow/               # Structure préparée uniquement — logique non développée à ce stade
│       │   ├── orders/
│       │   ├── logistics/
│       │   ├── messaging/
│       │   ├── disputes/
│       │   ├── notifications/
│       │   ├── admin/
│       │   └── commissions/
│       ├── shared/
│       │   ├── middleware/           # auth, rôles, rate limiting, gestion d'erreurs
│       │   ├── events/               # bus d'événements interne (pub/sub)
│       │   ├── errors/               # classes d'erreurs applicatives normalisées
│       │   ├── logger/               # logs structurés
│       │   └── config/               # lecture typée des variables d'environnement
│       ├── components/               # Composants UI partagés (Tailwind)
│       │   └── pi/                   # Composants clients dédiés Pi (PiAuthProvider, etc. — voir point d'attention 1)
│       ├── prisma/
│       │   ├── schema.prisma
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
│       └── playwright.config.ts
├── docs/
│   ├── architecture/                 # copie des documents de référence validés
│   ├── adr/                          # Architecture Decision Records
│   └── runbooks/
├── .gitignore
├── .editorconfig
├── .eslintrc.json
├── .prettierrc
├── README.md
└── package.json                      # racine (workspace si monorepo à outils multiples)
```

*Choix d'architecture retenu : une application Next.js unique hébergeant à la fois le frontend et le backend via les Route Handlers de l'App Router, conformément à la stack imposée et au principe de monolithe modulaire déjà validé. Le dossier `modules/` porte la séparation stricte par domaine métier exigée par l'architecture technique (section 2 du document d'architecture), les `app/api/v1/**` routes agissant comme couche d'entrée fine qui délègue immédiatement aux contrôleurs de `modules/*/controllers`.*

---

## B. Liste complète des dépendances

### Dépendances de production

| Dépendance | Rôle |
|---|---|
| `next` | Framework applicatif (frontend + backend via Route Handlers) |
| `react`, `react-dom` | Bibliothèque UI requise par Next.js |
| `typescript` | Typage statique, exigé par la stack validée |
| `tailwindcss`, `postcss`, `autoprefixer` | Système de style utilitaire |
| `@prisma/client` | Client généré pour l'accès à PostgreSQL |
| `prisma` | CLI et outillage de migration (souvent en devDependency, mentionné ici pour clarté) |
| `zod` | Validation des entrées (schémas de validation pour les endpoints API, cf. section 7 sécurité) |
| `jose` ou équivalent JWT | Génération/validation des tokens de session TopLuxe (à confirmer en Sprint 0 — **À VALIDER** entre JWT et cookie de session opaque, cf. addendum Pi Network point 8) |
| `pino` (ou équivalent) | Logs structurés |
| `@sentry/nextjs` | Monitoring d'erreurs |
| Wrapper Pi Network officiel pour Next.js | **À VALIDER au moment de l'installation** : le nom exact du paquet (`pi-sdk-nextjs` ou équivalent) et sa disponibilité sur le registre npm doivent être reconfirmés au moment de l'exécution de `npm install`, conformément à la documentation officielle déjà vérifiée dans l'addendum précédent — ne pas installer de paquet dont le nom n'est pas explicitement confirmé par la documentation Pi au moment du Sprint 0 |
| `ioredis` | Client Redis — **installé uniquement si le point d'attention 3 est tranché en faveur de Redis** |

### Dépendances de développement

| Dépendance | Rôle |
|---|---|
| `eslint`, `eslint-config-next` | Analyse statique de code |
| `prettier` | Formatage de code |
| `vitest` | Tests unitaires et d'intégration (stack imposée) |
| `@vitest/coverage-v8` | Couverture de tests |
| `@playwright/test` | Tests E2E (stack imposée) |
| `@types/node`, `@types/react` | Types TypeScript |
| `prisma` (CLI) | Génération de schéma, migrations |
| `tsx` ou `ts-node` | Exécution de scripts TypeScript (seed, jobs de développement) |
| `husky` + `lint-staged` | Hooks de pré-commit (lint/format automatique) — **À VALIDER si retenu, non explicitement demandé mais cohérent avec la convention de commit demandée** |

*Aucune dépendance liée à Kubernetes, Kafka, ou tout autre composant d'infrastructure lourde n'a été ajoutée, conformément à la consigne explicite de rester sur un monolithe modulaire.*

---

## C. Rôle de chaque dépendance
*(Intégré directement dans le tableau de la section B ci-dessus, colonne « Rôle », pour éviter toute redondance.)*

---

## D. Configuration des environnements

### Variables publiques (exposées au client, préfixe `NEXT_PUBLIC_`)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_PI_SANDBOX_MODE` | Active le mode sandbox du SDK Pi côté client (`true` en développement, `false` en production) — cf. addendum, point 11 |
| `NEXT_PUBLIC_APP_ENV` | Identifiant d'environnement affichable (development/staging/production), pour bandeaux de debug éventuels |

### Variables serveur uniquement (jamais exposées au client)

| Variable | Rôle | Environnement(s) |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (via Prisma) | Tous |
| `DATABASE_CONNECTION_LIMIT` | Taille du pool de connexions Prisma | Tous — valeur **à valider** (point d'attention 2) |
| `REDIS_URL` | Connexion Redis | Tous, **si Redis retenu** (point d'attention 3) |
| `PI_API_KEY_TESTNET` | Clé API application Pi Testnet | Development, Staging |
| `PI_API_KEY_MAINNET` | Clé API application Pi Mainnet | Production uniquement |
| `PI_APP_WALLET_PRIVATE_SEED_TESTNET` | Clé privée portefeuille applicatif Testnet (A2U) | Staging — protection maximale |
| `PI_APP_WALLET_PRIVATE_SEED_MAINNET` | Clé privée portefeuille applicatif Mainnet | Production — protection maximale, accès minimal |
| `SESSION_TOKEN_SECRET` | Signature des tokens de session TopLuxe | Tous |
| `OBJECT_STORAGE_ENDPOINT` / `OBJECT_STORAGE_ACCESS_KEY` / `OBJECT_STORAGE_SECRET_KEY` / `OBJECT_STORAGE_BUCKET` | Accès au stockage compatible S3 (médias produits) | Tous |
| `KYC_DOCUMENT_STORAGE_*` (mêmes clés, bucket distinct) | Accès isolé et chiffré aux documents KYC — **distinct** du stockage médias produits (exigence de sécurité déjà actée) | Tous |
| `EMAIL_PROVIDER_API_KEY` | Envoi d'e-mails transactionnels | Tous |
| `SENTRY_DSN` | Monitoring d'erreurs | Staging, Production (Development optionnel) |
| `FX_RATE_SOURCE_CONFIG` | Source du taux de change Pi/fiat — **NON CONFIRMÉ, ne pas renseigner tant que le point n'est pas arbitré juridiquement/techniquement (cf. addendum Pi Network, point 11)** | Tous, en attente d'arbitrage |

Le fichier `.env.example` liste ces noms de variables sans aucune valeur réelle, avec un commentaire par variable indiquant sa nature (publique/serveur) et sa criticité, conformément à la consigne de ne jamais inclure de secret réel.

### Stratégie par environnement

| Environnement | Application Pi associée | Base de données | Objectif |
|---|---|---|---|
| Development | Sandbox Pi local (`NEXT_PUBLIC_PI_SANDBOX_MODE=true`) | Instance PostgreSQL locale ou de développement partagée | Travail quotidien |
| Staging | Application Pi **Testnet** dédiée | Instance PostgreSQL Render (staging) | Intégration, E2E automatisés, UAT pilotes |
| Production | Application Pi **Mainnet** dédiée | Instance PostgreSQL Render (production) | Utilisateurs réels |

---

## E. Architecture des modules

Chaque module de `apps/web/modules/*` suit une structure interne identique, pour garantir la cohérence et la testabilité :

- **`controllers/`** : reçoivent la requête (déjà validée par le middleware d'authentification/permissions), orchestrent l'appel aux services, formatent la réponse HTTP. Ne contiennent aucune logique métier.
- **`services/`** : logique métier du module (règles métier, transitions d'état, calculs) — c'est ici que vivent les règles déjà spécifiées dans le document de spécifications détaillées (ex. `EscrowService`, `PaymentReconciliationService`).
- **`repositories/`** : accès aux données via Prisma, isolant le reste du module du détail du schéma.
- **`validations/`** : schémas Zod correspondant exactement aux contraintes du modèle de données déjà spécifié (types, champs obligatoires, contraintes).
- **`types/`** : types TypeScript partagés du module.

**Composants transverses (`shared/`)** :
- `shared/middleware/` : authentification de session, vérification de rôle (RBAC), rate limiting, gestion d'erreurs centralisée.
- `shared/events/` : bus d'événements interne (publication/souscription), conforme à la matrice d'interactions entre modules déjà spécifiée (ex. `payment.completed` consommé par Escrow et Commandes).
- `shared/errors/` : hiérarchie d'erreurs applicatives (ex. `ValidationError`, `ForbiddenError`, `NotFoundError`) mappées vers les codes HTTP corrects.
- `shared/logger/` : wrapper de logs structurés, avec règle explicite de ne jamais logger de données sensibles (voir section 7).

**Règle de conception Pi Network (cf. point d'attention 1)** : toute intégration Pi (authentification, paiement) est isolée dans `modules/payments/pi/` côté logique, et dans `components/pi/` côté composants React clients (`'use client'`), afin qu'aucun Server Component ne tente d'importer directement le SDK Pi.

---

## F. Configuration Git/GitHub

### `.gitignore` (contenu prévu, extrait)
```
node_modules/
.next/
.env
.env.local
.env.*.local
*.log
coverage/
.vercel/
prisma/*.db
```

### Stratégie de branches
- `main` : branche protégée, reflète l'état déployé en production. Fusion uniquement via pull request approuvée, avec CI verte obligatoire.
- `develop` : branche d'intégration continue, reflète l'état déployé en staging.
- `feature/TLX-XXX-description-courte` : une branche par ticket du backlog, créée depuis `develop`.
- `hotfix/description` : correctifs urgents depuis `main`, fusionnés à la fois dans `main` et `develop`.

### Convention de commit (Conventional Commits, alignée sur la demande)
```
feat:     nouvelle fonctionnalité
fix:      correction de bug
refactor: changement de code sans impact fonctionnel
test:     ajout/modification de tests
docs:     documentation uniquement
chore:    tâches de maintenance (dépendances, configuration)
security: correctif ou durcissement de sécurité
```
Format recommandé : `feat(TLX-006): ajout de l'authentification Pi SDK` — le préfixe entre parenthèses référence systématiquement le ticket concerné pour la traçabilité.

### Protection de la branche principale
- Pull request obligatoire avant fusion dans `main` et `develop`.
- Au moins une revue approuvée requise.
- CI (lint, typecheck, tests, build) obligatoirement verte avant fusion — voir section G.
- Interdiction du push direct sur `main`.

### Pull requests
Modèle de PR à inclure dans `.github/PULL_REQUEST_TEMPLATE.md` (ticket concerné, description, checklist de tests effectués, captures d'écran si UI) — **à créer dans le cadre de cette étape de fondation, contenu détaillé laissé à l'équipe.**

---

## G. Configuration CI/CD (GitHub Actions)

Un workflow `ci.yml` déclenché sur chaque pull request et chaque push vers `develop`/`main`, exécutant dans l'ordre :

1. Installation des dépendances (avec cache).
2. Vérification TypeScript (`tsc --noEmit`).
3. Lint (`eslint`).
4. Tests unitaires et d'intégration (`vitest run`).
5. Build (`next build`) — garantit qu'aucune régression de build ne passe en revue.
6. *(Étape optionnelle, à activer une fois l'environnement de staging prêt)* Tests E2E Playwright contre un environnement de staging éphémère.

Aucun secret réel n'est nécessaire pour les étapes 1 à 5 (le build de vérification n'exécute pas d'appel réseau réel vers Pi ou la base de données de production) — seule l'étape 6, une fois activée, nécessitera l'accès aux secrets Testnet via les GitHub Secrets du dépôt, jamais commités.

Un second workflow `deploy-staging.yml`, déclenché sur fusion dans `develop`, préparera le déploiement automatique vers l'environnement Render de staging — **contenu détaillé dépendant de la configuration Render finale, voir section J.**

---

## H. PostgreSQL / Prisma

### Schéma Prisma (modèles confirmés par les spécifications techniques détaillées uniquement)

*Les types, contraintes et index reproduisent strictement le modèle de données déjà validé dans le document de spécifications. Aucun champ ni aucune table n'a été ajouté arbitrairement. Les points nécessitant un arbitrage sont marqués `// À VALIDER`.*

```prisma
// schema.prisma — modèles MVP uniquement, conforme aux spécifications validées

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserStatus {
  active
  pending_verification
  suspended
  banned
}

enum RoleCode {
  buyer
  seller_individual
  seller_pro
  expert
  moderator
  admin
}

model User {
  id            String     @id @default(uuid())
  piUid         String     @unique @map("pi_uid")
  piUsername    String     @map("pi_username")
  email         String?    @unique
  status        UserStatus @default(active)
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  lastLoginAt   DateTime?  @map("last_login_at")

  userRoles         UserRole[]
  sessions          Session[]
  // Relations complémentaires (verifications, products, orders, etc.) à ajouter
  // au fil des tickets correspondants, non dupliquées ici pour rester strictement
  // alignées sur les modules déjà spécifiés en détail.

  @@map("users")
}

model Role {
  id   String   @id @default(uuid())
  code RoleCode @unique

  userRoles UserRole[]

  @@map("roles")
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  roleId    String   @map("role_id")
  grantedAt DateTime @default(now()) @map("granted_at")
  grantedBy String?  @map("granted_by")

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
  @@index([userId])
  @@map("user_roles")
}

model Session {
  id         String    @id @default(uuid())
  userId     String    @map("user_id")
  tokenHash  String    @unique @map("token_hash")
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime  @map("expires_at")
  revokedAt  DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("sessions")
}

model AuditLog {
  id           String   @id @default(uuid())
  actorUserId  String?  @map("actor_user_id")
  actionCode   String   @map("action_code")
  entityType   String   @map("entity_type")
  entityId     String   @map("entity_id")
  details      Json?
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([actorUserId])
  @@index([createdAt])
  @@map("audit_logs")
}

// -----------------------------------------------------------------------
// Les modèles suivants (VerificationRecord, Product, Order, Payment,
// EscrowRecord, Shipment, Conversation, Dispute, Notification,
// PlatformSetting, CommissionRecord, etc.) sont déjà intégralement
// spécifiés — champs, types, contraintes, index — dans le document
// « TopLuxe — Spécifications Techniques Détaillées & Backlog MVP »,
// sections 3.5 à 14.5.
//
// Conformément à la consigne de ne pas développer les fonctionnalités
// métier à cette étape de fondation, ces modèles ne sont volontairement
// PAS retranscrits ici en intégralité : ils seront ajoutés au schéma
// au moment du ticket de modèle de données correspondant à chaque
// module (TLX-009, TLX-012, TLX-015, TLX-017, TLX-021, TLX-024,
// TLX-027, TLX-028, TLX-029, TLX-030, TLX-032, TLX-034), en reprenant
// EXACTEMENT les définitions déjà validées, sans improvisation.
// -----------------------------------------------------------------------
```

*Seuls les modèles fondation (User, Role, UserRole, Session, AuditLog — modules Identité & Audit, premiers tickets du backlog) sont retranscrits intégralement ici, car ce sont les seuls concernés par cette étape de préparation. Les autres modèles restent dans le document de spécifications comme source de vérité et seront ajoutés module par module, jamais anticipés.*

### Stratégie de migration
- `prisma migrate dev` en développement local.
- `prisma migrate deploy` en CI/CD pour staging et production (jamais `db push` en production).
- Chaque migration correspond à un ticket du backlog (ex. la migration créant `users`/`roles`/`sessions` correspond à TLX-004).

---

## I. Préparation Pi Network

*Conformément à la consigne, aucune simulation, aucun faux endpoint, aucune clé réelle. Uniquement l'emplacement architectural et la référence aux mécanismes déjà confirmés dans l'addendum Pi Network Authentication.*

| Élément | Emplacement prévu | Mécanisme de référence (déjà confirmé) |
|---|---|---|
| Initialisation Pi | `apps/web/components/pi/PiProvider.tsx` (composant client) | Inclusion du script fondamental + wrapper `pi-sdk-nextjs` (nom de paquet à reconfirmer au moment de l'installation) |
| Authentification (scope `username`) | `apps/web/modules/payments/pi/auth/` (logique), `apps/web/components/pi/PiLoginButton.tsx` (UI) | Scope `['username']` uniquement à la connexion, cf. addendum point 5 |
| Récupération de l'`accessToken` | Géré par le wrapper côté client, transmis via `apps/web/app/api/v1/auth/pi-login/route.ts` | Transfert systématique vers le backend, jamais de confiance côté client seul |
| Validation backend `GET /v2/me` | `apps/web/modules/identity/services/PiTokenVerificationService.ts` (structure prévue, logique non développée à ce stade) | `GET https://api.minepi.com/v2/me` avec `Authorization: Bearer {accessToken}` |
| Session TopLuxe | `apps/web/modules/identity/services/SessionService.ts` (structure prévue) | Création de session uniquement après validation positive de `/v2/me` |
| Gestion des erreurs / annulation | `apps/web/components/pi/PiLoginButton.tsx` (structure de gestion d'erreur prévue) | Cas d'annulation traité distinctement d'une erreur technique, cf. addendum point 9 |
| Callback paiement incomplet | `apps/web/modules/payments/pi/u2a/incompletePaymentHandler.ts` (emplacement préparé, logique non développée) | Callback obligatoire de l'appel d'authentification, cf. addendum point 10 |
| Séparation Testnet/Sandbox vs Production/Mainnet | Variables d'environnement (`NEXT_PUBLIC_PI_SANDBOX_MODE`, `PI_API_KEY_TESTNET`/`PI_API_KEY_MAINNET`) + deux applications Pi distinctes déjà actées | cf. addendum point 11 et section D ci-dessus |

**NE PAS DÉVELOPPER à ce stade** : le cycle U2A complet (create/approve/complete), le flux A2U, et l'escrow applicatif — ces emplacements sont préparés (dossiers `modules/payments/pi/u2a/`, `modules/payments/pi/a2u/`, `modules/escrow/`) mais restent vides de logique, conformément à la consigne explicite.

**NON CONFIRMÉ — NE PAS IMPLÉMENTER** : tout mécanisme d'escrow natif Pi, toute source de taux de change Pi/fiat officielle — ces points restent non résolus et ne doivent donner lieu à aucune implémentation, même préparatoire, tant qu'ils ne sont pas arbitrés.

---

## J. Préparation Render

| Composant | Préparation prévue | Statut |
|---|---|---|
| Service web (Next.js) | Build command `npm run build`, start command `npm run start`, health check sur une route dédiée `apps/web/app/api/health/route.ts` (à créer, retour 200 simple sans dépendance externe) | Prêt à configurer |
| Base de données PostgreSQL | Instance Render distincte pour staging et production | Plan Render **à valider** (point d'attention 2) |
| Redis | Instance Render optionnelle | **À VALIDER** (point d'attention 3) |
| Variables d'environnement | Toutes les variables listées en section D, configurées via l'interface Render, jamais commitées | Liste prête, valeurs à saisir manuellement lors du déploiement |
| Stratégie de migration Prisma | `prisma migrate deploy` exécuté comme étape de build ou comme job de déploiement dédié — **choix exact à valider** (build step vs job séparé) | À valider |
| Staging / Production | Deux services Render distincts, chacun connecté à sa propre base et à sa propre application Pi (Testnet pour staging, Mainnet pour production) | Prêt à configurer, cohérent avec section D |

**Aucun déploiement n'est effectué à ce stade**, conformément à la consigne.

---

## K. Checklist de validation avant le premier ticket (TLX-001)

- [ ] Arborescence du repository créée conformément à la section A.
- [ ] `package.json` initialisé avec les dépendances de la section B (sans le wrapper Pi tant que son nom exact n'est pas reconfirmé).
- [ ] Configuration TypeScript, ESLint, Prettier, Tailwind en place.
- [ ] `.env.example` créé avec toutes les variables de la section D, sans valeur réelle.
- [ ] `.gitignore` en place, aucun secret ne peut être commité par erreur.
- [ ] Schéma Prisma initial (User, Role, UserRole, Session, AuditLog) créé conformément à la section H.
- [ ] Workflow CI GitHub Actions (`ci.yml`) fonctionnel sur une pull request de test.
- [ ] Protection de la branche `main` activée.
- [ ] Structure de dossiers de tests (`tests/unit`, `tests/integration`, `tests/e2e`) en place, avec configuration Vitest et Playwright fonctionnelle sur un test trivial.
- [ ] Documentation initiale (README, ADR vide, architecture) en place conformément à la section L ci-après.
- [ ] Décision actée sur le wrapper Pi Network exact pour Next.js (nom de paquet reconfirmé dans la documentation officielle au moment de l'installation).
- [ ] Décision actée sur Redis (activé ou non au MVP).
- [ ] Décision actée sur le plan Render PostgreSQL et le dimensionnement du pool Prisma.
- [ ] Deux applications Pi (Testnet, Mainnet) déjà enregistrées conformément à TLX-002 (prérequis externe à cette étape de fondation, déjà planifié dans le backlog).

---

## L. Liste des problèmes détectés

*(Synthèse des points d'attention de la section 0 — aucun n'est bloquant, tous nécessitent une décision avant ou pendant le Sprint 0.)*

1. Contrainte de conception Client Component pour toute intégration Pi (App Router) — non bloquant, à documenter comme règle d'équipe.
2. Dimensionnement du pool de connexions Prisma/Render non déterminable sans choix de plan Render — **À VALIDER**.
3. Nécessité réelle de Redis au MVP non tranchée par les documents précédents — **À VALIDER**.

## M. Liste des décisions encore nécessaires

1. Nom exact et disponibilité effective du paquet wrapper Pi pour Next.js à reconfirmer au moment de l'installation (le principe est confirmé, le nom précis doit être revérifié).
2. JWT vs cookie de session opaque pour la session TopLuxe (les deux sont autorisés par Pi Network, le choix est entièrement à la main de TopLuxe — cf. addendum point 8).
3. Activation ou non de Redis pour les jobs planifiés (réconciliation, libération automatique d'escrow, expiration de réservation).
4. Plan Render PostgreSQL et configuration du pool de connexions associée.
5. Étape de migration Prisma en déploiement Render : intégrée au build ou job séparé.
6. Adoption ou non de Husky/lint-staged (cohérent avec la convention de commit demandée, mais non explicitement requis).

---

*Ce document constitue la préparation de la fondation technique du projet TopLuxe. Aucune fonctionnalité métier n'a été développée. Le premier ticket à implémenter reste TLX-001 du backlog déjà validé, une fois les décisions de la section M arbitrées.*
