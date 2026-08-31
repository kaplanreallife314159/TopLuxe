# TopLuxe — Architecture Technique Complète

*Marketplace premium sur Pi Network*
*Document produit par l'équipe technique (CTO, architecte logiciel, architecte cloud, expert blockchain Pi, architecte base de données, ingénieur sécurité)*
*Version 1.0 — Basé sur le document de référence officiel validé*
*Statut : conception d'architecture, aucune ligne de code produite*

---

## Sommaire

1. Architecture globale de la plateforme
2. Découpage en modules (services applicatifs)
3. Interactions entre modules
4. Liste complète des APIs nécessaires
5. Modèle conceptuel de la base de données
6. Flux de données complets
7. Flux de paiement en Pi
8. KYC et vérification des vendeurs
9. Système d'escrow, livraison, confirmation, litiges
10. Permissions précises par rôle
11. Inventaire complet des écrans
12. Intégrations externes nécessaires
13. Exigences de sécurité, performance, montée en charge
14. Ordre de développement recommandé (MVP → version finale)
15. Décisions à valider par le fondateur avant développement

---

## 1. Architecture globale de la plateforme

### 1.1 Vue d'ensemble

TopLuxe est conçu comme une **architecture modulaire orientée services**, découplée en modules fonctionnels autonomes communiquant via des interfaces bien définies (API synchrones) et des événements asynchrones (pour les flux longs comme la logistique ou l'escrow). Ce choix permet :

- de développer, tester et faire évoluer chaque module indépendamment ;
- d'isoler les modules les plus sensibles (Paiements, Escrow, KYC) avec des niveaux de sécurité renforcés ;
- de préparer une montée en charge progressive sans figer un monolithe difficile à faire évoluer.

*Remarque de cadrage* : à ce stade, il n'est pas nécessaire de trancher entre "microservices stricts" et "monolithe modulaire bien découpé" — ce choix d'implémentation sera fait à l'étape de spécification technique détaillée, en fonction de la taille de l'équipe et du budget. L'important est que **le découpage fonctionnel en modules** (section 2) soit respecté quelle que soit l'option retenue, pour garder la possibilité d'extraire des services indépendants plus tard.

### 1.2 Grandes couches de l'architecture

1. **Couche client** : Pi Browser App (interface principale acheteur/vendeur), interface web back-office dédiée pour l'administration/modération/experts (accès distinct, non exposé via Pi Browser).
2. **Couche API / Passerelle (API Gateway)** : point d'entrée unique pour les clients, responsable du routage vers les modules, de l'authentification des requêtes, du rate limiting, et de la journalisation centralisée.
3. **Couche modules applicatifs (services métier)** : détaillée en section 2.
4. **Couche données** : bases de données (relationnelle pour les données structurées/transactionnelles, stockage objet pour les médias), cache pour les données à forte lecture (catalogue, recherche).
5. **Couche asynchrone / événementielle** : bus d'événements pour la communication inter-modules découplée (ex. "paiement confirmé" déclenche la mise à jour de la commande sans couplage direct).
6. **Couche intégrations externes** : Pi Platform (SDK/Payments), prestataire KYC, transporteurs, notifications, etc. (section 12).
7. **Couche observabilité & sécurité transverse** : journalisation, monitoring, audit, gestion des secrets, détection de fraude.

### 1.3 Schéma logique (description textuelle)

```
[ Pi Browser App ]        [ Back-office Web (Admin/Modérateur/Expert) ]
        |                                  |
        └───────────────┬──────────────────┘
                         ▼
                 [ API Gateway ]
                         │
   ┌─────────────────────┼───────────────────────────────────────┐
   ▼                     ▼                                       ▼
[Identité &        [Catalogue &                          [Paiements Pi]
Auth]              Curation]                                     │
   │                     │                                       ▼
   │                     │                              [Escrow]
   ▼                     ▼                                       │
[KYC/KYB]         [Recherche]                                    ▼
                                                          [Commandes]
                                                                   │
                              ┌────────────────────────────────────┼──────────┐
                              ▼                                    ▼          ▼
                       [Logistique/Livraison]              [Messagerie]  [Avis/Réputation]
                                                                   │
                                                                   ▼
                                                             [Litiges]
                         ▲                                          ▲
                         │                                          │
                 [Notifications] ◄──────── Bus d'événements ───────►[Back-office Admin]
                                                                   │
                                                                   ▼
                                                        [Analytics & Reporting]
```

Tous les modules s'appuient sur une base de données partagée ou dédiée selon le choix d'implémentation, et publient/consomment des événements via le bus asynchrone pour les traitements différés (ex. libération d'escrow après délai, notifications, mise à jour de réputation).

---

## 2. Découpage en modules (services applicatifs)

| # | Module | Responsabilité principale |
|---|---|---|
| 1 | **Identité & Authentification** | Authentification Pi SDK, gestion de session, gestion des rôles et permissions |
| 2 | **KYC / KYB** | Collecte, revue, statut de vérification d'identité (acheteur/vendeur/entreprise) |
| 3 | **Catalogue & Fiche Produit** | Cycle de vie des annonces, gestion des catégories, médias |
| 4 | **Curation / Authentification Produit** | File de travail experts, décisions de validation, historisation |
| 5 | **Paiements Pi** | Intégration Pi Payments (U2A/A2U), conversion fiat/Pi, historique transactionnel |
| 6 | **Escrow** | Séquestre applicatif des fonds, règles de blocage/libération |
| 7 | **Commandes** | Cycle de vie de la commande, orchestration entre paiement, logistique, réception |
| 8 | **Logistique / Livraison** | Gestion des expéditions nationales/internationales, tracking, transporteurs |
| 9 | **Messagerie** | Communication contextualisée acheteur-vendeur |
| 10 | **Avis & Réputation** | Notation, badges, historique de fiabilité |
| 11 | **Litiges** | Ouverture, médiation, résolution |
| 12 | **Back-office Administration** | Supervision globale, configuration, gestion des utilisateurs/produits |
| 13 | **Notifications** | Diffusion in-app/email des événements |
| 14 | **Recherche & Découverte** | Indexation et recherche du catalogue *(V1/V2)* |
| 15 | **Analytics & Reporting** | Agrégation d'indicateurs business et opérationnels |
| 16 | **Contenu éditorial / Boutique Partenaire** | Pages de marque, storytelling *(V1/V2)* |
| 17 | **Commissions & Facturation** | Calcul et application des règles de commission, historique de facturation |
| 18 | **Audit & Journalisation** | Traçabilité transverse des actions sensibles (module technique transverse, pas un module métier isolé) |

---

## 3. Interactions entre modules

### 3.1 Mode d'interaction

- **Synchrone (API)** : utilisé lorsque la réponse est nécessaire immédiatement pour l'utilisateur (ex. Catalogue interroge Curation pour connaître le statut d'un produit, Commandes interroge Paiements pour vérifier l'état d'une transaction).
- **Asynchrone (événements)** : utilisé pour les traitements découplés et différés (ex. "Escrow.fonds_libérés" déclenche à la fois une notification, une mise à jour de réputation, et un enregistrement en Commissions & Facturation, sans que le module Escrow ait besoin de connaître ces trois consommateurs).

### 3.2 Interactions clés (matrice simplifiée)

| Module source | Événement / Appel | Module(s) cible(s) | Nature |
|---|---|---|---|
| Identité & Auth | Connexion réussie | Notifications, Audit | Événement |
| KYC/KYB | Statut "validé" | Catalogue (déblocage vente), Notifications | Événement |
| Catalogue | Soumission produit | Curation | Appel synchrone |
| Curation | Décision (validé/rejeté) | Catalogue, Notifications, Audit | Événement |
| Commandes | Création commande | Paiements (initiation) | Appel synchrone |
| Paiements | Paiement complété | Escrow, Commandes, Notifications, Audit | Événement |
| Commandes | Confirmation d'expédition | Logistique, Notifications | Appel synchrone + événement |
| Logistique | Statut "livré" | Commandes, Notifications | Événement |
| Commandes | Confirmation de réception (ou expiration délai) | Escrow (libération), Avis (déblocage) | Événement |
| Escrow | Libération des fonds | Paiements (A2U), Commissions & Facturation, Notifications, Audit | Événement |
| Litiges | Ouverture d'un litige | Escrow (blocage), Commandes, Notifications | Événement |
| Litiges | Résolution | Escrow (libération/remboursement), Avis, Notifications, Audit | Événement |
| Back-office Admin | Modification de paramètre (commission, seuil) | Commissions & Facturation, KYC/KYB | Appel synchrone |
| Tous modules métier | Action sensible | Audit & Journalisation | Événement systématique |

### 3.3 Principe de découplage

Le module **Escrow** ne doit jamais appeler directement le module **Avis** ou **Notifications** de façon synchrone : il publie un événement ("fonds libérés", "commande remboursée") que les modules concernés consomment de façon autonome. Cela limite les dépendances fortes et facilite l'évolution indépendante de chaque module.

---

## 4. Liste complète des APIs nécessaires (par module, sans code)

*Chaque entrée décrit une capacité exposée (responsabilité), pas une signature technique.*

### 4.1 Identité & Authentification
- Authentifier un utilisateur via Pi SDK et créer/retrouver son profil TopLuxe.
- Rafraîchir une session.
- Récupérer le profil courant et ses rôles.
- Mettre à jour les informations de profil (coordonnées, préférences).
- Suspendre/réactiver un compte (réservé admin).

### 4.2 KYC / KYB
- Initier une demande de vérification (KYC acheteur, KYC vendeur, KYB entreprise).
- Soumettre des documents.
- Consulter le statut d'une vérification.
- Lister les vérifications en attente (réservé modérateur/admin).
- Valider / rejeter une vérification, avec motif (réservé modérateur/admin).

### 4.3 Catalogue & Fiche Produit
- Créer un produit (brouillon).
- Modifier un produit en brouillon.
- Soumettre un produit pour vérification.
- Consulter un produit (public).
- Lister/filtrer les produits (public, par catégorie/prix/marque/état).
- Retirer un produit (vendeur, sous condition qu'aucune commande ne soit en cours).
- Lister les produits d'un vendeur donné (vendeur, admin).

### 4.4 Curation / Authentification Produit
- Lister la file de produits en attente (réservé expert).
- Consulter le détail d'une soumission (photos, documents).
- Valider une soumission.
- Rejeter une soumission avec motif.
- Demander des compléments d'information.
- Consulter l'historique des décisions d'un expert (réservé admin).

### 4.5 Paiements Pi
- Initier un paiement pour une commande.
- Recevoir la confirmation d'approbation (callback Pi).
- Compléter un paiement (callback Pi).
- Consulter le statut d'un paiement.
- Initier un remboursement (A2U) — réservé Escrow/Admin.
- Consulter l'historique transactionnel d'un utilisateur.

### 4.6 Escrow
- Créer un enregistrement d'escrow lié à une commande payée.
- Consulter le statut d'un escrow (bloqué / libéré / en litige / remboursé).
- Déclencher la libération des fonds (automatique ou manuelle suite décision litige).
- Bloquer un escrow suite à l'ouverture d'un litige.
- Rembourser un escrow (partiel ou total).

### 4.7 Commandes
- Créer une commande à partir d'un produit.
- Consulter le détail d'une commande.
- Lister les commandes d'un utilisateur (acheteur ou vendeur).
- Mettre à jour le statut d'une commande (préparation, expédition, livrée).
- Confirmer la réception (acheteur).
- Annuler une commande (selon règles : non-expédition dans les délais, etc.).

### 4.8 Logistique / Livraison
- Enregistrer les informations d'expédition (transporteur, numéro de suivi).
- Consulter le statut de suivi d'une expédition.
- Lister les transporteurs disponibles selon la destination (national/international).
- Recevoir les mises à jour de statut transporteur (webhook externe si disponible).
- Déclarer un incident de livraison (perte, retard anormal).

### 4.9 Messagerie
- Créer/consulter une conversation liée à un produit ou une commande.
- Envoyer un message.
- Lister les conversations d'un utilisateur.
- Consulter une conversation (réservé modérateur, en cas de litige).

### 4.10 Avis & Réputation
- Créer un avis (réservé acheteur, commande clôturée uniquement).
- Répondre à un avis (réservé vendeur concerné).
- Consulter les avis d'un vendeur/produit (public).
- Calculer/consulter le score de réputation d'un vendeur.
- Modérer un avis signalé (réservé modérateur/admin).

### 4.11 Litiges
- Ouvrir un litige lié à une commande.
- Ajouter des preuves à un litige.
- Consulter le détail d'un litige.
- Proposer une résolution (réservé modérateur).
- Trancher un litige de manière définitive (réservé admin).
- Lister les litiges en cours (réservé modérateur/admin).

### 4.12 Back-office Administration
- Rechercher/consulter un utilisateur.
- Suspendre/bannir un utilisateur.
- Rechercher/consulter/modérer un produit.
- Consulter le tableau de bord global (indicateurs clés).
- Configurer les paramètres plateforme (taux de commission, seuils KYC).
- Exporter des rapports financiers.

### 4.13 Notifications
- Envoyer une notification (usage interne, appelé par les autres modules via événements).
- Lister les notifications d'un utilisateur.
- Marquer une notification comme lue.
- Gérer les préférences de notification d'un utilisateur.

### 4.14 Recherche & Découverte *(V1/V2)*
- Indexer un produit publié.
- Rechercher des produits selon critères avancés.
- Récupérer des suggestions/mises en avant éditoriales.

### 4.15 Analytics & Reporting
- Consulter les indicateurs business (volume, panier moyen, taux de conversion).
- Consulter les indicateurs opérationnels (délais KYC, délais d'authentification, taux de litige).
- Exporter des données agrégées.

### 4.16 Commissions & Facturation
- Calculer la commission applicable à une transaction selon les règles actives.
- Consulter l'historique de commission d'un vendeur.
- Configurer/mettre à jour les règles de commission (réservé admin).

### 4.17 Audit & Journalisation
- Enregistrer un événement d'audit (usage interne systématique).
- Consulter le journal d'audit (réservé admin, avec filtres).

---

## 5. Modèle conceptuel de la base de données

### 5.1 Entités principales

- **Utilisateur** (User) : identifiant interne, uid Pi, username Pi, email (optionnel), statut de compte, date de création.
- **Rôle** (Role) : type de rôle (acheteur, vendeur, expert, modérateur, admin) — relation many-to-many avec Utilisateur si cumul de rôles autorisé.
- **Vérification KYC/KYB** (VerificationRecord) : type (KYC particulier / KYB entreprise), statut, documents associés, date de décision, décideur, motif.
- **Document** (Document) : fichier chiffré, type de document, entité liée (VerificationRecord ou Produit), date d'upload.
- **Catégorie** (Category) : nom, catégorie parente éventuelle (hiérarchie), attributs spécifiques par catégorie.
- **Produit** (Product) : titre, description, catégorie, marque, état, prix fiat de référence, statut (brouillon/soumis/publié/réservé/vendu/retiré/rejeté), vendeur (référence Utilisateur).
- **Média Produit** (ProductMedia) : image/vidéo, ordre d'affichage, produit associé.
- **Revue d'Authentification** (AuthenticationReview) : produit associé, expert associé, décision, motif, date, historique des allers-retours.
- **Commande** (Order) : produit associé, acheteur, vendeur, statut, prix fiat, montant Pi verrouillé, date de création, dates de changement de statut.
- **Paiement** (Payment) : commande associée, identifiant transaction Pi, montant, statut, horodatages (initié/approuvé/complété), taux de conversion appliqué.
- **Escrow** (EscrowRecord) : commande associée, paiement associé, statut (bloqué/libéré/en litige/remboursé), date de libération prévue, date de libération effective.
- **Expédition** (Shipment) : commande associée, transporteur, numéro de suivi, statut, adresse de livraison, type (national/international), date d'expédition, date de livraison.
- **Adresse** (Address) : utilisateur associé, pays, ville, code postal, ligne d'adresse, type (livraison/facturation).
- **Conversation** (Conversation) : produit ou commande associé, participants.
- **Message** (Message) : conversation associée, auteur, contenu, horodatage.
- **Avis** (Review) : commande associée, auteur (acheteur), note, commentaire, réponse du vendeur.
- **Litige** (Dispute) : commande associée, ouvert par, motif, statut, décision finale, décideur.
- **Preuve de Litige** (DisputeEvidence) : litige associé, fichier ou texte, date d'ajout, auteur.
- **Notification** (Notification) : utilisateur destinataire, type d'événement, contenu, statut lu/non lu, date.
- **Règle de Commission** (CommissionRule) : critères d'application (catégorie, statut vendeur, palier de valeur), taux, date d'entrée en vigueur.
- **Enregistrement de Commission** (CommissionRecord) : commande associée, règle appliquée, montant prélevé.
- **Boutique Partenaire** (PartnerShop) *(V1/V2)* : vendeur professionnel associé, branding, description.
- **Journal d'Audit** (AuditLog) : acteur, action, entité concernée, date, détails.
- **Badge de Réputation** (ReputationBadge) : utilisateur (vendeur) associé, type de badge, date d'obtention.

### 5.2 Relations principales (description conceptuelle)

- Un **Utilisateur** peut avoir plusieurs **Rôles** (selon arbitrage sur le cumul acheteur/vendeur).
- Un **Utilisateur** (vendeur) possède plusieurs **Produits**.
- Un **Produit** appartient à une **Catégorie**, possède plusieurs **Médias Produit**, et fait l'objet d'une ou plusieurs **Revues d'Authentification** (historique des allers-retours).
- Une **Commande** référence un **Produit**, un **Acheteur** et un **Vendeur** (tous deux des **Utilisateurs**).
- Une **Commande** est liée à un **Paiement** (relation 1-1 dans le cas standard), lui-même lié à un **Escrow** (1-1).
- Une **Commande** est liée à une **Expédition** (1-1, ou 1-n si renvoi après litige résolu par remplacement — cas à trancher).
- Une **Commande** peut être liée à zéro ou un **Litige** ; un **Litige** possède plusieurs **Preuves de Litige**.
- Une **Commande** (clôturée) peut donner lieu à un **Avis**.
- Un **Utilisateur** peut avoir plusieurs **Vérifications KYC/KYB** dans le temps (historique, en cas de revalidation).
- Une **Conversation** est liée à un **Produit** et/ou une **Commande**, et contient plusieurs **Messages**.
- Une **Règle de Commission** s'applique à plusieurs **Commandes** via des **Enregistrements de Commission**.
- Chaque action sensible dans n'importe quel module génère une entrée dans **Journal d'Audit**, référençant l'acteur et l'entité concernée de façon polymorphe.

### 5.3 Remarques de conception

- La **traçabilité complète** (qui a fait quoi, quand) impose que la majorité des entités transactionnelles (Produit, Commande, Paiement, Escrow, Litige, Vérification) conservent un historique de changement de statut plutôt qu'un simple champ "statut actuel" écrasé à chaque mise à jour — un modèle d'historisation (table d'événements ou table de log par entité) est recommandé.
- Le montant **Pi verrouillé** sur une commande doit être conservé tel quel (valeur figée au moment du paiement), distinct du taux de conversion courant, pour garantir l'intégrité en cas de contestation ultérieure.
- Les **Documents** KYC doivent être stockés séparément des données métier courantes (isolation renforcée, chiffrement dédié, accès restreint) — recommandation à confirmer en architecture de sécurité (section 13).

---

## 6. Flux de données complets

### 6.1 Flux "Achat d'un produit" (bout en bout)

1. L'acheteur consulte le Catalogue (lecture depuis la base/cache).
2. Clic "Acheter" → Commandes crée une commande à l'état `créée`, vérifie la disponibilité du produit auprès de Catalogue.
3. Commandes appelle Paiements pour initier le paiement Pi.
4. Paiements interagit avec la Pi Platform (SDK côté client + callbacks serveur) — détail en section 7.
5. Paiement complété → événement publié → Escrow crée un enregistrement `fonds bloqués` → Commandes passe au statut `payée (escrow)`.
6. Notifications informe le vendeur ; Logistique attend la saisie du tracking par le vendeur.
7. Vendeur confirme l'expédition → Commandes passe à `expédiée` → Logistique suit la livraison.
8. Statut `livrée` (Logistique) → Commandes notifie l'acheteur pour confirmation.
9. Confirmation acheteur (ou expiration du délai) → événement → Escrow libère les fonds → Paiements exécute un versement A2U au vendeur → Commissions & Facturation enregistre le prélèvement → Commandes passe à `clôturée`.
10. Avis & Réputation débloque la possibilité de laisser un avis.
11. Tout au long du flux, chaque changement d'état est enregistré dans Audit & Journalisation.

### 6.2 Flux "Publication d'un produit" (bout en bout)

1. Vendeur (KYC validé, vérifié auprès de KYC/KYB) crée un produit en `brouillon` dans Catalogue.
2. Upload des médias vers le stockage objet, référencés dans ProductMedia.
3. Soumission → Catalogue appelle Curation, produit passe à `soumis pour vérification`.
4. Expert traite la soumission (validation/rejet/compléments) → Curation publie une décision.
5. Si validé : Catalogue passe le produit à `publié`, Recherche & Découverte indexe le produit.
6. Notifications informe le vendeur du résultat.

---

## 7. Flux de paiement en Pi (détail technique)

1. **Côté client (Pi Browser App)** : l'acheteur valide la commande ; l'application appelle `Pi.createPayment` avec les métadonnées (identifiant de commande interne, montant, mémo).
2. **Approbation utilisateur** : l'acheteur confirme la transaction dans son Pi Wallet.
3. **Callback "approved"** : la Pi Platform notifie le backend TopLuxe (module Paiements) que le paiement est approuvé côté utilisateur ; TopLuxe enregistre le statut `en attente d'approbation` → `approuvé`, et réserve temporairement le produit concerné.
4. **Confirmation blockchain** : la transaction Pi est propagée et confirmée sur le réseau (délai variable, hors contrôle direct de TopLuxe).
5. **Callback "completed" / appel serveur `complete`** : TopLuxe appelle la complétion côté Pi Platform une fois la transaction confirmée, ce qui finalise le paiement.
6. **Enregistrement final** : le module Paiements marque la transaction `complétée`, publie un événement consommé par Escrow (création de l'enregistrement `fonds bloqués`) et par Commandes (passage au statut `payée`).
7. **Cas de remboursement / reversement vendeur (flux A2U)** : déclenché par Escrow (libération) ou par une décision de litige (remboursement acheteur) ; le module Paiements initie un paiement sortant vers l'utilisateur concerné (vendeur ou acheteur) via le flux App-to-User de la Pi Platform.
8. **Réconciliation** : un mécanisme de vérification périodique doit comparer l'état interne des paiements avec l'état réel côté Pi Platform, pour détecter et corriger toute divergence (paiement approuvé côté Pi mais non complété côté TopLuxe suite à un incident, par exemple).

*Point de vigilance architecture (déjà identifié dans le document de référence) : la disponibilité exacte d'un flux A2U fiable et le comportement précis de l'API Pi Payments doivent être vérifiés dans la documentation technique la plus à jour avant de figer l'implémentation du module Escrow — c'est le prérequis technique n°1 avant tout développement (voir section 15).*

---

## 8. KYC et vérification des vendeurs (flux détaillé)

1. Déclenchement : première tentative de mise en vente (vendeur particulier) ou d'inscription en tant que Maison Partenaire (KYB).
2. Le module KYC/KYB collecte les documents requis (pièce d'identité, preuve d'adresse, ou documents légaux d'entreprise selon le cas).
3. Les documents sont stockés de façon chiffrée et isolée (voir 5.3 et section 13).
4. Selon l'option retenue (voir décisions à valider, section 15) : transmission automatique à un prestataire de vérification tiers, ou mise en file d'attente pour revue manuelle interne (modérateur niveau 1, escalade admin si doute).
5. Décision enregistrée (validé/rejeté/compléments demandés), avec motif et décideur tracés.
6. Événement publié : si validé, le module Catalogue autorise la création de fiches produit pour ce vendeur ; si rejeté, Notifications informe l'utilisateur avec le motif et la marche à suivre pour resoumission.
7. Revalidation : un mécanisme de contrôle périodique (ou déclenché par changement de statut légal pour le KYB) peut invalider une vérification existante après une durée définie, forçant une nouvelle soumission.

---

## 9. Système d'escrow, livraison, confirmation, litiges (flux intégré)

### 9.1 Escrow
- Créé automatiquement à la complétion du paiement (statut `fonds bloqués`).
- Reste bloqué jusqu'à : confirmation explicite de réception, expiration du délai automatique, ou résolution d'un litige.
- Toute ouverture de litige sur la commande associée fige immédiatement l'escrow en statut `en litige`, quel que soit son état précédent.

### 9.2 Livraison
- Le vendeur enregistre les informations d'expédition dans le module Logistique, qui met à jour le statut de la commande.
- Le module Logistique consomme, si disponible, les mises à jour de statut transporteur (webhook ou interrogation périodique) pour détecter automatiquement le passage à `livrée`.
- Pour l'international, le module Logistique gère des règles spécifiques (transporteurs éligibles selon destination, documentation douanière requise) — voir section 12 pour les intégrations transporteurs.

### 9.3 Confirmation de réception
- Déclenchement du compte à rebours de confirmation automatique dès le passage au statut `livrée`.
- Confirmation explicite de l'acheteur → événement immédiat vers Escrow (libération).
- Absence d'action après le délai défini → confirmation automatique par le système, avec traçabilité complète (pour distinguer une confirmation active d'une confirmation par défaut, utile en cas de contestation ultérieure).

### 9.4 Litiges
- Ouverture par l'acheteur ou le vendeur, avec motif et preuves, à tout moment entre le statut `livrée` (ou en cas de non-livraison anormale) et la clôture définitive.
- Le module Litiges orchestre : blocage de l'escrow, notification des deux parties, fenêtre de résolution amiable, escalade à un modérateur avec accès en lecture à la Messagerie et au tracking Logistique, puis éventuelle escalade finale à l'administrateur.
- La résolution génère un événement vers Escrow (libération totale au vendeur, remboursement total à l'acheteur, ou remboursement partiel — nécessitant une capacité de split côté Paiements/Escrow à prévoir dans le modèle de données et les APIs).

---

## 10. Permissions précises par rôle

*Cette matrice détaille les actions au niveau API (section 4), en complément de la matrice de haut niveau du document de référence.*

| Action / API | Acheteur | Vendeur particulier | Vendeur pro | Expert | Modérateur | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Créer/modifier un produit en brouillon | ❌ | ✅ (soi-même) | ✅ (soi-même) | ❌ | ❌ | ✅ |
| Soumettre un produit pour vérification | ❌ | ✅ (soi-même) | ✅ (soi-même) | ❌ | ❌ | ❌ |
| Valider/rejeter une soumission produit | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ (arbitrage) |
| Initier un paiement | ✅ (soi-même) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Consulter le statut d'un escrow | ✅ (sa commande) | ✅ (sa commande) | ✅ (sa commande) | ❌ | ✅ (litige) | ✅ |
| Déclencher une libération manuelle d'escrow | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Confirmer la réception d'une commande | ✅ (sa commande) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Enregistrer une expédition | ❌ | ✅ (sa commande) | ✅ (sa commande) | ❌ | ❌ | ✅ |
| Envoyer un message | ✅ (ses conversations) | ✅ (ses conversations) | ✅ (ses conversations) | ❌ | ✅ (lecture seule, litige) | ✅ |
| Ouvrir un litige | ✅ (sa commande) | ✅ (sa commande) | ✅ (sa commande) | ❌ | ❌ | ❌ |
| Proposer une résolution de litige | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Trancher définitivement un litige | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Valider/rejeter un KYC/KYB | ❌ | ❌ | ❌ | ❌ | ✅ (niveau 1) | ✅ |
| Suspendre/bannir un utilisateur | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Configurer les règles de commission | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Consulter le journal d'audit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Consulter le reporting financier global | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 11. Inventaire complet des écrans

### Acheteur / Visiteur
Accueil, Catalogue avec filtres, Fiche produit, Messagerie, Checkout/récapitulatif, Écran de paiement Pi, Suivi de commande, Historique des commandes, KYC acheteur, Confirmation de réception / ouverture de litige, Détail et suivi de litige, Formulaire d'avis, Profil utilisateur, Gestion des adresses, Centre de notifications.

### Vendeur
Tableau de bord vendeur, KYC/KYB, Création de fiche produit, Suivi de soumission pour authentification, Liste des produits par statut, Détail commande reçue, Saisie tracking/expédition, Messagerie, Détail et suivi de litige, Réputation et avis reçus, Page boutique officielle *(V1/V2)*, Statistiques de vente *(V1/V2)*.

### Expert Authentificateur
File de travail par catégorie, Écran de revue détaillée (photos, documents, zoom comparatif), Formulaire de décision motivée, Historique des décisions.

### Modérateur
File des litiges ouverts, Détail d'un litige (preuves, messages, tracking), Formulaire de décision/proposition, File KYC/KYB niveau 1, Vue Messagerie en lecture seule (contexte litige).

### Administrateur
Tableau de bord global, Gestion des utilisateurs, Gestion des produits, Reporting financier, Configuration plateforme (commissions, seuils, catégories), Gestion des litiges niveau 2, Gestion des maisons partenaires *(V1/V2)*, Journal d'audit, Configuration des transporteurs/zones de livraison.

---

## 12. Intégrations externes nécessaires

| Intégration | Rôle | Modules concernés |
|---|---|---|
| **Pi Platform (SDK + Pi Payments)** | Authentification utilisateur, paiements U2A/A2U | Identité & Auth, Paiements Pi, Escrow |
| **Prestataire de vérification d'identité (KYC/KYB)** | Externalisation de la vérification documentaire | KYC/KYB |
| **Transporteurs / API logistique (national et international)** | Génération d'étiquettes, suivi de colis, statuts de livraison | Logistique |
| **Fournisseur de taux de change fiat/Pi** *(si non fourni nativement par la Pi Platform)* | Calcul du montant Pi équivalent au prix fiat de référence | Paiements Pi |
| **Service d'envoi d'e-mails transactionnels** | Notifications hors application | Notifications |
| **Service de notifications push** *(si applicable au contexte Pi Browser App)* | Alertes en temps réel | Notifications |
| **Stockage objet / CDN pour les médias** | Hébergement et diffusion performante des photos/vidéos produits | Catalogue, Curation |
| **Service d'assurance transport** *(pour livraisons de valeur, notamment international)* | Couverture des biens en transit | Logistique |
| **Outil de détection de fraude / anti-abus** *(V1/V2)* | Renforcement de la sécurité transactionnelle | Paiements, Identité & Auth |
| **Outil d'analytics produit** | Suivi d'usage, tableaux de bord | Analytics & Reporting |

---

## 13. Exigences de sécurité, performance, montée en charge

### 13.1 Sécurité
- **Isolation renforcée des modules sensibles** : KYC/KYB, Paiements et Escrow doivent bénéficier d'un niveau d'accès et de journalisation plus strict que les modules à faible sensibilité (Catalogue en lecture, Messagerie).
- **Chiffrement** : au repos pour les documents KYC et les données personnelles, en transit pour l'ensemble des communications (API Gateway ↔ modules, modules ↔ intégrations externes).
- **Gestion des secrets** : clés d'API (Pi Platform, prestataires externes) stockées dans un coffre-fort de secrets dédié, jamais en clair dans le code ou la configuration versionnée.
- **Contrôle d'accès** : RBAC strict appliqué au niveau de l'API Gateway et re-vérifié au niveau de chaque module (défense en profondeur).
- **Anti-fraude et anti-abus** : limitation de débit (rate limiting) sur les endpoints sensibles (paiement, messagerie, création de compte), détection de comportements anormaux (multi-comptes, tentatives de contournement d'escrow).
- **Audit systématique** : toute action à impact financier ou sur la confiance génère une entrée d'audit immuable.
- **Conformité RGPD** : minimisation des données, durée de conservation encadrée, procédures d'accès/rectification/suppression opérationnelles dès le MVP pour les données personnelles et KYC.

### 13.2 Performance
- **Catalogue et recherche** : mise en cache des données à forte lecture, index de recherche dédié dès que le volume le justifie (module Recherche & Découverte).
- **Médias** : diffusion via CDN pour garantir des temps de chargement maîtrisés sur mobile (contexte Pi Browser App).
- **Paiement** : les étapes critiques (initiation, approbation, complétion) doivent bénéficier de la plus haute priorité de traitement et d'une surveillance renforcée (latence, taux d'échec).

### 13.3 Montée en charge
- **Scalabilité horizontale** des modules à forte charge potentielle (Catalogue, Recherche, Notifications) indépendamment des modules à charge plus stable (KYC, Litiges).
- **Découplage via bus d'événements** pour absorber les pics sans bloquer les flux synchrones critiques (ex. un pic de notifications ne doit jamais ralentir le flux de paiement).
- **Base de données** : prévoir une architecture permettant réplication en lecture et sauvegardes régulières dès le MVP, avec une capacité d'évolution vers du partitionnement si le volume de commandes/produits croît fortement.
- **Plan de reprise d'activité** : priorité absolue sur les données financières (Paiements, Escrow, Commandes) et les données KYC, avec des sauvegardes testées régulièrement.

---

## 14. Ordre de développement recommandé (MVP → version finale)

### Phase 0 — Fondations techniques
1. Identité & Authentification (intégration Pi SDK).
2. Audit & Journalisation (module transverse, à poser tôt car utilisé par tous les autres).
3. API Gateway et infrastructure de base (environnements, CI/CD, gestion des secrets).

### Phase 1 — MVP fonctionnel
4. KYC/KYB (version manuelle interne).
5. Catalogue & Fiche Produit.
6. Curation / Authentification Produit.
7. Paiements Pi (flux U2A, complétion) — **avec vérification technique préalable du mécanisme A2U réalisable pour l'escrow, prérequis bloquant**.
8. Escrow (version applicative simple).
9. Commandes (orchestration du cycle de vie).
10. Logistique / Livraison (national prioritaire).
11. Messagerie (version basique).
12. Litiges (version manuelle, paliers simples).
13. Notifications (in-app essentielles).
14. Back-office Administration (version minimale : supervision, validation KYC, gestion litiges).
15. Commissions & Facturation (modèle simple unique).

### Phase 2 — V1 (structuration et croissance)
16. KYC/KYB délégué à un prestataire externe spécialisé.
17. Logistique internationale structurée (partenaires dédiés, gestion douanière).
18. Avis & Réputation (badges, scoring).
19. Recherche & Découverte (filtres avancés, indexation).
20. Contenu éditorial / Boutique Partenaire.
21. Analytics & Reporting enrichi.
22. Évolution du modèle de commission (différenciation selon arbitrage).

### Phase 3 — V2 (fonctionnalités avancées)
23. Enchères en Pi.
24. Passeport numérique du produit.
25. Abonnements vendeur premium, programme d'affiliation.
26. Extension géographique et fonctionnalités liées (multi-devises d'affichage, conformité additionnelle).
27. Co-investissement encadré *(sous réserve stricte de faisabilité réglementaire)*.

---

## 15. Décisions à valider par le fondateur avant le début du développement

Cette liste consolide les points techniques et business bloquants ou structurants, à trancher avant le premier sprint de développement :

1. **Vérification technique prioritaire du mécanisme d'escrow réalisable avec Pi Payments** (capacités réelles du flux A2U) — condition bloquante avant de démarrer le module Escrow.
2. **Cumul ou séparation des rôles acheteur/vendeur** sur un même compte.
3. **Mode de KYC au MVP** : revue manuelle interne temporaire vs prestataire externe dès le lancement.
4. **Choix du/des modèle(s) de commission** (parmi les options présentées dans le document de référence).
5. **Catégories de produits prioritaires au MVP** (toutes dès le départ ou sous-ensemble).
6. **Juridiction(s) de lancement**, avec validation juridique associée (KYC/AML, statut du Pi, droit de la consommation).
7. **Niveau d'exigence de vérification physique** des produits selon la valeur, et identification de partenaires logistiques/points de contrôle.
8. **Prise en charge des frais de livraison internationale et des taxes douanières** (acheteur, vendeur, ou inclus).
9. **Délai précis de confirmation automatique de réception** (proposition indicative 5–10 jours).
10. **Niveau d'exigence d'authentification pour les maisons partenaires déjà réputées** (processus allégé ou identique).
11. **Panier mono-produit ou multi-produits** au MVP.
12. **Politique de délai de recours** pour une contestation tardive après libération automatique des fonds.
13. **Choix d'architecture d'implémentation** (microservices stricts vs monolithe modulaire) — à trancher avec l'équipe technique une fois l'équipe et le budget de développement connus, sans impact sur ce document de conception fonctionnelle.
14. **Choix des prestataires externes** (KYC/KYB, transporteurs, prestataire e-mail/notifications, éventuel outil anti-fraude) — sélection à mener une fois les décisions ci-dessus arbitrées.

---

*Ce document constitue l'architecture technique complète de référence pour TopLuxe, en cohérence avec le document de référence officiel validé. Aucune ligne de code n'a été produite. La prochaine étape, une fois les décisions de la section 15 arbitrées, consistera à décliner ce document en spécifications techniques détaillées par module, puis en tickets de développement.*
