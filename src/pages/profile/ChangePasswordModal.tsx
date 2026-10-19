import { useState, useEffect } from 'react'
import { userApi } from '../../api/userApi'
import { apiMessage } from '../../utils/apiMessage'

type Props = { open: boolean; onClose: () => void }

const GLASS = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(48px) saturate(180%)',
  WebkitBackdropFilter: 'blur(48px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
} as const

export default function ChangePasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // Étape 2 : code SMS envoyé au numéro du compte.
  const [sessionToken, setSessionToken] = useState('')
  const [code, setCode] = useState('')
  const step: 'form' | 'code' = sessionToken ? 'code' : 'form'

  useEffect(() => {
    if (open) {
      setCurrent('')
      setNewPwd('')
      setConfirm('')
      setError('')
      setSuccess(false)
      setSessionToken('')
      setCode('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  const changer = async (session_token?: string, otp?: string) => {
    await userApi.changePassword({ current_password: current, new_password: newPwd, session_token, code: otp })
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (step === 'code') {
      if (code.length !== 6) { setError('Entrez le code à 6 chiffres reçu par SMS.'); return }
      setLoading(true)
      try {
        await changer(sessionToken, code)
      } catch (err: any) {
        setError(apiMessage(err) || 'Code incorrect ou expiré.')
      }
      setLoading(false)
      return
    }
    if (newPwd !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (newPwd.length < 8) { setError('Mot de passe trop court (8 caractères min.)'); return }
    setLoading(true)
    try {
      const res = await userApi.sendPasswordOtp(current)
      if (res.requires_otp && res.session_token) setSessionToken(res.session_token)
      else await changer()
    } catch (err: any) {
      setError(apiMessage(err) || 'Mot de passe actuel incorrect')
    }
    setLoading(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Changer le mot de passe"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={GLASS}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-dark">Sécurité</h2>
            <p className="text-sm text-text-grey mt-0.5">Changez votre mot de passe</p>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <svg className="w-4 h-4 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-green-600 text-sm font-semibold">Mot de passe mis à jour. Vos autres appareils ont été déconnectés.</p>
            </div>
          )}
          {step === 'code' ? (
            <div>
              <label htmlFor="cp-code" className="text-sm font-semibold text-text-dark mb-1.5 block">Code reçu par SMS</label>
              <input id="cp-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                placeholder="000000" autoFocus
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all text-center tracking-[0.4em] font-bold" />
              <p className="text-xs text-text-grey mt-1.5">
                Un code a été envoyé au numéro de votre compte.{' '}
                <button type="button" onClick={() => { setSessionToken(''); setCode(''); setError('') }}
                  className="font-semibold text-primary">Recommencer</button>
              </p>
            </div>
          ) : (
            <>
            <div>
              <label htmlFor="cp-current" className="text-sm font-semibold text-text-dark mb-1.5 block">Mot de passe actuel</label>
              <input id="cp-current" type="password" value={current} onChange={e => setCurrent(e.target.value)} required
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label htmlFor="cp-new" className="text-sm font-semibold text-text-dark mb-1.5 block">Nouveau mot de passe</label>
              <input id="cp-new" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
                placeholder="Min. 8 caractères"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label htmlFor="cp-confirm" className="text-sm font-semibold text-text-dark mb-1.5 block">Confirmer le nouveau mot de passe</label>
              <input id="cp-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
            </div>
            </>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-text-dark"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Mise à jour…</> : step === 'code' ? 'Valider' : 'Recevoir le code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
