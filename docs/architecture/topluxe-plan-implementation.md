# TopLuxe — Plan d'Implémentation Technique

*Marketplace premium sur Pi Network*
*Document produit par l'équipe technique (CTO, Tech Lead, Software Architect, Engineering Manager, Senior PM)*
*Version 1.0 — Basé sur le document de référence officiel et l'architecture technique validés*
*Statut : plan d'implémentation, aucune ligne de code produite*

---

## Sommaire

1. Objet du document
2. Phase MVP
3. Phase V1
4. Phase V2
5. Versions futures
6. Feuille de route chronologique (module par module)
7. Checklist de préparation avant le premier commit Git
8. Checklist avant intégration du SDK Pi Network
9. Checklist avant déploiement du MVP
10. Décisions finales du fondateur avant de commencer à coder

---

## 1. Objet du document

Ce document traduit le document de référence officiel et l'architecture technique validés en **plan d'exécution concret**, phase par phase. Il répond à la question "dans quel ordre, avec quoi, et comment on sait qu'une phase est terminée" — sans encore écrire de code. Il servira de base directe pour la création du backlog technique et des tickets de développement.

---

## 2. Phase MVP

### 2.1 Objectifs de la phase
- Démontrer la boucle complète : un vendeur vérifié publie un produit authentifié, un acheteur l'achète en Pi, le paiement est séquestré, le produit est livré (national prioritaire), la réception est confirmée, les fonds sont libérés.
- Fonctionner avec un catalogue restreint et une équipe de curation manuelle.
- Poser les fondations techniques et de sécurité qui ne devront pas être reprises plus tard (auth, audit, gestion des rôles).

### 2.2 Modules à développer
Identité & Authentification · Audit & Journalisation · KYC/KYB (version manuelle) · Catalogue & Fiche Produit · Curation / Authentification Produit · Paiements Pi · Escrow · Commandes · Logistique/Livraison (national) · Messagerie (basique) · Litiges (paliers manuels) · Notifications (in-app) · Back-office Administration (minimal) · Commissions & Facturation (modèle unique).

### 2.3 Ordre de développement justifié

| Ordre | Module | Justification |
|---|---|---|
| 1 | Identité & Authentification | Tout autre module dépend d'un utilisateur authentifié et de ses rôles |
| 2 | Audit & Journalisation | Doit être posé avant que des actions sensibles existent, pour être branché dès le premier module métier |
| 3 | KYC/KYB (manuel) | Prérequis pour autoriser toute vente |
| 4 | Catalogue & Fiche Produit | Nécessaire avant de pouvoir vérifier un vendeur "en action" avec un vrai produit |
| 5 | Curation / Authentification Produit | Dépend du Catalogue (rien à vérifier sans produit soumis) |
| 6 | **Vérification technique du mécanisme d'escrow Pi (spike technique, avant code métier)** | Prérequis bloquant identifié dans l'architecture — doit être validé avant d'engager le développement des Paiements/Escrow |
| 7 | Paiements Pi | Dépend de la validation du point 6 |
| 8 | Escrow | Dépend directement de Paiements Pi (consomme l'événement de complétion) |
| 9 | Commandes | Orchestrateur central, dépend de Catalogue (disponibilité produit) et Paiements (déclenchement) |
| 10 | Logistique / Livraison | Dépend de Commandes (statut expédition) |
| 11 | Messagerie | Fonctionnellement indépendante, peut être développée en parallèle dès que Identité et Catalogue existent |
| 12 | Litiges | Dépend de Commandes, Escrow et Messagerie (accès en lecture) |
| 13 | Notifications | Consomme les événements de tous les modules précédents — doit être branché en continu, mais sa version minimale peut arriver tard |
| 14 | Back-office Administration | Nécessite que les modules qu'il supervise (KYC, Produits, Commandes, Litiges) existent déjà, au moins en version basique |
| 15 | Commissions & Facturation | Dépend d'Escrow (déclenché à la libération des fonds) — peut être développé en toute fin de MVP |

### 2.4 Dépendances clés
- **Bloquante** : le spike technique sur l'escrow Pi (2.3, étape 6) conditionne l'intégralité du flux transactionnel — à traiter en tout premier, avant même l'UI de paiement.
- **Bloquante** : KYC/KYB doit être fonctionnel avant que le Catalogue autorise une soumission réelle de produit par un vendeur.
- **Souple** : Messagerie peut avancer en parallèle des modules Paiements/Escrow, aucune dépendance directe.
- **Externe** : accès validé au Pi Developer Portal et environnement Pi Payments (sandbox puis mainnet) requis avant l'étape 6.

### 2.5 Écrans du MVP
**Acheteur** : Accueil, Catalogue avec filtres, Fiche produit, Messagerie, Checkout, Paiement Pi, Suivi de commande, Historique des commandes, KYC acheteur, Confirmation de réception/ouverture de litige, Formulaire d'avis *(simplifié)*, Profil, Centre de notifications.
**Vendeur** : Tableau de bord, KYC/KYB, Création de fiche produit, Suivi de soumission, Liste des produits, Détail commande reçue, Saisie tracking, Messagerie.
**Expert** : File de travail, Écran de revue, Formulaire de décision.
**Modérateur** : File des litiges, Détail litige, File KYC niveau 1.
**Admin** : Tableau de bord global, Gestion utilisateurs, Gestion produits, Reporting basique, Configuration commission unique, Gestion litiges niveau 2.

### 2.6 API à créer (synthèse — détail complet en section 4 du document d'architecture)
Auth (login Pi, session, profil) · KYC/KYB (soumission, statut, décision) · Catalogue (CRUD produit, soumission, listing/filtrage) · Curation (file, décision) · Paiements (initiation, callbacks approve/complete, statut) · Escrow (création, statut, libération, blocage, remboursement) · Commandes (création, statut, confirmation réception, annulation) · Logistique (enregistrement expédition, statut suivi) · Messagerie (conversation, message) · Litiges (ouverture, preuve, décision) · Notifications (liste, marquage lu) · Admin (utilisateurs, produits, configuration, reporting basique) · Commissions (calcul, historique).

### 2.7 Tables / modèles de données du MVP
User, Role, VerificationRecord, Document, Category, Product, ProductMedia, AuthenticationReview, Order, Payment, EscrowRecord, Shipment, Address, Conversation, Message, Dispute, DisputeEvidence, Notification, CommissionRule, CommissionRecord, AuditLog.
*(Review et ReputationBadge peuvent être posés en modèle simplifié dès le MVP même si l'expérience "réputation" complète arrive en V1.)*

### 2.8 Intégrations externes du MVP
- **Pi Platform** (SDK Authentication + Pi Payments U2A, et A2U si confirmé disponible) — intégration critique.
- **Transporteur(s) national(aux)** — au moins un partenaire pour démarrer.
- **Service d'e-mail transactionnel** — pour les notifications hors app.
- **Stockage objet / CDN** — pour les médias produits.
- KYC/KYB externe **optionnel au MVP** (peut rester en revue manuelle interne selon arbitrage fondateur).

### 2.9 Tests à prévoir
- **Tests unitaires** sur chaque module, en particulier la logique métier sensible (calcul de commission, règles de changement de statut de commande, règles de libération d'escrow).
- **Tests d'intégration** inter-modules : paiement complété → escrow créé → commande mise à jour ; livraison confirmée → compte à rebours de réception déclenché.
- **Tests de bout en bout (E2E)** sur le parcours complet achat → livraison → clôture, et sur le parcours publication produit → authentification → publication.
- **Tests spécifiques Pi Payments** : environnement sandbox Pi obligatoire avant tout test, y compris les cas d'échec (annulation, timeout, double tentative).
- **Tests de sécurité** : contrôle d'accès par rôle (tentative d'action non autorisée), protection des documents KYC, protection contre le rejeu sur les callbacks de paiement.
- **Tests de charge légers** sur les endpoints critiques (catalogue, paiement) pour détecter les problèmes évidents avant le lancement, sans viser une charge de production à ce stade.
- **Recette utilisateur (UAT)** avec un groupe restreint de vendeurs/acheteurs pilotes avant ouverture publique.

### 2.10 Risques spécifiques à la phase MVP
| Risque | Mitigation |
|---|---|
| Le mécanisme d'escrow imaginé n'est pas réalisable tel quel avec l'API Pi Payments actuelle | Spike technique en tout début de phase (2.3, étape 6), avant tout engagement de développement sur Paiements/Escrow |
| Sous-estimation du temps de traitement manuel du KYC et de la curation | Démarrer avec un catalogue volontairement restreint, prévoir de la marge dans le planning |
| Callbacks Pi Payments non reçus ou en doublon | Mécanisme de réconciliation périodique dès le MVP (voir architecture, section 7) |
| Vendeur pilote insatisfait du parcours de mise en vente jugé trop long (KYC + curation) | UAT anticipée avec vendeurs pilotes, ajustement avant ouverture large |

### 2.11 Critères de validation (sortie de phase MVP)
- Un utilisateur peut s'authentifier via Pi SDK, obtenir un KYC validé, publier un produit authentifié, et le voir apparaître au catalogue.
- Un acheteur peut payer ce produit en Pi, avec les fonds visiblement placés en escrow (vérifiable en base et/ou en back-office).
- Le vendeur peut expédier, l'acheteur peut confirmer la réception (manuelle et automatique testées), les fonds sont libérés et la commission prélevée.
- Un litige peut être ouvert, bloque effectivement l'escrow, et peut être résolu manuellement par un modérateur/admin.
- Le back-office permet de superviser l'ensemble sans accès direct à la base de données.
- Tous les tests de la section 2.9 passent, en particulier les tests E2E des deux parcours principaux.
- Aucune donnée KYC n'est accessible sans contrôle d'accès approprié (vérifié par un test de sécurité dédié).

---

## 3. Phase V1

### 3.1 Objectifs de la phase
- Passer d'un fonctionnement artisanal (curation manuelle intensive) à un fonctionnement structuré et partiellement délégué.
- Ouvrir la livraison internationale et le programme Maison Partenaire.
- Donner aux vendeurs de vrais outils (analytics, réputation visible).

### 3.2 Modules à développer / faire évoluer
KYC/KYB (délégation à un prestataire externe) · Logistique internationale · Avis & Réputation (version complète, badges) · Recherche & Découverte · Contenu éditorial / Boutique Partenaire · Analytics & Reporting (enrichi) · Commissions & Facturation (évolution vers un modèle différencié).

### 3.3 Ordre de développement justifié

| Ordre | Module | Justification |
|---|---|---|
| 1 | KYC/KYB → intégration prestataire externe | Réduit la charge opérationnelle qui limite la croissance ; prérequis pour absorber plus de vendeurs |
| 2 | Avis & Réputation (version complète) | Renforce la confiance nécessaire avant d'ouvrir plus largement le catalogue |
| 3 | Logistique internationale | Dépend d'un volume suffisant de demandes internationales pour être priorisé, et de partenaires transporteurs identifiés |
| 4 | Contenu éditorial / Boutique Partenaire | Nécessaire pour onboarder des Maisons Partenaires dans de bonnes conditions |
| 5 | Recherche & Découverte | Devient nécessaire quand le catalogue dépasse la taille gérable par simple filtrage |
| 6 | Analytics & Reporting enrichi | Peut être développé en parallèle, utile pour piloter les décisions de croissance |
| 7 | Évolution du modèle de commission | Dépend de l'arbitrage fondateur sur le modèle cible (A/B/C/D), à intégrer une fois le volume V1 stabilisé |

### 3.4 Dépendances clés
- La délégation du KYC à un prestataire externe est un prérequis souhaitable avant l'ouverture du programme Maison Partenaire (volume de vérifications plus élevé).
- La Logistique internationale dépend de la sélection effective de transporteurs partenaires (décision business, pas seulement technique).
- Recherche & Découverte dépend d'un volume de catalogue suffisant pour être pertinente ; peut être reportée si le catalogue MVP reste restreint plus longtemps que prévu.

### 3.5 Écrans ajoutés/modifiés en V1
Page boutique officielle (vendeur pro), Statistiques de vente (vendeur), écran de filtres avancés (recherche), écran de gestion des maisons partenaires (admin), écran de configuration des zones de livraison internationale (admin), affichage enrichi des badges de réputation (public).

### 3.6 API à créer/étendre
KYC/KYB : nouveaux endpoints d'intégration prestataire (webhook de statut). Logistique : endpoints multi-transporteurs, gestion douane. Avis : endpoints de badges et de calcul de score. Recherche : endpoint de recherche avancée, endpoint d'indexation. Commissions : endpoints de gestion de règles multiples (par catégorie/statut vendeur).

### 3.7 Tables / modèles de données ajoutés
PartnerShop, ReputationBadge (version complète), SearchIndex *(technique, selon solution retenue)*, règles de Commission étendues (CommissionRule avec critères multiples), Zone de livraison (ShippingZone), Contenu éditorial (EditorialContent) si un CMS léger est retenu.

### 3.8 Intégrations externes ajoutées
- **Prestataire KYC/KYB externe** (remplace ou complète la revue manuelle).
- **Transporteurs internationaux spécialisés** (transport de valeur, assurance).
- **Outil d'indexation/recherche** dédié si le volume le justifie.
- **Outil d'analytics produit** plus poussé pour le pilotage business.

### 3.9 Tests à prévoir
- Tests de non-régression complets sur le MVP (le V1 ne doit jamais casser le flux transactionnel existant).
- Tests d'intégration spécifiques au nouveau prestataire KYC (y compris ses cas d'échec/timeout).
- Tests de performance sur la recherche (temps de réponse avec un catalogue plus large).
- Tests des règles de commission multiples (non-régression sur les commandes en cours au moment du changement de règle).
- UAT avec les premières Maisons Partenaires pilotes.

### 3.10 Risques spécifiques à la phase V1
| Risque | Mitigation |
|---|---|
| Le prestataire KYC externe a un taux de faux rejets ou un délai plus long que prévu | Phase de test avec un échantillon avant bascule complète, conserver un fallback manuel |
| Complexité douanière sous-estimée pour l'international | Démarrer avec un nombre restreint de pays/zones, étendre progressivement |
| Changement de modèle de commission mal perçu par les vendeurs existants | Communication claire, application non rétroactive stricte (règle déjà actée en section règles métier) |

### 3.11 Critères de validation (sortie de phase V1)
- Le KYC/KYB externe est opérationnel et mesurablement plus rapide que la revue manuelle du MVP.
- Au moins une Maison Partenaire a été onboardée de bout en bout avec sa page boutique.
- Une commande internationale a été traitée avec succès de bout en bout (paiement, douane, livraison, confirmation).
- Le nouveau modèle de commission est appliqué correctement aux nouvelles commandes sans affecter les commandes en cours au moment du changement.
- Les tests de non-régression du MVP passent intégralement.

---

## 4. Phase V2

### 4.1 Objectifs de la phase
- Différencier TopLuxe avec des fonctionnalités avancées difficilement réplicables.
- Diversifier les sources de revenus.
- Préparer une éventuelle extension géographique.

### 4.2 Modules à développer / faire évoluer
Enchères en Pi · Passeport numérique du produit · Abonnements vendeur premium · Programme d'affiliation · Extension multi-zone géographique (support de conformité additionnelle).

### 4.3 Ordre de développement justifié

| Ordre | Module | Justification |
|---|---|---|
| 1 | Abonnements vendeur premium | Monétisation additionnelle sans dépendance technique lourde, peut être livré rapidement sur la base de l'existant |
| 2 | Programme d'affiliation | Complète la boîte à outils de croissance, dépendance faible avec les autres modules V2 |
| 3 | Passeport numérique du produit | Nécessite une réflexion préalable sur la traçabilité étendue (potentiel ancrage blockchain) — travail de cadrage avant développement |
| 4 | Enchères en Pi | Fonctionnalité la plus complexe (gestion du temps réel, surenchères, paiement différé) — à traiter après stabilisation des fondations de paiement/escrow |
| 5 | Extension multi-zone géographique | Dépend des arbitrages juridiques/business, traitée en dernier une fois la plateforme mature |

### 4.4 Dépendances clés
- Les Enchères en Pi dépendent d'une évolution du module Paiements/Escrow pour gérer des paiements engagés mais non finalisés (offres) — nécessite une extension du modèle de données Commande/Paiement.
- Le Passeport numérique du produit dépend d'un arbitrage sur l'usage ou non d'un ancrage blockchain externe à Pi (à cadrer avant tout développement).
- L'extension géographique dépend d'arbitrages juridiques externes au périmètre technique.

### 4.5 Écrans ajoutés en V2
Écran d'enchère (mise en temps réel, historique des offres), Écran passeport numérique du produit (historique de propriété, certificats), Écran de gestion d'abonnement vendeur, Tableau de bord affiliation.

### 4.6 API à créer/étendre
Enchères : création d'enchère, placement d'offre, clôture automatique, notification de surenchère. Passeport produit : consultation d'historique, ajout d'un événement de traçabilité. Abonnements : souscription, gestion, facturation récurrente. Affiliation : génération de lien/code, suivi de conversion, calcul de commission d'apport.

### 4.7 Tables / modèles de données ajoutés
Auction, Bid, ProductPassportEvent, Subscription, SubscriptionPlan, AffiliateLink, AffiliateConversion.

### 4.8 Intégrations externes ajoutées
- Éventuel service d'ancrage blockchain externe pour le passeport produit *(à confirmer selon arbitrage)*.
- Prestataire de facturation récurrente pour les abonnements, si non géré en interne.

### 4.9 Tests à prévoir
- Tests de charge spécifiques sur les enchères (pic de trafic en fin d'enchère, gestion de la concurrence sur la dernière offre).
- Tests d'intégrité sur le passeport produit (immuabilité de l'historique).
- Tests de facturation récurrente (renouvellement, échec de paiement, résiliation).
- Tests de non-régression complets sur MVP + V1.

### 4.10 Risques spécifiques à la phase V2
| Risque | Mitigation |
|---|---|
| Complexité technique des enchères sous-estimée (concurrence, paiement engagé) | Prototypage/spike dédié avant développement complet |
| Le passeport numérique nécessite un ancrage blockchain non prévu initialement | Cadrage préalable avec l'expert blockchain avant tout développement |
| Dilution de la simplicité de la plateforme par l'accumulation de fonctionnalités | Priorisation stricte, ne développer que ce qui est validé par la traction V1 |

### 4.11 Critères de validation (sortie de phase V2)
- Au moins une enchère complète a été menée à terme avec succès, paiement et livraison inclus.
- Le passeport numérique du produit est consultable et cohérent pour les produits concernés.
- Les abonnements et l'affiliation génèrent un revenu mesurable et traçable dans le reporting.

---

## 5. Versions futures (au-delà de V2)

Ces pistes sont identifiées mais volontairement non détaillées à ce stade — elles seront cadrées via un document dédié le moment venu, une fois la traction V2 mesurée :

- Co-investissement encadré sur pièces d'exception (nécessite validation réglementaire approfondie avant tout cadrage technique).
- Application mobile dédiée au-delà de la Pi Browser App, si l'usage le justifie.
- Extension à de nouvelles verticales de luxe non envisagées initialement.
- Ouverture progressive à d'autres moyens de paiement si le contexte réglementaire et l'écosystème Pi l'exigent.

---

## 6. Feuille de route chronologique (module par module)

*Feuille de route exprimée en sprints relatifs (à caler sur un calendrier réel une fois l'équipe et sa capacité connues). Un sprint est supposé de 2 semaines à titre indicatif.*

| Sprint(s) | Livrable |
|---|---|
| Sprint 0 | Checklist "avant premier commit" complétée (section 7), infrastructure de base, environnements posés |
| Sprint 1 | Identité & Authentification, Audit & Journalisation |
| Sprint 2 | Spike technique escrow Pi (checklist SDK Pi, section 8), KYC/KYB manuel |
| Sprint 3–4 | Catalogue & Fiche Produit, Curation |
| Sprint 5–6 | Paiements Pi, Escrow (sous réserve de la validation du spike sprint 2) |
| Sprint 7 | Commandes |
| Sprint 8 | Logistique/Livraison nationale, Messagerie (en parallèle) |
| Sprint 9 | Litiges |
| Sprint 10 | Notifications, Back-office Administration minimal |
| Sprint 11 | Commissions & Facturation, durcissement sécurité, tests E2E complets |
| Sprint 12 | UAT avec pilotes, corrections, checklist "avant déploiement MVP" (section 9) |
| **→ Lancement MVP** | |
| Sprint 13–14 | KYC/KYB externe, Avis & Réputation complète |
| Sprint 15–16 | Logistique internationale, Boutique Partenaire |
| Sprint 17 | Recherche & Découverte |
| Sprint 18 | Analytics enrichi, évolution du modèle de commission |
| **→ Lancement V1** | |
| Sprint 19 | Abonnements vendeur premium, Affiliation |
| Sprint 20–21 | Cadrage puis développement du Passeport numérique du produit |
| Sprint 22–24 | Enchères en Pi (spike + développement + tests de charge) |
| Sprint 25 | Extension multi-zone géographique (selon arbitrages) |
| **→ Lancement V2** | |

*Cette chronologie suppose une équipe stable dédiée ; elle devra être révisée dès que la taille réelle de l'équipe de développement sera connue.*

---

## 7. Checklist de préparation avant le premier commit Git

- [ ] Document de référence officiel et document d'architecture formellement validés par le fondateur.
- [ ] Décisions bloquantes de la section 10 tranchées (au minimum celles marquées "bloquantes").
- [ ] Dépôt de code créé avec une structure de repository définie (mono-repo vs multi-repo — choix à faire par l'équipe technique).
- [ ] Convention de nommage des branches et stratégie de branching définie (ex. trunk-based, git-flow simplifié).
- [ ] Pipeline CI/CD minimal posé (build, tests automatiques, déploiement en environnement de test).
- [ ] Environnements distincts créés : développement, recette/staging, production.
- [ ] Gestion des secrets mise en place (coffre-fort de secrets, aucune clé en clair).
- [ ] Outil de gestion de backlog/tickets configuré, avec le découpage en modules de ce document importé comme structure initiale.
- [ ] Standards de code et de revue de code définis (linting, revue obligatoire avant fusion).
- [ ] Politique de tests définie (couverture minimale attendue, types de tests obligatoires par type de module).
- [ ] Accès équipe configurés avec permissions appropriées (principe du moindre privilège dès le départ, y compris pour les développeurs).
- [ ] Journal des décisions techniques (ADR — Architecture Decision Record) initialisé pour tracer les choix d'implémentation au fil de l'eau.

---

## 8. Checklist avant intégration du SDK Pi Network

- [ ] Compte développeur créé et validé sur le Pi Developer Portal.
- [ ] Application TopLuxe enregistrée sur la plateforme Pi, avec les scopes nécessaires identifiés (`username`, `payments`, et tout autre scope requis).
- [ ] Accès à l'environnement **sandbox/testnet** Pi confirmé et fonctionnel avant tout développement métier.
- [ ] Documentation technique Pi Payments la plus récente relue en détail par l'architecte/expert blockchain, en particulier sur : le cycle U2A complet (create/approve/complete), la disponibilité et le comportement réel du flux A2U, la gestion des webhooks/callbacks, les cas d'erreur documentés.
- [ ] **Spike technique réalisé et documenté** confirmant (ou infirmant, avec plan B associé) la faisabilité du mécanisme d'escrow tel que conçu dans l'architecture (réception sur compte applicatif + reversement A2U différé).
- [ ] Stratégie de gestion des clés/identifiants d'application Pi actée (stockage sécurisé, séparation sandbox/production).
- [ ] Comportement de conversion Pi/fiat clarifié : source du taux de change utilisée, fréquence de rafraîchissement, mécanisme de verrouillage du taux pendant la fenêtre de paiement.
- [ ] Procédure de réconciliation des transactions (comparaison état interne vs état réel Pi Platform) conçue avant le premier développement du module Paiements.
- [ ] Conditions d'utilisation et Pi Developer Guidelines relues pour confirmer qu'aucune fonctionnalité prévue n'est en contradiction avec les règles de la plateforme.
- [ ] Demande d'accès à l'environnement **mainnet** initiée suffisamment en amont du lancement (délais d'approbation à anticiper).

---

## 9. Checklist avant déploiement du MVP

- [ ] Tous les critères de validation de la section 2.11 sont remplis.
- [ ] Tests E2E des deux parcours principaux (achat, publication produit) passent en environnement de recette identique à la production.
- [ ] Accès mainnet Pi Payments confirmé et testé avec au moins une transaction réelle de faible montant en conditions réelles.
- [ ] Mécanisme de réconciliation des paiements testé avec des scénarios d'échec simulés (callback manquant, doublon).
- [ ] Revue de sécurité complétée : contrôle d'accès par rôle vérifié, chiffrement des données KYC vérifié, journal d'audit vérifié sur les actions sensibles.
- [ ] Sauvegardes de base de données configurées et testées (restauration effective vérifiée, pas seulement la sauvegarde).
- [ ] Plan de supervision/monitoring en place (alertes sur échecs de paiement, erreurs serveur, latence anormale).
- [ ] Processus d'astreinte ou de support technique défini pour le lancement (qui répond en cas d'incident critique sur les paiements/escrow).
- [ ] Conditions générales d'utilisation et de vente (CGU/CGV), politique de confidentialité rédigées et validées juridiquement.
- [ ] Recette utilisateur (UAT) réalisée avec un groupe pilote de vendeurs et acheteurs réels, retours intégrés.
- [ ] Catalogue initial constitué et vérifié (nombre de produits pilotes suffisant pour un lancement crédible).
- [ ] Canal de remontée de bugs/feedback post-lancement mis en place.
- [ ] Communication de lancement préparée, cohérente avec les capacités réelles du MVP (ne pas promettre des fonctionnalités V1/V2).

---

## 10. Décisions finales que le fondateur doit valider avant de commencer à coder

Ces décisions reprennent et priorisent celles identifiées dans le document d'architecture, avec un statut de criticité pour guider l'ordre d'arbitrage :

| # | Décision | Criticité |
|---|---|---|
| 1 | Résultat du spike technique sur le mécanisme d'escrow Pi (A2U) — accepter le modèle proposé ou valider un plan B | **Bloquante** |
| 2 | Mode de KYC au MVP : revue manuelle interne vs prestataire externe dès le départ | **Bloquante** |
| 3 | Cumul ou séparation des rôles acheteur/vendeur sur un même compte | **Bloquante** (impacte le modèle de données dès le départ) |
| 4 | Catégories de produits prioritaires au MVP | **Bloquante** (impacte le périmètre de la Curation) |
| 5 | Juridiction(s) de lancement, avec validation juridique associée | **Bloquante** (conditionne les seuils KYC, CGU/CGV) |
| 6 | Choix du/des modèle(s) de commission pour le MVP (un modèle simple recommandé, cf. section 2) | Importante, non bloquante pour démarrer le code (peut être paramétrable) |
| 7 | Panier mono-produit ou multi-produits au MVP | Importante (impacte le modèle Commande) |
| 8 | Délai précis de confirmation automatique de réception | Importante, paramétrable a posteriori |
| 9 | Prise en charge des frais de livraison internationale et taxes douanières | Peut être différée à la phase V1 (livraison internationale) |
| 10 | Niveau d'exigence de vérification physique selon la valeur du produit | Peut être affinée en cours de MVP avec les premiers cas réels |
| 11 | Niveau d'exigence d'authentification pour les futures maisons partenaires | Peut être différée à la phase V1 |
| 12 | Politique de délai de recours pour une contestation tardive | Peut être affinée après les premiers litiges réels observés |
| 13 | Choix d'architecture d'implémentation (microservices stricts vs monolithe modulaire) | **Bloquante pour l'équipe technique**, à trancher en tout début de Sprint 0, en fonction de la taille d'équipe et du budget disponibles |
| 14 | Sélection effective des prestataires externes (KYC si externalisé, transporteur national de lancement, service e-mail) | **Bloquante avant Sprint 2–3** (dépendance directe sur le développement des intégrations correspondantes) |

---

*Ce document constitue le plan d'implémentation technique de référence pour TopLuxe. Aucune ligne de code n'a été produite. Dès que les décisions bloquantes de la section 10 sont arbitrées, le développement peut démarrer en suivant la checklist de la section 7, en commençant par le Sprint 0 de la feuille de route (section 6).*
