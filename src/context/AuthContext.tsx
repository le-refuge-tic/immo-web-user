import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type AuthUser = {
  id: number
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  role: string
  roles_actifs?: string[]
  role_principal?: string
  photo_profil: string | null
  score_credibilite?: number
  nb_etoiles?: number
  penalite_pourcentage?: number
}

type AuthCtx = {
  user: AuthUser | null
  token: string | null
  isLoggedIn: boolean
  login: (data: any) => void
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
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('rg_user') || 'null') }
    catch { return null }
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('rg_token')
  )
  const [activeRole, setActiveRoleState] = useState<string>(() =>
    localStorage.getItem('rg_active_role') || ''
  )

  const setActiveRole = (role: string) => {
    setActiveRoleState(role)
    localStorage.setItem('rg_active_role', role)
  }

  const login = (data: any) => {
    const u: AuthUser = data.user
    const t: string = data.access_token
    const rt: string = data.refresh_token
    setUser(u)
    setToken(t)
    localStorage.setItem('rg_user', JSON.stringify(u))
    localStorage.setItem('rg_token', t)
    localStorage.setItem('rg_refresh', rt)
    setActiveRole(u.role_principal || u.role)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setActiveRoleState('')
    localStorage.removeItem('rg_user')
    localStorage.removeItem('rg_token')
    localStorage.removeItem('rg_refresh')
    localStorage.removeItem('rg_active_role')
  }

  const updateUser = (partial: Partial<AuthUser>) => {
    if (!user) return
    const updated = { ...user, ...partial }
    setUser(updated)
    localStorage.setItem('rg_user', JSON.stringify(updated))
  }

  const rolesActifs: string[] = user?.roles_actifs ?? (user?.role ? [user.role] : [])

  const hasRole = (role: string) => rolesActifs.includes(role)

  useEffect(() => {}, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout, updateUser, hasRole, rolesActifs, activeRole: activeRole || user?.role_principal || user?.role || '', setActiveRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
