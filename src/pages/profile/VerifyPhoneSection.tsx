import { useState } from 'react'
import { userApi } from '../../api/userApi'
import { apiMessage } from '../../utils/apiMessage'
import {
  PHONE_PLACEHOLDER,
  PHONE_FORMAT_HINT,
  validateBeninPhone,
  normaliseBeninPhone,
} from '../../utils/phone'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

type Step = 'saisie' | 'code'

type Props = {
  /** Numéro actuel du compte ; absent au premier renseignement. */
  currentPhone?: string
  /** Appelé avec le nouveau numéro une fois celui-ci vérifié et enregistré. */
  onVerified: (telephone: string) => void
}

const FIELD_CLASS =
  'glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all'

/**
 * Changement de numéro en deux étapes : le code part AU NOUVEAU numéro, et
 * seul ce numéro-là peut être validé par la session OTP ouverte. Le numéro
 * sert au 2FA et à la réinitialisation du mot de passe, il ne peut donc pas
 * être modifié par un simple PATCH du profil.
 */
export default function VerifyPhoneSection({ currentPhone, onVerified }: Props) {
  const [step, setStep] = useState<Step>('saisie')
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const isChangement = !!currentPhone

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN_SECONDS)
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const normalised = normaliseBeninPhone(telephone)

  const envoyerCode = async (renvoi = false) => {
    if (!validateBeninPhone(telephone)) {
      setError(PHONE_FORMAT_HINT)
      return
    }
    if (isChangement && !password) {
      setError('Saisissez votre mot de passe actuel pour changer de numéro.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await userApi.sendPhoneOtp(normalised, isChangement ? password : undefined)
      setSessionToken(res.session_token)
      setStep('code')
      if (renvoi) setCode('')
      startCountdown()
    } catch (err) {
      setError(apiMessage(err) || 'Le code n’a pas pu être envoyé. Vérifiez le numéro saisi.')
    }
    setLoading(false)
  }

  const verifierCode = async () => {
    if (code.length !== OTP_LENGTH) {
      setError(`Entrez le code à ${OTP_LENGTH} chiffres reçu par SMS.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      await userApi.verifyPhoneOtp(sessionToken, code, normalised)
      onVerified(normalised)
    } catch (err) {
      setError(apiMessage(err) || 'Code incorrect ou expiré.')
    }
    setLoading(false)
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      <div>
        <p className="text-sm font-semibold text-text-dark">
          {isChangement ? 'Changer de numéro' : 'Vérifier mon numéro'}
        </p>
        <p className="text-xs text-text-grey mt-1 leading-relaxed">
          {step === 'saisie'
            ? 'Un code vous sera envoyé par SMS au nouveau numéro pour le confirmer.'
            : <>Entrez le code à {OTP_LENGTH} chiffres envoyé au <strong>{normalised}</strong>.</>}
        </p>
      </div>

      <div role="alert" aria-live="assertive" aria-atomic="true">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {step === 'saisie' ? (
        <>
          <div>
            <label htmlFor="vp-telephone" className="text-xs font-semibold text-text-dark mb-1.5 block">
              Nouveau numéro
            </label>
            <input
              id="vp-telephone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={telephone}
              onChange={e => { setTelephone(e.target.value); setError('') }}
              placeholder={PHONE_PLACEHOLDER}
              className={FIELD_CLASS}
            />
          </div>

          {isChangement && (
            <div>
              <label htmlFor="vp-password" className="text-xs font-semibold text-text-dark mb-1.5 block">
                Mot de passe actuel
              </label>
              <input
                id="vp-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                className={FIELD_CLASS}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => envoyerCode()}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))' }}
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Envoi…</>
              : 'Envoyer le code'}
          </button>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="vp-code" className="text-xs font-semibold text-text-dark mb-1.5 block">
              Code de vérification
            </label>
            <input
              id="vp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setError('') }}
              placeholder="000000"
              className={`${FIELD_CLASS} text-center tracking-[0.4em] font-bold`}
            />
          </div>

          <button
            type="button"
            onClick={verifierCode}
            disabled={loading || code.length !== OTP_LENGTH}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))' }}
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Vérification…</>
              : 'Valider le numéro'}
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStep('saisie'); setCode(''); setError('') }}
              className="text-xs font-semibold text-primary"
            >
              Modifier le numéro
            </button>
            <button
              type="button"
              onClick={() => envoyerCode(true)}
              disabled={countdown > 0 || loading}
              className="text-xs font-semibold text-primary disabled:text-text-grey disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
