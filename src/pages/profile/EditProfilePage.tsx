import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api/userApi'

const GLASS = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 40px rgba(0,0,0,0.08)',
} as const

export default function EditProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nom, setNom] = useState(user?.nom || '')
  const [prenom, setPrenom] = useState(user?.prenom || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await userApi.updateProfil({ nom, prenom, email: email || undefined })
      updateUser(data.user || { nom, prenom, email })
      setSuccess(true)
      setTimeout(() => navigate('/profil'), 1200)
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

  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  const AvatarBlock = () => (
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
  )

  const FormFields = () => (
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
            className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
        </div>
        <div>
          <label className="text-sm font-semibold text-text-dark mb-1.5 block">Prénom</label>
          <input value={prenom} onChange={e => setPrenom(e.target.value)} required
            className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-text-dark mb-1.5 block">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com"
          className="glass-input w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-all" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.35)' }}>
        {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enregistrement…</> : 'Sauvegarder'}
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
          <h1 className="text-lg font-bold text-text-dark">Modifier le profil</h1>
        </div>
        <div className="px-4 py-6">
          <AvatarBlock />
          <FormFields />
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:flex min-h-[calc(100vh-64px)] items-center justify-center px-8 py-12">
        <div className="w-full max-w-lg rounded-2xl p-8" style={GLASS}>
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-dark">Modifier le profil</h1>
              <p className="text-sm text-text-grey mt-0.5">Mettez à jour vos informations personnelles</p>
            </div>
          </div>
          <AvatarBlock />
          <FormFields />
        </div>
      </div>

    </div>
  )
}
