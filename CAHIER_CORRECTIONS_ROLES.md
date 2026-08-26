# Cahier de charges — Corrections système de rôles

> Projet : `immo-web-user`  
> Date : 2026-08-26  
> Priorité : critique → sérieux → mineur

---

## BUG-01 — `activeRole` non validé contre `rolesActifs` (Critique)

**Fichier :** `src/context/AuthContext.tsx` — L101

**Problème**  
La valeur exposée par le contexte est calculée ainsi :

```ts
activeRole: activeRole || user?.role_principal || user?.role || ''
```

Cette chaîne de fallback ne vérifie jamais que le rôle résultant existe dans `rolesActifs`.  
Scénario reproductible : l'utilisateur active le rôle `demarcheur`, le serveur le désactive (admin, suspension), puis l'app recharge depuis le localStorage — `activeRole='demarcheur'` persiste mais `rolesActifs=['prospect']`. Toute la navigation est construite sur un rôle invalide.

**Correction à appliquer**

Dans `AuthProvider`, après le calcul de `rolesActifs`, calculer `computedActiveRole` en validant :

```ts
const computedActiveRole = (() => {
  const candidate = activeRole || user?.role_principal || user?.role || ''
  if (candidate && rolesActifs.includes(candidate)) return candidate
  return user?.role_principal || user?.role || ''
})()
```

Passer `computedActiveRole` dans la valeur du contexte à la place de l'expression inline actuelle.

**Effet de bord à gérer**  
Si `computedActiveRole` diffère de `activeRole` stocké, appeler `setActiveRole(computedActiveRole)` dans un `useEffect` pour resynchroniser le localStorage.

---

## BUG-02 — `PrivateRoute` ne vérifie pas l'appartenance au rôle (Critique)

**Fichier :** `src/App.tsx` — L38-46, L85-96

**Problème**  
`PrivateRoute` vérifie uniquement `isLoggedIn`. Les routes `/proprietaire`, `/demarcheur`, `/locataire` sont donc accessibles à tout utilisateur connecté, quel que soit son rôle actif.

```tsx
// Actuel — insuffisant
function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}
```

**Correction à appliquer**

Créer un composant `RoleRoute` distinct (ne pas surcharger `PrivateRoute` pour ne pas casser les autres routes) :

```tsx
function RoleRoute({ role, children }: { role: string; children: React.ReactElement }) {
  const { isLoggedIn, rolesActifs } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    sessionStorage.setItem('post_login_redirect', location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  if (!rolesActifs.includes(role)) return <Navigate to="/" replace />
  return children
}
```

Remplacer dans `App.tsx` :

```tsx
// Avant
<Route path="/proprietaire" element={<PrivateRoute><ProprietaireDashboard /></PrivateRoute>} />
<Route path="/demarcheur"   element={<PrivateRoute><DemarcheurDashboard /></PrivateRoute>} />
<Route path="/locataire"    element={<PrivateRoute><LocataireDashboard /></PrivateRoute>} />

// Après
<Route path="/proprietaire" element={<RoleRoute role="proprietaire"><ProprietaireDashboard /></RoleRoute>} />
<Route path="/demarcheur"   element={<RoleRoute role="demarcheur"><DemarcheurDashboard /></RoleRoute>} />
<Route path="/locataire"    element={<RoleRoute role="locataire"><LocataireDashboard /></RoleRoute>} />
```

Appliquer également aux sous-routes `/proprietaire/biens/:id`.

---

## BUG-03 — Race condition : `activeRole` persisté avant succès API à la désactivation (Sérieux)

**Fichier :** `src/pages/profile/ManageRolesPage.tsx` — L58-73

**Problème**  
La séquence actuelle dans `desactiverRole` :

1. `rolesApi.desactiver(role)` — appel API
2. `updateUser({ roles_actifs: newRoles })` — mise à jour du state/localStorage
3. `setActiveRole(rolePrincipal)` — uniquement si `role === activeRole`

Si l'API réussit mais qu'une erreur réseau survient ensuite (ou si le composant est démonté), `updateUser` n'est pas appelé mais l'état peut être incohérent. À l'inverse, si l'API échoue (bloc `catch`), `updateUser` n'est pas appelé — c'est correct — mais `activeRole` a pu être modifié par une interaction concurrente.

Cas plus grave : si l'utilisateur clique deux fois rapidement, deux appels `desactiver` partent, le second peut écrire un `newRoles` calculé sur l'ancien `actifs` (closure stale).

**Correction à appliquer**

- Désactiver le bouton pendant `loading` (déjà fait partiellement avec `disabled={busy}`) — vérifier que `busy` bloque bien les deux boutons Activer et Désactiver simultanément pour le même rôle.
- Mettre `updateUser` et `setActiveRole` **dans le bloc `try`**, après la confirmation API, avec un ordre strict :
  1. API call
  2. `updateUser`
  3. `setActiveRole` (conditionnel)
- Ajouter un état `isSubmitting` global sur la page (pas seulement par rôle) pour bloquer tout double-clic inter-rôles.

```ts
const desactiverRole = async (role: string) => {
  if (!confirm(...)) return
  setLoading(role)
  setError('')
  try {
    await rolesApi.desactiver(role)
    const newRoles = actifs.filter(r => r !== role)
    updateUser({ roles_actifs: newRoles })
    if (role === activeRole) setActiveRole(rolePrincipal)  // après updateUser
    setSuccess(...)
  } catch (e: any) {
    setError(...)
    // NE PAS toucher activeRole ici
  } finally {
    setLoading(null)
  }
}
```

---

## BUG-04 — Données dashboard non rafraîchies au changement de rôle (Sérieux)

**Fichier :** `src/pages/proprietaire/ProprietaireDashboard.tsx` — fonction `loadData` et `goToRoleSpace`

**Problème**  
`setActiveRole()` met à jour le contexte mais ne déclenche pas de rechargement des données du dashboard. L'utilisateur qui bascule de `prospect` à `proprietaire` et revient dans la même session voit des données périmées (biens, loyers, visites du contexte précédent).

**Correction à appliquer**

Dans le `useEffect` qui appelle `loadData()`, ajouter `activeRole` comme dépendance :

```ts
useEffect(() => {
  loadData()
}, [activeRole]) // déclenche le rechargement à chaque changement d'espace
```

Si `loadData` est mémoïsée avec `useCallback`, s'assurer qu'`activeRole` est dans ses dépendances également.

Appliquer le même pattern dans `DemarcheurDashboard.tsx` et `LocataireDashboard.tsx` s'ils ont un `loadData` similaire.

---

## BUG-05 — `refreshAccessToken` ne met pas à jour `rg_user` avec les nouveaux rôles (Sérieux)

**Fichier :** `src/api/httpInterceptor.ts` — L32-43  
**Fichier :** `src/api/rolesApi.ts` — L8-21

**Problème**  
`refreshAccessToken()` met à jour `rg_token` dans le localStorage mais ne met jamais à jour `rg_user`. Après un refresh de token (soit automatique via l'interceptor 401, soit explicite après activation/désactivation de rôle), les `roles_actifs` dans `rg_user` restent ceux du dernier login — divergence silencieuse entre le token JWT (qui contient les nouveaux rôles) et l'objet user en mémoire.

**Correction à appliquer**

Si le endpoint `/auth/refresh` retourne un objet `user` mis à jour, l'exploiter :

```ts
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('rg_refresh')
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refreshToken })
    localStorage.setItem('rg_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('rg_refresh', data.refresh_token)
    // Mettre à jour rg_user si le serveur renvoie l'user mis à jour
    if (data.user) {
      localStorage.setItem('rg_user', JSON.stringify(data.user))
    }
    return data.access_token as string
  } catch {
    return null
  }
}
```

Si le serveur ne renvoie pas `user`, décoder le payload JWT (sans librairie : `atob(token.split('.')[1])`) pour en extraire `roles_actifs` et patcher `rg_user` en conséquence.

**Note :** ce fix seul ne suffit pas — le contexte React lit `rg_user` uniquement au montage. Il faut coupler ce fix avec un mécanisme de notification vers `AuthContext` (event `storage`, ou exposer une fonction `syncUser` dans le contexte).

---

## BUG-06 — `activeRole` non resetté synchronement au logout (Mineur)

**Fichier :** `src/context/AuthContext.tsx` — L77-85

**Problème**  
`logout()` appelle `setActiveRoleState('')` et retire `rg_active_role` du localStorage. Cependant, le recalcul de `computedActiveRole` (voir BUG-01) utilise `user?.role_principal` en fallback. Entre le `setUser(null)` et le re-render, si un composant lit `activeRole` de façon synchrone (ex: dans un `useEffect` de cleanup), il peut recevoir la valeur périmée.

**Correction à appliquer**

Garantir l'ordre de reset dans `logout()` : vider `activeRole` **avant** `user` pour que le fallback `user?.role_principal` soit déjà `undefined` lors du prochain calcul.

```ts
const logout = () => {
  setActiveRoleState('')                     // 1. reset activeRole d'abord
  localStorage.removeItem('rg_active_role')  // 2. sync localStorage
  setUser(null)                              // 3. puis user
  setToken(null)
  localStorage.removeItem('rg_user')
  localStorage.removeItem('rg_token')
  localStorage.removeItem('rg_refresh')
}
```

---

## Ordre de mise en œuvre recommandé

| Ordre | Bug | Raison |
|-------|-----|--------|
| 1 | BUG-01 | Fondation : corrige la source de vérité `activeRole` |
| 2 | BUG-02 | Sécurité : bloque l'accès aux espaces non autorisés |
| 3 | BUG-05 | Synchronisation : les rôles serveur reflétés côté client |
| 4 | BUG-03 | Robustesse : évite les états incohérents sur actions concurrentes |
| 5 | BUG-04 | UX : données fraîches au changement d'espace |
| 6 | BUG-06 | Propreté : reset propre au logout |

---

## Fichiers à modifier (récapitulatif)

| Fichier | Bugs concernés |
|---------|---------------|
| `src/context/AuthContext.tsx` | BUG-01, BUG-06 |
| `src/App.tsx` | BUG-02 |
| `src/pages/profile/ManageRolesPage.tsx` | BUG-03 |
| `src/pages/proprietaire/ProprietaireDashboard.tsx` | BUG-04 |
| `src/pages/demarcheur/DemarcheurDashboard.tsx` | BUG-04 |
| `src/pages/locataire/LocataireDashboard.tsx` | BUG-04 |
| `src/api/httpInterceptor.ts` | BUG-05 |
