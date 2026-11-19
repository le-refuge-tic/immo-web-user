# Validation des formulaires — site public et espace propriétaire (lot 15)

Ce document recense chaque formulaire de `immo-web-user` et la règle de chacun de ses champs. Il sert de référence pour garder le front aligné sur le backend : les DTO NestJS font foi, et le front reproduit leurs règles.

## Règles communes

**Saisie des champs.** Les composants de `src/shared/saisie/champs.tsx` (fichier identique dans immo-web-admin) remplacent les `<input type="number">` et les champs téléphone libres.

| Composant | Ce qu'il fait |
|---|---|
| `NumberInput` | Champ texte au clavier numérique. N'accepte que des chiffres, à la frappe comme au collage. `max` bloque la saisie au-delà ; `decimales` autorise une virgule. |
| `MoneyInput` (ou `milliers`) | Affiche les milliers séparés (« 150 000 ») mais renvoie la valeur brute (`150000`). |
| `PhoneInput` | Garde 10 chiffres au plus. Retire l'indicatif s'il est collé (`+229`, `00229`, `229`). `etranger` sert aux indicatifs hors Bénin : chiffres seulement, 15 au plus. |
| `EmailInput`, `TexteInput`, `DateInput` | E-mail limité à 255 caractères ; texte borné par `maxLength` ; date avec `futur` pour refuser les dates passées. |

**Schémas.** Les briques zod sont dans `src/shared/saisie/schemas.ts`. Les schémas du site sont dans `src/validation/schemas.ts` et testés dans `schemas.test.ts`. Les messages déjà vérifiés par les tests e2e sont repris mot pour mot.

**Hook `useValidation`** (`src/shared/saisie/validation.ts`) :
- l'erreur s'affiche sous le champ quand on le quitte, et sur tous les champs à la soumission ;
- le focus va au premier champ en erreur ;
- l'envoi n'a lieu qu'une fois.

**Contrôle `npm run check:inputs`.** Le script fait partie de `npm run check`. Il échoue si un `<input type="number">` brut ou un champ téléphone libre réapparaît.

## Inventaire

Légende de la colonne « Schéma » :
- ✅ : schéma zod ;
- 🔹 : règles déjà en fonctions pures testées (gardées telles quelles) ;
- — : pas de saisie libre.

| Formulaire (fichier) | Champ | Type et bornes | Obligatoire | Message d'erreur | Schéma |
|---|---|---|---|---|---|
| Connexion (`components/ui/auth-switch`) | téléphone | `PhoneInput` ; +229 : 01 + 8 chiffres ; autre indicatif : 6 à 15 chiffres | oui | « Remplissez tous les champs » / « Numéro invalide : saisissez 10 chiffres… » | ✅ `schemaConnexion` |
| | mot de passe | ≤ 128 | oui | « Remplissez tous les champs » | ✅ |
| Inscription (`auth-switch`) | nom, prénom | 2 à 100 (`RegisterDto`) | oui | « Renseignez votre nom. »… | ✅ `schemaInscription` |
| | téléphone / e-mail | voir connexion ; e-mail ≤ 255 ; l'un des deux exigé | un des deux | « Renseignez un téléphone ou un e-mail. » | ✅ |
| | mot de passe / confirmation | 8 à 128 ; identiques | oui | « Mot de passe trop court (8 caractères min.) », « Les mots de passe ne correspondent pas » | ✅ |
| | conditions | case cochée | oui | « Veuillez accepter les conditions d'utilisation » | ✅ |
| Codes SMS (inscription, connexion, mot de passe oublié) | code | 6 chiffres (cases) | oui | messages existants | 🔹 |
| Mot de passe oublié (`auth/ForgotPasswordPage`) | téléphone, nouveau mot de passe | 01 + 8 chiffres ; 8 à 128 | oui | messages existants | 🔹 |
| Changement de mot de passe (`profile/ChangePasswordModal`) | actuel, nouveau, confirmation | 8 à 128 ; identiques | oui | « … ne correspondent pas » | 🔹 |
| Profil (`profile/EditProfileModal`) | nom, prénom | lettres, 2 au moins (`NOM_REEL`) | oui | « Saisissez votre vrai nom… » | ✅ `schemaProfil` |
| | e-mail | e-mail | non | « Adresse e-mail invalide. » | ✅ |
| Nouveau numéro (`profile/VerifyPhoneSection`) | numéro | `PhoneInput` | oui | message existant | 🔹 |
| Numéro de retrait (`components/wallet/NumeroRetraitModal`) | numéro | `PhoneInput`, 01 + 8 chiffres | oui | « Numéro invalide : saisissez 10 chiffres… » | 🔹 `validateBeninPhone` (règle commune) |
| Retrait (`wallet/PortefeuillePage`, `proprietaire/tabs/PortefeuilleTab`) | montant | `MoneyInput` ; minimum et solde | oui | messages existants sous le champ | 🔹 |
| Rechargement (`wallet/RechargementWalletPage`) | montant | `MoneyInput`, ≥ 100 | oui | « Montant minimum : 100 FCFA » | 🔹 (schéma `schemaRechargement` testé) |
| | numéro | `PhoneInput` | si l'opérateur le demande | « Numéro invalide… » | 🔹 |
| Paiement de visite, d'intégration, de loyer (`visites/PaiementModal`, `integration/PaiementIntegrationPage`, `locataire/tabs/*`) | numéro Mobile Money | `PhoneInput` | oui (hors FedaPay) | bouton désactivé tant que le numéro est invalide | 🔹 (`schemaNumeroMobileMoney` testé) |
| Avis après visite (`visites/FeedbackModal`) | note, commentaire | note 1 à 5 ; texte borné | note oui | messages existants | 🔹 |
| Réclamation (`conversations/chat/ComplaintModal`) | motif, description | texte borné | oui | messages existants | 🔹 |
| Publication d'un bien classique (`bien/nouveau-bien/*`) | prix, surfaces, compteurs | `NumberInput` / `MoneyInput` ; surfaces décimales en hectares | selon l'étape | messages de chaque étape | 🔹 règles partagées (`shared/biens`) |
| Publication guesthouse ou salle (`bien/dedie/*`) | capacités, tarifs | `NumberInput` (`Entier`) ; montants | selon l'étape | messages de chaque étape | 🔹 `manquesEtape` (téléphone du propriétaire : règle béninoise) |
| Modification rapide (`bien/EditBienModal`) | prix | `MoneyInput`, ≥ 1 | oui | « Le montant doit être au moins 1. » | ✅ `schemaModificationBien` |
| | prix promotionnel | ≥ 100 et inférieur au prix | non | « Le prix promotionnel doit être inférieur au prix normal. » | ✅ |
| | frais de visite | ≥ 0 | non | — | ✅ |
| | description | ≤ 5 000 | non | — | ✅ |
| Bien en gestion (`proprietaire/AjouterBienGestionModal`) | loyer mensuel | `MoneyInput`, ≥ 1 | oui | « Le loyer mensuel est obligatoire » | ✅ `schemaLoyerGestion` |
| Rôles (`profile/ManageRolesPage`, `proprietaire/tabs/RolesTab`) | choix | boutons | — | — | — |
| Filtres de recherche (`home/*`, `search/recherche/FilterPanel`) | prix et surfaces min / max | `MoneyInput` | non | — (filtres) | — |
| Messagerie (`conversations/ChatThread`) | message | texte | oui | — | — |

## Écarts relevés avec le backend
- `InitierChangementNumeroDto` (numéro de retrait) accepte encore 8 à 10 chiffres côté backend. Le front exige 01 + 8 chiffres. À aligner côté backend, après accord, à cause de l'app mobile.
- La connexion n'acceptait aucun contrôle de format côté front ; elle refuse désormais un numéro béninois de mauvaise longueur avant l'appel. Le backend renvoyait de toute façon « identifiants incorrects ».
