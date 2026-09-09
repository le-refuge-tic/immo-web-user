# Améliorations recommandées — immo-web (REFUGE)

**Date :** 2026-09-02
Document complémentaire à [AUDIT.md](AUDIT.md). Priorisé : 🔴 avant prod · 🟠 court terme · 🟡 confort.

---

## 🔴 À faire avant toute mise en production

### 1. Réactiver la 2FA
- `src/utils/otpBypass.ts` : repasser `SKIP_OTP_UI = false`.
- Confirmer `OTP_BYPASS=false` côté backend.
- **Mieux :** conditionner le bypass à l'environnement plutôt qu'à une constante commitée :
  ```ts
  export const SKIP_OTP_UI = import.meta.env.DEV && import.meta.env.VITE_OTP_BYPASS === 'true'
  ```
  Ainsi un build de production ne peut structurellement pas sauter l'OTP.

### 2. Confirmer l'autorisation serveur par rôle
Auditer le backend pour garantir que **chaque** endpoint protégé revérifie le rôle
(le `RoleRoute` front est contournable via `localStorage`). C'est la ligne de défense réelle.

### 3. Révoquer la session au logout
Dans `AuthContext.logout()`, appeler `authApi.logout(refresh_token)` avant d'effacer
le `localStorage`, pour invalider le refresh token côté serveur.

---

## 🟠 Court terme (qualité & robustesse)

### 4. Trancher le doublon de `refresh`
Aligner `authApi.refresh` et `httpInterceptor.refreshAccessToken` (voir AUDIT §2.2) :
un seul contrat `{ refresh_token }` ± `user_id`. Supprimer l'implémentation morte.

### 5. Sécuriser le stockage des tokens
Migrer le refresh token vers un cookie `HttpOnly` + `Secure` + `SameSite=Strict`
(nécessite support backend). Réduit drastiquement l'impact d'un éventuel XSS.

### 6. Mettre en place des tests
Playwright est déjà installé mais inutilisé. Prioriser les parcours critiques :
- connexion (avec OTP réel) ;
- création/édition d'un bien ;
- réservation + paiement wallet ;
- garde de rôle (un prospect ne doit pas atteindre `/proprietaire`).
Ajouter un script `"test": "playwright test"` et le brancher en CI.

### 7. Nettoyer le code mort restant
- Supprimer les symboles inutilisés listés dans AUDIT §5.3 (`VisiteCard`,
  `reservationPlaceholderSrc`, variables analytics, `findVisite`).
- Retirer les 3 dépendances orphelines de `package.json` :
  `@radix-ui/react-label`, `@radix-ui/react-slot`, `class-variance-authority`
  (puis `npm install` pour régénérer le lock).

### 8. Résorber les warnings `exhaustive-deps`
Passer en revue chaque `react-hooks/exhaustive-deps` : soit ajouter la dépendance,
soit documenter par un commentaire pourquoi elle est volontairement omise. Évite les
bugs d'affichage de données périmées.

---

## 🟡 Confort & performance

### 9. Code-splitting du bundle
`index.js` fait 1,29 Mo (333 Ko gzip) en un seul chunk. Découper par route avec
`React.lazy` + `Suspense` (surtout les gros dashboards proprio/démarcheur) réduirait
nettement le temps de premier affichage.

### 10. Factoriser l'en-tête `Authorization`
Le pattern `Bearer ${localStorage.getItem('rg_token')}` est dupliqué dans ~16 fichiers
`api/*`. Le centraliser dans un interceptor de requête axios (comme l'interceptor de
réponse existant) : moins de duplication, un seul point de vérité.
> Bonus : le `DemarcheurDashboard` utilise `fetch()` brut avec header manuel
> ([DemarcheurDashboard.tsx:426](src/pages/demarcheur/DemarcheurDashboard.tsx#L426))
> — il court-circuite l'interceptor de refresh. À basculer sur axios.

### 11. Uniformiser la gestion d'erreur
Beaucoup de `catch (_) {}` silencieux. Définir une stratégie : afficher un message
utilisateur (toast/bannière — `BannerContext` existe déjà) plutôt qu'avaler l'erreur.

### 12. Découper les fichiers géants
`ProprietaireDashboard.tsx` ≈ 3800 lignes. Extraire les sous-composants (cartes,
graphiques, modales) en fichiers dédiés améliorerait lisibilité, testabilité et
temps de compilation.

---

## Récapitulatif priorisé

| # | Action | Priorité | Effort |
|---|---|---|---|
| 1 | Réactiver 2FA | 🔴 | faible |
| 2 | Autorisation serveur par rôle | 🔴 | moyen (backend) |
| 3 | Révoquer session au logout | 🔴 | faible |
| 4 | Dédoublonner `refresh` | 🟠 | faible |
| 5 | Tokens en cookie HttpOnly | 🟠 | moyen (backend) |
| 6 | Tests Playwright | 🟠 | élevé |
| 7 | Supprimer code mort restant | 🟠 | faible |
| 8 | Corriger `exhaustive-deps` | 🟠 | moyen |
| 9 | Code-splitting | 🟡 | moyen |
| 10 | Centraliser `Authorization` | 🟡 | faible |
| 11 | Gestion d'erreur uniforme | 🟡 | moyen |
| 12 | Découper fichiers géants | 🟡 | élevé |
