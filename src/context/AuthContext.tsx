import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { tokenStore } from '../utils/tokenStore'
import { readStoredUser, writeStoredUser } from '../utils/storedUser'
import { revokeSession } from '../api/authApi'
import { unsubscribeFromPush } from '../lib/push'
import { userApi } from '../api/userApi'
import { clearFormDrafts } from '../utils/formDraft'
import type { LoginPayload, SessionUser } from '../types/session'

type AuthUser = SessionUser

type AuthCtx = {
  user: AuthUser | null
  token: string | null
  isLoggedIn: boolean
  login: (data: LoginPayload) => void
  logout: () => void
  updateUser: (u: Partial<AuthUser>) => void
  hasRole: (role: string) => boolean
  rolesActifs: string[]
  /** Rôle "espace" actuellement parcouru (peut différer du rôle principal
   *  quand un propriétaire/démarcheur a activé le rôle prospect pour
   *  naviguer côté client). */
  activeRole: string
  setActiveRole: (role: string) => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  hasRole: () => false,
  rolesActifs: [],
  activeRole: '',
  setActiveRole: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser<AuthUser>())
  const [token, setToken] = useState<string | null>(() =>
    tokenStore.getToken() || null
  )
  const [activeRole, setActiveRoleState] = useState<string>(() =>
    localStorage.getItem('rg_active_role') || ''
  )

  const setActiveRole = (role: string) => {
    setActiveRoleState(role)
    localStorage.setItem('rg_active_role', role)
  }

  const login = (data: LoginPayload) => {
    const u: AuthUser = data.user
    const t: string = data.access_token
    const rt: string = data.refresh_token
    setUser(u)
    setToken(t)
    writeStoredUser(u)
    tokenStore.setToken(t)
    tokenStore.setRefresh(rt)
    setActiveRole(u.role_principal || u.role)
  }

  const logout = () => {
    // Révocation serveur d'abord (lit les jetons avant leur effacement), puis nettoyage local.
    revokeSession()
    // Nettoyage à la déconnexion : un échec de désabonnement push ne doit pas bloquer la sortie
    void unsubscribeFromPush().catch(() => {})
    setActiveRoleState('')
    localStorage.removeItem('rg_active_role')
    setUser(null)
    setToken(null)
    localStorage.removeItem('rg_user')
    tokenStore.clearTokens()
    clearFormDrafts()
  }

  const updateUser = (partial: Partial<AuthUser>) => {
    if (!user) return
    const updated = { ...user, ...partial }
    setUser(updated)
    writeStoredUser(updated)
  }

  const rolesActifs: string[] = user?.roles_actifs ?? (user?.role ? [user.role] : [])

  const hasRole = (role: string) => rolesActifs.includes(role)

  const fallbackRole = user?.role_principal || user?.role || ''
  const candidate = activeRole || fallbackRole
  const computedActiveRole = (candidate && rolesActifs.includes(candidate)) ? candidate : fallbackRole
  const rolesKey = rolesActifs.join(',')

  // Après rechargement, seul le profil minimal est persisté (FE-E-006) :
  // les coordonnées sont rechargées en mémoire depuis GET /users/me, sans persistance.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    userApi.me().then((full) => {
      if (cancelled || !full || typeof full !== 'object') return
      const { roles_actifs: _r, role_principal: _p, role: _ro, ...details } = full
      setUser(prev => (prev ? { ...prev, ...details } : prev))
    }).catch(() => { /* enrichissement du profil facultatif : la session garde les informations déjà connues */ })
    return () => { cancelled = true }
  }, [token])

  // Resynchronise localStorage si activeRole stocké n'est plus valide
  useEffect(() => {
    if (user && activeRole && activeRole !== computedActiveRole) {
      setActiveRole(computedActiveRole)
    }
  }, [user, rolesKey, activeRole, computedActiveRole])

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout, updateUser, hasRole, rolesActifs, activeRole: computedActiveRole, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
