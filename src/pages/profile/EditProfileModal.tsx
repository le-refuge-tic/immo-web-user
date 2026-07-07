import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api/userApi'

type Props = { open: boolean; onClose: () => void }

const GLASS = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(48px) saturate(180%)',
  WebkitBackdropFilter: 'blur(48px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
} as const

export default function EditProfileModal({ open, onClose }: Props) {
  const { user, updateUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nom, setNom] = useState(user?.nom || '')
  const [prenom, setPrenom] = useState(user?.prenom || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setNom(user?.nom || '')
      setPrenom(user?.prenom || '')
      setEmail(user?.email || '')
      setError('')
      setSuccess(false)
    }
  }, [open])

  if (!open) return null

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await userApi.updateProfil({ nom, prenom, email: email || undefined })
      updateUser(data.user || { nom, prenom, email })
      setSuccess(true)
      setTimeout(onClose, 1000)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur de mise à jour')
    }
    setLoading(false)
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = await userApi.uploadAvatar(file)
      updateUser({ photo_profil: data.url || data.photo_profil })
    } catch (_) {}
    setUploading(false)
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
          <h2 className="text-xl font-bold text-text-dark">Modifier le profil</h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <svg className="w-4 h-4 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {user?.photo_profil ? (
              <img src={user.photo_profil} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: '#4B6BFF' }}>
              {uploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              )}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          <p className="text-xs text-text-grey mt-2">Changer la photo de profil</p>
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
              <p className="text-green-600 text-sm font-semibold">Profil mis à jour</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-text-dark mb-1.5 block">Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)} required
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold text-text-dark mb-1.5 block">Prénom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)} required
                className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-text-dark mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com"
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
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enregistrement…</> : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
