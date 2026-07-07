import { useState, useEffect } from 'react'
import { userApi } from '../../api/userApi'

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

  useEffect(() => {
    if (open) {
      setCurrent('')
      setNewPwd('')
      setConfirm('')
      setError('')
      setSuccess(false)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (newPwd.length < 6) { setError('Mot de passe trop court (6 car. min.)'); return }
    setLoading(true)
    setError('')
    try {
      await userApi.changePassword({ current_password: current, new_password: newPwd })
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mot de passe actuel incorrect')
    }
    setLoading(false)
  }

  return (
    <div
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
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <svg className="w-4 h-4 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-green-600 text-sm font-semibold">Mot de passe mis à jour</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-text-dark mb-1.5 block">Mot de passe actuel</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required
              className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-dark mb-1.5 block">Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
              placeholder="Min. 6 caractères"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-semibold text-text-dark mb-1.5 block">Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-text-dark"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Mise à jour…</> : 'Changer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
