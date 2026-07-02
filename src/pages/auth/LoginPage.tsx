import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'

const COUNTRY_CODES = [
  { code: '+229', label: 'BJ +229' },
  { code: '+228', label: 'TG +228' },
  { code: '+225', label: 'CI +225' },
  { code: '+221', label: 'SN +221' },
  { code: '+33',  label: 'FR +33'  },
]

const BackIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const KeyIcon = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)
const ArrowIcon = () => (
  <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)
const ErrorIcon = () => (
  <svg className="w-4.5 h-4.5 text-danger flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

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
    <div className="min-h-dvh bg-[#F4F6FA] flex flex-col">
      {/* Header */}
      <div
        className="px-6 pb-9 rounded-b-[36px]"
        style={{
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0F3460 100%)',
          paddingTop: 'max(env(safe-area-inset-top, 0px) + 20px, 52px)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl mb-7"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <BackIcon />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px]"
            style={{
              background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)',
              boxShadow: '0 4px 12px rgba(75,107,255,0.4)',
            }}
          >
            <KeyIcon />
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-tight">REFUGE</p>
            <p className="text-white/50 text-[11px]">Immobilier au Bénin</p>
          </div>
        </div>

        <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight">Bon retour !</h1>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">
          Connectez-vous pour accéder<br />à votre espace personnalisé.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-7 pb-6">
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-danger/8 border border-danger/30 rounded-xl px-4 py-3">
              <ErrorIcon />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="text-[13px] font-semibold text-text-dark mb-2 block">
              Numéro de téléphone
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="bg-white border border-divider rounded-xl px-3 py-3 text-sm font-medium text-text-dark outline-none focus:border-primary"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="97 00 00 00"
                className="flex-1 bg-white border border-divider rounded-xl px-4 py-3 text-sm text-text-dark outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-text-dark mb-2 block">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <LockIcon />
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-divider rounded-xl pl-11 pr-12 py-3 text-sm text-text-dark outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-grey"
              >
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-[14px] rounded-[14px] font-bold text-base shadow-btn disabled:opacity-70 flex items-center justify-center gap-2 transition-opacity"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="text-[15px]">Connexion en cours…</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowIcon />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pb-6 text-center">
        <p className="text-text-grey text-sm">
          Nouveau ici ?{' '}
          <Link to="/register" className="text-primary font-bold">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
