import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../../api/userApi'

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

  return (
    <div className="min-h-full bg-app-bg">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-divider">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-dark">Changer le mot de passe</h1>
      </div>

      <div className="px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3">
              <p className="text-success text-sm font-semibold">Mot de passe mis à jour ✓</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-text-dark mb-2 block">Mot de passe actuel</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required
              className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-sm font-semibold text-text-dark mb-2 block">Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
              placeholder="Min. 6 caractères"
              className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-sm font-semibold text-text-dark mb-2 block">Confirmer</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn disabled:opacity-60">
            {loading ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
