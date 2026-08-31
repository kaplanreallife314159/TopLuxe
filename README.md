# TopLuxe

Marketplace premium sur Pi Network — achat et vente de produits haut de gamme en Pi exclusivement.

## Statut du projet

Ce dépôt est au stade **fondation technique (Sprint 0 / TLX-001)**. Aucune fonctionnalité métier
(catalogue, commandes, paiements, escrow, litiges) n'est encore implémentée. Seuls les modules
**Identité** et **Audit** contiennent une structure de code, conformément au ticket TLX-001 du
backlog validé.

L'intégration Pi Network (authentification via `pi-sdk-nextjs`) est préparée architecturalement
(dossiers, emplacements) mais **non implémentée** — elle fait l'objet d'un ticket séparé.
Les paiements Pi (U2A, A2U, escrow) ne sont pas développés.

## Documents de référence

Voir `docs/architecture/` pour les documents de cadrage produit, l'architecture technique complète,
les spécifications techniques détaillées, le backlog MVP, l'addendum Pi Network Authentication et
la version finale verrouillée du Sprint 0. Ces documents sont la source de vérité : ce code doit
rester strictement conforme à ce qu'ils décrivent.

## Stack technique

- Next.js (App Router) + TypeScript
- Monolithe modulaire, API REST via Route Handlers
- PostgreSQL + Prisma
- Tailwind CSS
- Vitest (tests unitaires/intégration), Playwright (E2E)
- Session serveur opaque (cookie HttpOnly, hash en base) — pas de JWT
- Redis explicitement exclu du MVP initial (interface `SchedulerPort` prête pour une évolution future)

## Installation locale

> ⚠️ Ces commandes nécessitent un accès réseau au registre npm et à une base PostgreSQL locale,
> qui n'étaient pas disponibles dans l'environnement ayant généré ce dépôt (voir rapport TLX-001).
> Elles doivent être exécutées dans un environnement de développement standard.

```bash
npm install
cp apps/web/.env.example apps/web/.env
# renseigner DATABASE_URL et les autres variables serveur dans apps/web/.env
npm run prisma:migrate
npm run dev
```

## Variables d'environnement

Voir `apps/web/.env.example` pour la liste complète, avec pour chaque variable une indication
publique/serveur et son rôle. Aucune valeur réelle n'est présente dans ce fichier ni ailleurs
dans le dépôt.

## Tests

```bash
npm run test        # Vitest — unitaires + intégration
npm run test:e2e     # Playwright — E2E
```

## Structure du code

Voir `docs/adr/0001-record-architecture-decisions.md` et les documents dans `docs/architecture/`
pour le détail du découpage en modules (`apps/web/modules/*`) et des règles de conception retenues.
