# TopLuxe — Document de Référence Officiel

*Marketplace premium sur Pi Network — Achat et vente en Pi exclusivement*
*Version 2.0 — Document de référence produit, consolidant et remplaçant les versions précédentes*
*Statut : en attente de validation — aucune ligne de code produite*

---

## Sommaire

1. À propos de ce document
2. Vision, mission, valeurs
3. Objectifs — court / moyen / long terme
4. Personas
5. Rôles et matrice des droits
6. Parcours utilisateurs complets
7. Modules applicatifs (vue fonctionnelle)
8. Fonctionnalités détaillées par module
9. Écrans (inventaire UX)
10. Règles métier transverses
11. Exigences de sécurité
12. Exigences de performance
13. Modèle économique
14. Contraintes spécifiques Pi Network
15. Risques et solutions
16. Feuille de route (MVP → V1 → V2)
17. Glossaire
18. Points ouverts nécessitant votre arbitrage

---

## 1. À propos de ce document

Ce document constitue la **référence officielle du projet TopLuxe**. Il est produit par une équipe pluridisciplinaire simulée — produit, business analyst, CTO, architecte logiciel, UX designer, expert blockchain/Pi Network — et a vocation à :

- servir de socle unique et cohérent pour toutes les décisions produit, techniques et business à venir ;
- être la référence utilisée pour générer, dans une étape ultérieure, l'architecture technique détaillée puis le découpage en modules de développement ;
- rester un document vivant, versionné, amendé au fil des validations.

Aucune décision technique d'implémentation (stack, base de données, infrastructure cloud) n'est prise ici volontairement. Ce document décrit **le quoi et le pourquoi**, pas encore **le comment technique**.

---

## 2. Vision, mission, valeurs

### 2.1 Vision

Faire de TopLuxe la marketplace de référence mondiale pour l'achat et la vente de produits haut de gamme réglés exclusivement en Pi, en démontrant qu'une monnaie née d'une communauté peut supporter des échanges de grande valeur avec le même niveau de confiance qu'une marketplace de luxe traditionnelle.

### 2.2 Mission

Offrir aux Pionniers Pi Network un espace où ils peuvent acheter et vendre des biens haut de gamme authentifiés — bijoux, montres, vêtements et chaussures de créateurs, véhicules, art — avec des garanties fortes : vendeurs vérifiés, produits authentifiés, paiement sécurisé par séquestre, gestion professionnelle de la commande jusqu'à la livraison.

### 2.3 Valeurs

| Valeur | Traduction concrète sur la plateforme |
|---|---|
| **Confiance** | Vérification systématique des vendeurs et des produits ; aucune vente sans validation |
| **Exigence** | Curation qualitative plutôt que volume ; standards visuels et éditoriaux premium |
| **Transparence** | Statuts de commande clairs, règles de commission publiques, processus de litige lisible |
| **Sécurité** | Paiement protégé par séquestre ; protection des données personnelles et des documents KYC |
| **Communauté Pi** | La plateforme s'adresse en priorité aux Pionniers, valorise l'écosystème Pi et son usage réel |
| **Exclusivité maîtrisée** | Un catalogue restreint et vérifié plutôt qu'un catalogue ouvert à tous sans contrôle |

---

## 3. Objectifs — court / moyen / long terme

### Court terme (0–6 mois) — Cadrage et MVP

- Valider juridiquement le modèle (KYC, paiement en Pi, escrow) dans au moins une juridiction pilote.
- Constituer un catalogue initial restreint (quelques dizaines de produits vérifiés) via une curation manuelle et/ou des partenariats avec quelques vendeurs pilotes.
- Lancer le MVP fonctionnel : inscription Pi SDK, KYC de base, catalogue, fiche produit, paiement Pi avec escrow simple, gestion de commande, messagerie basique.
- Mesurer la première traction réelle (nombre de transactions, valeur moyenne, taux de litige).

### Moyen terme (6–18 mois) — Structuration et croissance

- Industrialiser le processus d'authentification (réseau d'experts élargi, éventuellement partenaires physiques par catégorie).
- Ouvrir le programme "Maison partenaire" pour des boutiques et créateurs identifiés.
- Déployer un tableau de bord vendeur avancé (analytics, gestion multi-produits, outils marketing internes).
- Étendre les catégories de produits (ex. démarrer avec bijoux/montres/mode, puis élargir vers art et automobile si la logistique le permet).
- Mettre en place un programme de réputation et de fidélité.

### Long terme (18 mois et +) — Leadership et diversification

- Devenir la référence reconnue de la communauté Pi pour les achats de haute valeur.
- Introduire des fonctionnalités avancées : enchères en Pi, passeport numérique du produit, co-investissement encadré sur des pièces d'exception.
- Étendre à de nouvelles zones géographiques selon la maturité réglementaire et l'adoption du Pi.
- Explorer des partenariats institutionnels avec des maisons de luxe reconnues, au-delà de la seule communauté Pi.

---

## 4. Personas

### 4.1 Le Pionnier Collectionneur (Acheteur)

Membre actif de la communauté Pi depuis plusieurs années, technophile, sensible à la reconnaissance de la valeur du Pi dans un usage réel. Recherche des produits authentiques, une expérience d'achat rassurante, et une preuve tangible que le Pi "sert à quelque chose de concret et prestigieux".

**Attentes** : confiance absolue sur l'authenticité, clarté du prix (fiat de référence + équivalent Pi), suivi précis de sa commande, réactivité du vendeur.

### 4.2 Le Vendeur Particulier Premium

Possède un ou quelques biens de valeur (montre, sac, bijou) qu'il souhaite revendre à un public qualifié. N'est pas un professionnel du e-commerce.

**Attentes** : processus de mise en vente simple malgré les exigences de vérification, garantie d'être payé, accompagnement en cas de question.

### 4.3 La Maison / Boutique Partenaire (Vendeur professionnel)

Marque, artisan ou revendeur certifié disposant d'un catalogue régulier. Recherche un canal de vente supplémentaire vers une audience internationale et communautaire.

**Attentes** : outils de gestion catalogue efficaces, conditions commerciales claires, image de marque respectée (branding boutique), volumétrie gérable.

### 4.4 L'Expert Authentificateur

Interne ou partenaire externe spécialisé par catégorie (horlogerie, joaillerie, mode, art, automobile). Garant technique de la confiance de la plateforme.

**Attentes** : outils de revue efficaces (comparatif photo, historique, checklist par catégorie), traçabilité de ses décisions, charge de travail soutenable.

### 4.5 Le Modérateur / Support

Gère la relation client de premier niveau et les litiges simples.

**Attentes** : vision complète et centralisée d'une commande (messages, preuves, statut), outils d'escalade clairs.

### 4.6 L'Administrateur Plateforme

Pilote la plateforme dans son ensemble : conformité, finances, croissance.

**Attentes** : reporting fiable, contrôle fin des paramètres (commissions, seuils KYC), visibilité sur les risques en cours (litiges ouverts, KYC en attente).

---

## 5. Rôles et matrice des droits

*(reprise et confirmation du cadrage précédent — base stable pour l'architecture)*

| Rôle | Peut acheter | Peut vendre | Valide KYC/KYB | Valide authenticité | Traite litiges | Accès reporting global |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Visiteur | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acheteur | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendeur particulier | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vendeur professionnel | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ |
| Expert authentificateur | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modérateur | ❌ | ❌ | ✅ (niveau 1) | ❌ | ✅ (niveau 1) | ❌ (partiel) |
| Administrateur | ❌ | ❌ | ✅ | ✅ (arbitrage) | ✅ (niveau 2) | ✅ |

*\* Sous réserve de la décision d'arbitrage sur le cumul de rôles acheteur/vendeur — voir section 18.*

---

## 6. Parcours utilisateurs complets

### 6.1 Parcours Acheteur — de la découverte à l'avis post-achat

1. **Découverte** : arrivée sur TopLuxe via la Pi Browser App, connexion via Pi SDK Authentication.
2. **Navigation** : filtrage par catégorie, marque, fourchette de prix (affiché en Pi et en équivalent fiat de référence), état du produit.
3. **Consultation fiche produit** : photos/vidéo, certificat d'authenticité, provenance, badge du vendeur (vérifié, top vendeur, maison partenaire), avis existants.
4. **Question au vendeur** (optionnel) : ouverture d'une conversation liée au produit.
5. **Mise en commande** : clic "Acheter", récapitulatif avec prix fiat de référence + conversion Pi au taux du moment.
6. **Vérification KYC acheteur** (si seuil dépassé et KYC non encore validé) : parcours dédié avant de poursuivre.
7. **Paiement** : déclenchement du paiement Pi (`Pi.createPayment`), confirmation utilisateur dans le wallet Pi.
8. **Confirmation serveur** : TopLuxe approuve puis complète le paiement ; les fonds sont placés en **escrow**.
9. **Suivi de commande** : statuts visibles en temps réel (préparation → expédition → livraison), notifications à chaque étape.
10. **Réception** : confirmation manuelle de bonne réception par l'acheteur, ou validation automatique après un délai sans contestation.
11. **Libération des fonds** au vendeur (commission déduite), commande clôturée.
12. **Avis** : l'acheteur est invité à noter le vendeur et le produit.

### 6.2 Parcours Vendeur — de l'inscription à la vente conclue

1. **Activation du statut vendeur** depuis un compte acheteur existant (ou création directe orientée vendeur).
2. **KYC (particulier) ou KYB (professionnel)** : soumission des documents requis, revue, validation.
3. **Création de fiche produit** : catégorie, marque, état, description, prix souhaité, photos, preuves d'authenticité disponibles.
4. **Soumission pour vérification** : passage devant un expert authentificateur.
5. **Aller-retour éventuel** : demande de compléments d'information par l'expert.
6. **Publication** du produit dans le catalogue après validation.
7. **Réception d'une commande** : notification, préparation du colis, saisie du numéro de suivi.
8. **Expédition** dans le délai imparti (sous peine d'annulation automatique).
9. **Livraison confirmée** par l'acheteur ou le système.
10. **Réception des fonds** (commission déduite) après libération de l'escrow.
11. **Réputation** : le vendeur accumule des avis, peut atteindre des badges de statut supérieur.

### 6.3 Parcours Expert authentificateur

1. Réception d'une nouvelle soumission dans sa file de travail (filtrée par catégorie de spécialité).
2. Revue des photos, du numéro de série, des documents fournis, comparaison avec des références connues.
3. Décision : validation directe, rejet motivé, ou demande de compléments (photo sous un angle précis, document manquant).
4. Pour les produits à très forte valeur : déclenchement éventuel d'une vérification physique via un point de contrôle partenaire (processus logistique dédié).
5. Historisation de la décision, produit publié ou vendeur notifié du rejet.

### 6.4 Parcours Litige

1. Ouverture par l'acheteur ou le vendeur depuis la commande concernée, sélection d'un motif prédéfini, ajout de preuves.
2. Blocage automatique de la libération des fonds en escrow.
3. Tentative de résolution directe via la messagerie encadrée (délai indicatif, ex. 48h).
4. Escalade à un modérateur si non résolu : revue des preuves, des messages, du tracking logistique.
5. Décision du modérateur, ou escalade à l'administrateur pour les cas complexes (remboursement total/partiel, libération au vendeur).
6. Clôture, notification aux deux parties, impact éventuel sur la réputation du vendeur.

### 6.5 Parcours Maison / Boutique Partenaire (onboarding B2B)

1. Prise de contact (formulaire dédié ou démarchage).
2. Constitution du dossier KYB renforcé (documents légaux, représentant légal, coordonnées de règlement).
3. Validation par l'administrateur, avec potentiellement une diligence renforcée compte tenu de l'enjeu de crédibilité pour la marque TopLuxe.
4. Configuration de la boutique officielle (branding dédié, présentation de la maison, storytelling).
5. Import du catalogue (à l'unité au MVP, en masse en V1/V2).
6. Chaque produit suit néanmoins le processus d'authentification, avec un niveau d'exigence à définir selon la confiance déjà établie envers la maison partenaire *(point d'arbitrage, voir section 18)*.

### 6.6 Parcours Administrateur — pilotage courant

1. Connexion au back-office sécurisé (accès distinct de l'app Pi grand public).
2. Consultation du tableau de bord : transactions du jour, litiges ouverts, KYC en attente, alertes de fraude potentielle.
3. Traitement des files prioritaires (KYC/KYB en attente, litiges escaladés).
4. Consultation du reporting financier (volume, commissions perçues, taux de litige, taux de conversion).
5. Ajustement de paramètres si besoin (taux de commission, seuils KYC, mise en avant de catégories).

---

## 7. Modules applicatifs (vue fonctionnelle)

Découpage fonctionnel de la plateforme en modules cohérents — base de réflexion pour la future architecture technique, sans préjuger de son implémentation :

1. **Identité & Authentification** — connexion Pi SDK, gestion de session, gestion des rôles.
2. **KYC / KYB** — collecte, revue, statut de vérification d'identité.
3. **Catalogue & Fiche Produit** — création, gestion, cycle de vie des annonces.
4. **Authentification Produit (Curation)** — file de travail experts, décisions, traçabilité.
5. **Paiements Pi** — intégration Pi Payments (U2A/A2U), conversion fiat/Pi, historique transactionnel.
6. **Escrow** — séquestre applicatif, règles de libération/blocage des fonds.
7. **Commandes** — cycle de vie complet de la commande, statuts, délais.
8. **Logistique / Livraison** — suivi expédition, partenaires transporteurs, preuves de livraison.
9. **Messagerie** — communication contextualisée acheteur-vendeur.
10. **Avis & Réputation** — notation, badges, historique de fiabilité.
11. **Litiges** — ouverture, médiation, résolution, historisation.
12. **Back-office Administration** — supervision globale, configuration, reporting.
13. **Notifications** — in-app et email, multi-événements.
14. **Recherche & Découverte** — filtres, mise en avant, recommandations (V1/V2).
15. **Analytics & Reporting** — indicateurs business et opérationnels.
16. **Contenu éditorial / Boutique Partenaire (CMS léger)** — storytelling maison, pages de marque (V1/V2).

---

## 8. Fonctionnalités détaillées par module

*(Ce niveau de détail reprend et enrichit le cahier des charges précédent ; il est réorganisé ici par module pour préparer directement le découpage en services techniques.)*

### 8.1 Identité & Authentification
- Connexion via Pi SDK (scopes `username`, `payments`, éventuellement `wallet_address`).
- Un compte TopLuxe = un uid Pi unique, pas de doublon.
- Gestion des rôles multiples sur un même compte (acheteur/vendeur) — *sous réserve de l'arbitrage section 18*.
- Statuts de compte : actif, en attente de vérification, suspendu, banni.
- Gestion de session sécurisée, déconnexion, renouvellement de token.

### 8.2 KYC / KYB
- Parcours différencié : KYC léger acheteur (au-delà d'un seuil), KYC standard vendeur particulier, KYB vendeur professionnel.
- Statuts : non démarré, en cours, en attente de revue manuelle, validé, rejeté (motivé), expiré.
- Recommandation de délégation à un prestataire tiers spécialisé plutôt qu'un développement interne, pour des raisons de conformité.
- Conservation limitée et chiffrée des documents, conforme RGPD.

### 8.3 Catalogue & Fiche Produit
- Cycle de vie : brouillon → soumis → publié / rejeté → réservé → vendu → retiré.
- Champs obligatoires : catégorie, marque (si applicable), état, prix fiat de référence, photos (minimum requis), description.
- Champs avancés : numéro de série, certificat existant, facture d'origine, accessoires inclus.
- Gestion multi-catégories : bijoux, montres, mode/chaussures, art, automobile (ouverture progressive selon la feuille de route).

### 8.4 Authentification Produit (Curation)
- File de travail par expert, filtrable par catégorie de spécialité.
- Décision : validé / rejeté / compléments demandés, avec motif obligatoire.
- Option de vérification physique pour objets à très forte valeur (processus logistique dédié à définir : point de contrôle partenaire).
- Historisation complète (qui, quand, quelle décision, quel motif).

### 8.5 Paiements Pi
- Initiation du paiement côté client (`Pi.createPayment`), cycle standard approve/complete côté serveur.
- Prix affiché en devise fiat de référence, conversion en Pi verrouillée sur une fenêtre courte au moment du paiement (pour limiter l'effet de la volatilité).
- Statuts : initié, en attente d'approbation, approuvé, complété, échoué, annulé, remboursé.
- Historique transactionnel complet, réconciliable avec les données on-chain Pi.

### 8.6 Escrow
- Fonds crédités sur un compte applicatif TopLuxe à la validation du paiement (pas de versement direct au vendeur).
- Libération déclenchée par confirmation acheteur ou expiration d'un délai automatique sans contestation.
- Blocage automatique en cas de litige ouvert.
- Prélèvement de la commission TopLuxe au moment de la libération.
- *Point à valider techniquement : mécanisme exact selon les capacités actuelles de Pi Payments (A2U pour le reversement au vendeur) — voir section 14.*

### 8.7 Commandes
- Une commande = un produit (au MVP, pour simplifier la logique d'escrow — évolutif en V1/V2 si pertinent).
- Statuts : créée, paiement en attente, payée (escrow), en préparation, expédiée, livrée, confirmée, clôturée, ou bifurcation litige.
- Délai d'expédition imparti au vendeur, avec annulation/remboursement automatique en cas de dépassement.

### 8.8 Logistique / Livraison
- Numéro de suivi obligatoire.
- Transporteurs partenaires spécialisés imposés au-delà d'un seuil de valeur (assurance, signature à réception).
- Statuts : en attente d'expédition, expédiée, en transit, livrée, litige livraison.

### 8.9 Messagerie
- Conversation systématiquement liée à un produit ou une commande.
- Détection/limitation des tentatives de contournement de la plateforme.
- Historique consultable par la modération en cas de litige.

### 8.10 Avis & Réputation
- Avis possible uniquement après clôture réelle d'une commande.
- Note globale + critères détaillés (conformité, emballage, réactivité).
- Badges : vendeur vérifié, top vendeur, maison partenaire officielle.

### 8.11 Litiges
- Motifs prédéfinis (non reçu, non conforme, endommagé, authenticité suspectée).
- Processus en paliers : résolution directe → médiation modérateur → décision admin.
- Délai maximal de traitement pour éviter les litiges qui s'éternisent.

### 8.12 Back-office Administration
- Supervision utilisateurs, produits, transactions, litiges.
- Reporting financier (volume, commissions, taux de litige).
- Configuration des paramètres clés (commissions, seuils KYC, catégories mises en avant).

### 8.13 Notifications
- Déclenchées par : changement de statut commande, nouveau message, décision d'authentification, résultat KYC, ouverture/résolution litige.
- Canaux : in-app obligatoire, email si coordonnées fournies (optionnel côté utilisateur).

### 8.14 Recherche & Découverte *(V1/V2)*
- Filtres avancés (marque, matériau, année, fourchette de prix Pi/fiat).
- Mise en avant éditoriale (sélections, nouveautés, maisons partenaires).
- Recommandations personnalisées *(V2, à évaluer selon la volumétrie de données disponible)*.

### 8.15 Analytics & Reporting
- Indicateurs business : volume de transactions, valeur moyenne de panier, taux de conversion, taux de litige, répartition par catégorie.
- Indicateurs opérationnels : délai moyen de validation KYC, délai moyen d'authentification produit, délai moyen d'expédition.

### 8.16 Contenu éditorial / Boutique Partenaire *(V1/V2)*
- Pages de marque personnalisées pour les maisons partenaires.
- Contenu éditorial (mise en avant d'histoires de produits, dossiers thématiques) pour renforcer le positionnement premium.

---

## 9. Écrans (inventaire UX)

Vue d'ensemble des écrans nécessaires, organisée par persona. Cet inventaire sert de base pour un futur travail de wireframing détaillé (non réalisé à ce stade).

### 9.1 Écrans côté Acheteur / Visiteur
1. Accueil / Découverte (mise en avant, catégories phares)
2. Catalogue avec filtres (catégorie, prix, marque, état)
3. Fiche produit détaillée (photos, description, certificat, avis, vendeur)
4. Fil de messagerie (par produit/commande)
5. Récapitulatif de commande / checkout
6. Écran de paiement Pi (interface Pi SDK)
7. Suivi de commande (timeline de statuts)
8. Historique des commandes
9. Écran KYC acheteur (si déclenché)
10. Écran de confirmation de réception / ouverture de litige
11. Formulaire d'avis post-achat
12. Profil utilisateur (informations, préférences, adresses de livraison)
13. Centre de notifications

### 9.2 Écrans côté Vendeur
1. Tableau de bord vendeur (vue synthétique : ventes en cours, produits publiés, litiges éventuels)
2. Écran KYC / KYB vendeur
3. Formulaire de création de fiche produit (upload photos, description, prix)
4. Écran de soumission pour authentification + suivi du statut
5. Liste des produits (par statut : brouillon, en vérification, publié, vendu)
6. Détail d'une commande reçue (infos acheteur limitées, adresse de livraison, actions : expédier)
7. Saisie du numéro de suivi / confirmation d'expédition
8. Messagerie vendeur
9. Réputation et avis reçus
10. Page boutique officielle *(vendeur professionnel / maison partenaire, V1/V2)*
11. Statistiques de vente *(V1/V2)*

### 9.3 Écrans côté Expert Authentificateur
1. File de travail (produits en attente de vérification, filtrable par catégorie)
2. Écran de revue détaillée d'un produit (photos, documents, zoom, comparatif)
3. Formulaire de décision (valider / rejeter / demander compléments) avec champ de motif
4. Historique des décisions prises

### 9.4 Écrans côté Modérateur
1. File des litiges ouverts (priorisation)
2. Détail d'un litige (preuves, messages, statut de la commande, tracking)
3. Formulaire de décision / proposition de résolution
4. File des KYC/KYB en attente de revue niveau 1

### 9.5 Écrans côté Administrateur (Back-office)
1. Tableau de bord global (transactions, litiges, KYC en attente, alertes)
2. Gestion des utilisateurs (recherche, statut, suspension/bannissement)
3. Gestion des produits (modération, retrait)
4. Reporting financier (volume, commissions, export)
5. Configuration des paramètres plateforme (taux de commission, seuils KYC, catégories)
6. Gestion des litiges escaladés (niveau 2)
7. Gestion des maisons partenaires *(V1/V2)*

---

## 10. Règles métier transverses

- Aucun produit n'est visible dans le catalogue sans validation d'un expert authentificateur.
- Aucun fonds n'est versé à un vendeur avant confirmation de réception ou expiration du délai de contestation.
- Aucune vente ne peut être initiée par un vendeur dont le KYC/KYB n'est pas au statut "validé".
- Un litige ouvert bloque systématiquement la libération des fonds en escrow, sans exception.
- Un avis ne peut être laissé que sur une commande réellement clôturée.
- Toute décision impactant la confiance (authentification, litige, KYC) doit être historisée avec l'identité du décideur, la date et le motif.
- Le prix affiché par défaut est exprimé en devise fiat de référence ; l'équivalent Pi n'est figé qu'au moment du paiement, dans une fenêtre de temps limitée.

---

## 11. Exigences de sécurité

- **Contrôle d'accès** : modèle de permissions basé sur les rôles (RBAC), principe du moindre privilège pour les comptes internes (modérateurs, experts, admin).
- **Protection des données KYC** : chiffrement au repos et en transit des documents d'identité, accès strictement limité et journalisé, durée de conservation encadrée et conforme RGPD.
- **Sécurité des paiements** : validation stricte côté serveur de chaque étape du cycle Pi Payments (approve/complete), vérification d'intégrité des webhooks/callbacks Pi, protection contre les tentatives de rejeu (replay) ou de double validation.
- **Anti-fraude** : détection de comportements suspects (multi-comptes, tentative de contournement de l'escrow, faux avis), limitation de débit (rate limiting) sur les actions sensibles.
- **Journalisation et auditabilité** : traçabilité complète des actions à impact financier ou sur la confiance (authentification produit, décisions de litige, libération de fonds, changements de statut KYC).
- **Sécurité applicative générale** : protection contre les vulnérabilités standards (injection, cross-site scripting, falsification de requête), gestion sécurisée des sessions, authentification forte pour les comptes internes à privilèges élevés (admin, modérateurs).
- **Conformité RGPD** : minimisation des données collectées, base légale identifiée pour chaque traitement, droits d'accès/rectification/suppression effectifs.

---

## 12. Exigences de performance

- **Temps de réponse catalogue/recherche** : affichage fluide même avec une croissance progressive du nombre de produits (objectif indicatif à raffiner en architecture : temps de chargement perçu bas sur les parcours de découverte).
- **Fenêtre de paiement** : le processus de paiement Pi (de l'initiation à la confirmation) doit rester fluide et rassurant pour l'utilisateur, avec une gestion claire des cas d'attente (confirmation blockchain non instantanée).
- **Disponibilité** : les étapes critiques (paiement, escrow, confirmation de commande) doivent bénéficier d'un niveau de fiabilité renforcé par rapport aux fonctionnalités secondaires (ex. contenu éditorial).
- **Scalabilité progressive** : l'architecture doit pouvoir absorber la croissance attendue par la feuille de route (section 16) sans refonte majeure entre le MVP et la V1.
- **Gestion des médias** : les photos/vidéos produits (souvent nombreuses et en haute définition pour du luxe) doivent être servies efficacement, avec un temps de chargement maîtrisé sur mobile (contexte Pi Browser App).
- **Résilience** : dégradation progressive plutôt que panne totale en cas de forte charge ponctuelle (ex. mise en avant d'un produit rare générant un pic de trafic).

*(Ces exigences seront chiffrées précisément — temps en millisecondes, SLA de disponibilité, capacité en nombre d'utilisateurs concurrents — lors de la phase d'architecture technique, en fonction des choix d'infrastructure.)*

---

## 13. Modèle économique

| Levier | Description | Statut |
|---|---|---|
| **Commission sur transaction** | Prélevée à la libération des fonds en escrow, taux différencié possible selon catégorie ou statut vendeur (particulier vs professionnel vs maison partenaire) | **Taux à définir avec vous** — proposition initiale à discuter (ex. fourchette 5–15 %) |
| **Frais de mise en avant** | Vendeurs payant pour une visibilité renforcée (accueil, catégorie) | À activer en V1 |
| **Abonnement vendeur premium** | Outils avancés (analytics, boutique personnalisée) pour vendeurs professionnels | À activer en V1/V2 |
| **Frais d'authentification renforcée** | Pour les vérifications physiques sur objets à très forte valeur | À définir selon le coût réel du réseau d'experts/partenaires |
| **Programme d'affiliation** | Commission sur apport de nouveaux vendeurs/acheteurs qualifiés | À évaluer en V2 |

**Question ouverte pour vous** : quel positionnement tarifaire souhaitez-vous par rapport aux marketplaces de luxe existantes, et quelle importance accordez-vous à un taux de commission attractif au lancement (quitte à l'ajuster une fois la confiance installée) versus une rentabilité plus rapide ?

---

## 14. Contraintes spécifiques Pi Network

- **Intégration obligatoire au Pi SDK** : authentification, paiements (U2A pour les achats), et potentiellement A2U pour les remboursements et le reversement aux vendeurs après escrow.
- **Escrow non natif** : à notre connaissance, Pi Payments ne propose pas nativement un mécanisme d'escrow on-chain généraliste ; le séquestre devra très probablement être géré par la logique applicative de TopLuxe (réception sur un compte Pi applicatif, puis reversement A2U après confirmation). *Ce point doit être vérifié précisément dans la documentation Pi Payments la plus récente avant de figer l'architecture — il conditionne fortement la conception du module Escrow.*
- **Volatilité et taux de conversion** : le prix de référence doit rester en devise fiat pour la lisibilité, avec une conversion Pi verrouillée sur une fenêtre courte au moment du paiement.
- **Dépendance à la Pi Browser App** : l'essentiel de l'expérience utilisateur transite par le navigateur Pi, avec les contraintes UX/techniques que cela implique (par opposition à une app native classique).
- **Respect des Pi Developer Guidelines** : toute fonctionnalité doit rester conforme aux règles d'usage de la plateforme Pi, qui peuvent évoluer — une veille active est nécessaire.
- **Statut d'accès mainnet** : nécessité de confirmer que l'application TopLuxe dispose bien d'un accès validé à l'environnement de production Pi Payments avant tout lancement commercial réel.

---

## 15. Risques et solutions

| Risque | Impact | Solution proposée |
|---|---|---|
| Vente d'un bien contrefait malgré la curation | Réputationnel / légal, majeur | Double validation experte, vérification physique pour objets à forte valeur, politique de remboursement immédiat en cas de contrefaçon avérée |
| Mécanisme d'escrow non réalisable tel quel avec les capacités actuelles de Pi Payments | Technique, bloquant potentiel | Vérification technique précoce et prioritaire avant toute autre décision d'architecture ; plan B applicatif si nécessaire |
| Statut réglementaire incertain du Pi comme moyen de paiement | Légal | Conseil juridique par juridiction, veille continue, architecture permettant d'ajouter d'autres options si nécessaire |
| Volatilité du Pi entre validation panier et paiement | Financier | Verrouillage du taux sur une fenêtre courte, affichage transparent du taux appliqué |
| Litiges non résolus dégradant la confiance | Opérationnel | Processus de médiation structuré avec délais stricts |
| Vendeur ne respectant pas les délais d'expédition | Opérationnel | Annulation et remboursement automatiques, impact sur la réputation |
| Faible liquidité/traction au lancement | Business | Curation qualitative, partenariats pilotes, communication ciblée communauté Pi |
| Fuite de données KYC | Sécurité / légal, critique | Délégation à un prestataire spécialisé, chiffrement, accès strictement limité, audits réguliers |
| Coût élevé de la vérification manuelle | Business | Catalogue restreint au démarrage, automatisation progressive des contrôles de premier niveau |
| Évolution des règles de la Pi Platform | Technique / stratégique | Veille active, architecture backend découplée autant que possible du SDK |

---

## 16. Feuille de route

### MVP (Court terme)
- Authentification Pi SDK, gestion de compte simple.
- KYC/KYB basique (revue manuelle interne acceptable à ce stade).
- Catalogue restreint, quelques catégories prioritaires (à confirmer — ex. bijoux, montres, mode).
- Fiche produit complète avec processus d'authentification par un expert.
- Paiement Pi avec escrow applicatif simple.
- Gestion de commande de bout en bout (préparation → expédition → livraison → clôture).
- Messagerie basique liée aux commandes/produits.
- Gestion de litiges simple (paliers manuels).
- Back-office administrateur minimal (supervision, validation KYC, gestion litiges).
- Notifications in-app essentielles.

### V1 (Moyen terme)
- KYC/KYB délégué à un prestataire spécialisé.
- Ouverture du programme Maison Partenaire (boutique officielle, branding).
- Tableau de bord vendeur avancé (analytics de base).
- Frais de mise en avant, premiers leviers de monétisation additionnels.
- Extension du catalogue à de nouvelles catégories (selon faisabilité logistique).
- Recherche et filtres avancés.
- Amélioration du processus d'authentification (réseau d'experts élargi, éventuelle vérification physique structurée).
- Reporting et analytics enrichis pour l'administration.

### V2 (Long terme)
- Enchères en Pi pour pièces rares/uniques.
- Passeport numérique du produit (traçabilité étendue, potentiellement via ancrage blockchain à étudier).
- Abonnements vendeur premium, programme d'affiliation.
- Fonctionnalités de co-investissement encadré sur pièces d'exception *(sous réserve stricte de faisabilité réglementaire)*.
- Application mobile dédiée au-delà de la Pi Browser App, si pertinent.
- Extension géographique selon maturité réglementaire.

---

## 17. Glossaire

- **Pionnier** : membre de la communauté Pi Network.
- **U2A / A2U** : User-to-App / App-to-User, les deux sens de flux du protocole Pi Payments.
- **Escrow** : séquestre des fonds jusqu'à confirmation de bonne exécution de la transaction.
- **KYC / KYB** : Know Your Customer / Know Your Business — vérification d'identité d'un individu ou d'une entreprise.
- **Maison partenaire** : vendeur professionnel disposant d'un espace de marque dédié sur TopLuxe.
- **Curation** : processus de sélection et de validation qualitative des produits avant publication.

---

## 18. Points ouverts nécessitant votre arbitrage

Avant de passer à la conception de l'architecture technique détaillée, les points suivants doivent être tranchés :

1. **Cumul des rôles acheteur/vendeur** sur un même compte : autorisé ou séparé ?
2. **Mécanisme exact de l'escrow** : confirmation technique précise des capacités actuelles de Pi Payments (A2U) pour valider ou ajuster le modèle décrit en 8.6/14.
3. **Catégories de lancement prioritaires** : toutes dès le MVP, ou un sous-ensemble (ex. bijoux + montres + mode en premier, art et automobile plus tard) ?
4. **Mode de KYC au MVP** : revue manuelle interne temporaire, ou prestataire externe dès le lancement ?
5. **Niveau d'exigence de vérification physique** selon la valeur du produit, et identification de partenaires logistiques/points de contrôle.
6. **Juridiction(s) de lancement ciblée(s)**, pour cadrer précisément les obligations légales avec un conseil juridique dédié.
7. **Taux de commission cible** et politique tarifaire vis-à-vis des vendeurs professionnels vs particuliers.
8. **Niveau d'exigence d'authentification pour les maisons partenaires déjà réputées** : processus allégé ou identique à celui des vendeurs particuliers ?
9. **Panier mono-produit ou multi-produits** au MVP.

---

*Ce document constitue la référence officielle du projet TopLuxe à ce stade. Aucune ligne de code n'a été produite. La prochaine étape, une fois ce document validé et les points de la section 18 arbitrés, consistera à concevoir l'architecture technique détaillée (modèle de données, découpage en services, choix technologiques) puis à la décliner en modules de développement.*
