# Journal des modifications

Toutes les modifications notables de l'application web cliente REFUGE (`immo-web-user`).

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et les numéros de version
suivent [SemVer](https://semver.org/lang/fr/). Chaque version correspond à une étiquette Git
`vX.Y.Z` posée sur `main`. Les identifiants entre parenthèses (`FE-B-006`…) renvoient au rapport
d'audit frontend du 26/09/2026. La procédure de publication est décrite dans le README.

Les versions 0.1.0 à 0.5.0 ont été reconstituées le 27/10/2026 à partir de l'historique Git.

## [Non publié]

### Ajouté
- Brouillon d'annonce : les photos et la vidéo choisies sont conservées dans le navigateur
  (IndexedDB, 7 jours) et retrouvées après une session expirée ou un rechargement ; elles sont
  effacées à la publication, par « Tout effacer » et à la déconnexion (FE-B-002).
- Couche de données TanStack Query (FE-A-004) : cache d'une minute par jeu de paramètres,
  déduplication et annulation des requêtes. Une seule requête de liste à l'ouverture de la
  recherche ; revenir d'une fiche vers l'accueil ou la recherche ne recharge rien pendant la durée
  du cache ; cœurs des favoris partagés entre l'accueil, la recherche et la page Favoris.

### Corrigé
- Tableaux de bord propriétaire et démarcheur rechargés à chaque changement d'espace (BUG-04).
- Un rafraîchissement du jeton qui change les rôles est repris tout de suite par l'interface,
  sans rechargement de page (BUG-05).
- Après une création, une modification, un changement de statut ou une suppression de bien, les
  listes et fiches en cache sont relues ; le cache est vidé à la connexion et à la déconnexion.
- Thème sombre (FE-B-024) : plus aucun contraste insuffisant propre au sombre sur les 62 écrans et
  onglets mesurés par axe-core (110 nœuds au départ : menus des espaces, accents locataire,
  démarcheur et propriétaire, prix et liens, cartes de la recharge et du contrat de bail, badges,
  messagerie). Le thème clair est inchangé au pixel près, sauf le libellé « Espace Locataire »,
  trop pâle en clair aussi, et le dégradé des icônes de rôle de l'espace propriétaire, qui
  s'arrêtait sur du noir à cause d'une fonction qui n'acceptait qu'un code hexadécimal.

## [0.5.0] - 2026-10-27

Fusion de `staging` dans `main` (25/10) : `main` contient désormais tout le travail de l'audit.

### Ajouté
- Date de disponibilité quand un bien est « En finition / Bientôt », saisie à la création et
  affichée sur la fiche.
- Filtre de recherche « Nombre de pièces » unique (chambres + salons, 1 à 4 exact, 5 et plus) et
  total des pièces à la création d'une annonce.
- Journal des modifications, étiquettes de version et contrôle en CI qu'une entrée existe pour la
  version de `package.json` (FE-F-007).
- Les erreurs Sentry portent la version du build : `VITE_RELEASE`, sinon
  `immo-web-user@<version>` suivi du commit sur Vercel.

### Corrigé
- Recherche vide dès qu'on filtrait le nombre de pièces.
- « Tout supprimer » des favoris : la liste n'est rechargée qu'après la fin de toutes les
  suppressions ; un échec partiel n'affiche plus de favoris déjà supprimés (FE-B-011).
- Alerte non lue du locataire : vrai bouton, annoncée « Non lue » sans masquer la date (FE-C-002).

## [0.4.0] - 2026-10-22

Lot « 3 à 12 mois » de l'audit.

### Ajouté
- Écran de repli par route en cas d'erreur de rendu, avec « Réessayer » et « Retour à
  l'accueil » (FE-A-005).
- Tests de bout en bout Playwright des parcours critiques, exécutés dans un job CI dédié
  (FE-F-003), et hook de pré-commit (`npm run check`).
- Règles d'accessibilité jsx-a11y bloquantes en CI, exceptions commentées (FE-A-007).
- Message clair et « Réessayer » sur 33 écrans de chargement ; bandeau quand un rafraîchissement
  échoue, la liste déjà affichée reste visible (FE-B-001, FE-B-011).

### Modifié
- Inscription web réservée aux comptes propriétaires (variable
  `VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT`).
- TypeScript en mode strict, plus aucun `any` explicite, appels d'API typés d'après les réponses
  du backend ; contrôle `check:any` en CI (FE-A-003).
- Huit pages de 866 à 1649 lignes découpées en hooks, sections et modules ; plus aucun fichier
  au-dessus de 750 lignes (FE-A-002).
- Toutes les modales passent par `ModalSheet` (focus piégé, Échap, retour du focus) ; menus du
  chat accessibles au clavier (FE-C-005).
- Couleurs écrites en dur : de 949 à 223, au profit de variables du thème (`--c-*`, `--p-*`,
  `--tx-*`) ; contrôle `check:colors` en CI (FE-B-017, FE-B-024).

### Corrigé
- Paiement du loyer : le suivi interroge la vraie référence de transaction ; lien invalide et
  délai dépassé signalés.
- Alertes du locataire lues correctement, avec « Tout marquer comme lu ».
- Contre-proposition du démarcheur envoyée par l'API, avec ses erreurs affichées.
- Retrait refusé dès la saisie sous 500 FCFA ; l'inscription ramène à la page d'origine.
- Réservation sans bien chargé : la visite n'est plus annoncée gratuite à tort.

### Supprimé
- Ancien tableau de bord analytique du propriétaire et autres codes morts (FE-A-006).

## [0.3.0] - 2026-10-16

Lots « avant lancement » et « 0 à 3 mois » de l'audit.

### Ajouté
- Appareil de confiance, session persistante et OTP sur les actions sensibles.
- Recherche paginée avec total et « Afficher plus », filtres envoyés au serveur (FE-D-005,
  FE-B-009).
- Police auto-hébergée (FE-D-003), Sentry et mesure des Web Vitals (FE-F-004), budget de taille
  du paquet en CI (FE-D-001).
- Récapitulatif de confirmation de visite ; quartier tapé en toutes lettres reconnu (FE-B-018,
  FE-B-010).

### Modifié
- Accessibilité : cartes en vrais liens, boutons nommés, focus visible, un titre h1 par écran,
  annonce des changements de page, carrousels avec pause (FE-C-002 à FE-C-009).
- Téléphones toujours au format +229 ; historique « payé » ou « reçu » selon le payeur
  (FE-B-013, FE-B-007).
- « Agent » devient « Démarcheur » ; score de crédibilité expliqué (FE-B-020, FE-B-022).
- Invite aux notifications une fois par session, au bon moment (FE-B-016).

### Corrigé
- Une panne de l'API n'est plus présentée comme « Aucun bien trouvé » (FE-B-001).
- Double paiement : clé d'idempotence, reprise du suivi, protection contre les doubles clics
  (FE-B-006).
- Visite gratuite explicite et barème 500 / 5 000 FCFA (FE-B-012).
- Session expirée : message, retour à la page d'origine et brouillon d'annonce conservé
  (FE-B-002).

### Supprimé
- Onglet « Créneaux » des tableaux de bord, branché sur des routes absentes (FE-A-001).

## [0.2.0] - 2026-10-09

Premières corrections de l'audit (équipe, 24/09 au 01/10) et refonte des lots 1 à 3.

### Ajouté
- Mot de passe oublié (OTP puis nouveau mot de passe).
- Pages Mentions légales et Politique de confidentialité, à faire valider (FE-B-003).
- SEO, aperçu sur les réseaux sociaux, consentement aux cookies, mesure d'audience Umami.
- Anti-spam sur l'inscription (champ piège invisible, délai minimal de 3 s).
- Manifeste PWA et cache hors ligne du service worker.
- En-têtes de sécurité et CSP dans `vercel.json` (FE-E-004), vérification des liens en CI.

### Modifié
- Navigation mobile à 5 entrées, thème dans les paramètres, espaces par rôle adaptés au mobile et
  au thème sombre (FE-B-019).
- Découpage du tableau de bord propriétaire, URL d'API centralisée dans `apiBase.ts`
  (FE-A-006, FE-F-006).
- Chargement des pages à la demande, sondage ralenti et suspendu onglet inactif, `socket.io`
  chargé à la demande (FE-D-001, FE-D-004).
- Images allégées, photos compressées avant envoi (FE-D-002).
- Boîtes `confirm()` / `alert()` remplacées par des messages dans la page (FE-B-021).

### Corrigé
- Zoom de nouveau autorisé (FE-C-001) ; contrastes WCAG AA (FE-C-004).
- Badges d'alertes et de messages ; teintes de statut en thème sombre.
- Recherche cassée au-delà de 100 résultats.
- Déconnexion : révocation de la session et désabonnement des notifications push (FE-E-003).

### Sécurité
- Suppression du contournement OTP côté client (FE-E-001).
- Liste blanche des URL de paiement (FE-E-008).

## [0.1.0] - 2026-09-09

État audité : commit `9b1515d`, référence du rapport d'audit frontend du 26/09/2026.

[Non publié]: https://github.com/le-refuge-tic/immo-web-user/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/le-refuge-tic/immo-web-user/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/le-refuge-tic/immo-web-user/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/le-refuge-tic/immo-web-user/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/le-refuge-tic/immo-web-user/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/le-refuge-tic/immo-web-user/releases/tag/v0.1.0
