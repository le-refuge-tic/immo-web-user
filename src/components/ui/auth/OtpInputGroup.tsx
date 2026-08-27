import { useRef, useEffect } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { AuthErrorBanner } from './AuthErrorBanner'
import { SubmitButton } from './SubmitButton'

const OTP_LENGTH = 6

interface Props {
  digits: string[]
  onDigitChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onConfirm: () => void
  loading: boolean
  error: string
  maskedPhone: string
  resendCooldown: number
  onResend: () => void
  resending?: boolean
  onBack?: () => void
  backLabel?: string
}

export function OtpInputGroup({
  digits,
  onDigitChange,
  onKeyDown,
  onConfirm,
  loading,
  error,
  maskedPhone,
  resendCooldown,
  onResend,
  resending,
  onBack,
  backLabel = 'Retour',
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const controls = useAnimation()
  const prefersReduced = useReducedMotion()

  // Shake row on error
  useEffect(() => {
    if (!error) return
    if (prefersReduced) return
    controls.start({
      x: [0, -7, 7, -5, 5, -3, 3, 0],
      transition: { duration: 0.42, ease: 'easeInOut' },
    })
  }, [error, controls, prefersReduced])

  const handleChange = (i: number, value: string) => {
    onDigitChange(i, value)
    const digit = value.replace(/\D/g, '').slice(-1)
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(i, e)
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const allFilled = digits.every(d => d !== '')

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-l">
        <ShieldCheck size={22} className="text-primary" />
      </div>

      <h2 className="auth-title">Vérification</h2>
      <p className="auth-sub">
        Code envoyé au numéro se terminant par <strong className="text-text-dark">{maskedPhone}</strong>
      </p>

      <AuthErrorBanner message={error} />

      <motion.div
        animate={controls}
        className="flex gap-1.5 mb-4"
      >
        {digits.map((d, i) => (
          <motion.input
            key={i}
            ref={el => { refs.current[i] = el }}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            disabled={loading}
            aria-label={`Chiffre ${i + 1} du code`}
            initial={false}
            animate={{
              borderColor: d ? '#4B6BFF' : error ? '#FF3B30' : 'rgba(0,0,0,0.12)',
              backgroundColor: d ? 'rgba(75,107,255,0.06)' : '#F5F5F7',
            }}
            transition={{ duration: prefersReduced ? 0 : 0.15 }}
            className="h-11 w-9 rounded-xl border-[1.5px] text-center text-lg font-bold text-text-dark outline-none transition-shadow disabled:opacity-50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(75,107,255,0.15)] focus:bg-white"
          />
        ))}
      </motion.div>

      <SubmitButton
        type="button"
        onClick={onConfirm}
        loading={loading}
        disabled={!allFilled}
        loadingLabel="Vérification…"
        className="mb-3"
      >
        Confirmer
      </SubmitButton>

      <div className="mt-2 text-sm text-text-grey text-center">
        {resendCooldown > 0 ? (
          <span>Renvoyer dans <strong className="text-text-dark">{resendCooldown}s</strong></span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {resending ? 'Envoi…' : 'Renvoyer le code'}
          </button>
        )}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-sm font-semibold text-text-grey hover:text-text-dark transition-colors"
        >
          {backLabel}
        </button>
      )}
    </div>
  )
}
