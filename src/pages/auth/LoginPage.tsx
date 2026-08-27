import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import { SKIP_OTP_UI, DUMMY_OTP_CODE } from '../../utils/otpBypass'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -28, opacity: 0 }),
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
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
    if (redirect) {
      sessionStorage.removeItem('post_login_redirect')
      navigate(redirect, { replace: true })
      return
    }
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

  const transition = { duration: prefersReduced ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] as any }

  return (
    <div className="auth-root">
      <AuthSidePanel />

      <div className="auth-panel">
        <div className="auth-form-inner">
          <div className="flex justify-center mb-3">
            <img src={logoUrl} alt="REFUGE" className="w-11 h-11 object-contain" />
          </div>

          <AnimatePresence mode="wait" custom={stepDir}>
            {step === 'credentials' ? (
              <motion.div
                key="credentials"
                custom={stepDir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
              >
                <h2 className="auth-title">Bienvenue</h2>
                <p className="auth-sub">Connectez-vous pour accéder à votre espace</p>

                <AuthErrorBanner message={error} />

                <form onSubmit={handleLogin} className="flex flex-col gap-2">
                  <PhoneField
                    countryCode={countryCode}
                    phone={phone}
                    onCountryChange={setCountryCode}
                    onPhoneChange={setPhone}
                  />

                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />

                  <SubmitButton loading={loading} loadingLabel="Connexion…" className="mt-1">
                    Se connecter
                  </SubmitButton>
                </form>

                <div className="auth-divider" />
                <p className="auth-footer">
                  Nouveau ici ?{' '}
                  <Link to="/register" className="auth-link">Créer un compte</Link>
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
            ) : (
              <motion.div
                key="otp"
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
                  resending={loading}
                  onBack={() => { setStepDir(-1); setStep('credentials'); setError('') }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

  )
}
