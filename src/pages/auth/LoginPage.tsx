import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import { SKIP_OTP_UI, DUMMY_OTP_CODE } from '../../utils/otpBypass'
import './authLayout.css'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import AuthSidePanel from '../../components/ui/auth-switch'

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
          } catch (_) {
            // Le bypass backend n'est plus actif — on retombe sur le vrai parcours OTP.
          }
        }

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

  return (
    <div className="lp-root">

      {/* ════════════════  PANNEAU GAUCHE  ════════════════ */}
      <AuthSidePanel />

      {/* ════════════════  PANNEAU DROIT  ════════════════ */}
      <div className="lp-right">
        <div className="lp-deco lp-deco--1" />
        <div className="lp-deco lp-deco--2" />
        <div className="lp-deco lp-deco--3" />

        <div className="lp-form-card">
          <div className="lp-form-logo">
            <img src={logoUrl} alt="REFUGE" style={{ width: 58, height: 58, objectFit: 'contain' }} />
          </div>

          {step === 'credentials' ? (
            <>
              <h2 className="lp-form-title">Bienvenue</h2>
              <p className="lp-form-sub">Connectez-vous pour accéder à votre espace</p>

              {error && (
                <div className="lp-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="lp-form">
                <div className="lp-field">
                  <label className="lp-label">Numéro de téléphone</label>
                  <div className="lp-phone-row">
                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="lp-input">
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="97 00 00 00"
                      autoComplete="tel"
                      className="lp-input"
                    />
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">Mot de passe</label>
                  <div className="lp-pwd-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="lp-input"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="lp-eye-btn" tabIndex={-1}>
                      {showPwd ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="lp-btn-submit">
                  {loading ? <><span className="lp-spinner" />Connexion…</> : 'Se connecter'}
                </button>
              </form>

              <div className="lp-divider" />
              <div className="lp-footer">
                Nouveau ici ? <Link to="/register">Créer un compte</Link>
              </div>
              <button type="button" onClick={() => navigate(-1)} className="lp-btn-ghost">
                Retour à l'accueil
              </button>
            </>
          ) : (
            <>
              <div className="lp-otp-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="lp-form-title">Vérification</h2>
              <p className="lp-form-sub">
                Entrez le code envoyé au numéro se terminant par <strong>{maskedPhone}</strong>
              </p>

              {otpError && (
                <div className="lp-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {otpError}
                </div>
              )}

              <div className="lp-otp-row">
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
                    className="lp-otp-input"
                  />
                ))}
              </div>

              <button type="button" onClick={() => verifyOtp(otpDigits.join(''))} disabled={otpLoading || otpDigits.some(d => !d)} className="lp-btn-submit">
                {otpLoading ? <span className="lp-spinner" /> : 'Confirmer'}
              </button>

              <div className="lp-footer" style={{ marginTop: '1.25rem' }}>
                {resendCooldown > 0 ? (
                  <>Renvoyer le code dans <strong>{resendCooldown}s</strong></>
                ) : (
                  <button type="button" onClick={resendOtp} disabled={loading} className="lp-forgot-inline" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {loading ? 'Envoi…' : 'Renvoyer le code'}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => { setStep('credentials'); setError('') }} className="lp-btn-ghost">
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
