import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Eye, EyeOff, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import {
  SidePanel,
  ErrorBanner,
  PrimaryButton,
  PhoneInput,
} from '../../components/ui/auth-switch'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import './authNew.css'
import { apiMessage } from '../../utils/apiMessage'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

const stepVariants = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()

  const [step, setStep] = useState<'phone' | 'otp' | 'password' | 'done'>('phone')
  const [stepDir, setStepDir] = useState(1)
  const [countryCode, setCountryCode] = useState('+229')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  const telephone = countryCode + phone.trim()
  const transition = { duration: prefersReduced ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] as any }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const demanderCode = async () => {
    if (!phone.trim()) { setError('Entrez votre numéro de téléphone'); return }
    setLoading(true); setError('')
    try {
      await withColdStartRetry(
        () => authApi.forgotPassword(telephone),
        () => setError('Le serveur se réveille, nouvelle tentative…'),
      )
      setError('')
      setOtpDigits(Array(OTP_LENGTH).fill(''))
      setStepDir(1); setStep('otp')
      setResendCooldown(RESEND_COOLDOWN)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err: any) {
      setError((isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.' : apiMessage(err) || "Impossible d'envoyer le code"))
    }
    setLoading(false)
  }

  const resendCode = async () => {
    if (resendCooldown > 0) return
    setResending(true); setError('')
    try {
      await withColdStartRetry(() => authApi.forgotPassword(telephone), () => setError('Le serveur se réveille…'))
      setError('')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err: any) {
      setError((isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : apiMessage(err) || "Impossible de renvoyer le code"))
    }
    setResending(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]; next[index] = digit; setOtpDigits(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
    if (next.join('').length === OTP_LENGTH) validerOtp(next.join(''))
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const validerOtp = async (codeOverride?: string) => {
    const code = codeOverride ?? otpDigits.join('')
    if (code.length < OTP_LENGTH) { setError('Entrez le code à 6 chiffres reçu par SMS'); return }
    setLoading(true); setError('')
    try {
      await withColdStartRetry(() => authApi.verifyResetCode(telephone, code), () => setError('Le serveur se réveille, nouvelle tentative…'))
      setError('')
      setStepDir(1); setStep('password')
    } catch (err: any) {
      setError((isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : apiMessage(err) || 'Code invalide ou expiré'))
    }
    setLoading(false)
  }

  const reinitialiser = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (newPassword.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }

    setLoading(true); setError('')
    try {
      await authApi.resetPassword(telephone, code, newPassword)
      setStepDir(1); setStep('done')
    } catch (err: any) {
      setError((isColdStartError(err) ? 'Le serveur met du temps à répondre. Réessayez.' : apiMessage(err) || 'Code invalide ou expiré'))
    }
    setLoading(false)
  }

  const maskedPhone = phone.length >= 4 ? `••••${phone.slice(-4)}` : phone

  return (
    <div className="auth-root">
      <SidePanel />

      <div className="auth-panel">
        <div className="auth-form-inner">
          <div className="flex justify-center mb-3">
            <img src={logoUrl} alt="REFUGE" className="w-20 h-20 object-contain drop-shadow-md" />
          </div>

          <AnimatePresence mode="wait" custom={stepDir}>
            {step === 'phone' && (
              <motion.div key="phone" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
                <h2 className="auth-title">Mot de passe oublié</h2>
                <p className="auth-sub">Entrez votre numéro de téléphone, nous vous enverrons un code par SMS</p>
                <ErrorBanner message={error} />
                <form onSubmit={e => { e.preventDefault(); demanderCode() }} className="flex flex-col gap-2">
                  <div className="auth-field">
                    <label htmlFor="forgot-phone" className="auth-label">Numéro de téléphone</label>
                    <PhoneInput id="forgot-phone" countryCode={countryCode} phone={phone} onCountryChange={setCountryCode} onPhoneChange={setPhone} />
                  </div>
                  <PrimaryButton loading={loading} loadingLabel="Envoi…" className="mt-1">Recevoir le code</PrimaryButton>
                </form>
                <button type="button" onClick={() => navigate('/login')} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Retour à la connexion
                </button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(75,107,255,0.12)]">
                    <ShieldCheck size={22} className="text-[#4B6BFF]" />
                  </div>
                  <h2 className="auth-title">Vérification</h2>
                  <p className="auth-sub">Code envoyé au numéro se terminant par <strong className="text-[#1D1D1F]">{maskedPhone}</strong></p>
                </div>
                <ErrorBanner message={error} />
                <form onSubmit={e => { e.preventDefault(); validerOtp() }} className="flex flex-col gap-2">
                  <div className="flex gap-2 mb-2 justify-center">
                    {otpDigits.map((d, i) => (
                      <motion.input key={i} ref={el => { otpRefs.current[i] = el }} value={d}
                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                        inputMode="numeric" maxLength={1} disabled={loading}
                        animate={{ borderColor: d ? '#4B6BFF' : 'rgba(0,0,0,0.12)', backgroundColor: d ? 'rgba(75,107,255,0.06)' : '#F5F5F7' }}
                        transition={{ duration: 0.15 }}
                        className="h-11 w-9 rounded-xl border-[1.5px] text-center text-lg font-bold text-[#1D1D1F] outline-none disabled:opacity-50 focus:border-[#4B6BFF] focus:shadow-[0_0_0_3px_rgba(75,107,255,0.15)] focus:bg-white"
                        aria-label={`Chiffre ${i + 1}`}
                      />
                    ))}
                  </div>
                  <PrimaryButton loading={loading} loadingLabel="Vérification…" disabled={otpDigits.some(d => !d)} className="mt-1">Continuer</PrimaryButton>
                </form>

                <div className="mt-3 text-sm text-[#6E6E73] text-center">
                  {resendCooldown > 0 ? <span>Renvoyer dans <strong className="text-[#1D1D1F]">{resendCooldown}s</strong></span> : (
                    <button type="button" onClick={resendCode} disabled={resending} className="font-semibold text-[#4B6BFF] hover:underline disabled:opacity-60">
                      {resending ? 'Envoi…' : 'Renvoyer le code'}
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => { setStepDir(-1); setStep('phone'); setError('') }} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Retour
                </button>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div key="password" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
                <h2 className="auth-title">Nouveau mot de passe</h2>
                <p className="auth-sub">Choisissez un nouveau mot de passe pour votre compte</p>
                <ErrorBanner message={error} />
                <form onSubmit={reinitialiser} className="flex flex-col gap-2">
                  <div className="auth-field">
                    <label htmlFor="forgot-new-password" className="auth-label">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                      <input id="forgot-new-password" type={showPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="auth-input pad-icon-left pad-icon-right w-full" />
                      <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} aria-label={showPwd ? 'Masquer' : 'Afficher'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="forgot-confirm-password" className="auth-label">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A8]" />
                      <input id="forgot-confirm-password" type={showPwd ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="auth-input pad-icon-left w-full" />
                    </div>
                  </div>

                  <PrimaryButton loading={loading} loadingLabel="Réinitialisation…" className="mt-1">Réinitialiser le mot de passe</PrimaryButton>
                </form>

                <button type="button" onClick={() => { setStepDir(-1); setStep('otp'); setError('') }} className="mt-3 block w-full text-center text-sm font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Retour
                </button>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div key="done" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={transition}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(52,199,89,0.12)]">
                    <CheckCircle2 size={22} className="text-[#34C759]" />
                  </div>
                  <h2 className="auth-title">Mot de passe réinitialisé</h2>
                  <p className="auth-sub">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                </div>
                <PrimaryButton type="button" onClick={() => navigate('/login')} className="mt-2">Se connecter</PrimaryButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
