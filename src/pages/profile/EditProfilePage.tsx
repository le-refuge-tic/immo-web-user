import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userApi } from '../../api/userApi'

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

  return (
    <div className="min-h-full bg-app-bg">
      <div className="bg-white px-4 pt-12 pb-4 flex items-center gap-3 border-b border-divider">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-dark">Modifier le profil</h1>
      </div>

      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {user?.photo_profil ? (
              <img src={user.photo_profil} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-l flex items-center justify-center">
                <span className="text-primary text-2xl font-bold">{initials}</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-white"
            >
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3">
              <p className="text-success text-sm font-semibold">Profil mis a jour</p>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)} required
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Prénom</label>
              <input value={prenom} onChange={e => setPrenom(e.target.value)} required
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com"
              className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-btn disabled:opacity-60 mt-2">
            {loading ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  )
}
