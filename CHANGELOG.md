# Journal des modifications

Toutes les modifications notables de l'application web cliente REFUGE (`immo-web-user`).

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et les numéros de version
suivent [SemVer](https://semver.org/lang/fr/). Chaque version correspond à une étiquette Git
`vX.Y.Z` posée sur `main`. Les identifiants entre parenthèses (`FE-B-006`…) renvoient au rapport
d'audit frontend du 26/09/2026. La procédure de publication est décrite dans le README.

Les versions 0.1.0 à 0.5.0 ont été reconstituées le 27/10/2026 à partir de l'historique Git.

## [Non publié]

### Ajouté (lot 12 — favori sur la fiche)
- Bouton « Ajouter aux favoris » / « Retirer des favoris » sur la fiche d'un bien : sur la photo (téléphone et bureau) et dans la barre d'actions du bas sur téléphone. Il utilise la même liste de favoris que les cartes et la page Favoris (cache React Query) : un clic met tout à jour, sans rechargement.
- Toasts « Ajouté aux favoris » / « Retiré des favoris » ; en cas d'échec, « Favori non enregistré. Réessayez. » et le bouton garde son état réel.
- Hors connexion, le bouton mène à la connexion puis ramène sur la fiche. Masqué pour le propriétaire du bien.

### Ajouté (lot 11 — prix cash des terrains)
- Terrain en vente : deux prix clairement libellés dans « Nouveau bien » et dans la modification — « Prix normal (paiement échelonné) », obligatoire, et « Prix si paiement cash », facultatif, qui doit être inférieur au prix normal (au moins 100 F). La réduction s'affiche en direct (« soit −12 % / −300 000 F »).
- Récapitulatif de création (qui n'affichait aucun prix pour un terrain) et fiche du bien : le prix normal et le prix cash s'affichent côte à côte, sans prix barré ni badge « PROMO » (ce n'est pas une offre limitée dans le temps).
- Tri et filtres de recherche : toujours sur le prix normal.
- Dépend du backend (colonne `prix_cash`, migration 1787880000000).

### Corrigé (CI)
- Budget de chargement initial : la page de connexion/inscription (qui embarque zod, framer-motion et ses
  images) est chargée à la demande comme les autres pages lourdes. JS initial : 221 Ko → 164 Ko (budget 200 Ko).
- e2e messagerie : les deux tests supposaient que le chat ouvre « Infos du contact » ; depuis le 04/11 seul le
  personnel y a accès (`estCompteStaff`). Les tests vérifient maintenant la règle réelle.

### Corrigé (recette du 19/11)
- Fiche d'un bien du propriétaire et assistant « Nouveau bien » : en thème sombre, les textes clairs
  s'affichaient sur des cartes blanches (illisibles). Ces deux pages suivent maintenant le thème,
  comme le tableau de bord.
- « Nouveau bien », champ Quartier : les suggestions ne se sélectionnaient pas au toucher (le champ
  perdait le focus avant le clic). Sélection au `click`, focus conservé.

### Ajouté (lot 10 — visites)
- **« Créneau expiré »** : une visite en attente ou contre-proposée dont le créneau est passé affiche un badge « Créneau expiré » et une phrase claire (« Le propriétaire n'a pas répondu avant le créneau »). Elle propose « Proposer un nouveau créneau » ou « Contacter le support », sans bouton Annuler ni paiement. Un onglet « Expirées » existe côté client (Mes visites) et côté propriétaire (Réservations). Avant, la carte indiquait encore « Souhaitée : … », puis passait d'un coup en « Échouée ».
  - Un propriétaire voit le même état avec la phrase « Vous n'avez pas répondu avant le créneau demandé ».
  - Le serveur envoie aussi une alerte « Créneau expiré » aux deux parties, une seule fois.
- **Frais de visite présentés comme une promotion** : 500 F s'affichent avec le prix normal barré (1 000 FCFA) et la mention « Tarif promotionnel » (ou « Offre de lancement jusqu'au JJ/MM » si une date de fin est fixée) :
  - fiche du bien (bouton « Réserver une visite »), page de réservation, confirmation, paiement de la visite, carte de visite et reçu.
  - Seul le tarif par défaut est une promotion : un bien aux frais personnalisés ou une visite gratuite s'affichent tels quels.
  - Si le tarif est indisponible, les montants s'affichent simplement, sans mention.

### Modifié (lot 10)
- Une visite non confirmée au créneau passé n'est plus « Échouée » : « Échouée » reste réservé aux visites confirmées qui n'ont pas eu lieu.

### Modifié (lot 13 — rôles)
- **Rôle démarcheur supprimé du site** (décision du 17/11) :
  - l'espace `/demarcheur` et ses onglets, la délégation à un démarcheur (déjà masquée) et leurs API ont été retirés ;
  - un ancien lien `/demarcheur` ramène à l'accueil ;
  - plus aucun écran ne cite le démarcheur : rôles, navigation, notifications, inscription, textes publics. Dans la messagerie, un ancien compte démarcheur s'affiche comme « Agent immobilier ».
- Un compte qui a encore le rôle démarcheur arrive sur son rôle principal, ou sur propriétaire, ou sinon sur prospect. Rien n'est modifié en base.
- **Écrans de rôles** (onglet propriétaire et « Espaces & rôles ») : ils appliquent les règles du backend et du mobile (`src/utils/roles.ts`, testé). Prospect et Propriétaire s'activent ; Locataire s'obtient avec « Rejoindre un bien ». Un propriétaire peut maintenant activer Prospect ; avant, il ne pouvait activer que Démarcheur.
- **Désactiver un rôle** passe par une boîte de dialogue de confirmation.
- **Publication par un propriétaire** : les champs réservés au démarcheur (frais de visite, commission d'agence) ont disparu. Ils n'étaient de toute façon jamais affichés à un propriétaire.

### Corrigé (lot 13)
- Réservations du propriétaire : l'erreur d'une action (confirmation, visite effectuée, chat, autre créneau) s'affiche dans la fenêtre de détail. Avant, elle restait cachée derrière la fenêtre. Le bandeau est aussi annoncé aux lecteurs d'écran (`role="alert"`).
### Corrigé (audit de la recette staging, lot 3)
- Conversations (téléphone) : la barre du bas est masquée dans un fil de discussion (elle recouvrait la zone de saisie) ; en-tête de la liste sans l'espace vide de 156 px ; la liste défile.
- Publication : étape « Détails & frais » (ex-« Honoraires »), titres liés à leurs champs, combobox ARIA et clavier sur Quartier, « Tout effacer » avec confirmation, coche en icône.
- Rôles : notification après activation et désactivation.
- Mes biens : liste relue à la fin d'un envoi de photos ; carte avec « Reprendre l'envoi » pour un envoi interrompu ou en échec ; plus d'avertissement « 0 photo » pendant l'envoi.
- Contrastes : badge Guesthouse, onglets inactifs de Mes visites (sombre), chiffres du profil.
- Édition d'un bien : prix sans décimales, frais de visite identiques à la fiche (500 F par défaut), description étiquetée ; budget min/max et lieu étiquetés dans la recherche.
- Réservations du propriétaire : « Marquer effectuée » seulement une fois les frais payés.
- Filtres mobiles : dialogue ARIA, Échap ; bouton Retirer désactivé expliqué.
- CSP : `connect-src` limité à l'API configurée (+ WebSocket, Umami, Sentry) via une balise ajoutée au build. `'unsafe-inline'` des styles est conservé : les attributs `style` de React en dépendent.

### Corrigé (audit de la recette staging, suite)
- Bandeau cookies : Échap le ferme sans enregistrer de choix, et il ne revient pas à chaque page de la session.
- Profil : « Donner mon avis » devient « Évaluer mes visites » (l'avis se donne visite par visite).
- Portefeuille épargne : « Recharger mon épargne » (comme la page de rechargement) ; numéro Mobile Money à 16 px.

### Corrigé (audit de la recette staging)
- Recherche et fiche d'un bien : une seule mise en page est montée (liste et adresse n'apparaissent plus en double dans la page).
- Tri par prix : les biens sont regroupés par unité (mois, nuit, heure, vente) puis triés dans chaque groupe ; « Légèrement hors budget » et « Autres biens » sont triés aussi.
- Conversations : le dernier échange (créneau de visite compris) et son heure s'affichent ; plus de « Nouvelle conversation » à tort ; icône à la place de l'emoji 🏠.
- Publication d'un bien : l'écran défile jusqu'au champ fautif (prix, quartier, photos) et le surligne ; bandeau d'erreur plus contrasté.
- Contrastes (bandeaux d'erreur, « Retour », « Renvoyer dans Xs »), zones tactiles de 44 px (navigation, filtres, compteurs, points du carrousel), champs à 16 px sur mobile (zoom iOS).
- Connexion : la diapositive de marque ne chevauche plus le logo et l'accroche du panneau.
- Cartes : hauteur uniforme, « à louer / à vendre » retiré du titre (le badge suffit).
- Libellés : « Publier un bien » partout ; Guesthouse et Salle de fêtes dans le choix du type.
- Espace propriétaire : réservations et indicateurs ne comptent plus les visites faites en tant que visiteur (`GET /visites?role=gestionnaire`) ; « — vs mois dernier » quand le mois précédent est à 0.
- Portefeuille : plus d'erreur au premier chargement (création simultanée du wallet côté backend).
- Menu profil : l'espace courant (et non « Prospect ») ; les cartes de /mes-roles gardent leur place.
- Mot de passe : œil afficher / masquer dans Sécurité, retrait et vérification du téléphone.
- Mobile : « Voir tout » et boutons de tri à 44 px ; prix de la visite toujours en « FCFA ».
- Mot de passe oublié : format du numéro vérifié avant envoi ; message neutre (« Si ce numéro existe… »).

### Ajouté (lot 15 — validation des formulaires)
- Champs communs (`src/shared/saisie`, identiques dans l'administration) :
  - `NumberInput` et `MoneyInput` : chiffres seulement, à la frappe comme au collage ; milliers affichés (« 150 000 ») ;
  - `PhoneInput` : 10 chiffres commençant par 01, indicatif collé retiré ;
  - `EmailInput`, `TexteInput`, `DateInput`.
- Les 16 `<input type="number">` et les 9 champs téléphone de l'application utilisent ces composants. Avant, ils acceptaient « e », « - », le collage de texte ou un numéro trop long.
- Schémas zod (`src/validation/schemas.ts`, testés) pour l'inscription, la connexion, le profil, la modification rapide d'un bien, le bien en gestion, le rechargement et les numéros Mobile Money.
- Modification rapide d'un bien : les erreurs s'affichent sous chaque champ et le focus va au premier champ en erreur.
- `npm run check:inputs` (dans `npm run check`) refuse tout nouveau champ numérique ou téléphone brut.
- Inventaire champ par champ dans `docs/VALIDATION_FORMULAIRES.md`.

### Corrigé (lot 15)
- Un retrait au-delà du solde n'est plus bloqué en silence à la frappe : le message habituel s'affiche sous le champ.
- La connexion refuse un numéro béninois de mauvaise longueur avant d'appeler le serveur.

### Modifié (lot 9 — accueil mobile et tablette)
- Accueil sur téléphone et tablette : en-tête compact (logo, salutation, avatar) aux couleurs du
  thème (fini le fond `#0a0a0a`), image adoucie par un dégradé léger et recherche arrondie
  flottante ; segment Louer/Acheter puis catégories ; « Récemment ajoutés » en cartes larges ;
  grille ; services et pied de page désormais visibles sous 768 px.
- Tablette (768–1024 px) : mise en page dédiée (hero réduit, grille de 2 colonnes, marges `px-6`,
  carrousel visible) ; la version bureau seulement à partir de 1024 px.
- Barre de navigation du bas : sa hauteur réelle (zone sûre comprise) est publiée dans
  `--bottom-nav-h`, utilisée par le bas du contenu, les toasts, l'indicateur d'envoi, l'invitation
  aux notifications et le bouton de l'application ; masquée pendant la publication et l'édition
  plein écran et quand le clavier est ouvert.

### Corrigé (lot 9)
- Le bas des pages, les toasts et certaines modales passaient sous la barre du bas
  (`--bottom-nav-h` utilisée mais jamais définie ; modales au même niveau que la barre).
- Barre du haut à 1024 px : le logo chevauchait le lien « Accueil ».

### Ajouté (lot 9)
- Parcours Playwright `captures-accueil` : captures 360×640, 390×844, 768×1024, 1024×1366 (et
  sombre), aucun contenu sous la barre du bas, barre absente des formulaires plein écran.
  Captures dans `docs/captures/lot9/`.

### Ajouté (lot 8 — notifications)
- Tableau des notifications dans le README (à compléter à chaque fonctionnalité).
- Décision sur une annonce (approuvée, rejetée, sous conditions, retirée, modification approuvée
  ou refusée, type changé) : toast immédiat si la personne est connectée ; ces alertes ont leur
  icône et ouvrent le bien (`src/utils/typesAlertes.ts`, liste commune aux trois écrans).

### Corrigé (lot 8)
- La fiche d'un bien non publié (en attente, rejeté, retiré) affichait « Bien introuvable » à son
  propriétaire : elle se charge désormais par la route du propriétaire.

### Ajouté (lot 7 — modération)
- « Mes biens » : une annonce en attente indique ce qui manque pour être publiée (photos du bien
  et des pièces, minimum du référentiel), le motif d'un retrait de publication et les conditions
  d'une publication conditionnelle.
- `src/shared/biens/approbation.ts` (partagé) : un seul comptage des photos, comme l'API.
- Parcours Playwright `moderation-proprietaire`.

### Ajouté (lot 6 — brouillons sur tous les appareils)
- Brouillons de publication (bien, guesthouse, salle de fêtes) gardés sur le serveur
  (`/brouillons-biens`) : repris sur un autre appareil, la saisie la plus récente l'emporte, une
  suppression vaut partout. Le navigateur sert de cache hors ligne ; les photos restent sur
  l'appareil où elles ont été choisies. Synchronisation : `src/shared/brouillons` (partagé).
- « Mes biens » : section « Brouillons » (libellé, type, étape, date ; Reprendre, Supprimer avec
  confirmation).
- Parcours Playwright `brouillons-serveur`.
- Formulaire ouvert pendant qu'une version plus récente arrive d'un autre appareil : rien n'est
  écrasé, bandeau « Charger cette version » / « Garder ma saisie ».

### Modifié (lot 6)
- Le formulaire classique rouvre à l'étape atteinte ; son brouillon n'est plus re-daté chaque
  seconde sans changement.
- Brouillons guesthouse / salle propres au compte (`rg_draft_<type>_<id>`, l'ancienne clé commune
  est reprise une fois) et effacés à la déconnexion comme les autres.

### Ajouté (lot 5 — modification des biens)
- Guesthouse et salle de fêtes se modifient avec le formulaire de création
  (`/proprietaire/biens/:id/modifier`) : mêmes étapes, champs, règles et totaux.
- Gestion des photos d'un bien existant (guesthouse, salle et bien classique) : photo principale,
  suppression confirmée, ajout par le gestionnaire d'envois en arrière-plan. Un bien publié garde le
  minimum de photos de son type (refus de l'API affiché).
- Parcours Playwright `modification-proprietaire` (envoi en validation, sortie sans enregistrer,
  photos).

### Modifié (lot 5)
- Un bien publié n'est plus bloqué : la modification part en validation (« Envoyer en
  validation »), l'annonce actuelle reste en ligne ; bandeau tant qu'elle attend.
- « Enregistrer » inactif tant que rien n'a changé ; « Quitter sans enregistrer ? » avant de perdre
  une saisie ; succès et erreurs en notification, avec le message du serveur.

### Ajouté (lot 4 — mêmes formulaires pour tous)
- Le propriétaire publie une **guesthouse** et une **salle de fêtes** (`/nouveau-bien/guesthouse`,
  `/nouveau-bien/salle-fete`), ouvertes depuis « Court séjour » et « Événementiel » du choix du type
  (après confirmation). Mêmes étapes, champs, règles, totaux et récapitulatif que le commercial :
  logique partagée dans `src/shared/biens/formulaires`. Le bloc « Propriétaire » est celui du compte
  connecté, en lecture seule ; sans téléphone dans le profil, la publication est bloquée avec un
  lien vers le profil. 4 photos minimum (référentiel), envoi en arrière-plan.
- Parcours Playwright `proprietaire-guesthouse` (blocage sans téléphone, publication complète,
  salle de fêtes).

### Modifié
- « Ajouter un bien en gestion » : types du référentiel et sélecteur en deux temps ; précise que
  ce bien privé n'a pas besoin de photos (il n'est jamais public, backend).
- La commission d'agence n'est plus calculée par le navigateur : le serveur la fixe (lot 4).

### Ajouté (lot 2 — référentiel des types)
- Référentiel unique des types de biens (`src/shared/biens/referentielTypes.ts`, copie de
  `GET /referentiels/types-biens`) : catégories (résidentiel, terrain, commercial, court séjour,
  événementiel) puis sous-types, avec type et sous-type en base, transactions, photos minimum.
- « Nouveau bien » : choix du type en deux temps, catégorie en grandes cartes puis sous-type en
  puces. Nouveaux sous-types : duplex / grande propriété (meublable) et local commercial / showroom.
- Accueil : la transaction (Tous · À louer · À vendre) et le type de bien sont sur deux lignes
  distinctes. « Appartement » couvre les appartements vides et meublés ; nouveaux filtres
  « Chambre-salon » et « Commerce » ; « Maison / Villa » n'inclut plus les locaux commerciaux.

### Ajouté (lot 1 — socle)
- Envoi des photos en arrière-plan : après « Publier le bien », retour immédiat à « Mes biens » ;
  la couverture part d'abord, puis 2 photos en parallèle, puis la vidéo, avec 2 réessais
  automatiques. Un indicateur suit l'envoi sur toutes les pages, la fermeture de l'onglet est
  signalée, et un envoi interrompu par un rechargement est proposé à la reprise (fichiers gardés
  dans IndexedDB, effacés à la déconnexion). En cas d'échec : « Réessayer » ou « Compléter les
  photos ». Le bien n'entre en validation qu'avec toutes ses photos (backend).
- Toasts de session (`useToast`) et boîtes de confirmation communes (`useConfirm`,
  `src/shared/dialogues`) ; `npm run check:no-native-dialogs` refuse `window.confirm`, `alert`
  et `prompt`.

### Corrigé
- Étape « Honoraires » de « Nouveau bien » : une réponse inattendue de `/configuration/frais-visite`
  (corps vide, autre format) faisait planter l'étape (`toLocaleString` sur `undefined`) ; le tarif
  standard s'affiche désormais.
- Publication sans fichier : un toast confirme l'enregistrement et rappelle d'ajouter des photos.
- Photos envoyées avec une clé d'idempotence (`cle_envoi`) : une reprise après rechargement ne crée
  plus de doublon.

### Tests
- Nouveau parcours Playwright `envois-arriere-plan` : retour immédiat, indicateur, avertissement à la
  fermeture, reprise après rechargement sans doublon, « Ignorer ».
- Parcours de publication, brouillon et vidéo remis à jour (2 photos minimum, 8 au maximum, bouton
  « Déconnexion », suivi des envois) : ils échouaient déjà sur staging.

### Maintenance
- `npm run check` repasse au vert : les 40 avertissements de lint sont corrigés (variables
  inutilisées ; constantes et hooks sortis des fichiers de composants : `tabs/outils.ts`,
  `tabs/navigation.tsx`, `context/useAuth.ts`…) et le plafond passe de 26 à 0 avertissement.

### Supprimé
- Écran « Bien soumis ! » avec « Réessayer l'envoi » : remplacé par le suivi des envois.

### Sécurité
- Les comptes de l'équipe Refuge (admin, super admin, commercial) ne peuvent plus ouvrir de session
  sur le site : la connexion envoie `espace: 'public'` et le serveur les refuse (403) ; une session
  staff déjà présente dans le navigateur est fermée au chargement.

### Ajouté
- Salles de fêtes : nouveau type de bien loué à l'heure. La carte affiche « 45 000 FCFA / 8 h · 300
  personnes », la fiche détaille tarif, capacité, événements acceptés, équipements, parking et
  horaires (fin après minuit = lendemain). La recherche filtre par événement, capacité, équipements
  clés, parking et budget **à l'heure** ; budget et tri comparent le prix ramené à l'heure, jamais le
  prix affiché. Une unité de prix inconnue n'est plus affichée « prix de vente ».
- Vignettes des photos (FE-D-002) : les cartes d'annonces chargent la vignette de 480 px créée
  par le backend au téléversement (`srcset` vers l'original sur écran large ou haute densité) ;
  les photos plus anciennes gardent l'original jusqu'au rattrapage côté backend.
- Vidéo d'annonce : affichée sur la fiche (rien n'est téléchargé avant la lecture), format MP4 et
  30 Mo vérifiés au choix ; un envoi de photo ou de vidéo qui échoue après la publication est
  signalé au lieu d'être ignoré.
- Statut de vérification des pièces d'identité (CIP/IFU) dans le profil propriétaire et démarcheur :
  en cours, validé, ou refusé avec son motif.
- Créneau de visite expiré : une proposition restée sans réponse après son heure s'affiche
  « Expiré » et invite à proposer un nouvel horaire ; la notification « Créneau expiré » ouvre la
  conversation (tâche serveur associée côté backend).
- Brouillon d'annonce : les photos et la vidéo choisies sont conservées dans le navigateur
  (IndexedDB, 7 jours) et retrouvées après une session expirée ou un rechargement ; elles sont
  effacées à la publication, par « Tout effacer » et à la déconnexion (FE-B-002).
- Couche de données TanStack Query (FE-A-004) : cache d'une minute par jeu de paramètres,
  déduplication et annulation des requêtes. Une seule requête de liste à l'ouverture de la
  recherche ; revenir d'une fiche vers l'accueil ou la recherche ne recharge rien pendant la durée
  du cache ; cœurs des favoris partagés entre l'accueil, la recherche et la page Favoris.

### Corrigé
- Une preview Vercel ne peut plus être construite contre l'API de production : le build échoue avec
  la marche à suivre (garde `scripts/garde-api-preview.mjs`). Une preview de la branche
  recette/integration affichait les données de production parce que `VITE_API_URL` n'y était pas
  réservée au staging.
- Inscription web ouverte à tous, prospects compris : l'en-tête propose « S'inscrire » et le
  parcours demande le profil (je cherche un bien / je suis propriétaire). La restriction aux
  propriétaires (PR #4) reste disponible avec `VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT=true`.
- Accueil, « Emplacements » : avec moins de 8 quartiers, des pastilles fixes au lieu d'un bandeau
  défilant qui laissait des vides et faisait sortir les pastilles de l'écran.
- Correctifs de la recette (branche recette/integration) repris dans l'écran découpé : un message
  supprimé par un administrateur est signalé comme tel (B9) ; le reçu affiche le type de bien
  calculé par le serveur (B10) ; la vérification CIP / IFU passe en lecture seule tant que les
  documents sont en attente ou validés, pour qu'un renvoi ne remette pas une identité validée en
  attente (C1) ; les notifications « documents validés / rejetés » ont leur icône (C1).
- Photos ou vidéo dont l'envoi échoue après la publication : conservées, signalées sur l'écran de
  confirmation avec un bouton « Réessayer l'envoi » (aucun autre écran ne permet d'ajouter un
  fichier à une annonce publiée).
- Une clé d'idempotence déjà servie (paiement précédent expiré ou refusé) ne bloque plus un nouvel
  essai : nouvelle clé et un seul renvoi automatique, sur le loyer, la recharge et le retrait.
- Le bandeau de vérification des pièces d'identité suit le statut du serveur après un envoi ; la
  vidéo de la fiche affiche la photo de couverture avant la lecture.
- Paiement du loyer et demande de retrait envoyés avec une clé d'idempotence (FE-B-006) : un
  renvoi après une coupure ne crée pas de seconde transaction et retrouve le lien de paiement ;
  la clé change dès que la demande change (montant, portefeuille, opérateur).
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
- Contrastes en thème clair (FE-C-004) : 63 nœuds axe-core sur 26 écrans, 0 aujourd'hui sur les
  62 mesurés (seul reste le logotype « REFUGE », exempté). Assombrissements minimaux, calculés pour
  4,5:1 sur le pire fond mesuré : violet, vert locataire, ambre, bleu de marque, gris secondaire,
  acier ; pastilles « Publié », « Payé », « Rejeté », « En retard » sur des verts et rouges plus
  soutenus ; statuts écrits avec les jetons de texte.
- Couleurs en dur (FE-B-017) : le contrôle ne compte plus les commentaires et met à part les
  illustrations justifiées (drapeaux, visages de notation, couleur de marque, animations) ;
  dégradés d'avatars regroupés dans `src/theme/illustrations.ts` (deux copies supprimées).
  Base : 149 couleurs d'interface en dur, 44 d'illustration.

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
