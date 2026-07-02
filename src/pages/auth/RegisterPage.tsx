import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'

const COUNTRY_CODES = [
  { code: '+229', flag: '🇧🇯' },
  { code: '+228', flag: '🇹🇬' },
  { code: '+225', flag: '🇨🇮' },
  { code: '+221', flag: '🇸🇳' },
  { code: '+33', flag: '🇫🇷' },
]

const ROLES = [
  { key: 'prospect', label: 'Je cherche un bien', desc: 'À louer ou à acheter', icon: '🔍' },
  { key: 'proprietaire', label: 'Je suis propriétaire', desc: 'Je mets mon bien en location/vente', icon: '🏠' },
  { key: 'demarcheur', label: 'Je suis démarcheur', desc: 'Agent immobilier indépendant', icon: '💼' },
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
      // auto-login
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
    <div className="min-h-dvh bg-app-bg flex flex-col">
      <div className="bg-gradient-to-br from-primary to-[#7B4BFF] px-6 pt-14 pb-8 text-center">
        <h1 className="text-white text-2xl font-bold">Créer un compte</h1>
        <p className="text-white/70 text-sm mt-1">Rejoignez REFUGE</p>
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-white' : 'w-4 bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-6">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
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
                    role === r.key
                      ? 'border-primary bg-primary-l'
                      : 'border-divider bg-white'
                  }`}
                >
                  <span className="text-3xl">{r.icon}</span>
                  <div>
                    <p className="font-bold text-text-dark text-sm">{r.label}</p>
                    <p className="text-text-grey text-xs mt-0.5">{r.desc}</p>
                  </div>
                  {role === r.key && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (!role) { setError('Choisissez un profil'); return }; setError(''); setStep(2) }}
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
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-text-dark mb-1.5 block">Prénom</label>
                <input
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  placeholder="Jean"
                  required
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
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
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="97 00 00 00"
                  className="flex-1 bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
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
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
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
                  className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary pr-12"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-grey">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
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
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary"
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
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-btn disabled:opacity-60"
              >
                {loading ? 'Création…' : "S'inscrire"}
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
