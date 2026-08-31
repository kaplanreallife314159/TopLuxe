# TopLuxe — Spécifications Techniques Détaillées & Backlog MVP

*Marketplace premium sur Pi Network*
*Document produit par l'équipe technique (CTO senior, Tech Lead, Software Architect, Blockchain Engineer Pi Network, QA Lead)*
*Version 1.0 — Prêt pour exécution développeur*
*Statut : spécifications détaillées, aucune ligne de code produite*

---

## Sommaire

0. Analyse technique préalable — Pi Network (obligatoire avant Paiements/Escrow)
1. Module — Identité & Authentification
2. Module — Audit & Journalisation
3. Module — KYC / KYB
4. Module — Catalogue & Fiche Produit
5. Module — Curation / Authentification Produit
6. Module — Paiements Pi
7. Module — Escrow
8. Module — Commandes
9. Module — Logistique / Livraison (national)
10. Module — Messagerie
11. Module — Litiges
12. Module — Notifications
13. Module — Back-office Administration
14. Module — Commissions & Facturation
15. Backlog MVP (tickets TLX-001 à TLX-039+)
16. A. Architecture technique finale recommandée
17. B. Stack technologique recommandée et justification
18. C. Structure recommandée du repository GitHub
19. D. Environnements nécessaires
20. E. Variables / secrets nécessaires
21. F. Ordre exact des premiers tickets
22. G. Checklist « PRÊT À CODER »
23. H. Points à valider par le fondateur
24. I. Points à vérifier dans la documentation officielle Pi Network avant le premier commit

---

## 0. Analyse technique préalable — Pi Network

*Cette section a été établie à partir de la documentation officielle et semi-officielle disponible (dépôts GitHub `pi-apps` maintenus par l'écosystème Pi, Pi Developer Guide, Pi Developer Portal). Chaque point est marqué **CONFIRMÉ** (documenté officiellement) ou **NON CONFIRMÉ — NE PAS IMPLÉMENTER AVANT VALIDATION** (absence de documentation officielle suffisamment claire ou fiable). Aucune hypothèse n'est présentée comme un fait acquis.*

### 0.1 Authentification Pi — **CONFIRMÉ**

Le SDK Pi permet d'authentifier un utilisateur ("Pioneer") de façon sécurisée via son identité Pi Network, en complément des fonctionnalités de paiement et d'accès au Pi Wallet<cite index="4-1">, avec une authentification utilisateur sécurisée via les comptes Pi Network</cite>. L'authentification et les paiements nécessitent que l'application s'exécute à l'intérieur du Pi Browser<cite index="7-1">, l'authentification et les fonctionnalités de paiement du SDK Pi nécessitant que l'application fonctionne dans le Pi Browser</cite>.

**Implication pour TopLuxe** : le module Identité & Authentification s'appuie sur ce mécanisme côté client (SDK) combiné à une validation côté serveur du token/utilisateur retourné.

### 0.2 Cycle de paiement U2A (User-to-App) — **CONFIRMÉ**

Le flux U2A est un mécanisme en trois phases documenté officiellement<cite index="3-1">: la création du paiement côté frontend, l'obtention d'un identifiant de paiement transmis au serveur pour approbation, puis l'approbation côté serveur via l'appel API /approve qui permet à l'utilisateur de soumettre la transaction blockchain</cite>. Après approbation, la transaction est soumise à la blockchain, puis le SDK transmet l'identifiant de transaction (TxID) au frontend via le callback `onReadyForServerCompletion`, à charge pour l'application de le transmettre au serveur pour finaliser le paiement via l'appel /complete<cite index="5-1">, le serveur de l'application accusant réception du paiement auprès des serveurs Pi via l'endpoint /complete</cite>.

Il est explicitement recommandé de ne jamais marquer un paiement comme complété côté application avant confirmation d'un code 200 par l'appel serveur de complétion, afin d'éviter la livraison d'un bien suite à un paiement falsifié<cite index="3-1">, un code d'erreur autre que 200 sur l'appel serveur de complétion devant empêcher de marquer le paiement comme complété et de livrer l'article</cite>.

**Implication pour TopLuxe** : le module Paiements Pi doit implémenter strictement ce cycle, avec un statut intermédiaire explicite tant que la confirmation blockchain n'est pas obtenue.

### 0.3 Callbacks / Webhooks — **CONFIRMÉ (mécanisme de callback SDK, pas de webhook serveur-à-serveur classique)**

Il ne s'agit pas d'un webhook HTTP entrant classique vers le serveur TopLuxe, mais d'un système de callbacks JavaScript déclenchés côté client par le SDK (`onReadyForServerApproval`, `onReadyForServerCompletion`, `onCancel`, `onError`)<cite index="15-1">, ces callbacks étant invoqués via window.Pi.createPayment avec une fonction dédiée pour chaque étape du cycle de paiement</cite>, à charge pour le frontend de relayer les identifiants reçus vers le backend TopLuxe.

**Implication pour TopLuxe** : il n'existe pas de notification serveur-à-serveur asynchrone native de la part de Pi si l'utilisateur quitte l'application avant la fin du cycle — d'où la nécessité impérative d'un mécanisme de réconciliation périodique (voir 0.8).

### 0.4 Flux App-to-User (A2U) — **CONFIRMÉ (disponible, mais entièrement à la charge et sous la responsabilité du développeur)**

Le flux A2U est officiellement documenté et disponible via des bibliothèques backend officielles (Node.js, PHP, Python, Rust)<cite index="13-1">, ce flux impliquant à la fois une interaction avec la blockchain Pi et avec le backend Pi, la blockchain étant la seule source de vérité pour l'échange de Pi tandis que le backend Pi améliore l'expérience utilisateur et aide à éviter les erreurs de paiement comme les doubles paiements</cite>.

Le processus documenté comprend trois étapes explicites<cite index="17-1">: la création du paiement A2U qui retourne un identifiant à stocker impérativement en base pour éviter tout double paiement, la soumission de la transaction à la blockchain qui retourne un identifiant de transaction, puis la complétion du paiement une fois la transaction vérifiée</cite>.

Point technique majeur confirmé : l'exécution du flux A2U nécessite que l'application dispose de son propre **portefeuille applicatif (app wallet)** dont la clé privée est détenue et utilisée directement par le serveur de l'application pour signer et soumettre la transaction<cite index="11-1">, le SDK backend étant initialisé avec la clé API de l'application ainsi que la clé privée du portefeuille applicatif</cite>. Pi Network précise explicitement que la gestion de ce portefeuille et de ses actifs relève entièrement de la responsabilité du développeur, sans garantie fournie par la plateforme<cite index="10-1">, la responsabilité de la gestion du portefeuille et des actifs applicatifs incombant exclusivement aux développeurs, les API étant fournies telles quelles sans garantie</cite>.

**Implication majeure pour TopLuxe** : le module Escrow et le versement aux vendeurs reposent sur ce mécanisme, ce qui signifie que **TopLuxe doit lui-même sécuriser, sauvegarder et surveiller la clé privée de son portefeuille applicatif** — un actif critique à traiter avec le plus haut niveau de sécurité (voir section Escrow).

### 0.5 Mécanisme d'escrow — **PARTIELLEMENT CONFIRMÉ — DISTINCTION IMPORTANTE**

Deux réalités distinctes ont été identifiées et ne doivent pas être confondues :

- Il existe une fonctionnalité **native** de "Pi Network Escrow", mais elle est intégrée au **P2P Marketplace du Pi Wallet lui-même**, un service permettant aux Pionniers d'échanger des actifs Pi entre eux, réservé aux utilisateurs ayant complété le KYC Pi et migré leurs actifs sur le mainnet<cite index="30-1">, l'activation du P2P Marketplace sur le portefeuille Pi permettant d'échanger des actifs Pi en toute sécurité avec d'autres Pionniers grâce aux services d'escrow de Pi Network, réservés aux Pionniers ayant complété le KYC et migré leurs actifs vers le mainnet</cite>. **Ce service ne concerne pas les transactions commerciales de biens/services au sein d'une application tierce comme TopLuxe.**
- Aucune API officielle généraliste d'escrow pour applications tierces (permettant de séquestrer un paiement U2A jusqu'à une condition métier définie par le développeur) n'a été identifiée dans la documentation Pi Platform.

**Conclusion : « NON CONFIRMÉ — NE PAS IMPLÉMENTER UN ESCROW NATIF PI AVANT VALIDATION »**. Il n'existe pas de service d'escrow Pi utilisable directement par TopLuxe pour ses transactions marketplace.

**Plan B retenu (techniquement réaliste et documenté)** : construire l'escrow **applicativement** — le paiement U2A de l'acheteur est envoyé au portefeuille applicatif de TopLuxe, les fonds y restent sous le contrôle exclusif de TopLuxe (statut "bloqué" géré uniquement au niveau de la base de données TopLuxe, pas au niveau blockchain), puis un paiement A2U est déclenché vers le vendeur lors de la libération. **Ce plan B est confirmé comme techniquement réalisable** par la documentation des flux U2A et A2U ci-dessus, mais implique que TopLuxe assume l'intégralité de la responsabilité de sécurité et de conformité sur les fonds ainsi détenus.

### 0.6 Contraintes liées au compte de paiement de l'application — **CONFIRMÉ**

- Un portefeuille applicatif doit être créé sur `wallet.pi`, avec confirmation d'accès obligatoire avant de poursuivre l'enregistrement de l'application<cite index="21-1">, un portefeuille devant être créé sur wallet.pi avec confirmation d'accès obligatoire en ouvrant le portefeuille créé avant de continuer</cite>.
- L'obtention d'un portefeuille **mainnet** nécessite au préalable que le développeur ait complété le KYC Pi<cite index="22-1">, l'obtention d'un portefeuille mainnet Pi nécessitant au préalable la complétion du KYC Pi, ce qui explique qu'il soit suggéré aux développeurs de lancer d'abord leur application sur testnet où n'importe qui peut créer un portefeuille</cite>.
- La clé API et la clé privée du portefeuille applicatif doivent être traitées comme des secrets de production, jamais codées en dur ni exposées<cite index="13-1">, la clé API de l'application ne devant jamais être codée en dur mais lue depuis une variable d'environnement et traitée comme un secret de production</cite>.

### 0.7 Exigences du Pi Developer Portal — **CONFIRMÉ**

- L'enregistrement d'une application impose de choisir un réseau ("App Network" — Mainnet ou Testnet) **au moment de la création**, et ce choix est **définitif et non modifiable** ensuite<cite index="19-1">, une application ne pouvant se connecter qu'à un seul réseau à la fois, et une fois l'application enregistrée cette option ne pouvant plus être changée, ce qui implique de créer deux applications distinctes, une en testnet pour les tests et une en mainnet pour la production</cite>.
- Chaque application dispose d'une "App Checklist" dans le portail, dont les étapes se débloquent séquentiellement<cite index="19-1">, chaque application ayant sa propre liste de contrôle aidant à suivre les étapes requises, celles-ci se débloquant progressivement au fur et à mesure de leur complétion</cite>.

**Implication pour TopLuxe** : il faut prévoir dès le Sprint 0 la création de **deux applications Pi distinctes** (une Testnet pour tout le développement/QA, une Mainnet pour la production), avec deux jeux de clés API et deux portefeuilles applicatifs séparés.

### 0.8 Exigences sandbox / testnet — **CONFIRMÉ**

Un environnement Sandbox Pi est disponible pour tester une application dans un navigateur desktop local avant tout déploiement dans le Pi Browser réel<cite index="14-1">, la documentation orientant d'abord vers les prérequis fondamentaux avec des listes de contrôle pour configurer le compte développeur, enregistrer une première application, et utiliser le Pi Sandbox pour tester l'application dans un navigateur desktop local avant le déploiement dans le Pi Browser</cite>. L'initialisation du SDK en mode sandbox se fait via un paramètre dédié<cite index="6-1">, l'initialisation se faisant avec `Pi.init({ version: "2.0", sandbox: true })`</cite>.

### 0.9 Conditions nécessaires au mainnet — **PARTIELLEMENT CONFIRMÉ, DÉLAIS NON CONFIRMÉS**

Confirmé : le développeur doit compléter un KYC Pi personnel avant de pouvoir lister une application sur le mainnet<cite index="20-1">, les développeurs devant compléter le KYC pour vérifier leur identité avant de soumettre une demande de listing, cette mesure visant à protéger l'écosystème Pi en cherchant à prévenir les acteurs frauduleux</cite>. Des exigences de branding sont également imposées<cite index="20-1">, l'URL/domaine de l'application ne devant pas commencer par « pi » ni détourner le branding Pi, l'usage du logo, des couleurs ou des éléments de design officiels étant à éviter</cite>.

**NON CONFIRMÉ — NE PAS PLANIFIER DE DATE DE LANCEMENT MAINNET FERME AVANT VALIDATION** : les délais réels d'approbation d'une application pour le mainnet ne sont pas documentés officiellement de façon fiable et prévisible ; plusieurs retours communautaires font état de délais de plusieurs mois avec des statuts de revue restant bloqués sans visibilité claire. **Plan B** : bâtir la feuille de route MVP en supposant un délai d'approbation mainnet non maîtrisable (traité comme un risque projet), et soumettre la demande de listing mainnet le plus tôt possible dans le calendrier — pas en toute fin de projet.

### 0.10 Conformité de l'activité TopLuxe avec les règles Pi Network — **PARTIELLEMENT CONFIRMÉ**

Confirmé : les développeurs du réseau de paiement Pi doivent garantir que toutes les transactions traitées représentent des biens ou services réels et authentiques, dans une logique de transparence<cite index="29-1">, les développeurs rejoignant le réseau Pi Pay étant tenus de respecter strictement des principes de transparence et d'authenticité, garantissant que toutes les transactions traitées via le système représentent des biens et services réels</cite>. Les lignes directrices communautaires de Pi App Studio interdisent explicitement les jeux d'argent/paris, sans mentionner d'interdiction des marketplaces de biens physiques ou des mécanismes d'escrow applicatif<cite index="35-1">, les activités interdites incluant les représentations trompeuses sur la valeur du Pi, ainsi que le fait de proposer ou faciliter des jeux d'argent, paris ou loteries impliquant des tokens Pi</cite>.

Point de vigilance distinct mais important : Pi Network communique explicitement que la vente ou le référencement du Pi sur des plateformes d'échange centralisées est présentée comme non autorisée et potentiellement frauduleuse<cite index="31-1">, toute vente ou tout référencement du Pi Coin sur des CEX ou via des transactions privées étant strictement non autorisé, illégal et potentiellement frauduleux</cite>. **Ceci ne concerne pas TopLuxe directement** (TopLuxe ne vend pas de Pi, elle vend des biens de luxe payés en Pi), mais cela a une conséquence technique indirecte importante :

**NON CONFIRMÉ — NE PAS SUPPOSER L'EXISTENCE D'UN TAUX DE CHANGE OFFICIEL FIABLE PI/FIAT** : aucune source de taux de change officielle et fiable fournie nativement par Pi Network n'a été identifiée dans la documentation technique consultée, et l'absence de marché d'échange centralisé autorisé renforce l'incertitude sur la disponibilité d'un taux de marché stable et vérifiable. **Plan B** : ce point doit être validé explicitement (juridiquement et techniquement) avant le développement du module Paiements — TopLuxe devra soit définir contractuellement son propre taux de référence, soit s'appuyer sur une source tierce dont la fiabilité et la légitimité devront être validées avec un conseil juridique.

### 0.11 Synthèse des points CONFIRMÉS vs NON CONFIRMÉS

| Point | Statut |
|---|---|
| Authentification Pi via SDK | **CONFIRMÉ** |
| Cycle U2A create/approve/complete | **CONFIRMÉ** |
| Callbacks SDK côté client (pas de webhook serveur natif) | **CONFIRMÉ** |
| Flux A2U disponible via bibliothèques backend officielles | **CONFIRMÉ** |
| A2U nécessite un portefeuille applicatif avec clé privée gérée par TopLuxe | **CONFIRMÉ** |
| Escrow natif Pi pour applications tierces | **NON CONFIRMÉ — inexistant à notre connaissance, utiliser le plan B applicatif** |
| Deux applications distinctes obligatoires (testnet/mainnet) | **CONFIRMÉ** |
| Sandbox disponible pour développement local | **CONFIRMÉ** |
| KYC développeur requis avant listing mainnet | **CONFIRMÉ** |
| Délai d'approbation mainnet prévisible | **NON CONFIRMÉ — traiter comme risque projet** |
| Marketplace de biens physiques autorisée dans les guidelines | **CONFIRMÉ (aucune interdiction identifiée), sous réserve de revue d'application par Pi** |
| Taux de change officiel Pi/fiat fourni par Pi Network | **NON CONFIRMÉ — à valider juridiquement et techniquement avant développement** |

---

## 1. Module — Identité & Authentification

### 1.1 Objectif exact
Authentifier chaque utilisateur via le SDK Pi, matérialiser un compte TopLuxe unique par identité Pi, et exposer les rôles/permissions à l'ensemble des autres modules.

### 1.2 Fonctionnalités incluses au MVP
- Connexion via Pi SDK, création automatique du profil TopLuxe à la première connexion.
- Gestion de session (jeton de session applicatif propre à TopLuxe, distinct du token Pi).
- Consultation et mise à jour basique du profil (coordonnées, préférences de notification).
- Attribution de rôle(s) : acheteur par défaut, vendeur après KYC validé, rôles internes attribués manuellement par un admin.
- Suspension/réactivation d'un compte (action admin).

### 1.3 Fonctionnalités explicitement exclues du MVP
- Connexion via un moyen autre que Pi SDK.
- Authentification à deux facteurs pour les comptes acheteur/vendeur (réservée aux comptes internes à privilèges).
- Gestion fine de préférences multi-appareils.
- Fédération d'identité externe (SSO tiers).

### 1.4 Dépendances avec les autres modules
Module fondation : tous les autres modules en dépendent. Dépend uniquement de l'intégration Pi SDK (section 0).

### 1.5 Modèle de données détaillé

**Table `users`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| pi_uid | VARCHAR(255) | UNIQUE, NOT NULL |
| pi_username | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NULLABLE, UNIQUE si renseigné |
| status | ENUM('active','pending_verification','suspended','banned') | NOT NULL, DEFAULT 'active' |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| last_login_at | TIMESTAMP | NULLABLE |

Index : `idx_users_pi_uid` (unique), `idx_users_status`.

**Table `roles`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| code | ENUM('buyer','seller_individual','seller_pro','expert','moderator','admin') | UNIQUE, NOT NULL |

**Table `user_roles`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| role_id | UUID | FK → roles.id, NOT NULL |
| granted_at | TIMESTAMP | NOT NULL |
| granted_by | UUID | FK → users.id, NULLABLE |

Contrainte : UNIQUE(user_id, role_id). Index : `idx_user_roles_user_id`.

**Table `sessions`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| revoked_at | TIMESTAMP | NULLABLE |

Index : `idx_sessions_token_hash` (unique), `idx_sessions_user_id`.

### 1.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres/Body | Réponse | Erreurs possibles | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/pi-login` | Public | token d'authentification Pi | Session TopLuxe, profil | 401 token invalide ; 403 compte banni ; 500 erreur Pi | Vérification serveur du token Pi obligatoire |
| POST | `/api/v1/auth/logout` | Authentifié | — | 204 | 401 session invalide | Révocation en base |
| GET | `/api/v1/users/me` | Authentifié | — | Profil + rôles | 401 | — |
| PATCH | `/api/v1/users/me` | Authentifié | email, préférences | Profil mis à jour | 400 ; 401 | Validation stricte |
| POST | `/api/v1/admin/users/{id}/suspend` | Admin | motif | 200 | 403 ; 404 | Action journalisée |
| POST | `/api/v1/admin/users/{id}/reactivate` | Admin | — | 200 | 403 ; 404 | Action journalisée |
| POST | `/api/v1/admin/users/{id}/roles` | Admin | code de rôle | 200 | 403 ; 400 | Action journalisée |

### 1.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `user.registered` | Identité & Auth | Notifications, Audit | user_id, pi_uid, date |
| `user.suspended` | Identité & Auth | Notifications, Audit, Catalogue | user_id, motif, admin_id |
| `user.role_granted` | Identité & Auth | Notifications, Audit | user_id, role_code, granted_by |

### 1.8 Permissions précises par rôle
Visiteur : uniquement `/auth/pi-login`. Utilisateur authentifié : lecture/modification de son propre profil uniquement. Admin seul : suspension, réactivation, modification de rôles d'un tiers.

### 1.9 États et transitions
`pending_verification` → `active` (première connexion) ; `active` ↔ `suspended` (admin) ; `active`/`suspended` → `banned` (définitif au MVP).

### 1.10 Règles métier exactes
- Un `pi_uid` correspond à un et un seul compte TopLuxe.
- Un compte suspendu ne peut plus initier de paiement ni soumettre de produit, conserve un accès en lecture seule.
- Les rôles internes ne sont jamais auto-attribuables.
- Authentification renforcée pour les comptes internes à privilèges — modalités à définir en Sprint 0.

### 1.11 Validations et contrôles de sécurité
Vérification serveur systématique du token Pi. Hashage du token de session. Rate limiting sur `/auth/pi-login`. Back-office avec authentification distincte et plus stricte.

### 1.12 Tests unitaires
Validation de profil ; génération/validation de token ; attribution de rôle (unicité) ; transitions d'état.

### 1.13 Tests d'intégration
Flux d'authentification en sandbox réel ; révocation de session effective ; blocage d'accès sans rôle requis.

### 1.14 Tests E2E
Connexion Pi sandbox → profil obtenu → déconnexion → accès refusé après déconnexion.

### 1.15 Critères d'acceptation
Connexion sandbox fonctionnelle, profil créé avec rôle `buyer` par défaut, suspension admin empêchant effectivement les actions réservées aux comptes actifs.

---

## 2. Module — Audit & Journalisation

### 2.1 Objectif exact
Garantir la traçabilité systématique et immuable de toute action à impact financier ou sur la confiance.

### 2.2 Fonctionnalités incluses au MVP
Enregistrement d'événements d'audit, consultation filtrée réservée à l'admin.

### 2.3 Fonctionnalités explicitement exclues du MVP
Visualisation avancée, alertes automatiques sur anomalies, export programmé.

### 2.4 Dépendances
Aucune dépendance entrante ; appelé par tous les autres modules.

### 2.5 Modèle de données détaillé

**Table `audit_logs`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| actor_user_id | UUID | FK → users.id, NULLABLE |
| action_code | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | UUID | NOT NULL |
| details | JSONB | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |

Index : `idx_audit_entity` (entity_type, entity_id), `idx_audit_actor`, `idx_audit_created_at`.
Contrainte de conception : table strictement en ajout, aucune API de modification/suppression.

### 2.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/audit-logs` | Admin | filtres, pagination | Liste paginée | 403 | Accès admin strict |

### 2.7 Événements asynchrones
Consommateur universel de tous les événements sensibles des autres modules.

### 2.8 Permissions
Lecture réservée exclusivement à l'admin.

### 2.9 États et transitions
Sans objet.

### 2.10 Règles métier exactes
Toute action sensible listée dans les autres modules DOIT générer une entrée d'audit ; son absence est un défaut bloquant en revue de code.

### 2.11 Validations et contrôles de sécurité
Immuabilité stricte (pas d'UPDATE/DELETE applicatif).

### 2.12 Tests unitaires
Rejet d'un enregistrement avec champs obligatoires manquants.

### 2.13 Tests d'intégration
Vérification qu'une action sensible représentative de chaque module génère une entrée correspondante.

### 2.14 Tests E2E
Validation KYC par un admin → entrée visible dans `/admin/audit-logs`.

### 2.15 Critères d'acceptation
Toute action sensible documentée génère effectivement une entrée d'audit consultable par un admin.

---

## 3. Module — KYC / KYB

### 3.1 Objectif exact
Vérifier l'identité des vendeurs (et des acheteurs au-delà d'un seuil) via une revue manuelle interne au MVP.

### 3.2 Fonctionnalités incluses au MVP
Soumission de documents, file de revue manuelle, décision motivée, notification du résultat.

### 3.3 Fonctionnalités explicitement exclues du MVP
Intégration prestataire externe automatisé (V1). OCR/IA. Revalidation périodique automatisée.

### 3.4 Dépendances
Dépend d'Identité & Auth. Bloque fonctionnellement le module Catalogue.

### 3.5 Modèle de données détaillé

**Table `verification_records`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| type | ENUM('kyc_buyer','kyc_seller_individual','kyb_seller_pro') | NOT NULL |
| status | ENUM('not_started','in_progress','pending_review','approved','rejected','expired') | NOT NULL, DEFAULT 'not_started' |
| rejection_reason | TEXT | NULLABLE |
| reviewed_by | UUID | FK → users.id, NULLABLE |
| reviewed_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Index : `idx_verif_user_id`, `idx_verif_status`.

**Table `verification_documents`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| verification_record_id | UUID | FK → verification_records.id, NOT NULL |
| document_type | ENUM('id_card','proof_of_address','business_registration','legal_representative_id','other') | NOT NULL |
| storage_reference | VARCHAR(500) | NOT NULL |
| uploaded_at | TIMESTAMP | NOT NULL |

Index : `idx_verif_docs_record_id`. Isolation de stockage renforcée obligatoire (voir 3.11).

### 3.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/verifications` | Authentifié | type | Record créé (`in_progress`) | 400 vérification active existante | — |
| POST | `/api/v1/verifications/{id}/documents` | Propriétaire | fichier, document_type | Document enregistré | 400 ; 403 | Upload vers stockage chiffré |
| POST | `/api/v1/verifications/{id}/submit` | Propriétaire | — | statut → `pending_review` | 400 documents manquants | — |
| GET | `/api/v1/verifications/{id}` | Propriétaire, modérateur, admin | — | Détail | 403 ; 404 | — |
| GET | `/api/v1/admin/verifications?status=pending_review` | Modérateur, Admin | pagination | Liste | 403 | — |
| POST | `/api/v1/admin/verifications/{id}/approve` | Modérateur, Admin | — | statut → `approved` | 403 ; 409 | Audit obligatoire |
| POST | `/api/v1/admin/verifications/{id}/reject` | Modérateur, Admin | motif | statut → `rejected` | 400 ; 403 | Audit obligatoire |

### 3.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `verification.approved` | KYC/KYB | Notifications, Audit, Identité & Auth (rôle) | user_id, type, verification_id |
| `verification.rejected` | KYC/KYB | Notifications, Audit | user_id, type, motif |

### 3.8 Permissions par rôle
Utilisateur : uniquement ses propres vérifications. Modérateur : file complète, escalade des cas de doute vers admin (processus). Admin : accès complet.

### 3.9 États et transitions
`not_started` → `in_progress` → `pending_review` → `approved` ou `rejected` (retour possible à `in_progress`) → `expired` (transition manuelle admin au MVP).

### 3.10 Règles métier exactes
- Approbation KYC particulier → attribution automatique du rôle `seller_individual`. Idem KYB → `seller_pro`.
- Un produit ne peut être soumis que si le vendeur a une vérification `approved` correspondante.
- Rejet toujours motivé, toujours notifié.

### 3.11 Validations et contrôles de sécurité
Chiffrement au repos dédié pour les documents KYC, distinct de la stratégie de stockage des autres médias. Accès strictement limité modérateur/admin. Validation stricte du format/poids côté serveur. Durée de conservation à définir juridiquement (RGPD), paramétrable.

### 3.12 Tests unitaires
Transitions d'état ; validation des documents obligatoires par type.

### 3.13 Tests d'intégration
Upload → stockage chiffré vérifié inaccessible publiquement ; approbation → rôle utilisateur mis à jour.

### 3.14 Tests E2E
KYC soumis → approuvé par modérateur → création de produit en brouillon possible.

### 3.15 Critères d'acceptation
Soumission, revue, approbation/rejet fonctionnels ; approbation débloque effectivement la vente ; documents inaccessibles sans rôle approprié (testé).

---

## 4. Module — Catalogue & Fiche Produit

### 4.1 Objectif exact
Permettre à un vendeur vérifié de créer, soumettre et gérer des fiches produit, et exposer le catalogue public des produits validés.

### 4.2 Fonctionnalités incluses au MVP
Création/modification en brouillon, upload de médias, soumission, consultation publique, retrait sous condition.

### 4.3 Fonctionnalités explicitement exclues du MVP
Recherche full-text avancée (V1). Recommandations personnalisées. Import en masse (V1, Maison Partenaire).

### 4.4 Dépendances
Dépend de KYC/KYB et d'Identité & Auth. Appelle Curation en synchrone.

### 4.5 Modèle de données détaillé

**Table `categories`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| parent_category_id | UUID | FK → categories.id, NULLABLE |

**Table `products`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| seller_id | UUID | FK → users.id, NOT NULL |
| category_id | UUID | FK → categories.id, NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NOT NULL |
| brand | VARCHAR(100) | NULLABLE |
| condition | ENUM('new','used','vintage') | NOT NULL |
| reference_price_fiat | DECIMAL(12,2) | NOT NULL, CHECK (>0) |
| reference_currency | VARCHAR(3) | NOT NULL, DEFAULT 'EUR' |
| status | ENUM('draft','submitted','published','reserved','sold','withdrawn','rejected') | NOT NULL, DEFAULT 'draft' |
| serial_number | VARCHAR(100) | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| published_at | TIMESTAMP | NULLABLE |

Index : `idx_products_seller`, `idx_products_status`, `idx_products_category`, `idx_products_search` (category_id, status, reference_price_fiat).

**Table `product_media`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| media_type | ENUM('image','video') | NOT NULL |
| storage_reference | VARCHAR(500) | NOT NULL |
| display_order | SMALLINT | NOT NULL |

Index : `idx_product_media_product_id`.

**Table `product_authenticity_documents`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| document_type | ENUM('certificate','invoice','other') | NOT NULL |
| storage_reference | VARCHAR(500) | NOT NULL |

### 4.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/products` | Vendeur (KYC approuvé) | title, description, category_id, brand, condition, reference_price_fiat | Produit créé (`draft`) | 403 KYC ; 400 | Vérification serveur du KYC |
| PATCH | `/api/v1/products/{id}` | Vendeur propriétaire, si `draft` | champs modifiables | Mis à jour | 403 ; statut non modifiable | — |
| POST | `/api/v1/products/{id}/media` | Vendeur propriétaire | fichier, media_type | Média enregistré | 400 | Validation stricte serveur |
| POST | `/api/v1/products/{id}/submit` | Vendeur propriétaire | — | statut → `submitted`, appel Curation | 400 médias insuffisants ; 409 | — |
| GET | `/api/v1/products/{id}` | Public | — | Détail | 404 | — |
| GET | `/api/v1/products` | Public | filtres, pagination | Liste paginée | — | — |
| POST | `/api/v1/products/{id}/withdraw` | Vendeur propriétaire | — | statut → `withdrawn` | 409 commande en cours | — |

### 4.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `product.submitted` | Catalogue | Curation, Audit | product_id, seller_id |
| `product.published` | Catalogue | Notifications, Audit, Recherche (V1) | product_id |
| `product.reserved` | Catalogue (via Commandes) | — | product_id, order_id |
| `product.sold` | Catalogue | Notifications, Audit | product_id, order_id |

### 4.8 Permissions par rôle
Vendeur : CRUD limité à ses produits `draft`. Public : lecture des produits publiés. Expert : lecture via Curation. Admin : accès complet.

### 4.9 États et transitions
`draft` → `submitted` → `published` ou `rejected` (retour `draft` possible) ; `published` → `reserved` → `sold` ou retour `published` ; `published`/`draft` → `withdrawn` (sans commande active).

### 4.10 Règles métier exactes
- Produit `submitted` non modifiable jusqu'à décision.
- Nombre minimum de photos paramétrable (défaut 6).
- Retrait autorisé uniquement sans commande active.

### 4.11 Validations et contrôles de sécurité
Vérification serveur du KYC avant création. Validation stricte des médias. Contrôle d'appartenance systématique.

### 4.12 Tests unitaires
Transitions de statut ; validation du nombre minimum de photos ; champs obligatoires.

### 4.13 Tests d'intégration
Soumission → appel effectif à Curation, création de l'AuthenticationReview.

### 4.14 Tests E2E
Parcours publication complet (modules 3, 4, 5) jusqu'à visibilité en catalogue public.

### 4.15 Critères d'acceptation
Création, soumission, publication après validation experte fonctionnelles ; produit non validé jamais visible publiquement ; retrait bloqué si commande active.

---

## 5. Module — Curation / Authentification Produit

### 5.1 Objectif exact
Garantir qu'aucun produit n'est publié sans revue par un expert authentificateur qualifié.

### 5.2 Fonctionnalités incluses au MVP
File par catégorie, revue détaillée, décision motivée (validation/rejet/complément), historique des décisions.

### 5.3 Fonctionnalités explicitement exclues du MVP
Vérification physique via partenaire logistique (V1/V2). Comparaison automatisée par IA (V2).

### 5.4 Dépendances
Dépend de Catalogue (produit soumis) ; met à jour son statut en retour.

### 5.5 Modèle de données détaillé

**Table `authentication_reviews`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| expert_id | UUID | FK → users.id, NULLABLE |
| decision | ENUM('pending','more_info_requested','approved','rejected') | NOT NULL, DEFAULT 'pending' |
| decision_reason | TEXT | NULLABLE |
| decided_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |

Index : `idx_auth_review_product`, `idx_auth_review_expert`, `idx_auth_review_decision`. Chaque resoumission après complément crée une nouvelle ligne (historique préservé).

### 5.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/expert/reviews?status=pending` | Expert | filtre catégorie | Liste | 403 | — |
| GET | `/api/v1/expert/reviews/{id}` | Expert | — | Détail | 403 ; 404 | — |
| POST | `/api/v1/expert/reviews/{id}/approve` | Expert | — | decision → `approved`, déclenche `product.published` | 403 ; 409 | Audit obligatoire |
| POST | `/api/v1/expert/reviews/{id}/reject` | Expert | motif | decision → `rejected` | 400 ; 403 | Audit obligatoire |
| POST | `/api/v1/expert/reviews/{id}/request-info` | Expert | message | decision → `more_info_requested` | 403 | Audit obligatoire |

### 5.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `review.approved` | Curation | Catalogue, Notifications, Audit | product_id, expert_id |
| `review.rejected` | Curation | Catalogue, Notifications, Audit | product_id, motif |
| `review.info_requested` | Curation | Notifications, Audit | product_id, message |

### 5.8 Permissions par rôle
Décision réservée à l'expert. Admin peut arbitrer en cas de désaccord (endpoint dédié en V1 ; exception documentée au MVP).

### 5.9 États et transitions
`pending` → `approved`/`rejected`/`more_info_requested` ; complément → nouvelle ligne `pending`.

### 5.10 Règles métier exactes
Motif obligatoire sauf approbation simple. Une seule revue `pending` active par produit.

### 5.11 Validations et contrôles de sécurité
Accès strict rôle expert/admin, vérifié côté serveur.

### 5.12 Tests unitaires
Obligation de motif au rejet ; unicité de la revue active.

### 5.13 Tests d'intégration
Approbation → passage effectif du produit à `published`.

### 5.14 Tests E2E
Inclus dans le parcours E2E du module 4.

### 5.15 Critères d'acceptation
Les trois décisions produisent l'effet attendu sur le produit, avec historique complet.

---

## 6. Module — Paiements Pi

*(S'appuie strictement sur la section 0. Toute divergence constatée en sandbox réel doit être remontée avant le développement du module 7.)*

### 6.1 Objectif exact
Exécuter et sécuriser le cycle complet de paiement Pi (U2A achat, A2U versements), avec réconciliation systématique.

### 6.2 Fonctionnalités incluses au MVP
Initiation U2A liée à une commande, gestion des callbacks approve/complete, verrouillage du taux Pi/fiat, réconciliation périodique, initiation A2U (déclenchée par Escrow).

### 6.3 Fonctionnalités explicitement exclues du MVP
Paiement fractionné/multi-devises. Portefeuille multi-signatures. Plusieurs comptes applicatifs Pi.

### 6.4 Dépendances
Dépend de Commandes et d'Identité & Auth. Prérequis strict d'Escrow. **Dépend de l'arbitrage sur le point 0.10 (taux de change).**

### 6.5 Modèle de données détaillé

**Table `payments`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL, UNIQUE |
| pi_payment_id | VARCHAR(255) | NULLABLE, UNIQUE |
| direction | ENUM('u2a','a2u') | NOT NULL |
| amount_pi | DECIMAL(18,7) | NOT NULL, CHECK (>0) |
| fx_rate_applied | DECIMAL(18,7) | NOT NULL |
| fx_rate_locked_until | TIMESTAMP | NOT NULL |
| status | ENUM('initiated','pending_approval','approved','completed','failed','cancelled') | NOT NULL, DEFAULT 'initiated' |
| pi_txid | VARCHAR(255) | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Index : `idx_payments_order_id` (unique), `idx_payments_pi_payment_id` (unique), `idx_payments_status`.

**Table `payment_reconciliation_log`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| payment_id | UUID | FK → payments.id, NOT NULL |
| checked_at | TIMESTAMP | NOT NULL |
| internal_status | VARCHAR(50) | NOT NULL |
| pi_platform_status | VARCHAR(50) | NOT NULL |
| discrepancy_detected | BOOLEAN | NOT NULL, DEFAULT false |

### 6.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/payments/initiate` | Acheteur | order_id | Payment créé, fx verrouillé, données pour `Pi.createPayment` | 400 commande indisponible | Vérification serveur disponibilité |
| POST | `/api/v1/payments/{id}/approve-callback` | Système | pi_payment_id | Appel Pi `/approve`, statut → `approved` | 400 ; 502 | Ne jamais approuver sans revérifier la commande |
| POST | `/api/v1/payments/{id}/complete-callback` | Système | pi_txid | Appel Pi `/complete`, statut → `completed` | 400 ; 502 | Jamais marqué complété sans 200 confirmé (règle 0.2) |
| GET | `/api/v1/payments/{id}` | Propriétaire, Admin | — | Détail | 403 ; 404 | — |
| POST | `/api/v1/internal/payments/a2u` | Système (Escrow uniquement) | recipient_user_id, amount_pi, memo, metadata | Payment A2U soumis | 500 échec signature/soumission | Endpoint interne, jamais public |

### 6.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `payment.completed` | Paiements | Escrow, Commandes, Notifications, Audit | payment_id, order_id, amount_pi |
| `payment.failed` | Paiements | Commandes (libération réservation), Notifications, Audit | payment_id, order_id, motif |
| `payment.a2u_completed` | Paiements | Escrow, Commissions, Notifications, Audit | payment_id, order_id, recipient_user_id |
| `payment.reconciliation_discrepancy` | Paiements (job) | Audit, alerte technique | payment_id, détail |

### 6.8 Permissions par rôle
Seul l'acheteur propriétaire initie un U2A. Callbacks déclenchés uniquement par le frontend TopLuxe suite aux callbacks SDK. Endpoint A2U interne, jamais exposé à un rôle utilisateur.

### 6.9 États et transitions
`initiated` → `pending_approval` → `approved` → `completed` ; à tout moment avant `completed` : → `failed` ou `cancelled`.

### 6.10 Règles métier exactes
- `fx_rate_applied` figé à l'initiation, jamais recalculé.
- Expiration de `fx_rate_locked_until` avant complétion → `failed` automatique.
- Un seul paiement actif par commande à la fois.
- Job de réconciliation périodique sur tout paiement non terminal depuis plus d'un délai paramétrable.

### 6.11 Validations et contrôles de sécurité
Revérification systématique de l'état réel côté Pi Platform avant tout passage à `completed`. Protection contre le rejeu (un `pi_payment_id` ne peut être complété deux fois). Clé privée du portefeuille applicatif exclusivement dans le coffre-fort de secrets.

### 6.12 Tests unitaires
Verrouillage/expiration du taux ; transitions d'état ; détection de divergence.

### 6.13 Tests d'intégration
Cycle complet en **sandbox Pi réel** (pas de mock) ; cas d'échec (annulation, timeout).

### 6.14 Tests E2E
Parcours achat complet en sandbox jusqu'à consommation par Escrow.

### 6.15 Critères d'acceptation
Cycle U2A complet fonctionnel en sandbox réel, y compris cas d'échec. Réconciliation détecte une divergence simulée. Aucun paiement jamais marqué complété sans confirmation positive Pi.

---

## 7. Module — Escrow

*(Implémente le Plan B de la section 0.5 — séquestre applicatif, aucune fonctionnalité d'escrow native Pi utilisée.)*

### 7.1 Objectif exact
Séquestrer les fonds d'une commande payée jusqu'à confirmation de réception ou résolution d'un litige, puis déclencher le versement au vendeur.

### 7.2 Fonctionnalités incluses au MVP
Création automatique à la complétion du paiement, blocage en cas de litige, libération (manuelle, automatique, ou par décision de litige), déclenchement du paiement A2U.

### 7.3 Fonctionnalités explicitement exclues du MVP
Remboursement partiel fractionné. Multi-devises. Split entre plusieurs bénéficiaires.

### 7.4 Dépendances
Dépend strictement de Paiements Pi. Consommé par Commandes, Litiges, Commissions & Facturation.

### 7.5 Modèle de données détaillé

**Table `escrow_records`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL, UNIQUE |
| payment_id | UUID | FK → payments.id, NOT NULL |
| status | ENUM('held','release_pending','released','disputed','refunded') | NOT NULL, DEFAULT 'held' |
| amount_pi | DECIMAL(18,7) | NOT NULL |
| held_at | TIMESTAMP | NOT NULL |
| auto_release_at | TIMESTAMP | NOT NULL |
| released_at | TIMESTAMP | NULLABLE |
| release_reason | ENUM('buyer_confirmed','auto_expired','dispute_resolved_seller') | NULLABLE |
| refund_reason | ENUM('dispute_resolved_buyer','order_cancelled') | NULLABLE |

Index : `idx_escrow_order_id` (unique), `idx_escrow_status`, `idx_escrow_auto_release_at`.

### 7.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/orders/{orderId}/escrow` | Acheteur/vendeur concernés, Admin | — | Statut | 403 ; 404 | — |
| POST | `/api/v1/internal/escrow/{id}/release` | Système | release_reason | statut → `released` | 409 déjà en litige | Endpoint interne uniquement |
| POST | `/api/v1/internal/escrow/{id}/hold-for-dispute` | Système | dispute_id | statut → `disputed` | 409 déjà libéré | Endpoint interne uniquement |
| POST | `/api/v1/admin/escrow/{id}/refund` | Admin | refund_reason | statut → `refunded` | 403 ; 409 | Audit obligatoire |

### 7.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `escrow.held` | Escrow | Notifications, Audit | escrow_id, order_id |
| `escrow.disputed` | Escrow | Notifications, Audit | escrow_id, dispute_id |
| `escrow.released` | Escrow | Paiements (A2U vendeur), Commissions, Avis, Notifications, Audit | escrow_id, order_id, seller_id, amount_pi |
| `escrow.refunded` | Escrow | Paiements (A2U acheteur), Notifications, Audit | escrow_id, order_id, buyer_id, amount_pi |

### 7.8 Permissions par rôle
Consultation ouverte aux deux parties. Aucune transition directement actionnable par acheteur/vendeur — toujours déclenchée par le système ou par l'admin dans le cadre d'un litige.

### 7.9 États et transitions
`held` → `disputed` (prioritaire) ; `held` → `release_pending` → `released` ; `disputed` → `released` (décision vendeur) ; `disputed` → `refunded` (décision acheteur).

### 7.10 Règles métier exactes
- Un escrow `disputed` ne transitionne jamais directement sans décision explicite de Litiges.
- `auto_release_at` jamais recalculé après contestation.
- Prélèvement de commission uniquement au passage effectif à `released`.

### 7.11 Validations et contrôles de sécurité
Protection maximale de la clé privée du portefeuille applicatif (coffre-fort, accès restreint et journalisé). Double vérification avant tout A2U (montant exact, destinataire exact). Idempotence stricte (une seule libération possible).

### 7.12 Tests unitaires
Transitions (rejet de `disputed` → `released` direct) ; calcul de `auto_release_at`.

### 7.13 Tests d'intégration
Job de libération automatique à échéance ; blocage effectif par ouverture de litige.

### 7.14 Tests E2E
Achat → livraison → confirmation → libération → versement A2U vérifié (sandbox réel).

### 7.15 Critères d'acceptation
Création automatique, blocage en litige, libération correcte (manuelle/auto), A2U réel vérifié en sandbox. Double libération impossible (testé).

---

## 8. Module — Commandes

### 8.1 Objectif exact
Orchestrer le cycle de vie complet d'une commande, de la création à la clôture ou l'annulation.

### 8.2 Fonctionnalités incluses au MVP
Création à partir d'un produit disponible, suivi de statut, confirmation de réception (manuelle/automatique), annulation encadrée.

### 8.3 Fonctionnalités explicitement exclues du MVP
Panier multi-produits (une commande = un produit au MVP). Modification post-paiement (hors annulation/litige).

### 8.4 Dépendances
Dépend de Catalogue et déclenche Paiements. Consomme `payment.completed`, `shipment.delivered`. Déclenche Escrow et Avis & Réputation.

### 8.5 Modèle de données détaillé

**Table `orders`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| buyer_id | UUID | FK → users.id, NOT NULL |
| seller_id | UUID | FK → users.id, NOT NULL |
| status | ENUM('created','payment_pending','paid','in_preparation','shipped','delivered','confirmed','closed','cancelled','disputed') | NOT NULL, DEFAULT 'created' |
| reference_price_fiat | DECIMAL(12,2) | NOT NULL |
| amount_pi_locked | DECIMAL(18,7) | NULLABLE |
| shipping_address_id | UUID | FK → addresses.id, NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| confirmed_at | TIMESTAMP | NULLABLE |
| closed_at | TIMESTAMP | NULLABLE |
| cancelled_at | TIMESTAMP | NULLABLE |
| cancellation_reason | VARCHAR(100) | NULLABLE |

Index : `idx_orders_buyer`, `idx_orders_seller`, `idx_orders_status`, `idx_orders_product_id`.

**Table `addresses`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| country | VARCHAR(2) | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| postal_code | VARCHAR(20) | NOT NULL |
| address_line | VARCHAR(255) | NOT NULL |
| type | ENUM('shipping','billing') | NOT NULL |

### 8.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/orders` | Acheteur | product_id, shipping_address_id | Commande créée, réservation produit | 409 indisponible ; 403 KYC requis | Contrôle de concurrence |
| GET | `/api/v1/orders/{id}` | Concernés, Admin | — | Détail | 403 ; 404 | — |
| GET | `/api/v1/orders` | Authentifié | filtres | Liste | — | — |
| POST | `/api/v1/orders/{id}/confirm-shipment` | Vendeur propriétaire | tracking_number, carrier | statut → `shipped` | 403 ; 409 | — |
| POST | `/api/v1/orders/{id}/confirm-receipt` | Acheteur propriétaire | — | statut → `confirmed`, déclenche release | 403 ; 409 (doit être `delivered`) | — |
| POST | `/api/v1/orders/{id}/cancel` | Acheteur, Vendeur, Admin | motif | statut → `cancelled` | 409 non annulable | Audit obligatoire |

### 8.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `order.created` | Commandes | Catalogue | order_id, product_id |
| `order.paid` | Commandes | Notifications, Logistique | order_id |
| `order.shipment_deadline_exceeded` | Commandes (job) | Escrow, Notifications, Audit | order_id |
| `order.confirmed` | Commandes | Escrow, Avis & Réputation | order_id |
| `order.cancelled` | Commandes | Catalogue, Escrow, Notifications, Audit | order_id, motif |

### 8.8 Permissions par rôle
Acheteur : actions sur ses propres commandes. Vendeur : actions sur les commandes où il vend. Admin : consultation/annulation de toute commande.

### 8.9 États et transitions
`created` → `payment_pending` → `paid` → `in_preparation` → `shipped` → `delivered` → `confirmed` → `closed` ; bifurcation `cancelled` avant `shipped`, `disputed` après `delivered`.

### 8.10 Règles métier exactes
- Réservation temporaire du produit, expiration paramétrable si paiement non abouti.
- Délai vendeur paramétrable pour expédition, sous peine d'annulation/remboursement.
- `amount_pi_locked` figé, jamais recalculé.

### 8.11 Validations et contrôles de sécurité
Contrôle de concurrence strict à la création. Vérification systématique de propriété.

### 8.12 Tests unitaires
Transitions de statut ; calcul des délais.

### 8.13 Tests d'intégration
Concurrence (deux commandes simultanées sur le même produit) ; expiration de réservation.

### 8.14 Tests E2E
Parcours achat complet (modules 4, 6, 7, 8, 9).

### 8.15 Critères d'acceptation
Cycle de vie complet correct, y compris annulation et expiration de délai, avec effets corrects sur Catalogue et Escrow.

---

## 9. Module — Logistique / Livraison (national, MVP)

### 9.1 Objectif exact
Assurer le suivi de l'expédition jusqu'à la livraison confirmée, sur le périmètre national au MVP.

### 9.2 Fonctionnalités incluses au MVP
Enregistrement des informations d'expédition, consultation du statut, passage au statut `delivered`.

### 9.3 Fonctionnalités explicitement exclues du MVP
Livraison internationale (V1). Intégration temps réel multi-transporteurs automatisée (un seul partenaire pilote au MVP, mise à jour manuelle en secours). Assurance transport intégrée au checkout (V1).

### 9.4 Dépendances
Dépend de Commandes (`order.paid`). Notifie Commandes du passage à `delivered`.

### 9.5 Modèle de données détaillé

**Table `shipments`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL, UNIQUE |
| carrier | VARCHAR(100) | NOT NULL |
| tracking_number | VARCHAR(100) | NOT NULL |
| status | ENUM('awaiting_shipment','shipped','in_transit','delivered','incident') | NOT NULL, DEFAULT 'awaiting_shipment' |
| shipped_at | TIMESTAMP | NULLABLE |
| delivered_at | TIMESTAMP | NULLABLE |

Index : `idx_shipments_order_id` (unique), `idx_shipments_tracking_number`.

### 9.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/orders/{orderId}/shipment` | Vendeur propriétaire | carrier, tracking_number | Créé, statut `shipped` | 403 ; 400 | — |
| GET | `/api/v1/orders/{orderId}/shipment` | Concernés | — | Détail | 403 ; 404 | — |
| POST | `/api/v1/admin/shipments/{id}/mark-delivered` | Admin | — | statut → `delivered` | 403 ; 409 | Audit obligatoire |
| POST | `/api/v1/admin/shipments/{id}/incident` | Admin | description | statut → `incident` | 403 | Audit obligatoire |

### 9.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `shipment.shipped` | Logistique | Commandes, Notifications | order_id, tracking_number |
| `shipment.delivered` | Logistique | Commandes, Notifications | order_id, delivered_at |

### 9.8 Permissions par rôle
Vendeur : enregistrement d'expédition sur ses propres commandes. Passage à `delivered` réservé à l'admin au MVP.

### 9.9 États et transitions
`awaiting_shipment` → `shipped` → `in_transit` (optionnel) → `delivered` ; → `incident` à tout moment.

### 9.10 Règles métier exactes
Numéro de suivi obligatoire pour `shipped`. `delivered` déclenche systématiquement le calcul de `auto_release_at` via Commandes.

### 9.11 Validations et contrôles de sécurité
Validation de format de tracking. Contrôle d'appartenance strict.

### 9.12 Tests unitaires
Validation de format ; règles de transition.

### 9.13 Tests d'intégration
`delivered` → déclenchement effectif du compte à rebours côté Commandes.

### 9.14 Tests E2E
Inclus dans le parcours E2E global.

### 9.15 Critères d'acceptation
Enregistrement d'expédition, évolution jusqu'à `delivered`, déclenchement correct de la suite du cycle.

---

## 10. Module — Messagerie

### 10.1 Objectif exact
Permettre une communication contextualisée et traçable entre acheteur et vendeur.

### 10.2 Fonctionnalités incluses au MVP
Création de conversation liée à un produit/commande, envoi/réception de messages, consultation modérateur en cas de litige.

### 10.3 Fonctionnalités explicitement exclues du MVP
Pièces jointes riches. Temps réel WebSocket complet (polling acceptable au MVP).

### 10.4 Dépendances
Dépend d'Identité & Auth et de Catalogue/Commandes.

### 10.5 Modèle de données détaillé

**Table `conversations`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NULLABLE |
| order_id | UUID | FK → orders.id, NULLABLE |
| buyer_id | UUID | FK → users.id, NOT NULL |
| seller_id | UUID | FK → users.id, NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Contrainte : au moins un de product_id/order_id renseigné. Index : `idx_conversations_buyer`, `idx_conversations_seller`.

**Table `messages`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| conversation_id | UUID | FK → conversations.id, NOT NULL |
| author_id | UUID | FK → users.id, NOT NULL |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Index : `idx_messages_conversation_id`.

### 10.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/conversations` | Acheteur/vendeur | product_id/order_id, destinataire | Conversation créée/retournée | 400 | — |
| GET | `/api/v1/conversations` | Authentifié | — | Liste | — | — |
| GET | `/api/v1/conversations/{id}/messages` | Participant, modérateur (litige) | pagination | Liste | 403 ; 404 | — |
| POST | `/api/v1/conversations/{id}/messages` | Participant | content | Message créé | 403 ; 400 | Filtrage anti-contournement basique |

### 10.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `message.sent` | Messagerie | Notifications | conversation_id, author_id |

### 10.8 Permissions par rôle
Seuls les deux participants lisent/écrivent. Modérateur en lecture seule, uniquement en contexte de litige actif.

### 10.9 États et transitions
Sans objet.

### 10.10 Règles métier exactes
Conversation toujours rattachée à un contexte (produit ou commande).

### 10.11 Validations et contrôles de sécurité
Contrôle d'appartenance strict. Filtrage basique de contenu (règles précises à affiner en V1).

### 10.12 Tests unitaires
Contrôle d'appartenance ; contrainte de contexte.

### 10.13 Tests d'intégration
Accès modérateur limité au contexte de litige actif.

### 10.14 Tests E2E
Échange de messages visible des deux côtés.

### 10.15 Critères d'acceptation
Échange fonctionnel avec contrôle d'accès strict et accès modérateur limité.

---

## 11. Module — Litiges

### 11.1 Objectif exact
Encadrer l'ouverture, la médiation et la résolution d'un désaccord entre acheteur et vendeur.

### 11.2 Fonctionnalités incluses au MVP
Ouverture avec motif et preuves, blocage automatique de l'escrow, médiation, décision finale.

### 11.3 Fonctionnalités explicitement exclues du MVP
Remboursement partiel fractionné (le MVP gère un remboursement total ou nul — **point à confirmer avec le fondateur**). Médiation automatisée/IA.

### 11.4 Dépendances
Dépend de Commandes et d'Escrow. Consulte Messagerie et Logistique en lecture.

### 11.5 Modèle de données détaillé

**Table `disputes`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL, UNIQUE |
| opened_by | UUID | FK → users.id, NOT NULL |
| reason_code | ENUM('not_received','not_as_described','damaged','authenticity_doubt') | NOT NULL |
| status | ENUM('open','in_mediation','escalated','resolved_buyer','resolved_seller','resolved_amicable') | NOT NULL, DEFAULT 'open' |
| resolved_by | UUID | FK → users.id, NULLABLE |
| resolution_notes | TEXT | NULLABLE |
| created_at | TIMESTAMP | NOT NULL |
| resolved_at | TIMESTAMP | NULLABLE |

Index : `idx_disputes_order_id` (unique), `idx_disputes_status`.

**Table `dispute_evidence`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| dispute_id | UUID | FK → disputes.id, NOT NULL |
| submitted_by | UUID | FK → users.id, NOT NULL |
| evidence_type | ENUM('photo','document','text') | NOT NULL |
| content_or_reference | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

### 11.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| POST | `/api/v1/orders/{orderId}/disputes` | Acheteur/vendeur concerné | reason_code, description | Créé (`open`), déclenche hold-for-dispute | 409 déjà existant ; 403 statut incompatible | — |
| POST | `/api/v1/disputes/{id}/evidence` | Participant | fichier/texte | Preuve ajoutée | 403 ; 400 | — |
| GET | `/api/v1/disputes/{id}` | Participants, Modérateur, Admin | — | Détail | 403 ; 404 | — |
| GET | `/api/v1/moderation/disputes?status=open` | Modérateur, Admin | pagination | Liste | 403 | — |
| POST | `/api/v1/moderation/disputes/{id}/propose-resolution` | Modérateur | resolution_notes | statut → `in_mediation` | 403 | Audit obligatoire |
| POST | `/api/v1/admin/disputes/{id}/resolve` | Admin | décision, resolution_notes | statut → `resolved_*` | 403 ; 409 | Audit obligatoire |

### 11.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `dispute.opened` | Litiges | Escrow, Notifications, Audit | dispute_id, order_id |
| `dispute.resolved` | Litiges | Escrow, Avis & Réputation, Notifications, Audit | dispute_id, order_id, décision |

### 11.8 Permissions par rôle
Ouverture réservée aux deux parties. Médiation réservée au modérateur. Décision finale réservée à l'admin.

### 11.9 États et transitions
`open` → `in_mediation` → `escalated` → `resolved_buyer`/`resolved_seller`/`resolved_amicable`.

### 11.10 Règles métier exactes
- Un seul litige actif par commande.
- Ouverture impossible avant `delivered`, sauf motif `not_received` après délai anormal (seuil à préciser avec le fondateur).
- Toute résolution déclenche explicitement l'action Escrow correspondante.

### 11.11 Validations et contrôles de sécurité
Contrôle strict que seules les parties concernées peuvent agir. Décision finale strictement réservée admin, vérifiée côté serveur.

### 11.12 Tests unitaires
Transitions ; unicité du litige actif.

### 11.13 Tests d'intégration
Ouverture → blocage effectif de l'escrow. Résolution → action Escrow correcte selon décision.

### 11.14 Tests E2E
Commande livrée → ouverture avec preuve → médiation → décision admin → effet sur escrow et commande.

### 11.15 Critères d'acceptation
Ouverture, blocage, médiation, résolution fonctionnels avec action Escrow correcte dans tous les cas.

---

## 12. Module — Notifications

### 12.1 Objectif exact
Informer chaque utilisateur des événements pertinents le concernant, in-app au MVP.

### 12.2 Fonctionnalités incluses au MVP
Réception et consommation des événements des autres modules, stockage et consultation in-app, marquage lu/non lu, e-mail pour événements critiques.

### 12.3 Fonctionnalités explicitement exclues du MVP
Notifications push natives. Préférences granulaires par type d'événement (V1).

### 12.4 Dépendances
Consommateur universel des événements de tous les autres modules.

### 12.5 Modèle de données détaillé

**Table `notifications`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, NOT NULL |
| event_code | VARCHAR(100) | NOT NULL |
| payload | JSONB | NOT NULL |
| is_read | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMP | NOT NULL |

Index : `idx_notifications_user_id`, `idx_notifications_is_read`.

### 12.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/notifications` | Authentifié | pagination, filtre | Liste | — | — |
| POST | `/api/v1/notifications/{id}/mark-read` | Propriétaire | — | 200 | 403 ; 404 | — |
| PATCH | `/api/v1/users/me/notification-preferences` | Authentifié | opt-in email | Mis à jour | 400 | — |

### 12.7 Événements asynchrones
Consomme l'intégralité des événements désignant Notifications comme consommateur dans les autres modules.

### 12.8 Permissions par rôle
Chaque utilisateur ne voit que ses propres notifications.

### 12.9 États et transitions
`non lu` → `lu`.

### 12.10 Règles métier exactes
Événement critique (KYC, paiement, litige) → email doublé si l'utilisateur a un email et n'a pas désactivé les emails.

### 12.11 Validations et contrôles de sécurité
Contrôle d'appartenance strict.

### 12.12 Tests unitaires
Consommation d'événement → création de notification correcte.

### 12.13 Tests d'intégration
Au moins un événement de chaque module critique génère bien une notification.

### 12.14 Tests E2E
Changement de statut KYC → notification in-app + email.

### 12.15 Critères d'acceptation
Chaque événement listé comme consommé par Notifications génère effectivement une notification, avec email pour les événements critiques.

---

## 13. Module — Back-office Administration (minimal)

### 13.1 Objectif exact
Offrir aux rôles internes les outils de supervision nécessaires au MVP.

### 13.2 Fonctionnalités incluses au MVP
Tableau de bord basique, recherche/consultation utilisateur, recherche/consultation produit, configuration du taux de commission unique, accès centralisé aux files déjà exposées par leurs modules.

### 13.3 Fonctionnalités explicitement exclues du MVP
Reporting financier avancé/exportable (V1). Gestion des maisons partenaires (V1). Règles de commission multiples (V1).

### 13.4 Dépendances
Consomme les APIs déjà exposées par les modules 1, 3, 4, 5, 11, 14 avec rôle admin/modérateur.

### 13.5 Modèle de données détaillé

**Table `platform_settings`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL |
| setting_value | VARCHAR(255) | NOT NULL |
| updated_by | UUID | FK → users.id, NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Clés attendues : `commission_rate_default`, `kyc_threshold_buyer`, `min_product_photos`, `auto_release_delay_days`, `shipment_deadline_days`.

### 13.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/dashboard` | Admin | — | Compteurs clés | 403 | — |
| GET | `/api/v1/admin/settings` | Admin | — | Liste | 403 | — |
| PATCH | `/api/v1/admin/settings/{key}` | Admin | nouvelle valeur | Mis à jour | 403 ; 400 | Audit obligatoire, non rétroactif |

### 13.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `setting.updated` | Back-office Admin | Audit | setting_key, valeur |

### 13.8 Permissions par rôle
Configuration réservée admin. Modérateur : lecture restreinte à son périmètre via les modules respectifs.

### 13.9 États et transitions
Sans objet.

### 13.10 Règles métier exactes
Modification de paramètre non rétroactive.

### 13.11 Validations et contrôles de sécurité
Validation stricte du type/format par paramètre.

### 13.12 Tests unitaires
Validation de format par type.

### 13.13 Tests d'intégration
Nouvelle commande utilise la nouvelle valeur ; commande engagée conserve l'ancienne.

### 13.14 Tests E2E
Modification du taux de commission → nouvelle commande clôturée applique le nouveau taux.

### 13.15 Critères d'acceptation
Tableau de bord correct ; modification non rétroactive vérifiée.

---

## 14. Module — Commissions & Facturation

### 14.1 Objectif exact
Calculer et enregistrer la commission TopLuxe prélevée à la libération de chaque escrow.

### 14.2 Fonctionnalités incluses au MVP
Modèle de commission unique (taux fixe), calcul automatique à la libération, historique consultable.

### 14.3 Fonctionnalités explicitement exclues du MVP
Modèles différenciés (catégorie/statut vendeur/palier) — V1, selon arbitrage fondateur.

### 14.4 Dépendances
Dépend d'Escrow (`escrow.released`).

### 14.5 Modèle de données détaillé

**Table `commission_records`**
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id, NOT NULL, UNIQUE |
| rate_applied | DECIMAL(5,2) | NOT NULL |
| amount_pi | DECIMAL(18,7) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Index : `idx_commission_order_id` (unique).

### 14.6 API REST détaillées

| Méthode | Endpoint | Rôle autorisé | Paramètres | Réponse | Erreurs | Sécurité |
|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/commissions` | Admin | filtres, pagination | Liste | 403 | — |
| GET | `/api/v1/sellers/me/commissions` | Vendeur | pagination | Historique | 403 | — |

### 14.7 Événements asynchrones

| Événement | Producteur | Consommateurs | Données |
|---|---|---|---|
| `commission.recorded` | Commissions | Audit, Back-office | order_id, amount_pi, rate_applied |

### 14.8 Permissions par rôle
Vendeur : ses propres commissions. Admin : toutes.

### 14.9 États et transitions
Sans objet.

### 14.10 Règles métier exactes
Taux appliqué = celui en vigueur au moment de la libération, jamais celui de la création de la commande.

### 14.11 Validations et contrôles de sécurité
Idempotence stricte (un seul enregistrement par commande).

### 14.12 Tests unitaires
Calcul du montant selon le taux configuré.

### 14.13 Tests d'intégration
Libération d'escrow → création automatique et correcte de l'enregistrement.

### 14.14 Tests E2E
Inclus dans le parcours E2E de clôture de commande.

### 14.15 Critères d'acceptation
Chaque commande clôturée génère un enregistrement de commission correct et consultable.

---

## 15. Backlog MVP — Tickets de développement

*Numérotation TLX-001 à TLX-039. Priorité : P0 = bloquant pour le MVP, P1 = important, P2 = souhaitable.*

### Sprint 0 — Fondations

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-001 | Infra | Poser l'infrastructure de base | Environnements dev/staging/prod, CI/CD minimal, coffre-fort de secrets | Aucune | Configuration CI/CD, infrastructure as code | 3 environnements fonctionnels, déploiement automatisé testé | Déploiement à blanc | P0 | Checklist Git validée |
| TLX-002 | Blockchain Pi | Créer les 2 applications Pi (testnet/mainnet) | Enregistrement Developer Portal, 2 portefeuilles applicatifs, clés API | TLX-001 | Configuration externe | 2 apps enregistrées, clés stockées dans le coffre-fort | Vérification manuelle d'accès sandbox | P0 | Checklist SDK Pi validée |
| TLX-003 | Blockchain Pi | Spike technique escrow (validation A2U) | Script de test isolé confirmant en sandbox le cycle U2A + A2U | TLX-002 | Script de test technique | Cycle U2A + A2U réussi en sandbox, rapport rédigé | Test manuel documenté | P0 | Rapport validé par CTO avant TLX-017 |

### Identité & Audit

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-004 | Identité | Modèle de données | Tables users, roles, user_roles, sessions | TLX-001 | Migrations | Conforme section 1.5 | Tests unitaires | P0 | Revue de code |
| TLX-005 | Audit | Modèle de données + service interne | Table audit_logs, `AuditService` | TLX-001 | Migration, service | Conforme section 2.5 | Tests unitaires | P0 | Revue de code |
| TLX-006 | Identité | Authentification Pi SDK | `/auth/pi-login`, vérification serveur | TLX-004, TLX-002 | Contrôleur Auth | Connexion sandbox réussie | Unitaires + intégration sandbox | P0 | Section 1.15 |
| TLX-007 | Identité | Session et profil | logout, /users/me | TLX-006 | Contrôleur Users | Conforme section 1.6 | Unitaires + intégration | P0 | Revue de code |
| TLX-008 | Identité | Rôles et suspension admin | Endpoints admin | TLX-006, TLX-005 | Contrôleur Admin Users | Conforme section 1.6, audit généré | Unitaires + intégration | P1 | Revue de code |

### KYC / KYB

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-009 | KYC | Modèle de données + stockage sécurisé | Tables verification_records/documents | TLX-004 | Migrations, service de stockage | Isolation confirmée | Unitaires + test sécurité | P0 | Revue sécurité passée |
| TLX-010 | KYC | Soumission | POST /verifications, /documents, /submit | TLX-009 | Contrôleur Verifications | Conforme section 3.6 | Unitaires + intégration | P0 | Revue de code |
| TLX-011 | KYC | Revue modérateur/admin | Liste, approve, reject | TLX-010, TLX-005 | Contrôleur Admin Verifications | Rôle attribué à l'approbation | Unitaires + intégration + E2E partiel | P0 | Section 3.15 |

### Catalogue & Curation

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-012 | Catalogue | Modèle de données | categories, products, product_media, documents | TLX-004 | Migrations | Conforme section 4.5 | Unitaires | P0 | Revue de code |
| TLX-013 | Catalogue | CRUD produit brouillon | POST/PATCH products, POST media | TLX-012, TLX-011 | Contrôleur Products | Vérification KYC serveur | Unitaires + intégration | P0 | Revue de code |
| TLX-014 | Catalogue | Soumission et catalogue public | submit, GET liste/détail, withdraw | TLX-013 | Contrôleur Products public | Conforme section 4.6 | Unitaires + intégration | P0 | Revue de code |
| TLX-015 | Curation | Modèle de données | authentication_reviews | TLX-012 | Migration | Conforme section 5.5 | Unitaires | P0 | Revue de code |
| TLX-016 | Curation | File et décisions expert | Liste, détail, approve/reject/request-info | TLX-015, TLX-014 | Contrôleur Expert Reviews | Effet correct sur Catalogue | Unitaires + intégration + E2E publication | P0 | Sections 4.15/5.15 |

### Paiements & Escrow

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-017 | Paiements | Modèle de données | payments, payment_reconciliation_log | TLX-003 validé | Migrations | Conforme section 6.5 | Unitaires | P0 | Revue de code |
| TLX-018 | Paiements | Cycle U2A complet | initiate, approve-callback, complete-callback | TLX-017 | Contrôleur Payments, client Pi Platform | Cycle réussi en sandbox réel | Unitaires + intégration sandbox obligatoire | P0 | Section 6.15 |
| TLX-019 | Paiements | Job de réconciliation | Tâche planifiée | TLX-018 | Job `PaymentReconciliationJob` | Détection de divergence simulée | Unitaires + intégration | P0 | Revue de code |
| TLX-020 | Paiements | Endpoint A2U interne | Signature via clé privée sécurisée | TLX-017, TLX-003 | Service A2U, intégration coffre-fort | Paiement A2U vérifié en sandbox | Unitaires + intégration sandbox obligatoire | P0 | Revue sécurité passée |
| TLX-021 | Escrow | Modèle de données | escrow_records | TLX-017 | Migration | Conforme section 7.5 | Unitaires | P0 | Revue de code |
| TLX-022 | Escrow | Cycle de vie escrow | hold/release/refund, consommation payment.completed | TLX-021, TLX-020 | Service Escrow, consumer | Idempotence vérifiée | Unitaires + intégration + E2E sandbox | P0 | Section 7.15 |
| TLX-023 | Escrow | Job de libération automatique | Tâche planifiée sur auto_release_at | TLX-022 | Job `EscrowAutoReleaseJob` | Libération auto déclenchée, bloquée si litige | Unitaires + intégration | P0 | Revue de code |

### Commandes & Logistique

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-024 | Commandes | Modèle de données | orders, addresses | TLX-012 | Migrations | Conforme section 8.5 | Unitaires | P0 | Revue de code |
| TLX-025 | Commandes | Création et concurrence | POST orders, réservation produit | TLX-024, TLX-014 | Contrôleur Orders, verrou transactionnel | Test de concurrence passé | Unitaires + intégration | P0 | Revue de code |
| TLX-026 | Commandes | Orchestration complète | confirm-shipment, confirm-receipt, cancel | TLX-025, TLX-018, TLX-022 | Contrôleur Orders, consumers | Conforme section 8.9 | Unitaires + intégration + E2E | P0 | Section 8.15 |
| TLX-027 | Logistique | Modèle et endpoints expédition | shipments + endpoints | TLX-026 | Migration, contrôleur Shipments | Conforme section 9.5/9.6 | Unitaires + intégration | P0 | Section 9.15 |

### Messagerie, Litiges, Notifications

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-028 | Messagerie | Modèle et endpoints | conversations, messages | TLX-024, TLX-014 | Migrations, contrôleur Conversations | Conforme section 10.5/10.6 | Unitaires + intégration | P1 | Section 10.15 |
| TLX-029 | Litiges | Modèle et endpoints | disputes, dispute_evidence | TLX-026, TLX-022 | Migrations, contrôleur Disputes | Blocage escrow effectif | Unitaires + intégration + E2E | P0 | Section 11.15 |
| TLX-030 | Notifications | Modèle et consommation | notifications, `NotificationDispatcher` | TLX-006 (et suivants) | Migration, service | Conforme section 12.5/12.7 | Unitaires + intégration (1 cas/module) | P1 | Section 12.15 |
| TLX-031 | Notifications | Envoi e-mail transactionnel | Intégration service e-mail | TLX-030 | Service `EmailNotifier` | E-mails envoyés pour événements critiques | Intégration (environnement de test e-mail) | P1 | Revue de code |

### Back-office & Commissions

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-032 | Back-office | Modèle et endpoints configuration | platform_settings | TLX-008 | Migration, contrôleur Admin Settings | Non-rétroactivité vérifiée | Unitaires + intégration | P0 | Section 13.15 |
| TLX-033 | Back-office | Tableau de bord admin | Endpoint dashboard | TLX-032, TLX-011, TLX-029 | Contrôleur Admin Dashboard | Conforme section 13.6 | Unitaires + intégration | P1 | Revue de code |
| TLX-034 | Commissions | Modèle et calcul | commission_records, consommation escrow.released | TLX-023, TLX-032 | Migration, service `CommissionCalculator` | Idempotence vérifiée | Unitaires + intégration | P0 | Section 14.15 |
| TLX-035 | Commissions | Endpoints de consultation | GET /admin/commissions, /sellers/me/commissions | TLX-034 | Contrôleur Commissions | Conforme section 14.6 | Unitaires + intégration | P1 | Revue de code |

### Sécurité, Tests transverses, Recette

| Ticket | Module | Objectif | Description | Dépendances | Fichiers/composants probables | Critères d'acceptation | Tests requis | Priorité | DoD |
|---|---|---|---|---|---|---|---|---|---|
| TLX-036 | Sécurité | Revue de sécurité globale MVP | Audit RBAC croisé, chiffrement KYC, secrets | Tous les P0 précédents | Rapport de revue | Aucune faille bloquante | Tests de sécurité par module sensible | P0 | Checklist déploiement (partielle) |
| TLX-037 | QA | Suite de tests E2E complète | Scénarios achat et publication, staging | Tous les modules P0 | Suite E2E automatisée | Parcours principaux passent sans intervention manuelle | Exécution CI systématique | P0 | Checklist déploiement |
| TLX-038 | QA | Recette utilisateur (UAT) | Session avec pilotes, collecte de retours | TLX-037 | Rapport UAT | Retours collectés et priorisés | — | P0 | Checklist déploiement |
| TLX-039 | Legal/Produit | CGU/CGV et politique de confidentialité | Rédaction juridique, intégration | Décisions fondateur (section 23) | Pages statiques | Documents validés et publiés | Revue juridique | P0 | Checklist déploiement |

*(Numérotation volontairement ouverte au-delà de TLX-039 : les tickets de correction post-UAT et de durcissement seront créés au fil de l'eau dans l'outil de backlog, en conservant la même structure.)*

---

## 16. A. Architecture technique finale recommandée pour le MVP

- **Style d'implémentation** : monolithe modulaire — un seul déploiement applicatif, code strictement séparé par module (chaque module expose ses propres contrôleurs/services/modèles sans dépendance croisée directe en base, communication via services internes et bus d'événements interne). Recommandé au MVP pour réduire la complexité opérationnelle tout en préservant la possibilité d'extraire des services indépendants en V1/V2 (Paiements/Escrow en priorité, pour des raisons de sécurité).
- **API Gateway** : couche d'entrée unique gérant l'authentification de session, le rate limiting et la journalisation d'accès.
- **Bus d'événements interne** : mécanisme de publication/souscription léger, suffisant au volume du MVP, évolutif vers un bus distribué en V1 si l'architecture est éclatée.
- **Jobs planifiés** : réconciliation des paiements, libération automatique d'escrow, expiration des réservations produit, délai d'expédition dépassé.

## 17. B. Stack technologique recommandée et justification

*Critères de choix donnés ici plutôt qu'une stack figée, conformément à la nature "sans code" de ce document — à confirmer par l'équipe technique finale.*

- **Backend** : framework avec typage statique fort recommandé, compte tenu de la sensibilité financière du projet.
- **Base de données** : relationnelle avec support transactionnel fort (ACID) **impérative**, compte tenu des exigences de contrôle de concurrence et d'intégrité financière décrites dans ce document.
- **Stockage objet / CDN** : nécessaire pour les médias produits, isolé du stockage des documents KYC.
- **File de messages / bus d'événements** : solution simple et éprouvée préférable à une solution sophistiquée sous-utilisée au stade MVP.
- **Frontend** : compatible avec les contraintes du Pi Browser App et le chargement du SDK Pi JS (`Pi.init()` avant tout appel).

*Le choix précis (langage, framework, SGBD) est délégué à l'équipe technique lors du Sprint 0, en cohérence avec la décision bloquante sur le style d'implémentation.*

## 18. C. Structure recommandée du repository GitHub

```
topluxe/
├── apps/
│   ├── api/
│   │   ├── modules/
│   │   │   ├── identity/
│   │   │   ├── audit/
│   │   │   ├── kyc/
│   │   │   ├── catalog/
│   │   │   ├── curation/
│   │   │   ├── payments/
│   │   │   ├── escrow/
│   │   │   ├── orders/
│   │   │   ├── logistics/
│   │   │   ├── messaging/
│   │   │   ├── disputes/
│   │   │   ├── notifications/
│   │   │   ├── admin/
│   │   │   └── commissions/
│   │   ├── shared/
│   │   └── migrations/
│   └── web/
│       ├── buyer/
│       ├── seller/
│       ├── expert/
│       ├── moderator/
│       └── admin/
├── docs/
├── infra/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── README.md
```
*Mono-repo recommandé au MVP (équipe probablement restreinte, forte dépendance fonctionnelle inter-module) — à réévaluer si l'équipe grandit significativement.*

## 19. D. Environnements nécessaires

| Environnement | Objectif | Réseau Pi associé |
|---|---|---|
| Développement | Travail quotidien, base locale/partagée | Sandbox Pi local (`sandbox: true`) |
| Staging / Recette | Intégration, E2E automatisés, UAT pilotes | Application Pi **Testnet** dédiée |
| Production | Utilisateurs réels | Application Pi **Mainnet** dédiée |

## 20. E. Variables / secrets nécessaires (sans valeurs réelles)

| Nom logique | Usage | Environnement(s) |
|---|---|---|
| `PI_API_KEY_TESTNET` | Clé API application Pi Testnet | Dev, Staging |
| `PI_API_KEY_MAINNET` | Clé API application Pi Mainnet | Production uniquement |
| `PI_APP_WALLET_PRIVATE_SEED_TESTNET` | Clé privée portefeuille applicatif Testnet | Staging — protection maximale |
| `PI_APP_WALLET_PRIVATE_SEED_MAINNET` | Clé privée portefeuille applicatif Mainnet | Production — protection maximale, accès minimal |
| `DATABASE_URL` | Connexion base de données | Tous |
| `OBJECT_STORAGE_CREDENTIALS` | Stockage médias produits | Tous |
| `KYC_DOCUMENT_STORAGE_CREDENTIALS` | Stockage isolé et chiffré des documents KYC | Tous — distinct du précédent |
| `EMAIL_PROVIDER_API_KEY` | Envoi e-mails transactionnels | Tous |
| `SESSION_TOKEN_SECRET` | Signature/validation des tokens de session | Tous |
| `FX_RATE_SOURCE_CONFIG` | Source du taux de change Pi/fiat | Tous — dépend de l'arbitrage sur le point 0.10 |

*Gestion exclusive via le coffre-fort de secrets défini au Sprint 0, jamais commitées dans le repository.*

## 21. F. Ordre exact des premiers tickets à développer

TLX-001 → TLX-002 → TLX-003 **(jalon de décision : validation du spike avant tout engagement au-delà)** → TLX-004 → TLX-005 → TLX-006 → TLX-007 → TLX-009 → TLX-010 → TLX-011 → TLX-012 → TLX-013 → TLX-014 → TLX-015 → TLX-016 → TLX-017 → TLX-018 → TLX-019 → TLX-020 → TLX-021 → TLX-022 → TLX-023 → TLX-024 → TLX-025 → TLX-026 → TLX-027 → TLX-029 → TLX-028 → TLX-030 → TLX-031 → TLX-032 → TLX-034 → TLX-035 → TLX-033 → TLX-008 → TLX-036 → TLX-037 → TLX-038 → TLX-039.

## 22. G. Checklist « PRÊT À CODER »

- [ ] Les 4 documents précédents (référence officielle, cahier des charges, architecture technique, plan d'implémentation) sont formellement validés par le fondateur.
- [ ] Ce document de spécifications détaillées est validé, y compris la section 0 et ses points NON CONFIRMÉS traités.
- [ ] Les décisions bloquantes de la section 23 sont arbitrées.
- [ ] Le spike technique TLX-003 est planifié en tout premier, avant tout engagement sur Paiements/Escrow.
- [ ] Les checklists Git, SDK Pi et déploiement MVP (document précédent) sont accessibles à l'équipe et suivies dans l'ordre.
- [ ] L'équipe technique (au minimum un profil capable de mener le spike blockchain) est constituée ou identifiée.
- [ ] Le prestataire de stockage objet/CDN et le prestataire e-mail transactionnel sont sélectionnés au moins pour l'environnement de développement.

## 23. H. Points à valider par le fondateur

*(Complète, sans les dupliquer, les points déjà posés dans le plan d'implémentation précédent.)*

1. **Confirmation du plan B d'escrow applicatif** (section 0.5) comme unique mécanisme viable.
2. **Source du taux de change Pi/fiat** (section 0.10) — pas de réponse technique officielle, arbitrage juridique nécessaire avant TLX-018.
3. **Gestion du remboursement partiel en cas de litige** — le MVP tel que spécifié ne gère qu'un remboursement total ou nul (section 11.3).
4. **Automatisation du passage au statut "livré"** — manuelle côté admin au MVP (section 9.8), à faire évoluer selon le partenaire logistique effectivement choisi.
5. **Calendrier de soumission de la demande de listing mainnet** — à valider comme jalon indépendant et anticipé (section 0.9).

## 24. I. Points à vérifier dans la documentation officielle Pi Network avant le premier commit

1. Reconfirmer, au démarrage effectif, l'ensemble des points « CONFIRMÉ » de la section 0 (la documentation Pi pouvant évoluer), en particulier le comportement exact de `/v2/payments`, `/approve`, `/complete`.
2. Obtenir une clarification officielle du Pi Core Team sur l'absence confirmée d'escrow natif pour applications tierces, pour sécuriser définitivement le choix du Plan B.
3. Vérifier l'existence ou l'absence d'un flux/API de taux de change Pi/fiat officiel au moment du développement du module Paiements.
4. Vérifier les délais réels d'approbation d'application actuellement constatés auprès de la communauté développeur Pi active.
5. Relire intégralement, avant TLX-002, le contenu à jour du Pi Developer Guide et des Mainnet Listing Requirements.
6. Confirmer la compatibilité exacte du modèle TopLuxe avec les Pi App Studio Community Guidelines les plus à jour, notamment sur la transparence/authenticité des transactions.

---

*Ce document constitue les spécifications techniques détaillées et le backlog de développement du MVP TopLuxe. Aucune ligne de code n'a été produite. Le développement peut démarrer, en suivant l'ordre de la section 21, dès que la checklist « PRÊT À CODER » (section 22) est cochée et que les points de la section 23 sont arbitrés — en commençant impérativement par TLX-001 à TLX-003, ce dernier constituant un jalon de validation avant tout engagement sur les modules Paiements et Escrow.*
