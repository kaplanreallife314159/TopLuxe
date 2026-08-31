# TopLuxe — Spécification Professionnelle de Référence

*Marketplace premium sur Pi Network — Achat et vente en Pi exclusivement*
*Version 3.0 — Référence officielle pour le développement*
*Statut : en attente de validation — aucune ligne de code produite*

---

## Sommaire

1. À propos de ce document
2. Vision, mission, valeurs
3. Objectifs — court / moyen / long terme
4. Personas
5. Rôles et matrice des droits
6. Parcours utilisateurs détaillés (acheteur, vendeur, admin) avec cas d'erreur
7. Modules applicatifs
8. Écrans (inventaire UX complet)
9. Règles métier transverses
10. Processus détaillé : Publication d'un produit
11. Processus détaillé : Paiement en Pi
12. Processus détaillé : Livraison nationale et internationale
13. Processus détaillé : Réception
14. Processus détaillé : Vérification (KYC/KYB + authentification produit)
15. Modèles de commission (plusieurs options, non tranchées)
16. Catalogue des cas d'erreur (vue consolidée)
17. Exigences de sécurité et de performance
18. Contraintes spécifiques Pi Network
19. Risques et solutions
20. Feuille de route (MVP → V1 → V2)
21. Glossaire
22. Points ouverts nécessitant votre arbitrage

---

## 1. À propos de ce document

Ce document est la **spécification professionnelle de référence** du projet TopLuxe, élaborée du point de vue d'une équipe pluridisciplinaire (PM senior, business analyst, CTO, architecte logiciel, UX/UI designer, expert blockchain, chef de projet). Il remplace et enrichit les versions précédentes en ajoutant :

- le détail pas-à-pas des processus critiques (publication produit, paiement Pi, livraison, réception, vérification) ;
- les cas d'erreur associés à chaque processus ;
- plusieurs modèles de commission présentés sans arbitrage, pour décision commune.

Ce document reste volontairement **sans aucune décision d'implémentation technique** (stack, base de données, infrastructure). Il constitue la base directe pour la conception de l'architecture technique, qui sera l'étape suivante.

---

## 2. Vision, mission, valeurs

### Vision
Faire de TopLuxe la marketplace de référence mondiale pour l'achat et la vente de produits haut de gamme réglés exclusivement en Pi, avec un niveau de confiance équivalent aux meilleures marketplaces de luxe traditionnelles.

### Mission
Offrir aux Pionniers Pi Network un espace pour acheter et vendre des biens haut de gamme authentifiés — bijoux, montres, mode/chaussures, véhicules, art — avec des vendeurs vérifiés, des produits authentifiés, un paiement sécurisé par séquestre, et une gestion professionnelle de la commande jusqu'à la livraison.

### Valeurs

| Valeur | Traduction concrète |
|---|---|
| Confiance | Vérification systématique des vendeurs et des produits |
| Exigence | Curation qualitative, standards visuels et éditoriaux premium |
| Transparence | Statuts clairs, règles de commission publiques, litiges lisibles |
| Sécurité | Paiement séquestré, protection des données KYC |
| Communauté Pi | Priorité aux Pionniers, valorisation de l'usage réel du Pi |
| Exclusivité maîtrisée | Catalogue restreint et vérifié plutôt qu'ouvert sans contrôle |

---

## 3. Objectifs — court / moyen / long terme

**Court terme (0–6 mois)** : cadrage juridique, catalogue pilote restreint, MVP fonctionnel (inscription, KYC de base, catalogue, paiement Pi avec escrow, commande, messagerie), première traction mesurable.

**Moyen terme (6–18 mois)** : industrialisation de l'authentification, ouverture du programme Maison Partenaire, tableau de bord vendeur avancé, extension progressive des catégories, programme de réputation.

**Long terme (18 mois et +)** : leadership reconnu dans la communauté Pi, enchères en Pi, passeport numérique du produit, extension géographique, partenariats institutionnels avec des maisons de luxe reconnues.

---

## 4. Personas

*(inchangé par rapport à la version précédente — synthèse)*

- **Pionnier Collectionneur** (acheteur) : recherche confiance, authenticité, clarté du prix Pi/fiat.
- **Vendeur Particulier Premium** : processus simple malgré les exigences, garantie de paiement.
- **Maison / Boutique Partenaire** (vendeur pro) : outils catalogue, conditions claires, image de marque respectée.
- **Expert Authentificateur** : outils de revue efficaces, traçabilité, charge de travail soutenable.
- **Modérateur / Support** : vision centralisée d'une commande, outils d'escalade.
- **Administrateur Plateforme** : reporting fiable, contrôle des paramètres, visibilité sur les risques.

---

## 5. Rôles et matrice des droits

| Rôle | Acheter | Vendre | Valider KYC/KYB | Valider authenticité | Traiter litiges | Reporting global |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Visiteur | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acheteur | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendeur particulier | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vendeur professionnel | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ |
| Expert authentificateur | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Modérateur | ❌ | ❌ | ✅ (niv. 1) | ❌ | ✅ (niv. 1) | Partiel |
| Administrateur | ❌ | ❌ | ✅ | ✅ (arbitrage) | ✅ (niv. 2) | ✅ |

*\* Sous réserve de l'arbitrage sur le cumul de rôles — section 22.*

---

## 6. Parcours utilisateurs détaillés (avec cas d'erreur)

### 6.1 Parcours Acheteur

| Étape | Action utilisateur | Comportement système | Cas d'erreur possibles |
|---|---|---|---|
| 1 | Connexion via Pi SDK | Vérification du token Pi, création/récupération du profil | Échec d'authentification Pi (token invalide/expiré) → message clair + retry ; compte suspendu → blocage avec message et contact support |
| 2 | Navigation catalogue | Affichage filtré | Aucun résultat → suggestion de filtres alternatifs |
| 3 | Consultation fiche produit | Affichage détail | Produit retiré/vendu entre-temps → message "produit non disponible" + suggestions similaires |
| 4 | Clic "Acheter" | Vérification stock/disponibilité, vérification seuil KYC | Produit déjà réservé par un autre acheteur (concurrence) → message + retour catalogue ; seuil KYC dépassé et KYC non validé → redirection parcours KYC |
| 5 | Paiement Pi (`Pi.createPayment`) | Initiation, approbation serveur | Paiement annulé par l'utilisateur → commande annulée automatiquement ; timeout de confirmation blockchain → statut "en attente", notification différée ; solde Pi insuffisant → message explicite côté wallet Pi |
| 6 | Confirmation serveur (`complete`) | Fonds placés en escrow, commande confirmée | Échec de complétion malgré approbation → procédure de réconciliation manuelle (cas rare, alerte admin) |
| 7 | Suivi de commande | Mise à jour de statuts | Vendeur ne confirme pas l'expédition dans le délai → annulation automatique + remboursement |
| 8 | Réception | Confirmation manuelle ou automatique | Produit non reçu après délai annoncé → ouverture de litige facilitée ; produit endommagé/non conforme → ouverture de litige avec preuves |
| 9 | Avis | Formulaire de notation | Tentative d'avis sans commande clôturée → action bloquée |

### 6.2 Parcours Vendeur

| Étape | Action | Système | Cas d'erreur |
|---|---|---|---|
| 1 | Activation statut vendeur | Déclenchement parcours KYC/KYB | Documents illisibles/incomplets → rejet motivé, resoumission possible |
| 2 | Création fiche produit | Formulaire + upload | Photos insuffisantes (nombre minimum non atteint) → blocage de la soumission avec message explicite ; format de fichier non supporté → message d'erreur précis |
| 3 | Soumission pour vérification | File d'attente expert | Délai anormalement long → notification proactive au vendeur avec estimation |
| 4 | Décision expert | Validation / rejet / compléments | Rejet → motif obligatoire affiché, produit non publié, resoumission possible après correction |
| 5 | Réception commande | Notification | — |
| 6 | Expédition | Saisie tracking | Numéro de suivi invalide/mal formaté → validation de format à la saisie ; dépassement du délai d'expédition → annulation automatique, impact réputation |
| 7 | Réception des fonds | Libération escrow | Litige ouvert avant libération → fonds bloqués, vendeur notifié de la procédure |

### 6.3 Parcours Administrateur

| Étape | Action | Système | Cas d'erreur |
|---|---|---|---|
| 1 | Connexion back-office | Authentification renforcée (distincte du Pi SDK grand public) | Tentative de connexion suspecte → verrouillage temporaire, alerte sécurité |
| 2 | Traitement KYC/KYB en attente | Validation/rejet | Document suspect (doute sur authenticité du document lui-même) → escalade vers vérification renforcée |
| 3 | Traitement litiges escaladés | Décision finale | Preuves insuffisantes des deux côtés → délai supplémentaire encadré avant décision par défaut (règle à définir) |
| 4 | Configuration plateforme | Modification paramètres (commissions, seuils) | Modification en cours de transaction active → application uniquement aux nouvelles transactions, jamais rétroactive |

---

## 7. Modules applicatifs

1. Identité & Authentification
2. KYC / KYB
3. Catalogue & Fiche Produit
4. Authentification Produit (Curation)
5. Paiements Pi
6. Escrow
7. Commandes
8. Logistique / Livraison (nationale et internationale)
9. Messagerie
10. Avis & Réputation
11. Litiges
12. Back-office Administration
13. Notifications
14. Recherche & Découverte *(V1/V2)*
15. Analytics & Reporting
16. Contenu éditorial / Boutique Partenaire *(V1/V2)*
17. Gestion des commissions & facturation

---

## 8. Écrans (inventaire UX complet)

### Côté Acheteur / Visiteur
Accueil, Catalogue avec filtres, Fiche produit, Messagerie, Checkout/récapitulatif, Paiement Pi, Suivi de commande, Historique des commandes, KYC acheteur, Confirmation de réception / ouverture litige, Formulaire d'avis, Profil utilisateur, Centre de notifications.

### Côté Vendeur
Tableau de bord, KYC/KYB, Création de fiche produit, Suivi de soumission pour authentification, Liste des produits par statut, Détail commande reçue, Saisie tracking/expédition, Messagerie, Réputation/avis reçus, Page boutique officielle *(V1/V2)*, Statistiques de vente *(V1/V2)*.

### Côté Expert Authentificateur
File de travail par catégorie, Écran de revue détaillée, Formulaire de décision motivée, Historique des décisions.

### Côté Modérateur
File des litiges, Détail d'un litige (preuves, messages, tracking), Formulaire de décision/proposition, File KYC/KYB niveau 1.

### Côté Administrateur
Tableau de bord global, Gestion utilisateurs, Gestion produits, Reporting financier, Configuration plateforme (commissions, seuils), Gestion litiges niveau 2, Gestion maisons partenaires *(V1/V2)*, Journal d'audit (logs des actions sensibles).

---

## 9. Règles métier transverses

- Aucun produit visible sans validation d'un expert authentificateur.
- Aucun fonds versé au vendeur avant confirmation de réception ou expiration du délai de contestation.
- Aucune vente possible sans KYC/KYB au statut "validé".
- Un litige ouvert bloque systématiquement la libération des fonds, sans exception.
- Un avis ne peut être laissé que sur une commande clôturée.
- Toute décision impactant la confiance (authentification, litige, KYC) est historisée (qui, quand, motif).
- Le prix par défaut est en devise fiat de référence ; l'équivalent Pi est figé uniquement au moment du paiement, dans une fenêtre limitée.
- Toute modification de paramètre plateforme (commission, seuils) s'applique uniquement aux nouvelles transactions, jamais rétroactivement à une commande déjà engagée.

---

## 10. Processus détaillé : Publication d'un produit

### Étapes
1. **Initiation** : le vendeur (KYC/KYB validé) accède au formulaire de création.
2. **Saisie des informations obligatoires** : catégorie, sous-catégorie, marque (si applicable), état (neuf/occasion/vintage), description, prix fiat de référence.
3. **Upload des médias** : nombre minimum de photos requis (ex. 6, sous tous les angles), format et poids encadrés, vidéo optionnelle mais recommandée pour les objets de très haute valeur.
4. **Preuves d'authenticité disponibles** : certificat existant, facture d'origine, numéro de série — upload optionnel mais fortement recommandé (accélère la validation experte).
5. **Prévisualisation** : le vendeur voit un rendu de la fiche telle qu'elle apparaîtra une fois publiée.
6. **Soumission** : passage du statut `brouillon` à `soumis pour vérification`.
7. **Revue experte** : voir section 14.2.
8. **Publication** : passage au statut `publié`, visible dans le catalogue et les résultats de recherche.
9. **Cycle de vie ultérieur** : `réservé` (en cours d'achat) → `vendu`, ou `retiré` (retrait volontaire du vendeur, sous condition qu'aucune commande ne soit en cours).

### Règles métier spécifiques
- Un produit ne peut pas être modifié une fois soumis tant que la décision experte n'est pas rendue (pour garantir que ce qui est vérifié correspond à ce qui sera publié).
- Après publication, une modification substantielle (photo principale, description du produit, prix — au-delà d'un seuil de variation à définir) redéclenche une revue.
- Un produit réservé (achat en cours) ne peut pas être retiré par le vendeur tant que la commande n'est pas clôturée ou annulée.

### Cas d'erreur
- Champs obligatoires manquants → blocage de la soumission avec indication précise des champs concernés.
- Nombre de photos insuffisant → blocage avec message explicite.
- Prix incohérent (ex. à zéro ou négatif) → validation de saisie.
- Soumission en double du même produit (détection de doublon potentiel) → alerte au vendeur, éventuelle fusion ou clarification demandée.
- Produit rejeté par l'expert → notification motivée, retour au statut `brouillon` modifiable.

---

## 11. Processus détaillé : Paiement en Pi

### Étapes
1. **Récapitulatif de commande** : affichage du prix fiat de référence et de l'équivalent Pi calculé au taux courant, avec mention explicite de la durée de validité de ce taux (fenêtre de verrouillage, ex. 5–10 minutes).
2. **Vérification des prérequis** : KYC acheteur suffisant pour le montant concerné, produit toujours disponible (non réservé par un tiers entretemps).
3. **Initiation du paiement** : appel `Pi.createPayment` côté client avec les métadonnées de la commande (identifiant interne, montant, mémo).
4. **Approbation utilisateur** : confirmation dans l'interface Pi Wallet par l'acheteur.
5. **Callback d'approbation serveur** : TopLuxe reçoit la confirmation d'approbation, réserve la commande (statut `paiement en attente`).
6. **Complétion** : une fois la transaction confirmée sur le réseau Pi, TopLuxe appelle la complétion (`complete`) ; la commande passe au statut `payée (escrow)`.
7. **Placement en escrow** : les fonds sont conservés sur le compte applicatif TopLuxe jusqu'à la libération (voir processus Réception, section 13).
8. **Journalisation** : chaque étape est historisée avec horodatage, identifiants de transaction Pi, statut.

### Règles métier spécifiques
- Le taux de conversion Pi/fiat appliqué est celui verrouillé au moment de l'initiation, pas celui du moment de la complétion (pour éviter toute contestation liée à la volatilité).
- Si la fenêtre de verrouillage expire avant complétion, la transaction est annulée et l'utilisateur doit relancer le paiement avec un taux réactualisé.
- Un produit est temporairement "réservé" dès l'initiation du paiement, pour éviter qu'un autre acheteur ne l'achète en parallèle ; la réservation expire si le paiement n'aboutit pas dans un délai défini.

### Cas d'erreur
- **Paiement annulé par l'utilisateur** (dans le wallet Pi) → commande annulée, produit libéré immédiatement pour d'autres acheteurs.
- **Solde Pi insuffisant** → message d'erreur natif du wallet Pi, commande non créée.
- **Timeout réseau Pi** (confirmation blockchain lente) → statut intermédiaire "en attente de confirmation", notification différée, pas d'annulation immédiate.
- **Échec de la complétion côté serveur malgré une approbation utilisateur réussie** → cas critique nécessitant une procédure de réconciliation manuelle (alerte automatique à l'équipe technique/admin, remboursement ou nouvelle tentative de complétion selon l'état réel côté Pi).
- **Fenêtre de taux expirée** → blocage avec message invitant à recommencer, nouveau taux affiché.
- **Double tentative de paiement sur la même commande** → verrouillage pour éviter tout double débit, un seul paiement actif autorisé par commande à la fois.

---

## 12. Processus détaillé : Livraison nationale et internationale

### Livraison nationale
- Choix parmi une liste de transporteurs partenaires validés (standards pour les biens de valeur modérée, spécialisés/assurés au-delà d'un seuil défini).
- Numéro de suivi obligatoire, saisi par le vendeur.
- Signature à la réception recommandée, obligatoire au-delà d'un seuil de valeur.
- Délai indicatif affiché à l'acheteur selon le transporteur choisi.

### Livraison internationale
- Contraintes supplémentaires à anticiper : douane, taxes et droits d'importation potentiellement à la charge de l'acheteur (à clarifier explicitement avant achat pour éviter toute mauvaise surprise), documentation douanière (facture, déclaration de valeur).
- Restrictions possibles selon la catégorie de produit et les pays concernés (ex. certains matériaux réglementés en joaillerie, pièces automobiles avec restrictions d'export/import, œuvres d'art avec potentielles restrictions patrimoniales).
- Transporteurs internationaux spécialisés dans le transport de valeur obligatoires au-delà d'un certain montant, avec assurance couvrant la valeur déclarée du bien.
- Délais affichés comme des estimations, avec marge plus large que pour le national.

### Règles métier spécifiques
- La disponibilité de la livraison internationale peut être limitée par le vendeur lui-même (choix de ne vendre qu'au niveau national) ou par la plateforme (restriction réglementaire sur certaines catégories/pays).
- Le calcul des frais de livraison (à la charge de qui : acheteur, vendeur, ou inclus dans le prix) doit être clarifié et affiché avant achat — **point à trancher avec vous**.
- Toute expédition internationale de bien de très haute valeur devrait faire l'objet d'une assurance obligatoire, potentiellement intégrée aux frais de la commande plutôt que laissée en option.

### Cas d'erreur
- Adresse de livraison incomplète/invalide → blocage à la validation du formulaire.
- Pays de livraison non couvert par les transporteurs partenaires disponibles → message explicite avant même la validation de la commande.
- Colis perdu en transit → procédure de litige avec le transporteur, remboursement de l'acheteur pris en charge selon les termes de l'assurance transport.
- Retenue en douane prolongée → notification proactive, gestion différenciée du délai de confirmation de réception (ne pas pénaliser le vendeur pour un blocage hors de son contrôle).

---

## 13. Processus détaillé : Réception

### Étapes
1. Le transporteur livre le colis, mise à jour automatique ou manuelle du statut "livré" (selon intégration avec le transporteur — niveau d'automatisation à définir en architecture).
2. L'acheteur reçoit une notification l'invitant à confirmer la bonne réception.
3. **Confirmation explicite** par l'acheteur (produit conforme) → déclenchement immédiat du processus de libération des fonds.
4. **Absence d'action** de l'acheteur après un délai défini (ex. 7 jours après le statut "livré") → confirmation automatique par défaut, sauf litige ouvert entretemps.
5. **Contestation** par l'acheteur (produit non conforme, endommagé, non reçu malgré statut "livré") → ouverture d'un litige, blocage de la libération des fonds.

### Règles métier spécifiques
- Le délai de confirmation automatique doit être suffisamment long pour permettre une inspection réelle du bien (les objets de luxe méritent un temps d'examen supérieur à un e-commerce standard) — délai proposé à valider avec vous (ex. 5 à 10 jours).
- Une contestation ne peut être ouverte qu'une fois le statut "livré" atteint (ou en cas d'absence de livraison malgré un délai anormalement dépassé).

### Cas d'erreur
- Statut "livré" déclenché par erreur (transporteur) alors que le colis n'est pas réellement arrivé → procédure de contestation dédiée, priorité de traitement élevée.
- Acheteur injoignable ou inactif après livraison → confirmation automatique après délai, avec traçabilité complète pour se prémunir d'une contestation tardive abusive.
- Litige ouvert après la libération automatique des fonds (contestation tardive) → traité selon une politique de délai de recours à définir (au-delà d'un certain délai, la transaction est considérée définitivement clôturée, sauf cas de fraude avérée).

---

## 14. Processus détaillé : Vérification

### 14.1 KYC (acheteur) / KYC (vendeur particulier) / KYB (vendeur professionnel)

**Étapes** :
1. Déclenchement (première vente pour un vendeur, ou dépassement de seuil pour un acheteur).
2. Collecte des documents : pièce d'identité, preuve d'adresse (KYC) ; documents légaux d'entreprise, représentant légal, coordonnées de règlement (KYB).
3. Transmission au prestataire de vérification (ou file de revue manuelle interne temporaire au MVP).
4. Décision : validé / rejeté (motivé) / informations complémentaires demandées.
5. Notification de l'utilisateur, déblocage des fonctionnalités correspondantes si validé.
6. Revalidation périodique éventuelle (expiration du KYC après une durée définie, en particulier pour le KYB si les documents légaux évoluent).

**Cas d'erreur** :
- Document illisible ou expiré → rejet motivé, resoumission facilitée sans repartir de zéro.
- Discordance entre l'identité déclarée et le document fourni → rejet, éventuel signalement pour revue renforcée.
- Document suspecté falsifié → escalade vers une vérification renforcée (niveau admin), possible suspension préventive du compte le temps de la vérification.

### 14.2 Authentification produit (curation)

**Étapes** :
1. Réception de la soumission dans la file de l'expert compétent (par catégorie).
2. Revue des photos, du numéro de série, des documents fournis.
3. Comparaison avec des références connues (bases de données de marques, historiques de modèles) — modalités précises à définir en architecture (accès à des bases externes, expertise humaine seule, ou combinaison des deux).
4. Décision motivée : validé / rejeté / compléments demandés.
5. Pour les produits à très forte valeur (seuil à définir) : déclenchement optionnel ou obligatoire d'une vérification physique via un point de contrôle partenaire, avant publication définitive.

**Cas d'erreur** :
- Photos insuffisantes pour trancher → demande de compléments précise (angle, gros plan sur un élément spécifique).
- Doute persistant même après compléments → rejet par précaution, possibilité pour le vendeur de fournir une expertise tierce reconnue en complément (à valider comme option).
- Désaccord entre le vendeur et la décision de l'expert → procédure d'appel encadrée, arbitrage par l'administrateur.

---

## 15. Modèles de commission (plusieurs options — à trancher ensemble)

Trois à quatre modèles sont proposés ci-dessous, non exclusifs les uns des autres (une combinaison est possible). Aucun arbitrage n'est fait à ce stade.

### Modèle A — Commission unique simple
- Un taux fixe unique appliqué à toutes les transactions (ex. 10 %), quel que soit le vendeur ou la catégorie.
- **Avantages** : simplicité de compréhension et de mise en œuvre, transparence maximale.
- **Inconvénients** : ne récompense pas les gros vendeurs/maisons partenaires, peut être un frein pour les catégories à très forte valeur (automobile, art) où un taux fixe élevé représente une somme importante en absolu.

### Modèle B — Commission dégressive par palier de valeur
- Taux plus élevé sur les premières tranches de prix, taux réduit au-delà d'un certain montant (ex. 10 % jusqu'à X, puis 5 % au-delà).
- **Avantages** : adapté aux produits de très haute valeur (art, automobile), incite à lister des pièces exceptionnelles sur TopLuxe plutôt qu'ailleurs.
- **Inconvénients** : plus complexe à expliquer, nécessite une communication claire pour éviter toute impression d'opacité.

### Modèle C — Commission différenciée par statut de vendeur
- Taux réduit pour les vendeurs professionnels/maisons partenaires à fort volume (fidélisation), taux standard pour les vendeurs particuliers.
- **Avantages** : aligne les intérêts avec les vendeurs stratégiques (catalogue de qualité, volume régulier), levier de négociation commerciale B2B.
- **Inconvénients** : risque de perception d'iniquité par les vendeurs particuliers si non justifié clairement.

### Modèle D — Commission différenciée par catégorie
- Taux ajusté selon la catégorie (ex. taux plus bas sur l'automobile en valeur absolue élevée, taux standard sur la mode/joaillerie).
- **Avantages** : reflète les marges réelles et les coûts de vérification différents selon la catégorie (une authentification automobile est plus coûteuse qu'une authentification de sac).
- **Inconvénients** : grille tarifaire plus complexe à maintenir et à communiquer.

### Synthèse comparative

| Modèle | Simplicité | Adapté à la diversité des catégories | Incitatif pour vendeurs pro | Risque de complexité perçue |
|---|:---:|:---:|:---:|:---:|
| A — Unique | Élevée | Faible | Faible | Faible |
| B — Dégressif par valeur | Moyenne | Élevé | Moyen | Moyenne |
| C — Différencié par statut vendeur | Moyenne | Faible | Élevé | Moyenne |
| D — Différencié par catégorie | Faible | Élevé | Faible | Élevée |

**Point ouvert pour vous** : ces modèles sont combinables (ex. B + C ensemble). Le choix final dépendra de vos priorités business (simplicité de lancement vs optimisation par catégorie/vendeur) et sera à définir avant l'implémentation du module Commissions & Facturation (section 7, module 17).

---

## 16. Catalogue des cas d'erreur (vue consolidée)

Cette section rassemble, en synthèse transverse, les grandes familles de cas d'erreur déjà détaillées dans les processus ci-dessus, pour faciliter leur reprise lors de la conception technique :

| Catégorie | Exemples | Traitement général |
|---|---|---|
| Erreurs d'authentification / session | Token Pi invalide/expiré, session interrompue | Message clair, reconnexion facilitée |
| Erreurs de disponibilité produit | Produit vendu/retiré entre-temps, double réservation concurrente | Message immédiat, libération/blocage automatique |
| Erreurs de paiement | Solde insuffisant, annulation utilisateur, timeout, échec de complétion serveur | Statuts intermédiaires clairs, procédure de réconciliation pour les cas critiques |
| Erreurs de soumission produit | Champs manquants, photos insuffisantes, doublons | Blocage à la saisie avec message précis |
| Erreurs de vérification (KYC/KYB/produit) | Document illisible, expiré, suspecté falsifié, doute expert | Rejet motivé, resoumission facilitée, escalade si nécessaire |
| Erreurs de livraison | Adresse invalide, pays non couvert, colis perdu, retenue douanière | Blocage préventif ou gestion différenciée du délai |
| Erreurs de réception/litige | Statut "livré" erroné, contestation tardive | Procédure de contestation dédiée, politique de délai de recours |
| Erreurs administratives | Modification de paramètre en cours de transaction | Application non rétroactive systématique |

---

## 17. Exigences de sécurité et de performance

### Sécurité
- Contrôle d'accès basé sur les rôles (RBAC), moindre privilège pour les comptes internes.
- Chiffrement au repos et en transit des documents KYC, accès strictement journalisé.
- Validation stricte côté serveur de chaque étape Pi Payments, protection contre le rejeu et la double validation.
- Anti-fraude : détection de comportements suspects, limitation de débit sur actions sensibles.
- Journalisation complète des actions à impact financier ou sur la confiance.
- Conformité RGPD : minimisation des données, droits d'accès/rectification/suppression effectifs.

### Performance
- Fluidité du catalogue et de la recherche, y compris avec croissance progressive du volume.
- Fiabilité renforcée sur les étapes critiques (paiement, escrow, confirmation de commande).
- Scalabilité progressive alignée sur la feuille de route (section 20).
- Gestion efficace des médias haute définition, avec temps de chargement maîtrisé sur mobile (Pi Browser App).
- Dégradation progressive plutôt que panne totale en cas de pic de charge.

*(Les valeurs chiffrées précises — SLA, temps de réponse en millisecondes, capacité concurrente — seront définies lors de la phase d'architecture technique.)*

---

## 18. Contraintes spécifiques Pi Network

- Intégration Pi SDK obligatoire (authentification, paiements U2A, potentiellement A2U pour remboursements et reversements vendeurs).
- Escrow non natif à Pi Payments à notre connaissance : mécanisme à gérer applicativement (réception sur compte Pi applicatif, reversement A2U après confirmation) — **point à vérifier techniquement en priorité avant de figer l'architecture**.
- Volatilité et taux de conversion : prix affiché en fiat, conversion Pi verrouillée sur une fenêtre courte.
- Dépendance à la Pi Browser App et à ses contraintes UX/techniques propres.
- Respect des Pi Developer Guidelines, sujettes à évolution — veille active nécessaire.
- Nécessité de confirmer l'accès mainnet Pi Payments avant tout lancement commercial réel.

---

## 19. Risques et solutions

| Risque | Impact | Solution |
|---|---|---|
| Contrefaçon malgré la curation | Réputationnel/légal, majeur | Double validation, vérification physique au-delà d'un seuil, remboursement immédiat si avéré |
| Escrow non réalisable tel quel avec Pi Payments actuel | Technique, potentiellement bloquant | Vérification technique prioritaire avant toute autre décision d'architecture |
| Statut réglementaire incertain du Pi | Légal | Conseil juridique par juridiction, veille continue |
| Volatilité du Pi entre panier et paiement | Financier | Verrouillage du taux sur fenêtre courte |
| Litiges non résolus | Opérationnel | Processus de médiation structuré, délais stricts |
| Retard d'expédition vendeur | Opérationnel | Annulation/remboursement automatique, impact réputation |
| Faible traction au lancement | Business | Curation qualitative, partenariats pilotes |
| Fuite de données KYC | Sécurité/légal, critique | Prestataire spécialisé, chiffrement, accès limité |
| Coût de la vérification manuelle | Business | Catalogue restreint au démarrage, automatisation progressive |
| Complications douanières à l'international | Opérationnel | Documentation claire, gestion différenciée des délais de confirmation |
| Évolution des règles Pi Platform | Technique/stratégique | Veille active, architecture backend découplée |

---

## 20. Feuille de route (MVP → V1 → V2)

**MVP** : authentification Pi SDK, KYC/KYB basique (revue manuelle), catalogue restreint, publication produit avec authentification experte, paiement Pi + escrow applicatif, gestion de commande complète, livraison nationale prioritaire (international limité ou en option prudente), messagerie basique, litiges en paliers manuels, back-office minimal, notifications essentielles, un seul modèle de commission simple (Modèle A) pour démarrer.

**V1** : KYC/KYB délégué à un prestataire spécialisé, programme Maison Partenaire, tableau de bord vendeur avancé, livraison internationale structurée avec partenaires dédiés, recherche/filtres avancés, évolution éventuelle vers un modèle de commission différencié (B, C ou D selon arbitrage), reporting enrichi.

**V2** : enchères en Pi, passeport numérique du produit, abonnements vendeur premium, affiliation, extension géographique, potentiel co-investissement encadré (sous réserve stricte de faisabilité réglementaire).

---

## 21. Glossaire

- **Pionnier** : membre de la communauté Pi Network.
- **U2A / A2U** : User-to-App / App-to-User, flux Pi Payments.
- **Escrow** : séquestre des fonds jusqu'à confirmation de bonne exécution.
- **KYC / KYB** : vérification d'identité individuelle / entreprise.
- **Maison partenaire** : vendeur professionnel avec espace de marque dédié.
- **Curation** : sélection et validation qualitative des produits.
- **Fenêtre de verrouillage** : durée pendant laquelle un taux de conversion Pi/fiat reste valable pour une transaction donnée.

---

## 22. Points ouverts nécessitant votre arbitrage

1. Cumul des rôles acheteur/vendeur sur un même compte.
2. Confirmation technique précise du mécanisme d'escrow réalisable avec Pi Payments (A2U).
3. Catégories de lancement prioritaires au MVP.
4. Mode de KYC au MVP (interne temporaire vs prestataire externe dès le lancement).
5. Niveau d'exigence de vérification physique selon la valeur, et partenaires logistiques associés.
6. Juridiction(s) de lancement ciblée(s).
7. **Choix du/des modèle(s) de commission** parmi les options A/B/C/D de la section 15 (ou combinaison).
8. Prise en charge des frais de livraison internationale (acheteur, vendeur, ou inclus) et gestion des taxes douanières.
9. Délai précis de confirmation automatique de réception (proposition indicative 5–10 jours à valider).
10. Niveau d'exigence d'authentification pour les maisons partenaires déjà réputées (processus allégé ou identique).
11. Panier mono-produit ou multi-produits au MVP.
12. Politique de délai de recours pour une contestation tardive après libération automatique des fonds.

---

*Ce document constitue la spécification professionnelle de référence officielle du projet TopLuxe. Aucune ligne de code n'a été produite. La prochaine étape, une fois ce document validé et les points de la section 22 arbitrés (au moins partiellement), consistera à concevoir l'architecture technique détaillée (modèle de données, découpage en services, choix technologiques), puis à la décliner en modules de développement.*
