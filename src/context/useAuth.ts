import { createContext, useContext } from 'react'
import type { LoginPayload, SessionUser } from '../types/session'

export type AuthUser = SessionUser

export type AuthCtx = {
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

export const AuthContext = createContext<AuthCtx>({
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

export const useAuth = () => useContext(AuthContext)
