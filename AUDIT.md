# Audit technique — immo-web (REFUGE)

**Date :** 2026-09-02
**Périmètre :** front-end React 19 / TypeScript / Vite (85 fichiers TS/TSX, ~23 700 lignes)
**Back-end :** audité séparément — voir `D:\Projet\immo-backend\AUDIT.md` (NestJS, 140 fichiers).
Les points marqués **[dépend backend]** ci-dessous ont été **levés** grâce à l'audit backend ;
la conclusion est indiquée à chaque fois.

---

## 1. Résumé exécutif

| Domaine | État | Commentaire |
|---|---|---|
| Build officiel (`npm run build`) | ❌ → ✅ **corrigé** | Cassé par une erreur TypeScript. Réparé pendant l'audit. |
| Sécurité | ⚠️ **2 points critiques** | 2FA désactivée en code ; tokens en `localStorage`. |
| Qualité / code mort | ⚠️ moyen | 9 fichiers orphelins supprimés ; 133 warnings lint. |
| Fonctionnalités | ✅ globalement sain | Routage, auth, refresh token cohérents (sous réserve backend). |
| Tests automatisés | ❌ absents | Playwright installé mais aucun test présent. |

**Actions déjà appliquées pendant l'audit :**
1. Correction de l'erreur de typage qui cassait `npm run build` (`ProfilePage.tsx`).
2. Suppression de 9 fichiers morts (jamais importés).
3. Vérification : `tsc` ✅, `oxlint` ✅ (0 erreur), `npm run build` ✅.

---

## 2. Bugs & anomalies

### 2.1 🔴 CRITIQUE — Le build de production échouait

`package.json` → `"build": "tsc -b && vite build"`. Le `tsc -b` renvoyait **exit 2** :

```
src/pages/profile/ProfilePage.tsx(307): Property 'id' does not exist on type '{ type?: string }'
src/pages/profile/ProfilePage.tsx(309): Property 'localisation' does not exist ...
```

**Cause :** le type `Visite` déclarait `creneau.bien` comme `{ type?: string }` seulement,
alors que le code lit `bien.id` et `bien.localisation` sur la valeur
`visiteActive.bien || visiteActive.creneau?.bien`.

**Impact :** tout déploiement (Vercel) exécutant le script `build` échouait.
Le `vite build` seul masquait le problème car il ne fait pas de vérification de types.

**Correctif appliqué** — élargissement du type dans [ProfilePage.tsx:106-107](src/pages/profile/ProfilePage.tsx#L106-L107) :

```ts
creneau?: { debut: string; bien?: { id?: number; type?: string; localisation?: {...} } }
bien?: { id?: number; type?: string; localisation?: { ville?: string; quartier?: string } }
```

### 2.1bis 🔴 CORRIGÉ — « Forbidden resource » à la proposition de visite

**Symptôme :** sur l'écran « Proposer une visite », la validation affichait une bannière
rouge « Forbidden resource » (message brut d'un 403 backend).

**Cause :** `POST /visites` est protégé côté backend par `@Roles(...CLIENTS)` où
`CLIENTS = [prospect, locataire]`. Or le bouton « Proposer une visite »
([BienDetailPage.tsx:498](src/pages/bien/BienDetailPage.tsx#L498)) ne vérifiait que
`isLoggedIn`, et `ReservationPage` est derrière un simple `PrivateRoute` (pas `RoleRoute`).
Un **propriétaire ou démarcheur** (sans rôle client actif) pouvait donc lancer la
réservation → 403.

**Correctif appliqué (front)** dans [ReservationPage.tsx](src/pages/reservation/ReservationPage.tsx) :
- garde-fou `peutReserver` (basé sur `rolesActifs`) avant l'appel ;
- bandeau explicatif « Profil prospect requis » + bouton **« Activer le profil prospect
  pour réserver »** qui appelle `rolesApi.activer('prospect')` (rafraîchit le token) ;
- le `catch` traduit désormais tout 403 résiduel en message clair au lieu de
  « Forbidden resource ».

Règle métier inchangée (seuls prospect/locataire réservent) ; aucun changement backend.

### 2.2 🟠 Incohérence des deux implémentations de `refresh`

Il existe **deux** façons de rafraîchir le token, avec des signatures différentes :

- [authApi.ts:22-23](src/api/authApi.ts#L22-L23) : `refresh(refresh_token, user_id)` — envoie `{ refresh_token, user_id }`.
- [httpInterceptor.ts:32-60](src/api/httpInterceptor.ts#L32-L60) : `refreshAccessToken()` — envoie seulement `{ refresh_token }`.

Seul l'interceptor est réellement utilisé. **Vérifié côté backend** : `auth.service.refresh(refreshToken)`
ne prend **que** le refresh token (pas de `user_id`). → L'interceptor est correct ;
**`authApi.refresh(refresh_token, user_id)` est du code mort à supprimer.**

### 2.3 🟠 `logout()` ne révoque pas la session serveur

[AuthContext.tsx:77-85](src/context/AuthContext.tsx#L77-L85) efface le `localStorage`
mais n'appelle jamais `authApi.logout(refresh_token)`. **Confirmé côté backend** :
`auth.service.logout()` **révoque** bien le refresh token en base — mais comme le front
ne l'appelle pas, le refresh token **reste valide côté serveur pendant 7 jours**
(`JWT_REFRESH_EXPIRES=7d`) après une « déconnexion ». Le correctif est côté front (§ AMELIORATIONS #3).

### 2.4 🟡 133 warnings lint (voir détail §5)

Aucune erreur, mais : ~1 fonction morte, ~14 variables mortes, `catch (_)` non utilisés,
et plusieurs `react-hooks/exhaustive-deps` (dépendances d'effets manquantes) qui peuvent
provoquer des données périmées à l'écran.

### 2.5 🟡 Dépendances d'effets manquantes (risque de bug runtime)

Exemples de `exhaustive-deps` à surveiller — un effet qui ne se ré-exécute pas quand
une valeur change affiche des données obsolètes :
- [HomePage.tsx:216](src/pages/home/HomePage.tsx#L216) (`loadFavs`), :252, :258
- [BienDetailPage.tsx:217](src/pages/bien/BienDetailPage.tsx#L217)
- [EditProfileModal.tsx:32](src/pages/profile/EditProfileModal.tsx#L32)

Ce ne sont pas tous des bugs (certains sont volontaires), mais chacun mérite un
commentaire explicite ou un correctif.

---

## 3. Sécurité

### 3.1 🔴 CRITIQUE — 2FA (OTP) désactivée par un flag en dur

[utils/otpBypass.ts](src/utils/otpBypass.ts) : `SKIP_OTP_UI = true` + `DUMMY_OTP_CODE = '000000'`.
À la connexion ([auth-switch.tsx:250-255](src/components/ui/auth-switch.tsx#L250-L255)),
si le serveur demande un OTP, l'app **soumet automatiquement `000000`** sans jamais
afficher l'écran de saisie.

**Impact :** tant que le backend tourne avec `OTP_BYPASS=true`, **la double
authentification est totalement contournée**. C'est acceptable en phase de test,
**inacceptable en production**.

**Recommandation :** repasser `SKIP_OTP_UI = false` et confirmer `OTP_BYPASS=false`
côté backend **avant toute mise en production**. Idéalement, piloter ce comportement
par une variable d'environnement (`import.meta.env.DEV`) plutôt qu'une constante commitée.

### 3.2 🟠 Tokens JWT stockés en `localStorage`

`rg_token` (access) et `rg_refresh` (refresh) sont dans `localStorage`
(interceptor + AuthContext + tous les fichiers `api/*`). Le `localStorage` est
**accessible par tout JavaScript de la page** → en cas de XSS, vol de session complet
(access + refresh).

Atténuations en place : ✅ aucun `dangerouslySetInnerHTML`, aucun `eval`, aucun
`innerHTML` dans le code — la surface XSS est faible aujourd'hui.

**Recommandation :** à terme, migrer le refresh token vers un cookie `HttpOnly`+`Secure`+`SameSite`.
**[dépend backend]**

### 3.3 🟠 Autorisation par rôle uniquement côté client

`RoleRoute` ([App.tsx:48-57](src/App.tsx#L48-L57)) et `hasRole` s'appuient sur
`user.roles_actifs` lu depuis `rg_user` (localStorage), **modifiable par l'utilisateur**.
Un utilisateur peut éditer son `localStorage` pour afficher les dashboards
propriétaire/démarcheur.

Ce n'est acceptable que si le backend revérifie le rôle sur chaque endpoint protégé.
✅ **Vérifié et confirmé côté backend** : `RolesGuard` revérifie le rôle depuis le **JWT**
(non falsifiable), pas depuis le localStorage. La couverture `@Roles()` est bonne
(admin 43/43, biens, visites, loyers, wallets protégés). → **Le `RoleRoute` front n'est
qu'un confort d'UX ; l'autorisation réelle est serveur. Risque maîtrisé.**

### 3.4 🟢 Points sains

- Pas de secret commité (`.env`, `.env.local`, `.env.production` bien gitignorés ;
  seule `VITE_API_URL` publique est exposée, ce qui est normal côté front).
- Service worker ([public/sw.js](public/sw.js)) : navigation uniquement vers des
  chemins internes construits depuis le payload → pas d'open-redirect.
- Timeouts axios configurés (30s GET / 90s mutations) → pas de blocage UI infini.

---

## 4. Fonctionnalités vérifiées

Vérification statique (lecture de code + typecheck ; pas d'exécution end-to-end faute
de backend de test accessible et de comptes) :

| Fonctionnalité | Constat |
|---|---|
| Connexion téléphone/email | OK, avec fallback cold-start (`withColdStartRetry`). |
| OTP 2FA | **court-circuité** (§3.1). |
| Refresh token automatique sur 401 | OK, rejoue la requête une fois puis logout. |
| Routage & gardes (Private/Role) | OK côté client (limites §3.3). |
| Multi-rôles / changement d'espace | Logique cohérente (`activeRole` recalculé). |
| Push / notifications | SW fonctionnel, routage au clic correct. |
| Gestion biens / visites / wallet | Couche API cohérente (16 modules `api/*`). |

> ⚠️ **Non testé dynamiquement.** Aucun test automatisé n'existe (Playwright est
> installé mais le dossier de tests est vide). Voir recommandations.

---

## 5. Code mort supprimé & nettoyage

### 5.1 Fichiers orphelins supprimés (9)

Vérifiés comme jamais importés et sans export utilisé :

```
src/api/feedbackApi.ts              (le feedback passe par visitesApi)
src/components/InAppBanner.tsx
src/components/ui/button.tsx        (aucun <Button> importé de ce fichier)
src/components/ui/coverflow-carousel.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/data/beninLocations.ts          (remplacé par data/quartiers.ts)
src/pages/auth/LoginPage.tsx        (remplacé par AuthSwitch)
src/pages/auth/RegisterPage.tsx     (remplacé par AuthSwitch)
```

Résultat : 94 → **85 fichiers**. `tsc`, `oxlint` et `npm run build` toujours ✅.

### 5.2 Dépendances npm devenues orphelines

Après suppression des composants UI ci-dessus, plus aucun fichier n'importe :

```
@radix-ui/react-label
@radix-ui/react-slot
class-variance-authority
```

→ peuvent être retirées de `package.json` (non fait automatiquement pour éviter tout
effet de bord ; voir AMELIORATIONS.md).

### 5.3 Code mort intra-fichier (non supprimé — nécessite revue)

Signalé par lint mais laissé en place car situé dans un fichier de ~3800 lignes sans
tests (risque de régression) :

- [ProprietaireDashboard.tsx:1230](src/pages/proprietaire/ProprietaireDashboard.tsx#L1230) `VisiteCard` — fonction déclarée, jamais rendue.
- [ProprietaireDashboard.tsx:1407](src/pages/proprietaire/ProprietaireDashboard.tsx#L1407) `reservationPlaceholderSrc` — inutilisé.
- [ProprietaireDashboard.tsx:3749-3783](src/pages/proprietaire/ProprietaireDashboard.tsx#L3749-L3783) — `approuves`, `enAttente`, `rejetes`, `biensParType`, `revenusTrendPct`, `hasRevenus`, `revenusSeries`, `visitesSeries` : calculs jamais rendus (restes d'un dashboard analytics retiré).
- [ChatThread.tsx:260](src/pages/conversations/ChatThread.tsx#L260) `findVisite` — inutilisé.

---

## 6. Vérifications exécutées

| Commande | Avant | Après |
|---|---|---|
| `npx tsc -b --noEmit` | ❌ 4 erreurs | ✅ 0 |
| `npx oxlint` | 137 warnings / 0 erreur | 133 warnings / 0 erreur |
| `npm run build` | ❌ exit 2 | ✅ exit 0 |

**Bundle :** `index.js` = 1,29 Mo (333 Ko gzip), non code-splitté → voir AMELIORATIONS.md.
