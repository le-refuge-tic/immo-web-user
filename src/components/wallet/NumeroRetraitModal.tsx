import { useState } from 'react'
import { walletApi } from '../../api/walletApi'

/**
 * Changement du numéro de retrait Mobile Money (flow OTP en 2 étapes),
 * partagé entre l'espace propriétaire et l'espace locataire.
 */
export default function NumeroRetraitModal({ current, onClose, onSaved, accent = '#4B6BFF' }: { current: string | null; onClose: () => void; onSaved: (numero: string) => void; accent?: string }) {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [numero, setNumero] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [otp, setOtp] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const initier = async () => {
    if (!/^\d{8,10}$/.test(numero.trim())) { setError('Numéro invalide (8 à 10 chiffres).'); return }
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-[#0B1C30] rounded-2xl w-full max-w-sm border border-[#1A3355]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3355]">
          <h2 className="font-bold text-[#F0EDE8]">Numéro de retrait</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B1C30] text-[#8A9BB5] flex-shrink-0">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {current && step === 'form' && (
            <p className="text-xs text-[#8A9BB5]">Numéro actuel : <span className="font-semibold text-[#F0EDE8]">{current}</span></p>
          )}
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#EF444414', color: '#EF4444', border: '1px solid #EF444430' }}>{error}</div>
          )}

          {step === 'form' ? (
            <>
              <div>
                <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Nouveau numéro Mobile Money</label>
                <input type="tel" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 0197000000"
                  className="w-full bg-[#112440] border border-[#1A3355] rounded-xl px-4 py-3 text-sm outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#F0EDE8] uppercase tracking-wide mb-2 block">Mot de passe (confirmation)</label>
                <input type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} placeholder="••••••••"
                  className="w-full bg-[#112440] border border-[#1A3355] rounded-xl px-4 py-3 text-sm outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
              </div>
              <p className="text-[11px] text-[#8A9BB5]">Un code sera envoyé par SMS sur le numéro principal de votre compte pour confirmer ce changement.</p>
              <button onClick={initier} disabled={submitting}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: accent }}>
                {submitting ? 'Vérification…' : 'Recevoir le code'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#8A9BB5]">Entrez le code reçu par SMS pour confirmer le nouveau numéro <span className="font-semibold text-[#F0EDE8]">{numero}</span>.</p>
              <input type="text" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Code à 6 chiffres"
                className="w-full bg-[#112440] border border-[#1A3355] rounded-xl px-4 py-3 text-sm text-center tracking-[0.3em] font-bold outline-none text-[#F0EDE8] focus:border-[#4B6BFF]" />
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
