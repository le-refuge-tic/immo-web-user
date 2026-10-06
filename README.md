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

| Variable | Obligatoire | Description |
|---|---|---|
| `VITE_API_URL` | oui | URL de base de l'API, ex. `https://<backend>/api/v1`. En développement, repli sur `http://localhost:3000/api/v1`. **En production, le build échoue si elle est absente ou non HTTPS.** |

Les variables `VITE_*` sont embarquées dans le paquet : n'y mettre aucun secret.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | `tsc -b` puis build de production dans `dist/` |
| `npm run preview` | sert le build localement |
| `npm run lint` | oxlint (dont règles jsx-a11y) |
| `npm test` | tests unitaires (Vitest) |

La CI (`.github/workflows/ci.yml`) exécute typage, lint, tests et build à chaque push et pull request.

## Déploiement (Vercel)

1. Définir `VITE_API_URL` dans Project Settings > Environment Variables (Production et Preview).
2. Chaque push sur la branche de production déclenche un déploiement ; commande de build `npm run build`, dossier `dist`.
3. `vercel.json` fournit la réécriture SPA (`/(.*)` vers `/index.html`), les en-têtes de sécurité (CSP, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, HSTS) et le cache long des fichiers à empreinte (`/assets/*`).
4. Si la CSP bloque une nouvelle origine (API, images, WebSocket), l'ajouter dans `vercel.json`.

## Retour arrière

Vercel conserve chaque déploiement : Dashboard > Deployments > déploiement sain précédent > "Promote to Production" (ou `vercel rollback`). `index.html` n'est pas mis en cache et les fichiers `/assets/*` sont immuables par empreinte : le retour arrière est immédiat. Sinon, `git revert` du commit fautif puis push.

## Sécurité

- Les jetons sont en `sessionStorage` ; seul un profil minimal (id, nom, rôles, photo) est persisté dans `localStorage`.
- La déconnexion révoque le jeton de rafraîchissement côté serveur (`POST /auth/logout`).
- Les URL de paiement ne sont ouvertes que si elles sont en HTTPS sur un hôte FedaPay (`src/utils/paymentUrl.ts`).
- Les contrôles de rôle côté client sont ergonomiques uniquement : l'autorisation réelle est faite par le backend.
