import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import { SKIP_OTP_UI, DUMMY_OTP_CODE } from '../../utils/otpBypass'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, Home, Check, Mail } from 'lucide-react'
import './authNew.css'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import AuthSidePanel from '../../components/ui/auth-switch'
import { AuthErrorBanner } from '../../components/ui/auth/AuthErrorBanner'
import { OtpInputGroup } from '../../components/ui/auth/OtpInputGroup'
import { SubmitButton } from '../../components/ui/auth/SubmitButton'
import { PhoneField } from '../../components/ui/auth/PhoneField'
import { PasswordField } from '../../components/ui/auth/PasswordField'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

type RoleOption = { key: string; label: string; desc: string; icon: React.ReactNode }
const ROLES: RoleOption[] = [
  { key: 'prospect',     label: 'Je cherche un bien',   desc: 'À louer ou à acheter',              icon: <Search size={20} /> },
  { key: 'proprietaire', label: 'Je suis propriétaire', desc: 'Je mets mon bien en location/vente', icon: <Home size={20} /> },
]

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -28, opacity: 0 }),
}

export default function RegisterPage() {
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
    setLoading(true)
    setError('')
    try {
      const body: any = { role, nom, prenom, password }
      if (phone.trim()) body.telephone = telephone
      if (email.trim()) body.email = email.trim()
      await authApi.register(body)
      const data = await withColdStartRetry(
        () => authApi.loginPhone(telephone, password),
        () => setError('Le serveur se réveille, nouvelle tentative…'),
      )
      setError('')
      if (data.requires_otp && data.session_token) {
        setSessionToken(data.session_token)

        if (SKIP_OTP_UI) {
          try {
            const otpData = await withColdStartRetry(() => authApi.verifyOtp(data.session_token, DUMMY_OTP_CODE))
            completeLogin(otpData)
            setLoading(false)
            return
          } catch (_) {}
        }

        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setOtpError('')
        setStepDir(1)
        setStep(3)
        setResendCooldown(RESEND_COOLDOWN)
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } else {
        completeLogin(data)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || (isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : "Erreur lors de l'inscription"))
    }
    setLoading(false)
  }

  const resendOtp = async () => {
    if (resendCooldown > 0) return
    setResending(true)
    setOtpError('')
    try {
      const data = await withColdStartRetry(
        () => authApi.loginPhone(telephone, password),
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
    setResending(false)
  }

  const verifyOtp = async (code: string, tokenOverride?: string) => {
    if (code.length < OTP_LENGTH) return
    setOtpLoading(true)
    setOtpError('')
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

  const goTo = (s: number) => {
    setStepDir(s > step ? 1 : -1)
    setStep(s)
  }

  const transition = { duration: prefersReduced ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] as any }

  return (
    <div className="auth-root">
      <AuthSidePanel />

      <div className="auth-panel">
        <div className="auth-form-inner">
          <div className="flex justify-center mb-3">
            <img src={logoUrl} alt="REFUGE" className="w-11 h-11 object-contain" />
          </div>

          {step !== 3 && (
            <div className="auth-step-dots">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`auth-step-dot${s === step ? ' active' : s < step ? ' done' : ''}`}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" custom={stepDir}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={stepDir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <h2 className="auth-title">Qui êtes-vous ?</h2>
                <p className="auth-sub">Choisissez le profil qui vous correspond</p>

                <AuthErrorBanner message={error} />

                <div className="flex flex-col gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`auth-role-card${role === r.key ? ' active' : ''}`}
                    >
                      <div className="auth-role-icon">{r.icon}</div>
                      <div className="flex-1 text-left">
                        <p className="text-[15px] font-bold text-text-dark">{r.label}</p>
                        <p className="text-xs text-text-grey mt-0.5">{r.desc}</p>
                      </div>
                      <div className="auth-role-check">
                        {role === r.key && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>

                <SubmitButton
                  type="button"
                  onClick={() => {
                    if (!role) { setError('Choisissez un profil'); return }
                    setError('')
                    goTo(2)
                  }}
                  className="mt-5"
                >
                  Continuer
                </SubmitButton>

                <div className="auth-divider" />
                <p className="auth-footer">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="auth-link">Se connecter</Link>
                </p>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mt-3 block w-full text-center text-sm font-semibold text-text-grey hover:text-text-dark transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Retour à l'accueil
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={stepDir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <h2 className="auth-title">Vos informations</h2>
                <p className="auth-sub">Quelques infos pour créer votre compte</p>

                <AuthErrorBanner message={error} />

                <form onSubmit={handleRegister} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="auth-field flex-1">
                      <label className="auth-label" htmlFor="reg-nom">Nom</label>
                      <input
                        id="reg-nom"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        placeholder="Dupont"
                        required
                        className="auth-input"
                      />
                    </div>
                    <div className="auth-field flex-1">
                      <label className="auth-label" htmlFor="reg-prenom">Prénom</label>
                      <input
                        id="reg-prenom"
                        value={prenom}
                        onChange={e => setPrenom(e.target.value)}
                        placeholder="Jean"
                        required
                        className="auth-input"
                      />
                    </div>
                  </div>

                  <PhoneField
                    countryCode={countryCode}
                    phone={phone}
                    onCountryChange={setCountryCode}
                    onPhoneChange={setPhone}
                    autoComplete="tel"
                  />

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-email">
                      Email{' '}
                      <span className="normal-case font-normal text-text-grey">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        className="auth-input pad-icon-left w-full"
                      />
                    </div>
                  </div>

                  <PasswordField
                    id="reg-pwd"
                    value={password}
                    onChange={setPassword}
                    placeholder="Min. 6 caractères"
                    autoComplete="new-password"
                    required
                  />

                  <PasswordField
                    id="reg-confirm"
                    label="Confirmer le mot de passe"
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                    placeholder="Répéter le mot de passe"
                    autoComplete="new-password"
                    required
                  />

                  <label className="auth-terms">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    <span className="auth-terms-box">
                      {acceptedTerms && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="auth-terms-text">
                      J'accepte les{' '}
                      <Link to="/conditions" target="_blank" className="auth-link">conditions d'utilisation</Link>
                      {' '}et la{' '}
                      <Link to="/confidentialite" target="_blank" className="auth-link">politique de confidentialité</Link>.
                    </span>
                  </label>

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => { setError(''); goTo(1) }}
                      className="h-10 rounded-xl border border-[rgba(0,0,0,0.12)] bg-transparent px-4 text-[13px] font-bold text-[#1D1D1F] hover:bg-black/5 transition-colors shrink-0"
                    >
                      Retour
                    </button>
                    <SubmitButton loading={loading} loadingLabel="Création…" className="flex-1">
                      S'inscrire
                    </SubmitButton>
                  </div>
                </form>

                <div className="auth-divider" />
                <p className="auth-footer">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="auth-link">Se connecter</Link>
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={stepDir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <OtpInputGroup
                  digits={otpDigits}
                  onDigitChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  onConfirm={() => verifyOtp(otpDigits.join(''))}
                  loading={otpLoading}
                  error={otpError}
                  maskedPhone={maskedPhone}
                  resendCooldown={resendCooldown}
                  onResend={resendOtp}
                  resending={resending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
