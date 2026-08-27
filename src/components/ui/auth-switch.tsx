import { cn } from '../../lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import { SKIP_OTP_UI, DUMMY_OTP_CODE } from '../../utils/otpBypass'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Eye, EyeOff, Search, Home, Check, ShieldCheck, AlertTriangle, Loader2, Lock, ChevronDown, Mail } from 'lucide-react'
import { ImageSlider } from './image-slider'
import { CountryFlag } from './auth/CountryFlag'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import slide1 from '../../assets/onboarding-1.jpg'
import slide2 from '../../assets/onboarding-2.jpg'
import slide3 from '../../assets/onboarding-3.jpg'
import slide4 from '../../assets/hero-interior.jpg'
import '../../pages/auth/authNew.css'

const COUNTRY_CODES = [
  { code: '+229', label: 'Bénin' },
  { code: '+228', label: 'Togo' },
  { code: '+225', label: "Côte d'Ivoire" },
  { code: '+221', label: 'Sénégal' },
  { code: '+33',  label: 'France' },
]

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

type RoleOption = { key: string; label: string; desc: string; icon: React.ReactNode }
const ROLES: RoleOption[] = [
  { key: 'prospect',     label: 'Je cherche un bien',   desc: 'À louer ou à acheter',              icon: <Search size={20} /> },
  { key: 'proprietaire', label: 'Je suis propriétaire', desc: 'Je mets mon bien en location/vente', icon: <Home size={20} /> },
]

// Slide dédiée à la marque REFUGE (premier élément du carrousel)
function BrandSlide() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(145deg, #1a2a6c 0%, #2d4de0 35%, #4B6BFF 65%, #3a1f6b 100%)',
      }}
    >
      <img
        src={logoUrl}
        alt="REFUGE"
        className="object-contain drop-shadow-2xl mb-4"
        style={{ width: 140, height: 140 }}
      />
      <span
        className="text-white font-black tracking-[0.18em] uppercase drop-shadow-lg"
        style={{ fontSize: '2rem', letterSpacing: '0.22em' }}
      >
        REFUGE
      </span>
      <span className="text-white/60 text-sm font-medium mt-2 tracking-wide">
        Votre logement idéal au Bénin
      </span>
    </div>
  )
}

const SLIDES = [<BrandSlide key="brand" />, slide1, slide2, slide3, slide4]

const PITCH_ITEMS = [
  'Maisons, appartements, terrains vérifiés',
  'Réservez des visites en quelques clics',
  'Échangez directement avec les propriétaires',
]

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
}

// ── Panneau gauche : ImageSlider + overlay REFUGE ──────────────────────────
function SidePanel() {
  return (
    <div className="auth-side hidden lg:flex">
      <ImageSlider slides={SLIDES} interval={4000} className="absolute inset-0" />

      {/* Overlay gradient pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1D1D1F]/80 via-[#1D1D1F]/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#4B6BFF]/30 to-transparent" />

      {/* Bord droit en fondu — pas de séparateur blanc */}
      <div className="auth-side-fade" aria-hidden="true" />

      {/* Contenu sur l'overlay */}
      <div className="relative z-10 flex flex-col h-full p-8 justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="REFUGE" className="w-12 h-12 object-contain drop-shadow-lg" />
          <span className="text-white text-xl font-black tracking-tight drop-shadow">REFUGE</span>
        </div>

        {/* Tagline + pitch en bas */}
        <div>
          <p className="text-white text-3xl font-black leading-tight tracking-tight drop-shadow-lg mb-5">
            Trouvez votre<br />
            <span className="text-[#FF6B35]">logement idéal</span><br />
            au Bénin
          </p>
          <div className="flex flex-col gap-2">
            {PITCH_ITEMS.map(text => (
              <div key={text} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4B6BFF] shrink-0" />
                <span className="text-white/90 text-sm font-medium drop-shadow">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sous-composants UI partagés (inline dans ce fichier standalone) ─────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 mb-3"
        >
          <AlertTriangle size={15} className="mt-px shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PrimaryButton({
  loading, disabled, loadingLabel, children, onClick, type = 'submit', className = '',
}: {
  loading?: boolean; disabled?: boolean; loadingLabel?: string
  children: React.ReactNode; onClick?: () => void; type?: 'submit' | 'button'; className?: string
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'relative flex w-full items-center justify-center gap-2 rounded-xl h-10 text-[14px] font-bold bg-primary text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B6BFF] focus-visible:ring-offset-2',
        className,
      )}
    >
      {loading ? <><Loader2 size={16} className="animate-spin" />{loadingLabel ?? children}</> : children}
    </motion.button>
  )
}

// ── Champ téléphone unifié (drapeau + indicatif | numéro) ────────────────────
function PhoneInput({
  countryCode, phone, onCountryChange, onPhoneChange, autoComplete = 'tel',
}: {
  countryCode: string; phone: string
  onCountryChange: (v: string) => void; onPhoneChange: (v: string) => void
  autoComplete?: string
}) {
  const current = COUNTRY_CODES.find(c => c.code === countryCode) ?? COUNTRY_CODES[0]
  return (
    <div className="auth-phone">
      <div className="auth-phone-country">
        <CountryFlag code={current.code} />
        <span className="auth-phone-code">{current.code}</span>
        <ChevronDown size={14} className="auth-phone-caret" />
        <select
          className="auth-phone-select"
          value={countryCode}
          onChange={e => onCountryChange(e.target.value)}
          aria-label="Indicatif pays"
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
          ))}
        </select>
      </div>
      <span className="auth-phone-divider" />
      <input
        type="tel"
        className="auth-phone-number"
        value={phone}
        onChange={e => onPhoneChange(e.target.value)}
        placeholder="97 00 00 00"
        autoComplete={autoComplete}
      />
    </div>
  )
}

// ── Formulaire de connexion ─────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formStep, setFormStep] = useState<'credentials' | 'otp'>('credentials')
  const [stepDir, setStepDir] = useState(1)
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
    const redirect = sessionStorage.getItem('post_login_redirect')
    if (redirect) { sessionStorage.removeItem('post_login_redirect'); navigate(redirect, { replace: true }); return }
    const role = data.user?.role
    if (role === 'proprietaire') navigate('/proprietaire', { replace: true })
    else if (role === 'demarcheur') navigate('/demarcheur', { replace: true })
    else navigate('/', { replace: true })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true); setError('')
    try {
      const fullPhone = countryCode + phone.trim()
      const data = await withColdStartRetry(
        () => authApi.loginPhone(fullPhone, password),
        () => setError('Le serveur se réveille, nouvelle tentative…'),
      )
      setError('')
      if (data.requires_otp && data.session_token) {
        setSessionToken(data.session_token)
        if (SKIP_OTP_UI) {
          try {
            const otpData = await withColdStartRetry(() => authApi.verifyOtp(data.session_token, DUMMY_OTP_CODE))
            completeLogin(otpData); setLoading(false); return
          } catch (_) {}
        }
        setOtpDigits(Array(OTP_LENGTH).fill('')); setOtpError('')
        setStepDir(1); setFormStep('otp')
        setResendCooldown(RESEND_COOLDOWN); setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else { completeLogin(data) }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : 'Identifiants incorrects'))
    }
    setLoading(false)
  }

  const resendOtp = async () => {
    if (resendCooldown > 0) return
    setLoading(true); setOtpError('')
    try {
      const fullPhone = countryCode + phone.trim()
      const data = await withColdStartRetry(() => authApi.loginPhone(fullPhone, password), () => setOtpError('Le serveur se réveille…'))
      setOtpError('')
      if (data.requires_otp && data.session_token) { setSessionToken(data.session_token); setOtpDigits(Array(OTP_LENGTH).fill('')); setResendCooldown(RESEND_COOLDOWN) }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : "Impossible de renvoyer le code"))
    }
    setLoading(false)
  }

  const verifyOtp = async (code: string, tokenOverride?: string) => {
    if (code.length < OTP_LENGTH) return
    setOtpLoading(true); setOtpError('')
    try {
      const data = await withColdStartRetry(() => authApi.verifyOtp(tokenOverride ?? sessionToken, code))
      completeLogin(data)
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : 'Code incorrect'))
    }
    setOtpLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[index] = digit; setOtpDigits(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
    const code = next.join(''); if (code.length === OTP_LENGTH) verifyOtp(code)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const maskedPhone = phone.length >= 4 ? `••••${phone.slice(-4)}` : phone
  const transition = { duration: prefersReduced ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] as any }

  return (
    <AnimatePresence mode="wait" custom={stepDir}>
      {formStep === 'credentials' ? (
        <motion.div key="creds" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
          <h2 className="auth-title">Bienvenue</h2>
          <p className="auth-sub">Connectez-vous pour accéder à votre espace</p>
          <ErrorBanner message={error} />
          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <div className="auth-field">
              <label className="auth-label">Numéro de téléphone</label>
              <PhoneInput countryCode={countryCode} phone={phone} onCountryChange={setCountryCode} onPhoneChange={setPhone} />
            </div>
            <div className="auth-field">
              <label className="auth-label">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="auth-input pad-icon-left pad-icon-right w-full" />
                <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} aria-label={showPwd ? 'Masquer' : 'Afficher'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <PrimaryButton loading={loading} loadingLabel="Connexion…" className="mt-1">Se connecter</PrimaryButton>
          </form>
          <div className="auth-divider" />
          <p className="auth-footer">
            Nouveau ici ?{' '}
            <button type="button" onClick={onSwitch} className="auth-link">Créer un compte</button>
          </p>
          <button type="button" onClick={() => navigate(-1)} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Retour à l'accueil
          </button>
        </motion.div>
      ) : (
        <motion.div key="otp" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(75,107,255,0.12)]">
              <ShieldCheck size={22} className="text-[#4B6BFF]" />
            </div>
            <h2 className="auth-title">Vérification</h2>
            <p className="auth-sub">Code envoyé au numéro se terminant par <strong className="text-[#1D1D1F]">{maskedPhone}</strong></p>
          </div>
          <ErrorBanner message={otpError} />
          <div className="flex gap-2 mb-5 justify-center">
            {otpDigits.map((d, i) => (
              <motion.input key={i} ref={el => { otpRefs.current[i] = el }} value={d}
                onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                inputMode="numeric" maxLength={1} disabled={otpLoading}
                animate={{ borderColor: d ? '#4B6BFF' : otpError ? '#FF3B30' : 'rgba(0,0,0,0.12)', backgroundColor: d ? 'rgba(75,107,255,0.06)' : '#F5F5F7' }}
                transition={{ duration: 0.15 }}
                className="h-11 w-9 rounded-xl border-[1.5px] text-center text-lg font-bold text-[#1D1D1F] outline-none disabled:opacity-50 focus:border-[#4B6BFF] focus:shadow-[0_0_0_3px_rgba(75,107,255,0.15)] focus:bg-white"
                aria-label={`Chiffre ${i + 1}`}
              />
            ))}
          </div>
          <PrimaryButton type="button" onClick={() => verifyOtp(otpDigits.join(''))} loading={otpLoading} disabled={otpDigits.some(d => !d)} loadingLabel="Vérification…">Confirmer</PrimaryButton>
          <div className="mt-3 text-sm text-[#6E6E73] text-center">
            {resendCooldown > 0 ? <span>Renvoyer dans <strong className="text-[#1D1D1F]">{resendCooldown}s</strong></span> : (
              <button type="button" onClick={resendOtp} disabled={loading} className="font-semibold text-[#4B6BFF] hover:underline disabled:opacity-60">
                {loading ? 'Envoi…' : 'Renvoyer le code'}
              </button>
            )}
          </div>
          <button type="button" onClick={() => { setStepDir(-1); setFormStep('credentials'); setError('') }} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Retour
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Formulaire d'inscription ────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const [step, setStep] = useState(1)
  const [stepDir, setStepDir] = useState(1)
  const [role, setRole] = useState(() => {
    const suggere = localStorage.getItem('rg_role_suggere')
    return suggere === 'proprietaire' || suggere === 'prospect' ? suggere : ''
  })
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const telephone = countryCode + phone.trim()

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const completeLogin = (data: any) => {
    login(data)
    const userRole = data.user?.role
    if (userRole === 'proprietaire') navigate('/proprietaire', { replace: true })
    else if (userRole === 'demarcheur') navigate('/demarcheur', { replace: true })
    else navigate('/', { replace: true })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPwd) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min.)'); return }
    if (!acceptedTerms) { setError('Veuillez accepter les conditions d\'utilisation'); return }
    setLoading(true); setError('')
    try {
      const body: any = { role, nom, prenom, password }
      if (phone.trim()) body.telephone = telephone
      if (email.trim()) body.email = email.trim()
      await authApi.register(body)
      const data = await withColdStartRetry(() => authApi.loginPhone(telephone, password), () => setError('Le serveur se réveille, nouvelle tentative…'))
      setError('')
      if (data.requires_otp && data.session_token) {
        setSessionToken(data.session_token)
        if (SKIP_OTP_UI) {
          try {
            const otpData = await withColdStartRetry(() => authApi.verifyOtp(data.session_token, DUMMY_OTP_CODE))
            completeLogin(otpData); setLoading(false); return
          } catch (_) {}
        }
        setOtpDigits(Array(OTP_LENGTH).fill('')); setOtpError('')
        setStepDir(1); setStep(3)
        setResendCooldown(RESEND_COOLDOWN); setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else { completeLogin(data) }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : "Erreur lors de l'inscription"))
    }
    setLoading(false)
  }

  const resendOtp = async () => {
    if (resendCooldown > 0) return
    setResending(true); setOtpError('')
    try {
      const data = await withColdStartRetry(() => authApi.loginPhone(telephone, password), () => setOtpError('Le serveur se réveille…'))
      setOtpError('')
      if (data.requires_otp && data.session_token) { setSessionToken(data.session_token); setOtpDigits(Array(OTP_LENGTH).fill('')); setResendCooldown(RESEND_COOLDOWN) }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : "Impossible de renvoyer le code"))
    }
    setResending(false)
  }

  const verifyOtp = async (code: string, tokenOverride?: string) => {
    if (code.length < OTP_LENGTH) return
    setOtpLoading(true); setOtpError('')
    try {
      const data = await withColdStartRetry(() => authApi.verifyOtp(tokenOverride ?? sessionToken, code))
      completeLogin(data)
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : 'Code incorrect'))
    }
    setOtpLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[index] = digit; setOtpDigits(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
    const code = next.join(''); if (code.length === OTP_LENGTH) verifyOtp(code)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const maskedPhone = phone.length >= 4 ? `••••${phone.slice(-4)}` : phone
  const goTo = (s: number) => { setStepDir(s > step ? 1 : -1); setStep(s) }
  const transition = { duration: prefersReduced ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] as any }

  return (
    <>
      {step !== 3 && (
        <div className="auth-step-dots">
          {[1, 2, 3].map(s => (
            <div key={s} className={`auth-step-dot${s === step ? ' active' : s < step ? ' done' : ''}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" custom={stepDir}>
        {step === 1 && (
          <motion.div key="r1" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
            <h2 className="auth-title">Qui êtes-vous ?</h2>
            <p className="auth-sub">Choisissez le profil qui vous correspond</p>
            <ErrorBanner message={error} />
            <div className="flex flex-col gap-2">
              {ROLES.map(r => (
                <button key={r.key} type="button" onClick={() => setRole(r.key)} className={`auth-role-card${role === r.key ? ' active' : ''}`}>
                  <div className="auth-role-icon">{r.icon}</div>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-bold text-[#1D1D1F]">{r.label}</p>
                    <p className="text-xs text-[#6E6E73] mt-0.5">{r.desc}</p>
                  </div>
                  <div className="auth-role-check">{role === r.key && <Check size={11} strokeWidth={3} />}</div>
                </button>
              ))}
            </div>
            <PrimaryButton type="button" onClick={() => { if (!role) { setError('Choisissez un profil'); return } setError(''); goTo(2) }} className="mt-5">Continuer</PrimaryButton>
            <div className="auth-divider" />
            <p className="auth-footer">Déjà un compte ?{' '}<button type="button" onClick={onSwitch} className="auth-link">Se connecter</button></p>
            <button type="button" onClick={() => navigate(-1)} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Retour à l'accueil</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="r2" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
            <h2 className="auth-title">Vos informations</h2>
            <p className="auth-sub">Quelques infos pour créer votre compte</p>
            <ErrorBanner message={error} />
            <form onSubmit={handleRegister} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="auth-field flex-1">
                  <label className="auth-label">Nom</label>
                  <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" required className="auth-input" />
                </div>
                <div className="auth-field flex-1">
                  <label className="auth-label">Prénom</label>
                  <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" required className="auth-input" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Téléphone</label>
                <PhoneInput countryCode={countryCode} phone={phone} onCountryChange={setCountryCode} onPhoneChange={setPhone} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email <span className="normal-case font-normal text-[#6E6E73]">(optionnel)</span></label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" className="auth-input pad-icon-left w-full" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 caractères" required className="auth-input pad-icon-left pad-icon-right w-full" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirmer</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Répéter le mot de passe" required className="auth-input pad-icon-left pad-icon-right w-full" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <label className="auth-terms">
                <input type="checkbox" className="sr-only" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span className="auth-terms-box">{acceptedTerms && <Check size={12} strokeWidth={3} />}</span>
                <span className="auth-terms-text">
                  J'accepte les{' '}
                  <a href="/conditions" target="_blank" rel="noreferrer" className="auth-link">conditions d'utilisation</a>
                  {' '}et la{' '}
                  <a href="/confidentialite" target="_blank" rel="noreferrer" className="auth-link">politique de confidentialité</a>.
                </span>
              </label>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => { setError(''); goTo(1) }} className="h-12 rounded-xl border border-[rgba(0,0,0,0.12)] bg-transparent px-5 text-[15px] font-bold text-[#1D1D1F] hover:bg-black/5 transition-colors shrink-0">Retour</button>
                <PrimaryButton loading={loading} loadingLabel="Création…" className="flex-1">S'inscrire</PrimaryButton>
              </div>
            </form>
            <div className="auth-divider" />
            <p className="auth-footer">Déjà un compte ?{' '}<button type="button" onClick={onSwitch} className="auth-link">Se connecter</button></p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="r3" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(75,107,255,0.12)]">
                <ShieldCheck size={28} className="text-[#4B6BFF]" />
              </div>
              <h2 className="auth-title">Vérification</h2>
              <p className="auth-sub">Code envoyé au numéro se terminant par <strong className="text-[#1D1D1F]">{maskedPhone}</strong></p>
            </div>
            <ErrorBanner message={otpError} />
            <div className="flex gap-2 mb-5 justify-center">
              {otpDigits.map((d, i) => (
                <motion.input key={i} ref={el => { otpRefs.current[i] = el }} value={d}
                  onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                  inputMode="numeric" maxLength={1} disabled={otpLoading}
                  animate={{ borderColor: d ? '#4B6BFF' : otpError ? '#FF3B30' : 'rgba(0,0,0,0.12)', backgroundColor: d ? 'rgba(75,107,255,0.06)' : '#F5F5F7' }}
                  transition={{ duration: 0.15 }}
                  className="h-11 w-9 rounded-xl border-[1.5px] text-center text-lg font-bold text-[#1D1D1F] outline-none disabled:opacity-50 focus:border-[#4B6BFF] focus:shadow-[0_0_0_3px_rgba(75,107,255,0.15)] focus:bg-white"
                  aria-label={`Chiffre ${i + 1}`}
                />
              ))}
            </div>
            <PrimaryButton type="button" onClick={() => verifyOtp(otpDigits.join(''))} loading={otpLoading} disabled={otpDigits.some(d => !d)} loadingLabel="Vérification…">Confirmer</PrimaryButton>
            <div className="mt-3 text-sm text-[#6E6E73] text-center">
              {resendCooldown > 0 ? <span>Renvoyer dans <strong className="text-[#1D1D1F]">{resendCooldown}s</strong></span> : (
                <button type="button" onClick={resendOtp} disabled={resending} className="font-semibold text-[#4B6BFF] hover:underline disabled:opacity-60">
                  {resending ? 'Envoi…' : 'Renvoyer le code'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Toggle switch Login / Register ──────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: 'login' | 'register'; onChange: (m: 'login' | 'register') => void }) {
  return (
    <div className="flex items-center bg-[rgba(0,0,0,0.05)] rounded-xl p-0.5 mb-4">
      {(['login', 'register'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'flex-1 h-8 rounded-[10px] text-[13px] font-bold transition-all duration-200',
            mode === m
              ? 'bg-white text-[#4B6BFF] shadow-sm'
              : 'text-[#6E6E73] hover:text-[#1D1D1F]'
          )}
        >
          {m === 'login' ? 'Connexion' : 'Inscription'}
        </button>
      ))}
    </div>
  )
}

// ── Bulles décoratives d'arrière-plan (panneau formulaire) ─────────────────
const BUBBLES = [
  { size: 320, top: '-10%', left: '-14%', color1: 'rgba(75,107,255,0.28)',  color2: 'rgba(75,107,255,0.06)',  delay: 0   },
  { size: 220, top: '62%',  left: '-10%', color1: 'rgba(255,107,53,0.22)',  color2: 'rgba(255,107,53,0.04)',  delay: 1.8 },
  { size: 170, top: '8%',   left: '70%',  color1: 'rgba(168,85,247,0.20)',  color2: 'rgba(168,85,247,0.04)',  delay: 3.2 },
  { size: 260, top: '72%',  left: '58%',  color1: 'rgba(75,107,255,0.18)',  color2: 'rgba(75,107,255,0.03)',  delay: 0.9 },
  { size: 120, top: '35%',  left: '85%',  color1: 'rgba(255,107,53,0.16)',  color2: 'rgba(255,107,53,0.03)',  delay: 2.5 },
  { size: 90,  top: '50%',  left: '16%',  color1: 'rgba(168,85,247,0.14)',  color2: 'rgba(168,85,247,0.02)',  delay: 4.1 },
  { size: 70,  top: '20%',  left: '42%',  color1: 'rgba(75,107,255,0.12)',  color2: 'rgba(75,107,255,0.02)',  delay: 1.4 },
]

function PanelBubbles() {
  return (
    <div className="auth-bubbles" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="auth-bubble"
          style={{
            width:  b.size,
            height: b.size,
            top:    b.top,
            left:   b.left,
            background: `radial-gradient(circle at 30% 30%, ${b.color1} 0%, ${b.color2} 55%, transparent 75%)`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Composant principal exporté ─────────────────────────────────────────────
export function AuthSwitch({ defaultMode = 'login' }: { defaultMode?: 'login' | 'register' }) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)

  return (
    <div className="auth-root">
      <SidePanel />

      <div className="auth-panel">
        <PanelBubbles />
        <div className="auth-form-inner">
          <div className="flex justify-center mb-3">
            <img src={logoUrl} alt="REFUGE" className="w-20 h-20 object-contain drop-shadow-md" />
          </div>

          <ModeToggle mode={mode} onChange={setMode} />

          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />
          }
        </div>
      </div>
    </div>
  )
}

export { AuthSwitch as Component }
export default AuthSwitch
