import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'

const COUNTRY_CODES = [
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = countryCode + phone.trim()
      const data = await authApi.loginPhone(fullPhone, password)
      login(data)
      const role = data.user?.role
      if (role === 'proprietaire') navigate('/proprietaire', { replace: true })
      else if (role === 'demarcheur') navigate('/demarcheur', { replace: true })
      else navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Identifiants incorrects')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-app-bg flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[#7B4BFF] px-6 pt-16 pb-10 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Bon retour !</h1>
        <p className="text-white/70 text-sm mt-1">Connectez-vous pour continuer</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 pb-6">
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-text-dark mb-2 block">Numéro de téléphone</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="bg-white border border-divider rounded-xl px-3 py-3 text-sm font-medium text-text-dark outline-none focus:border-primary"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="97 00 00 00"
                className="flex-1 bg-white border border-divider rounded-xl px-4 py-3 text-sm text-text-dark outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-text-dark mb-2 block">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm text-text-dark outline-none focus:border-primary pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-grey"
              >
                {showPwd ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-btn disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-text-grey text-sm">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary font-bold">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
