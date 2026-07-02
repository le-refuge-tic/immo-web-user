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

const SearchRoleIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const HomeRoleIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const AgentRoleIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
const ErrorIcon = () => (
  <svg className="w-4.5 h-4.5 text-danger flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

type RoleOption = { key: string; label: string; desc: string; icon: React.ReactNode }
const ROLES: RoleOption[] = [
  { key: 'prospect',    label: 'Je cherche un bien',  desc: 'À louer ou à acheter',             icon: <SearchRoleIcon /> },
  { key: 'proprietaire', label: 'Je suis propriétaire', desc: 'Je mets mon bien en location/vente', icon: <HomeRoleIcon /> },
  { key: 'demarcheur',  label: 'Je suis démarcheur',  desc: 'Agent immobilier indépendant',       icon: <AgentRoleIcon /> },
]

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPwd) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min.)'); return }
    setLoading(true)
    setError('')
    try {
      const body: any = { role, nom, prenom, password }
      if (phone.trim()) body.telephone = countryCode + phone.trim()
      if (email.trim()) body.email = email.trim()
      await authApi.register(body)
      const fullPhone = countryCode + phone.trim()
      const data = await authApi.loginPhone(fullPhone, password)
      login(data)
      const userRole = data.user?.role
      if (userRole === 'proprietaire') navigate('/proprietaire', { replace: true })
      else if (userRole === 'demarcheur') navigate('/demarcheur', { replace: true })
      else navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'inscription")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-[#F4F6FA] flex flex-col">
      {/* Header */}
      <div
        className="px-6 pb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)',
          paddingTop: 'max(env(safe-area-inset-top, 0px) + 14px, 56px)',
        }}
      >
        <h1 className="text-white text-2xl font-bold">Créer un compte</h1>
        <p className="text-white/70 text-sm mt-1">Rejoignez REFUGE</p>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-white' : s < step ? 'w-4 bg-white' : 'w-4 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-6">
        {error && (
          <div className="flex items-center gap-2 bg-danger/8 border border-danger/30 rounded-xl px-4 py-3 mb-4">
            <ErrorIcon />
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-base font-bold text-text-dark mb-4">Qui êtes-vous ?</h2>
            <div className="space-y-3">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    role === r.key ? 'border-primary bg-primary-l' : 'border-divider bg-white'
                  }`}
                >
                  <div className={`${role === r.key ? 'text-primary' : 'text-text-grey'}`}>
                    {r.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-dark text-sm">{r.label}</p>
                    <p className="text-text-grey text-xs mt-0.5">{r.desc}</p>
                  </div>
                  {role === r.key && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!role) { setError('Choisissez un profil'); return }
                setError('')
                setStep(2)
              }}
              className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-btn"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-text-dark mb-1.5 block">Nom</label>
                <input
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Dupont"
                  required
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-text-dark mb-1.5 block">Prénom</label>
                <input
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  placeholder="Jean"
                  required
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Téléphone</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-white border border-divider rounded-xl px-3 py-3 text-sm outline-none focus:border-primary"
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
                  className="flex-1 bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Email (optionnel)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  required
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary pr-12 transition-colors"
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

            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Répéter le mot de passe"
                required
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-divider bg-white text-text-dark py-4 rounded-xl font-bold text-sm"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-btn disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Création…</span>
                  </>
                ) : "S'inscrire"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <p className="text-text-grey text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
