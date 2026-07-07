import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../../api/userApi'

const GLASS = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 40px rgba(0,0,0,0.08)',
} as const

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (newPwd.length < 6) { setError('Mot de passe trop court (6 car. min.)'); return }
    setLoading(true)
    setError('')
    try {
      await userApi.changePassword({ current_password: current, new_password: newPwd })
      setSuccess(true)
      setTimeout(() => navigate('/profil'), 1500)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mot de passe actuel incorrect')
    }
    setLoading(false)
  }

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <label className="text-sm font-semibold text-text-dark mb-2 block">Mot de passe actuel</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required
          className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
      </div>
      <div>
        <label className="text-sm font-semibold text-text-dark mb-2 block">Nouveau mot de passe</label>
        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
          placeholder="Min. 6 caractères"
          className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
      </div>
      <div>
        <label className="text-sm font-semibold text-text-dark mb-2 block">Confirmer le nouveau mot de passe</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
          className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}>
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Mise à jour…</> : 'Changer le mot de passe'}
      </button>
    </form>
  )

  return (
    <div className="min-h-full">

      {/* ── MOBILE ── */}
      <div className="md:hidden bg-app-bg">
        <div className="px-4 pt-12 pb-4 flex items-center gap-3"
          style={{ background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <button onClick={() => navigate(-1)} className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text-dark">Changer le mot de passe</h1>
        </div>
        <div className="px-6 py-8"><FormContent /></div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex min-h-[calc(100vh-64px)] items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg rounded-2xl p-8" style={GLASS}>
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-black/05"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-dark">Changer le mot de passe</h1>
              <p className="text-sm text-text-grey mt-0.5">Sécurisez votre compte avec un nouveau mot de passe</p>
            </div>
          </div>
          <FormContent />
        </div>
      </div>

    </div>
  )
}
