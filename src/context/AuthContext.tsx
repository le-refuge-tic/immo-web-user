import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type AuthUser = {
  id: number
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  role: string
  photo_profil: string | null
}

type AuthCtx = {
  user: AuthUser | null
  token: string | null
  isLoggedIn: boolean
  login: (data: any) => void
  logout: () => void
  updateUser: (u: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem('rg_user') || 'null') }
    catch { return null }
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('rg_token')
  )

  const login = (data: any) => {
    const u: AuthUser = data.user
    const t: string = data.access_token
    const rt: string = data.refresh_token
    setUser(u)
    setToken(t)
    localStorage.setItem('rg_user', JSON.stringify(u))
    localStorage.setItem('rg_token', t)
    localStorage.setItem('rg_refresh', rt)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('rg_user')
    localStorage.removeItem('rg_token')
    localStorage.removeItem('rg_refresh')
  }

  const updateUser = (partial: Partial<AuthUser>) => {
    if (!user) return
    const updated = { ...user, ...partial }
    setUser(updated)
    localStorage.setItem('rg_user', JSON.stringify(updated))
  }

  useEffect(() => {
    // nothing – values are loaded from localStorage on init
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
