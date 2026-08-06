import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import './authLayout.css'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import terrainImg from '../../assets/login/terrain.jpg'
import appartementImg from '../../assets/login/appartement.jpg'
import villaImg from '../../assets/login/villa.jpg'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

const COUNTRY_CODES = [
  { code: '+229', label: 'BJ +229' },
  { code: '+228', label: 'TG +228' },
  { code: '+225', label: 'CI +225' },
  { code: '+221', label: 'SN +221' },
  { code: '+33',  label: 'FR +33'  },
]

const SearchRoleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const HomeRoleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

type RoleOption = { key: string; label: string; desc: string; icon: React.ReactNode }
const ROLES: RoleOption[] = [
  { key: 'prospect',     label: 'Je cherche un bien',   desc: 'À louer ou à acheter',              icon: <SearchRoleIcon /> },
  { key: 'proprietaire', label: 'Je suis propriétaire', desc: 'Je mets mon bien en location/vente', icon: <HomeRoleIcon /> },
]

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  // Présélectionne le profil choisi lors de l'onboarding ("Je veux louer" /
  // "J'ai un bien") pour éviter de reposer la question à l'inscription.
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
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Étape 3 : 2FA obligatoire — le premier login juste après
  // l'inscription doit aussi passer par la vérification SMS. ──────────────
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
        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setOtpError('')
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
    <div className="lp-root">

      {/* ════════════════  PANNEAU GAUCHE  ════════════════ */}
      <div className="lp-left">
        <div className="lp-brand">
          <img src={logoUrl} alt="REFUGE" style={{ width: 58, height: 58, objectFit: 'contain' }} />
          <span className="lp-brand-name">REFUGE</span>
        </div>

        <div className="lp-collage">
          <div className="lp-img lp-img--1"><img src={terrainImg} alt="Terrain" /></div>
          <div className="lp-img lp-img--2"><img src={appartementImg} alt="Appartement" /></div>
          <div className="lp-img lp-img--3"><img src={villaImg} alt="Villa" /></div>
        </div>

        <div className="lp-tagline">
          Trouvez la propriété<br />
          <span>que vous aimez.</span>
        </div>
      </div>

      {/* ════════════════  PANNEAU DROIT  ════════════════ */}
      <div className="lp-right">
        <div className="lp-deco lp-deco--1" />
        <div className="lp-deco lp-deco--2" />
        <div className="lp-deco lp-deco--3" />

        <div className="lp-form-card">
          <div className="lp-form-logo">
            <img src={logoUrl} alt="REFUGE" style={{ width: 58, height: 58, objectFit: 'contain' }} />
          </div>

          {step !== 3 && (
            <div className="lp-step-dots">
              {[1, 2, 3].map(s => (
                <div key={s} className={`lp-step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`} />
              ))}
            </div>
          )}

          {error && (
            <div className="lp-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Étape 1 — choix du rôle */}
          {step === 1 && (
            <>
              <h2 className="lp-form-title">Qui êtes-vous ?</h2>
              <p className="lp-form-sub">Choisissez le profil qui vous correspond</p>

              <div className="lp-role-grid">
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`lp-role-card ${role === r.key ? 'active' : ''}`}
                  >
                    <div className="lp-role-icon">{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p className="lp-role-title">{r.label}</p>
                      <p className="lp-role-desc">{r.desc}</p>
                    </div>
                    <div className="lp-role-check">{role === r.key && <CheckIcon />}</div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!role) { setError('Choisissez un profil'); return }
                  setError('')
                  setStep(2)
                }}
                className="lp-btn-submit"
                style={{ marginTop: '1.5rem' }}
              >
                Continuer
              </button>

              <div className="lp-divider" />
              <div className="lp-footer">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
              </div>
              <button type="button" onClick={() => navigate(-1)} className="lp-btn-ghost">
                Retour à l'accueil
              </button>
            </>
          )}

          {/* Étape 2 — informations personnelles */}
          {step === 2 && (
            <>
              <h2 className="lp-form-title">Vos informations</h2>
              <p className="lp-form-sub">Quelques infos pour créer votre compte</p>

              <form onSubmit={handleRegister} className="lp-form">
                <div className="lp-field-row">
                  <div className="lp-field">
                    <label className="lp-label">Nom</label>
                    <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" required className="lp-input" />
                  </div>
                  <div className="lp-field">
                    <label className="lp-label">Prénom</label>
                    <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" required className="lp-input" />
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">Téléphone</label>
                  <div className="lp-phone-row">
                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="lp-input">
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="97 00 00 00" className="lp-input" />
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">Email <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--c-muted)' }}>(optionnel)</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com" className="lp-input" />
                </div>

                <div className="lp-field">
                  <label className="lp-label">Mot de passe</label>
                  <div className="lp-pwd-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      required
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

                <div className="lp-field">
                  <label className="lp-label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Répéter le mot de passe"
                    required
                    className="lp-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button type="button" onClick={() => { setError(''); setStep(1) }} className="lp-btn-submit" style={{ background: '#fff', color: 'var(--c-text)', border: '1.5px solid var(--c-border)', flex: '0 0 auto', width: 'auto', padding: '0 1.25rem' }}>
                    Retour
                  </button>
                  <button type="submit" disabled={loading} className="lp-btn-submit" style={{ flex: 1 }}>
                    {loading ? <><span className="lp-spinner" />Création…</> : "S'inscrire"}
                  </button>
                </div>
              </form>

              <div className="lp-divider" />
              <div className="lp-footer">
                Déjà un compte ? <Link to="/login">Se connecter</Link>
              </div>
            </>
          )}

          {/* Étape 3 — 2FA obligatoire : vérification du téléphone */}
          {step === 3 && (
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
                  <button type="button" onClick={resendOtp} disabled={resending} className="lp-forgot-inline" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {resending ? 'Envoi…' : 'Renvoyer le code'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
