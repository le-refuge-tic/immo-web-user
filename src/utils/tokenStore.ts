const TOKEN_KEY   = 'rg_token'
const REFRESH_KEY = 'rg_refresh'

export const tokenStore = {
  getToken:     () => sessionStorage.getItem(TOKEN_KEY) ?? '',
  setToken:     (t: string) => sessionStorage.setItem(TOKEN_KEY, t),
  getRefresh:   () => sessionStorage.getItem(REFRESH_KEY) ?? '',
  setRefresh:   (t: string) => sessionStorage.setItem(REFRESH_KEY, t),
  clearTokens:  () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
  },
}
