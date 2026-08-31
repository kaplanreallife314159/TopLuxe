# TopLuxe — Mise à jour Pi Network : Authentification

*Addendum au document « TopLuxe — Spécifications Techniques Détaillées & Backlog MVP »*
*Vérifié le 30 août 2026 sur la documentation officielle : https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Authentication (+ pages liées Platform/Authentication et Pi Mainnet vs Testnet)*
*Statut : mise à jour de cadrage technique, aucune ligne de code produite*

---

## 0. Ce qui a changé depuis notre dernière vérification

La documentation Pi expose désormais un **guide dédié aux agents GenAI** (`quick-start/genai/Authentication`) qui formalise une règle qui n'apparaissait pas explicitement dans les sources consultées précédemment : **le SDK fondamental (`window.Pi`) n'est plus l'approche recommandée par défaut**. Pi Network recommande maintenant des **wrappers officiels par framework** (`pi-sdk-react`, `pi-sdk-nextjs`, `pi-sdk-js`, `pi-sdk-rails`, etc.), le SDK fondamental restant réservé à des cas particuliers.

Ceci ne remet pas en cause les mécanismes bas niveau déjà validés (cycle U2A, `GET /me`, etc.), qui restent inchangés et sont désormais confirmés une seconde fois — mais cela change **la couche d'abstraction recommandée pour l'implémentation frontend**, ce qui a un impact direct sur nos tickets TLX-006 et TLX-018.

---

## 1. Quelle approche officielle correspond à notre stack frontend ?

Notre document d'architecture (section B — Stack technologique) n'a volontairement pas figé de framework frontend précis, en délégant ce choix à l'équipe technique du Sprint 0. La documentation officielle fournit désormais un tableau de correspondance strict(cite index="38-1">, pour une stack React il faut utiliser `pi-sdk-react` avec le hook `usePiConnection()` et surtout ne jamais appeler `window.Pi.authenticate()` directement ; pour Next.js utiliser les hooks/composants fournis par `pi-sdk-nextjs` sans appeler le SDK fondamental directement ; pour du JavaScript sans framework, utiliser `PiSdkBase` depuis `pi-sdk-js` puis `pi.connect()`</cite>.

**Conséquence pour TopLuxe** : le choix du framework frontend (à trancher au Sprint 0 selon le document précédent) détermine directement et sans ambiguïté quel wrapper utiliser. Ce choix ne peut plus être laissé complètement ouvert — il doit être fait **avant** le ticket TLX-006, car il conditionne l'implémentation exacte de ce ticket.

## 2. `pi-sdk-react` / `pi-sdk-nextjs` / `pi-sdk-js` ou SDK fondamental ?

Position officielle explicite(cite index="38-1">, il est recommandé d'utiliser en priorité les paquets npm officiels — pi-sdk-js pour le client, pi-sdk-nextjs pour Next.js, pi-sdk-react pour React, pi-sdk-rails pour Rails — plutôt que d'intégrer directement le SDK fondamental, ces helpers fournissant des API typées, une gestion correcte du cycle de vie de l'authentification et des paiements, un scaffolding spécifique au framework, et étant maintenus pour suivre les évolutions de la plateforme</cite>. Le SDK fondamental (`window.Pi` / `pi-sdk.js`) ne doit être utilisé directement(cite index="38-1">, que si aucun helper ne supporte la stack retenue, en cas de débogage ou de contribution aux helpers eux-mêmes, ou si une capacité nécessaire n'est pas encore exposée par les helpers</cite>.

**Conséquence pour TopLuxe** : sauf raison technique précise justifiée en revue d'architecture, TopLuxe **doit** utiliser le wrapper officiel correspondant au framework retenu, et non le SDK fondamental directement. Ceci devient une règle de conception à ajouter à la section sécurité/qualité du module Identité & Authentification.

## 3. Processus exact d'initialisation

Deux niveaux confirmés :
- Le script fondamental doit être inclus dans le `<head>` de la page, condition technique de base quel que soit le wrapper utilisé par-dessus(cite index="38-1">, le SDK Pi de base devant être rendu disponible dans le head HTML via le script `https://sdk.minepi.com/pi-sdk.js`, ce script fournissant le pont bas niveau vers le Pi Browser</cite>.
- Au niveau du wrapper vanilla JS (si retenu), l'initialisation se fait via une instance de service dédiée(cite index="38-1">, l'initialisation se faisant en importation de `PiSdkBase` depuis `pi-sdk-js`, création d'une instance, puis appel de la méthode `connect()` pour établir la connexion</cite>.
- Pour React/Next.js, l'initialisation est gérée en interne par le hook/scaffold fourni par le wrapper — il n'y a pas d'appel manuel équivalent à exposer dans notre spécification, le wrapper l'encapsule.

## 4. Processus exact d'authentification

Le point d'entrée bas niveau reste l'appel `authenticate()`(cite index="39-1">, avec la fonction authenticate() du SDK Pi permettant d'obtenir les informations utilisateur ainsi que le token d'accès</cite>, mais l'implémentation directe de cet appel est désormais explicitement déconseillée si un wrapper existe pour la stack retenue(cite index="39-1">, en cas d'utilisation de pi-sdk-react, il faut utiliser `usePiConnection()` plutôt que d'appeler `window.Pi.authenticate()` directement, le hook gérant l'appel authenticate() en interne et exposant l'accessToken dans sa valeur de retour</cite>.

Le motif d'implémentation recommandé pour un contexte vanilla JS est un service applicatif encapsulant l'appel, avec gestion d'erreur systématique et retour structuré (succès/échec, accessToken, utilisateur) — ce pattern (`PiService`) est explicitement documenté comme la structure à suivre pour un développement piloté par un agent/LLM.

## 5. Le scope `username` pour l'authentification initiale

Confirmé comme scope par défaut recommandé, avec une règle de minimisation explicite(cite index="38-1">, le scope par défaut recommandé pour la connexion étant `['username']`, avec la consigne de ne demander le scope `payments` que lorsque cela est réellement nécessaire à l'utilité de l'application, afin de préserver la confiance de l'utilisateur</cite>.

**Conséquence pour TopLuxe** : notre parcours de connexion initiale (module Identité & Authentification) doit demander uniquement `['username']` à la connexion. Le scope `payments` ne doit être demandé qu'au moment effectif où l'utilisateur engage un paiement (module Paiements), pas à la connexion générale — ceci **corrige** une ambiguïté de notre document précédent qui ne précisait pas ce séquencement des scopes.

## 6. Transfert sécurisé de l'`accessToken` au backend

Confirmé : le token obtenu côté client (quel que soit le wrapper) doit être transmis au backend applicatif pour validation, jamais faire confiance à sa seule présence côté client(cite index="38-1">, l'authentification n'étant considérée complète qu'une fois vérifiée côté serveur, l'accessToken retourné par le frontend devant être envoyé au backend</cite>. Le canal de transfert n'est pas prescrit dans le détail (transmission HTTPS standard vers un endpoint applicatif), mais la nécessité de ne jamais court-circuiter la vérification serveur est une exigence explicite et répétée sur plusieurs pages de la documentation.

**Conséquence pour TopLuxe** : notre endpoint `POST /api/v1/auth/pi-login` (déjà spécifié) reste le bon point d'entrée, à condition qu'il exécute bien l'étape 7 ci-dessous à chaque appel, sans exception.

## 7. Validation backend via `GET https://api.minepi.com/v2/me`

Confirmé explicitement, avec le format exact de l'appel(cite index="39-1">, la vérification se faisant en envoyant une requête GET vers l'endpoint `/me` de l'API Pi avec le token d'accès inclus dans l'en-tête, un token valide retournant un UserDTO tandis qu'un token invalide retourne un code HTTP 401 Unauthorized</cite>. Format exact confirmé : `GET https://api.minepi.com/v2/me` avec un en-tête `Authorization: Bearer {accessToken}`.

**Conséquence pour TopLuxe** : ceci confirme et précise ce que notre spécification indiquait déjà en 1.11 ("vérification serveur systématique du token Pi") — le mécanisme exact est maintenant documenté avec l'URL et le format d'en-tête précis, à intégrer littéralement dans le ticket TLX-006.

## 8. Création de la session TopLuxe après validation

Confirmé au niveau du principe, sans imposer de mécanisme technique précis(cite index="38-1">, une fois l'UID confirmé par l'API Pi, le serveur applicatif pouvant émettre un JWT ou un cookie de session propre à l'application</cite>. Aucune contrainte technique supplémentaire n'est imposée par Pi Network sur ce point : le choix entre JWT et cookie de session, ainsi que la durée de vie, restent de la responsabilité de TopLuxe.

**Conséquence pour TopLuxe** : notre modèle de données `sessions` (table dédiée, token haché) et notre endpoint `/auth/pi-login` restent conformes — aucun changement structurel requis ici, seulement la confirmation que ce point est bien à la main de TopLuxe.

## 9. Gestion des erreurs et de l'annulation de l'authentification

Confirmé comme exigence explicite de conception(cite index="38-1">, il étant recommandé d'utiliser systématiquement async/await avec pi-sdk-js pour éviter l'imbrication de callbacks, et d'implémenter systématiquement un bloc try/catch autour de l'authentification pour gérer les annulations utilisateur</cite>. Le pattern `PiService` documenté retourne explicitement une structure `{ success: false, error }` en cas d'échec, plutôt que de laisser remonter une exception non gérée jusqu'à l'interface.

**Conséquence pour TopLuxe** : à ajouter explicitement à la section 1.11 (validations et contrôles de sécurité) du module Identité & Authentification — l'annulation d'authentification par l'utilisateur doit être un cas géré explicitement (retour à l'état "non connecté" sans erreur technique affichée), distinct d'une véritable erreur technique.

## 10. Gestion des paiements incomplets

Point confirmé et **important, absent de notre document précédent en tant que tel** : l'appel `authenticate()` (quel que soit le wrapper) attend un second paramètre obligatoire, un callback de gestion des paiements incomplets(cite index="38-1">, ce callback requis par le SDK Pi ayant pour rôle de gérer les paiements qui ont été interrompus avant leur complétion, un tel paiement interrompu devant être résolu côté backend</cite>.

**Conséquence pour TopLuxe — impact direct sur le module Paiements** : notre spécification actuelle (module 6) décrit un job de réconciliation périodique (TLX-019), mais ne décrivait pas ce mécanisme **complémentaire et différent** : un paiement incomplet peut être détecté **dès la prochaine authentification de l'utilisateur concerné**, via ce callback, avant même que le job de réconciliation périodique ne l'ait détecté. Ceci doit être ajouté comme un second mécanisme de détection (immédiat, déclenché à la reconnexion) en complément du job planifié (différé, systématique) déjà spécifié.

## 11. Différences développement/sandbox vs production/mainnet

Confirmé, avec des précisions supplémentaires par rapport à notre document précédent :
- Le Testnet utilise du **Test-Pi, sans aucune valeur réelle**, distribué via un robinet ("faucet"), avec un solde susceptible d'être réinitialisé périodiquement(cite index="40-1">, le Pi Testnet utilisant du Test Pi qui n'est pas du vrai Pi, ce Test Pi ne servant qu'à tester les transactions sur le Testnet et n'ayant aucune valeur, le solde de Test-Pi du portefeuille pouvant être réinitialisé périodiquement dans le cadre des tests</cite>) — **implication nouvelle pour nos tests** : le job de réconciliation (TLX-019) et les tests E2E en environnement de staging doivent être conçus en tenant compte d'une possible réinitialisation du solde testnet, qui n'était pas mentionnée dans notre document précédent.
- Le Sandbox est un environnement **local**, distinct du Testnet déployé, utilisant le Testnet mais avec une instance locale de l'application, nécessitant une URL enregistrée dans le Developer Portal(cite index="40-1">, le Sandbox étant un environnement de test local utilisant le Pi Testnet et une instance locale de l'application, réservé au développement, nécessitant une URL enregistrée sur la page Developer Portal de l'application</cite>).
- **Point réglementaire nouveau et important**, absent de notre analyse précédente : durant la période actuelle du Mainnet ("Enclosed Network"), l'échange de Pi contre une devise fiat est explicitement listé comme un usage **interdit**, de même que le transfert de Pi contre une promesse future de devise fiat(cite index="40-1">, les usages interdits incluant l'échange de Pi contre une devise fiat, l'échange de Pi contre une autre cryptomonnaie, et le transfert de Pi contre une promesse future de devise fiat ou d'autre cryptomonnaie</cite>). En revanche, l'échange de Pi contre des biens et services via les Pi Apps est explicitement un usage **autorisé**(cite index="40-1">, les usages autorisés incluant l'échange de Pi contre des biens et services à travers les applications Pi, ainsi que le transfert de Pi entre Pionniers pour des biens et services</cite>).

**Conséquence directe et importante pour TopLuxe** : le modèle économique de TopLuxe (vente de biens de luxe payés en Pi) correspond exactement à l'usage autorisé "échange de Pi contre des biens et services" — **ceci renforce la conformité générale du concept**. Mais cela renforce aussi, et de façon plus précise que dans notre analyse précédente, la prudence déjà exprimée sur le point non confirmé du taux de change Pi/fiat (section 0.10 du document précédent) : TopLuxe ne doit en aucun cas présenter ou structurer son mécanisme de prix comme un **"échange de Pi contre du fiat"**, ce qui est interdit — le prix fiat affiché doit rester strictement un **prix de référence indicatif pour l'affichage**, la transaction réelle étant et restant un paiement en Pi contre un bien, jamais une opération de change. Ce point doit être formalisé comme règle de conception explicite dans le module Paiements, et vérifié avec un conseil juridique.

---

## Comparaison avec « TopLuxe — Spécifications Techniques Détaillées & Backlog MVP »

### Ce qui reste inchangé

- Le cycle U2A create/approve/complete (section 0.2 du document précédent) — confirmé une seconde fois, sans changement.
- Le mécanisme de callbacks côté client, pas de webhook serveur-à-serveur natif (section 0.3) — confirmé, inchangé.
- Le flux A2U et la nécessité pour TopLuxe de détenir/sécuriser la clé privée du portefeuille applicatif (section 0.4) — confirmé, inchangé.
- L'absence d'escrow natif Pi pour applications tierces et le Plan B applicatif retenu (section 0.5) — confirmé, inchangé.
- Les contraintes du compte de paiement applicatif, la nécessité de deux applications Pi distinctes testnet/mainnet (sections 0.6, 0.7) — confirmé, inchangé.
- L'existence et le rôle du Sandbox (section 0.8) — confirmé, précisé (distinction Sandbox local / Testnet déployé, cf. point 11 ci-dessus).
- Le modèle de données `users`, `sessions`, `user_roles` (section 1.5 du document précédent) — inchangé, aucune évolution de schéma requise par cette mise à jour.
- L'endpoint `POST /api/v1/auth/pi-login` et son rôle (section 1.6) — inchangé dans sa forme, mais son contenu d'implémentation est précisé (voir ci-dessous).

### Ce qui doit être modifié

1. **Choix du wrapper frontend devient une décision bloquante à prendre avant TLX-006**, et non plus un détail d'implémentation libre — le framework frontend retenu (React, Next.js, ou vanilla JS) détermine strictement l'usage de `pi-sdk-react`, `pi-sdk-nextjs` ou `pi-sdk-js`, avec interdiction d'appeler `window.Pi.authenticate()` directement si un wrapper existe pour la stack choisie.
2. **Séquencement des scopes** : le scope `username` doit être demandé seul à la connexion initiale ; le scope `payments` doit être demandé séparément, uniquement au moment de l'initiation d'un paiement (module 6), jamais à la connexion générale. Notre spécification précédente ne précisait pas ce séquencement.
3. **Ajout d'un second mécanisme de détection des paiements incomplets** dans le module Paiements : un callback obligatoire de l'appel `authenticate()`, déclenché à chaque reconnexion d'un utilisateur ayant un paiement resté incomplet, en complément (pas en remplacement) du job de réconciliation périodique déjà spécifié (TLX-019).
4. **Règle de conception explicite sur le prix affiché** : le prix fiat de référence ne doit jamais être présenté ou implémenté comme un mécanisme d'échange Pi/fiat, compte tenu de l'interdiction explicite de l'échange Pi contre fiat pendant la période Enclosed Network actuelle du Mainnet. Ceci renforce et précise le point déjà identifié comme non confirmé (taux de change) — ce n'est plus seulement "source non confirmée", c'est désormais aussi une **contrainte réglementaire positive et confirmée à respecter dans la conception**.
5. **Ajout d'un cas de test explicite sur la réinitialisation périodique du solde Testnet**, à intégrer dans la stratégie de tests du module Paiements (TLX-018, TLX-037), absent de notre document précédent.
6. **Gestion explicite de l'annulation utilisateur comme cas non-erreur** dans le module Identité & Authentification (distinct des erreurs techniques), à formaliser dans la section validations/sécurité de ce module.

### Tickets TLX à mettre à jour

| Ticket | Mise à jour requise |
|---|---|
| **TLX-006** (Authentification Pi SDK) | Implémentation à baser sur le wrapper officiel correspondant au framework retenu (pas le SDK fondamental directement, sauf justification technique documentée) ; scope `['username']` uniquement à la connexion ; gestion explicite de l'annulation utilisateur comme cas non-erreur ; câblage du callback de paiement incomplet dès ce ticket (même si son traitement complet relève du module Paiements). |
| **TLX-018** (Cycle U2A complet) | Ajout de la demande du scope `payments` au moment de l'initiation du paiement (et non à la connexion) ; prise en compte du callback de paiement incomplet transmis par le module Identité pour déclencher, le cas échéant, une vérification/réconciliation immédiate du paiement concerné. |
| **TLX-019** (Job de réconciliation) | À documenter comme mécanisme complémentaire, non exclusif, au nouveau mécanisme de détection immédiate par callback (voir TLX-018) ; ajouter un cas de test sur la réinitialisation périodique du solde Testnet. |
| **TLX-037** (Suite de tests E2E) | Ajouter un scénario couvrant explicitement l'annulation d'authentification par l'utilisateur, et un scénario de paiement incomplet détecté à la reconnexion. |
| *(Nouveau, à créer)* **TLX-040** | Décision et documentation du choix de wrapper frontend Pi (react/nextjs/js) — préalable technique à TLX-006, à traiter en Sprint 0 aux côtés de TLX-001/002/003. |

### Nouvelles dépendances à ajouter

- Dépendance du ticket **TLX-006** envers une **décision de framework frontend actée** (nouveau prérequis, absent du document précédent qui laissait ce choix totalement libre et sans impact déclaré sur les tickets Pi).
- Dépendance du paquet officiel correspondant (`pi-sdk-react`, `pi-sdk-nextjs`, ou `pi-sdk-js`) à ajouter à la stack frontend du repository (section C — structure du repository — aucun changement de structure de dossiers nécessaire, mais une dépendance de package à documenter dans le Sprint 0).
- Dépendance fonctionnelle nouvelle entre **Identité & Authentification** et **Paiements** : le callback de paiement incomplet reçu à l'authentification doit désormais être transmis/consommé par le module Paiements — à ajouter à la table des interactions inter-modules du document d'architecture (section 3 du document d'architecture technique) lors de la prochaine révision de ce document.

### Points Pi restant NON CONFIRMÉS

Ces points, déjà identifiés dans le document précédent, **restent NON CONFIRMÉS** après cette vérification ciblée sur l'authentification — cette mise à jour ne les résout pas, elle ne portait pas sur eux :

- **NON CONFIRMÉ — NE PAS IMPLÉMENTER AVANT VALIDATION** : existence d'un escrow natif Pi pour applications tierces (inchangé, toujours absent de la documentation consultée).
- **NON CONFIRMÉ — NE PAS IMPLÉMENTER AVANT VALIDATION** : existence d'une source de taux de change Pi/fiat officielle fournie par Pi Network — ce point est même renforcé négativement par la découverte de l'interdiction explicite de l'échange Pi/fiat pendant la période Enclosed Network actuelle (point 11 ci-dessus).
- **NON CONFIRMÉ** : délai prévisible d'approbation d'une application pour le listing mainnet (inchangé).
- **NON CONFIRMÉ** : comportement détaillé et garanties précises de l'API `/me` en cas de conditions limites non documentées explicitement (ex. token valide mais compte Pi entretemps suspendu côté Pi Network) — aucune information officielle trouvée sur ce cas précis, à traiter par un test défensif côté TopLuxe (ne jamais supposer qu'un 200 sur `/me` garantit un compte Pi en règle à tous égards) plutôt que par une hypothèse.

---

## ARCHITECTURE PI NETWORK VALIDÉE POUR LE DÉVELOPPEMENT

*Uniquement les éléments confirmés par la documentation officielle actuelle, prêts à servir de base d'implémentation pour le module Identité & Authentification et la partie authentification du module Paiements.*

1. **Inclusion obligatoire** du script fondamental `https://sdk.minepi.com/pi-sdk.js` dans le `<head>` de l'application, quel que soit le wrapper utilisé par-dessus.
2. **Wrapper frontend obligatoire selon la stack** (décision à acter en Sprint 0, avant TLX-006) :
   - React → `pi-sdk-react`, hook `usePiConnection()`.
   - Next.js → `pi-sdk-nextjs`, hooks/composants scaffoldés.
   - Vanilla JS / autre → `pi-sdk-js`, classe `PiSdkBase`, méthode `connect()`.
   - Le SDK fondamental (`window.Pi`) n'est utilisé directement qu'en dernier recours documenté (absence de wrapper pour la stack, debug, contribution aux helpers).
3. **Authentification initiale avec le scope `['username']` uniquement.** Le scope `payments` est demandé séparément, uniquement au moment de l'initiation d'un paiement.
4. **Callback obligatoire de gestion des paiements incomplets**, fourni en second paramètre de l'appel d'authentification (quel que soit le wrapper), à câbler dès le module Identité et à connecter au module Paiements pour traitement.
5. **Transfert systématique de l'`accessToken`** obtenu côté client vers le backend TopLuxe, sans exception.
6. **Validation backend obligatoire** via `GET https://api.minepi.com/v2/me` avec l'en-tête `Authorization: Bearer {accessToken}` — un code 200 avec `UserDTO` valide l'utilisateur, un code 401 invalide le token.
7. **Création de la session TopLuxe** (JWT ou cookie de session, au choix de TopLuxe) uniquement après validation positive de l'étape 6 — jamais avant.
8. **Gestion explicite de l'annulation utilisateur** comme cas non-erreur (retour à l'état non connecté), distincte des erreurs techniques réelles, via un bloc try/catch systématique autour de l'appel d'authentification.
9. **Deux environnements applicatifs Pi strictement distincts et non convertibles l'un en l'autre après création** : Testnet (Test-Pi sans valeur, solde réinitialisable périodiquement) pour le développement/staging, Mainnet (Enclosed Network, Pi réel) pour la production.
10. **Sandbox local** requis pour le développement quotidien, utilisant le Testnet, nécessitant une URL enregistrée dans le Developer Portal de l'application testnet.
11. **Contrainte réglementaire confirmée à respecter dans la conception du module Paiements** : le mécanisme de prix de TopLuxe doit rester un prix en Pi avec référence fiat strictement indicative à l'affichage — jamais une opération d'échange Pi contre fiat, cet usage étant explicitement interdit pendant la période Enclosed Network actuelle du Mainnet. L'usage "échange de Pi contre biens et services via une Pi App", en revanche, est explicitement autorisé et correspond exactement au modèle TopLuxe.

*Tout élément non listé dans cette section (en particulier l'escrow applicatif détaillé, le taux de change Pi/fiat, les délais mainnet) reste régi par les statuts NON CONFIRMÉS déjà établis dans le document « TopLuxe — Spécifications Techniques Détaillées & Backlog MVP » et n'est pas modifié par cette mise à jour.*

---

*Ce document constitue un addendum de mise à jour ciblé sur l'authentification Pi Network. Aucune ligne de code n'a été produite. Il doit être lu conjointement avec le document « TopLuxe — Spécifications Techniques Détaillées & Backlog MVP », dont il précise et corrige uniquement la partie authentification (section 0 et module 1), sans remettre en cause le reste de l'architecture.*
