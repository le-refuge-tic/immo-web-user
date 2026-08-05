import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import logoUrl from '../../assets/REFUGE-ICON.png'
import brandingImg from '../../assets/hero-interior.jpg'

const COUNTRY_CODES = [
  { code: '+229', label: 'BJ +229' },
  { code: '+228', label: 'TG +228' },
  { code: '+225', label: 'CI +225' },
  { code: '+221', label: 'SN +221' },
  { code: '+33',  label: 'FR +33'  },
]

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── 2FA obligatoire : après validation du mot de passe, un code SMS
  // doit être vérifié avant d'obtenir les tokens de session. ──────────────
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [sessionToken, setSessionToken] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const completeLogin = (data: any) => {
    login(data)
    const role = data.user?.role
    if (role === 'proprietaire') navigate('/proprietaire', { replace: true })
    else if (role === 'demarcheur') navigate('/demarcheur', { replace: true })
    else navigate('/', { replace: true })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = countryCode + phone.trim()
      const data = await withColdStartRetry(
        () => authApi.loginPhone(fullPhone, password),
        () => setError('Le serveur se réveille, nouvelle tentative…'),
      )
      setError('')
      if (data.requires_otp && data.session_token) {
        setSessionToken(data.session_token)
        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setOtpError('')
        setStep('otp')
        setResendCooldown(RESEND_COOLDOWN)
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else {
        completeLogin(data)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : 'Identifiants incorrects'))
    }
    setLoading(false)
  }

  const resendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    setOtpError('')
    try {
      const fullPhone = countryCode + phone.trim()
      const data = await withColdStartRetry(
        () => authApi.loginPhone(fullPhone, password),
        () => setOtpError('Le serveur se réveille, nouvelle tentative…'),
      )
      setOtpError('')
      if (data.requires_otp && data.session_token) {
        setSessionToken(data.session_token)
        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setResendCooldown(RESEND_COOLDOWN)
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : "Impossible de renvoyer le code"))
    }
    setLoading(false)
  }

  const verifyOtp = async (code: string) => {
    if (code.length < OTP_LENGTH) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const data = await withColdStartRetry(() => authApi.verifyOtp(sessionToken, code))
      completeLogin(data)
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : 'Code incorrect'))
    }
    setOtpLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
    const code = next.join('')
    if (code.length === OTP_LENGTH) verifyOtp(code)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const maskedPhone = phone.length >= 4 ? `••••${phone.slice(-4)}` : phone

  return (
    <div className="min-h-dvh flex">

      {/* ── Colonne gauche — branding (desktop only) ── */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-between w-1/2 p-12">
        <img src={brandingImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(13,27,42,0.92) 0%, rgba(15,52,96,0.88) 60%, rgba(26,26,110,0.92) 100%)' }} />
        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src={logoUrl} alt="REFUGE" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <span className="font-bold text-2xl tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</span>
        </div>

        {/* Pitch */}
        <div className="relative">
          <h1 className="text-white text-4xl font-bold leading-tight mb-5">
            Trouvez votre<br />
            <span style={{ color: '#7B9BFF' }}>logement idéal</span><br />
            au Bénin
          </h1>
          <div className="space-y-3">
            {[
              'Maisons, appartements, terrains vérifiés',
              'Réservez des visites en quelques clics',
              'Échangez directement avec les propriétaires',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7B9BFF' }} />
                <p className="text-white/70 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer tagline */}
        <p className="relative text-white/30 text-xs">© 2025 REFUGE — Immobilier au Bénin</p>
      </div>

      {/* ── Colonne droite — formulaire ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-app-bg md:bg-app-bg">

        {/* Header mobile uniquement */}
        <div
          className="md:hidden px-6 pb-9 rounded-b-[36px]"
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
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[46px] h-[46px] flex items-center justify-center rounded-[14px]" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <img src={logoUrl} alt="REFUGE" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            </div>
            <div>
              <p className="font-bold text-2xl tracking-tight" style={{ color: '#00AEEF' }}>REFUGE</p>
              <p className="text-white/50 text-[11px]">Immobilier au Bénin</p>
            </div>
          </div>
          <h1 className="text-white text-[32px] font-bold leading-tight">Bon retour !</h1>
          <p className="text-white/60 text-sm mt-2">Connectez-vous pour accéder à votre espace.</p>
        </div>

        {/* Formulaire */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
          <div className="w-full max-w-sm">

          {/* Desktop heading */}
          <div className="hidden md:block mb-10">
            <h2 className="text-3xl font-bold text-text-dark">Bon retour !</h2>
            <p className="text-text-grey mt-2">Connectez-vous pour accéder à votre espace personnalisé.</p>
          </div>

          {step === 'credentials' && (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">Numéro de téléphone</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="glass-input flex-shrink-0 w-[92px] rounded-xl px-2 py-3.5 text-sm font-medium text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
                  autoComplete="tel"
                  className="flex-1 min-w-0 glass-input rounded-xl px-4 py-3.5 text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">Mot de passe</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full glass-input rounded-xl pl-11 pr-12 py-3.5 text-sm text-text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-grey hover:text-text-dark transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-sm shadow-btn disabled:opacity-70 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
          )}

          {step === 'otp' && (
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ background: 'rgba(75,107,255,0.08)' }}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-dark text-center mb-2">Vérification</h3>
              <p className="text-text-grey text-sm text-center leading-relaxed mb-7">
                Entrez le code envoyé au numéro se terminant par{' '}
                <span className="font-bold text-text-dark">{maskedPhone}</span>
              </p>

              {otpError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-600 text-sm">{otpError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center mb-7">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el }}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    disabled={otpLoading}
                    className="w-11 h-14 text-center text-xl font-bold text-text-dark glass-input rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => verifyOtp(otpDigits.join(''))}
                disabled={otpLoading || otpDigits.some(d => !d)}
                className="w-full py-4 rounded-xl font-bold text-white text-sm shadow-btn disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
              >
                {otpLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Confirmer
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-text-grey text-sm text-center mt-5">
                {resendCooldown > 0 ? (
                  <>Renvoyer le code dans <span className="font-bold text-text-dark">{resendCooldown}s</span></>
                ) : (
                  <button type="button" onClick={resendOtp} disabled={loading} className="text-primary font-bold hover:underline disabled:opacity-60">
                    {loading ? 'Envoi…' : 'Renvoyer le code'}
                  </button>
                )}
              </p>

              <button type="button" onClick={() => { setStep('credentials'); setError('') }}
                className="w-full text-center text-text-grey text-sm mt-4 hover:text-text-dark transition-colors">
                Retour
              </button>
            </div>
          )}

          {step === 'credentials' && (
          <p className="text-text-grey text-sm text-center mt-8">
            Nouveau ici ?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Créer un compte</Link>
          </p>
          )}

          {/* Desktop back */}
          <button onClick={() => navigate(-1)} className="hidden md:flex items-center gap-2 text-text-grey hover:text-text-dark text-sm mt-8 mx-auto transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </button>

          </div>{/* /max-w-sm */}
        </div>
      </div>
    </div>
  )
}
