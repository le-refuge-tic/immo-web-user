# REFUGE - application web utilisateur

React 19 + TypeScript + Vite + Tailwind, déployée sur Vercel. Elle consomme l'API REST/WebSocket du backend REFUGE (dépôt séparé) : un backend joignable est nécessaire.

## Prérequis

Node 22 (voir `.nvmrc`) et npm 10.

## Installation et lancement

```bash
npm ci
cp .env.example .env.local   # puis renseigner VITE_API_URL
npm run dev
```

## Variables d'environnement

Modèle complet dans `.env.example`. Les variables `VITE_*` sont embarquées dans le paquet : n'y mettre aucun secret.

| Variable | Obligatoire | Description |
|---|---|---|
| `VITE_API_URL` | oui | URL de base de l'API, ex. `https://<backend>/api/v1`. En développement, repli sur `http://localhost:3000/api/v1`. **En production, le build échoue si elle est absente ou non HTTPS.** |
| `VITE_SITE_URL` | production | Domaine public (`https://…`) pour les URL absolues (`og:image`, `canonical`, `sitemap.xml`). |
| `VITE_ALLOW_INDEXING` | non | `true` **uniquement en production**. Sinon `robots.txt` interdit tout et chaque page porte `noindex` (staging, aperçus). |
| `VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT` | non | `true` par défaut : l'inscription web ne crée que des comptes propriétaires. `false` rouvre le choix du rôle. Restriction d'interface : l'API accepte toujours les inscriptions de l'application mobile. |
| `VITE_SENTRY_DSN` | non | Active le suivi d'erreurs Sentry (chargé à la demande). Vide = aucun envoi. |
| `VITE_RELEASE` | non | Identifiant de version associé aux erreurs Sentry. Par défaut `immo-web-user@<version de package.json>`, suivi du commit sur Vercel. |
| `VITE_UMAMI_WEBSITE_ID` | non | Mesure d'audience Umami sans cookie. Vide = aucun script chargé. |
| `VITE_UMAMI_SRC` | non | Script Umami (Umami Cloud par défaut) ; s'il est auto-hébergé, l'ajouter à la CSP de `vercel.json`. |
| `VITE_APK_URL` | non | Lien de téléchargement de l'application Android. |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | `tsc -b` puis build de production dans `dist/` |
| `npm run preview` | sert le build localement |
| `npm run lint` | oxlint ; les règles jsx-a11y sont bloquantes, le nombre d'avertissements ne peut pas dépasser la limite de `package.json` |
| `npm test` | tests unitaires (Vitest) |
| `npm run test:e2e` | tests de bout en bout (Playwright), voir plus bas |
| `npm run check` | types, lint, `any`, couleurs, liens et journal des modifications : ce que le hook de pré-commit exécute |
| `npm run check:size` | budget de taille du paquet initial (après `build`) |
| `npm run check:colors` | échoue si le nombre de couleurs hexadécimales écrites en dur augmente |
| `npm run check:any` | échoue si un type `any` explicite est ajouté |
| `npm run check:links` | vérifie que chaque lien interne correspond à une route de `src/App.tsx` |
| `npm run check:changelog` | vérifie que `CHANGELOG.md` décrit la version de `package.json` |

La CI (`.github/workflows/ci.yml`) exécute typage, lint, tests, vérification des liens, build, budget de taille, contrôles couleurs, `any` et journal des modifications, puis, dans un job séparé, les tests de bout en bout.

## Contrôles avant commit

`npm ci` (ou `npm install`) active le hook `.githooks/pre-commit` (`git config core.hooksPath .githooks`) : il lance `npm run check` avant chaque commit. Contournement exceptionnel : `git commit --no-verify`. Les contrôles « cliquets » (`check:colors`, `check:any`, `--max-warnings` du lint) ne font que descendre : après un nettoyage, abaisser la base (`node scripts/check-inline-colors.mjs --update`, `node scripts/check-explicit-any.mjs --update`, valeur de `--max-warnings`).

## Tests de bout en bout

Les tests Playwright (`e2e/`) jouent les parcours critiques (découverte et recherche, session, réservation et paiement, publication d'annonce, messagerie, tableaux de bord…) dans un vrai navigateur, **contre une API entièrement simulée** : aucun backend n'est nécessaire. `playwright.config.ts` lance le serveur de développement. Première utilisation : `npx playwright install chromium`. `e2e/support/mockApi.ts` fournit la simulation (`mockApp`) ; ajouter un point d'accès simulé y suffit pour un nouveau test.

## Structure du code

- `src/pages/<écran>/` : une page par dossier ; les grosses pages sont découpées en hook (`useXxx`), sections et modules d'options (par exemple `bien/nouveau-bien/`, `search/recherche/`). Aucun fichier ne dépasse 800 lignes.
- `src/api/` : un module par domaine, appels axios typés ; `httpInterceptor.ts` gère le rafraîchissement du jeton.
- `src/lib/queryClient.ts` et `src/api/queryKeys.ts` : couche de données TanStack Query (cache d'une minute, pas de nouvelle tentative automatique). Lire une ressource avec `useQuery` et une clé de `queryKeys` ; les écritures sur un bien appellent `invaliderBiens()` (déjà fait dans `biensApi`). `useApiQuery` reste pour les écrans sans cache.
- `src/types/` : types de domaine des réponses d'API (`api.ts` et un fichier par domaine).
- `src/components/ui/ModalSheet.tsx` : toute fenêtre modale passe par ce composant (focus piégé, Échap, retour du focus).
- `src/components/ErrorState.tsx` : état d'erreur d'un chargement avec « Réessayer » ; une panne d'API ne doit jamais ressembler à « aucun résultat ».

## Couleurs

Pas de couleur hexadécimale nouvelle dans les composants : utiliser les classes du thème (`tailwind.config.js`), les variables CSS de `src/index.css` (`--c-*` pour la marque et les états, `--p-*` pour l'espace propriétaire, `--tx-*` pour les textes qui s'éclaircissent en mode sombre) et `withAlpha(couleur, 'hh')` (`src/utils/color.ts`) pour appliquer une opacité. Les surcharges du mode sombre de `index.css` lisent certains styles en ligne tels que le navigateur les sérialise (`rgb(26, 26, 46)`) : ne pas remplacer par un mot-clé (`white`) ou une variable une couleur qu'elles ciblent sans vérifier le rendu sombre.

Texte ou fond : une couleur de texte s'éclaircit en sombre (`--tx-*`, et dans les espaces `GREEN_TX`, `TEAL_TX`, `PURPLE_TX`, `BLUE_TX`), une couleur de fond plein sous un texte blanc ne change pas (`--c-fill-*`, `--c-primary`, `--c-amber-dark`, constantes `GREEN`, `TEAL`, `PURPLE`, `BLUE`). Utiliser un jeton de texte comme fond rend le texte blanc illisible en sombre ; les statuts exposent pour cela `color` (texte) et `fill` (fond). `e2e/contraste-sombre.spec.ts` vérifie avec axe-core qu'aucun contraste insuffisant n'apparaît en sombre.

## Déploiement (Vercel)

1. Définir `VITE_API_URL` dans Project Settings > Environment Variables (Production et Preview).
2. Chaque push sur la branche de production déclenche un déploiement ; commande de build `npm run build`, dossier `dist`.
3. `vercel.json` fournit la réécriture SPA (`/(.*)` vers `/index.html`), les en-têtes de sécurité (CSP, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, HSTS) et le cache long des fichiers à empreinte (`/assets/*`).
4. Si la CSP bloque une nouvelle origine (API, images, WebSocket), l'ajouter dans `vercel.json`.

## Retour arrière

Vercel conserve chaque déploiement : Dashboard > Deployments > déploiement sain précédent > "Promote to Production" (ou `vercel rollback`). `index.html` n'est pas mis en cache et les fichiers `/assets/*` sont immuables par empreinte : le retour arrière est immédiat. Sinon, `git revert` du commit fautif puis push.

## Publier une version

Les modifications notables sont notées au fil de l'eau dans la section `## [Non publié]` de `CHANGELOG.md` (Ajouté, Modifié, Corrigé, Supprimé, Sécurité), avec l'identifiant d'audit ou de ticket quand il existe. Pour publier, sur `main` à jour :

1. Choisir le numéro ([SemVer](https://semver.org/lang/fr/)) : correctifs seuls → `patch`, nouvelle fonction → `minor`.
2. Dans `CHANGELOG.md`, renommer `## [Non publié]` en `## [X.Y.Z] - AAAA-MM-JJ`, rouvrir une section `## [Non publié]` vide au-dessus, et mettre à jour les liens de comparaison en bas du fichier.
3. `npm version X.Y.Z --no-git-tag-version`, puis commit `chore: version X.Y.Z`.
4. `git tag -a vX.Y.Z -m "vX.Y.Z"` puis `git push origin main --follow-tags`.

`npm run check:changelog` (pré-commit et CI) échoue si la version de `package.json` n'a pas sa section. La version part dans les erreurs Sentry (`VITE_RELEASE`), ce qui relie une erreur au déploiement qui l'a produite.

## Sécurité

- Les jetons sont en `sessionStorage` ; seul un profil minimal (id, nom, rôles, photo) est persisté dans `localStorage`.
- La déconnexion révoque le jeton de rafraîchissement côté serveur (`POST /auth/logout`).
- Les URL de paiement ne sont ouvertes que si elles sont en HTTPS sur un hôte FedaPay (`src/utils/paymentUrl.ts`).
- Les contrôles de rôle côté client sont ergonomiques uniquement : l'autorisation réelle est faite par le backend.
