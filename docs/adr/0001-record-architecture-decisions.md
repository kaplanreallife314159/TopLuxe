# ADR 0001 — Décisions d'architecture actées au Sprint 0 (TLX-001)

Statut : Accepté
Date : voir historique Git du dépôt

## Contexte
Ce premier ADR consigne les décisions structurantes déjà validées dans les documents de
référence TopLuxe (document produit, architecture technique, spécifications techniques
détaillées, backlog MVP, addendum Pi Network Authentication, Sprint 0 verrouillé), au moment de
la création de la fondation technique du dépôt (TLX-001).

## Décisions

1. **Monolithe modulaire** : une application Next.js unique (App Router), avec un découpage
   strict du code métier par module dans `apps/web/modules/*`, plutôt que des microservices.
2. **Session serveur opaque, pas de JWT** : token aléatoire côté serveur, seul le hash est
   stocké (`sessions.token_hash`), transmis au client via un cookie HttpOnly. Voir
   `apps/web/modules/identity/services/SessionService.ts`.
3. **Redis exclu du MVP initial** : une interface d'abstraction (`SchedulerPort`) est posée pour
   permettre une évolution future sans réécrire la logique des jobs planifiés.
4. **Pi Network — `pi-sdk-nextjs`** : package officiel confirmé pour l'intégration Next.js de
   l'authentification et des paiements Pi. Non installé/câblé à ce stade (TLX-001) : seuls les
   emplacements architecturaux sont préparés (`modules/payments/pi/*`, `components/pi/`).
5. **Base de données minimale au Sprint 0** : uniquement les modèles `User`, `Role`, `UserRole`,
   `Session`, `AuditLog`. Aucune table métier n'est créée avant le ticket correspondant.
6. **Paiements Pi (U2A/A2U) et escrow non développés** : leur architecture doit être validée
   séparément avec la documentation officielle Pi Network avant tout code, conformément à la
   décision actée dans le document Sprint 0.

## Conséquences
Toute déviation par rapport à ces décisions doit faire l'objet d'un nouvel ADR explicite, et non
d'un changement silencieux dans le code.
