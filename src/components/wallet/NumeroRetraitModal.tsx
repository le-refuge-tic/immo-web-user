import { useState, useEffect } from 'react'
import { walletApi } from '../../api/walletApi'
import { validateBeninPhone, PHONE_FORMAT_HINT, PHONE_PLACEHOLDER, BENIN_PHONE_LENGTH } from '../../utils/phone'

/**
 * Changement du numéro de retrait Mobile Money (flow OTP en 2 étapes),
 * partagé entre l'espace propriétaire et l'espace locataire.
 */
export default function NumeroRetraitModal({ current, onClose, onSaved, accent = '#4B6BFF' }: { current: string | null; onClose: () => void; onSaved: (numero: string) => void; accent?: string }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [numero, setNumero] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [otp, setOtp] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const initier = async () => {
    if (!validateBeninPhone(numero)) { setError(PHONE_FORMAT_HINT); return }
    if (!motDePasse) { setError('Entrez votre mot de passe pour confirmer.'); return }
    setError(''); setSubmitting(true)
    try {
      const res = await walletApi.initierChangementNumeroRetrait(numero.trim(), motDePasse)
      setSessionToken(res.session_token)
      setStep('otp')
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Impossible de vérifier ces informations.')
    }
    setSubmitting(false)
  }

  const confirmer = async () => {
    if (!otp.trim()) { setError('Entrez le code reçu par SMS.'); return }
    setError(''); setSubmitting(true)
    try {
      await walletApi.confirmerChangementNumeroRetrait(sessionToken, otp.trim(), numero.trim())
      onSaved(numero.trim())
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Code invalide ou expiré.')
    }
    setSubmitting(false)
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Numéro de retrait"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-navy-900 rounded-2xl w-full max-w-sm border border-navy-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
          <h2 className="font-bold text-proprio-text">Numéro de retrait</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-lg bg-navy-900 text-proprio-muted flex-shrink-0" aria-hidden="false">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {current && step === 'form' && (
            <p className="text-xs text-proprio-muted">Numéro actuel : <span className="font-semibold text-proprio-text">{current}</span></p>
          )}
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#EF444414', color: 'var(--tx-red)', border: '1px solid #EF444430' }}>{error}</div>
          )}

          {step === 'form' ? (
            <>
              <div>
                <label className="text-xs font-bold text-proprio-text uppercase tracking-wide mb-2 block">Nouveau numéro Mobile Money</label>
                <input type="tel" value={numero} onChange={e => setNumero(e.target.value.replace(/\D/g, ''))} placeholder={PHONE_PLACEHOLDER} maxLength={BENIN_PHONE_LENGTH} inputMode="tel" autoComplete="tel-national"
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm outline-none text-proprio-text focus:border-brand" />
              </div>
              <div>
                <label className="text-xs font-bold text-proprio-text uppercase tracking-wide mb-2 block">Mot de passe (confirmation)</label>
                <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} placeholder="••••••••"
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm outline-none text-proprio-text focus:border-brand" />
              </div>
              <p className="text-caption text-proprio-muted">Un code sera envoyé par SMS sur le numéro principal de votre compte pour confirmer ce changement.</p>
              <button onClick={initier} disabled={submitting}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: accent }}>
                {submitting ? 'Vérification…' : 'Recevoir le code'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-proprio-muted">Entrez le code reçu par SMS pour confirmer le nouveau numéro <span className="font-semibold text-proprio-text">{numero}</span>.</p>
              <input type="text" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Code à 6 chiffres"
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm text-center tracking-[0.3em] font-bold outline-none text-proprio-text focus:border-brand" />
              <button onClick={confirmer} disabled={submitting}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: accent }}>
                {submitting ? 'Confirmation…' : 'Confirmer'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
