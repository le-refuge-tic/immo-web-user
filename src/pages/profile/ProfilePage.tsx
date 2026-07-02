import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'

const ROLE_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  locataire: 'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur: 'Démarcheur',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const rt = localStorage.getItem('rg_refresh') || ''
    try { await authApi.logout(rt) } catch (_) {}
    logout()
    navigate('/', { replace: true })
  }

  if (!user) return null

  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
  const role = user.role
  const isDash = role === 'proprietaire' || role === 'demarcheur'

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-[#7B4BFF] px-4 pt-14 pb-10 text-center">
        {user.photo_profil ? (
          <img src={user.photo_profil} alt="" className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto border-4 border-white">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
        )}
        <h2 className="text-white font-bold text-lg mt-3">
          {user.prenom} {user.nom}
        </h2>
        <span className="mt-1 inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {ROLE_LABELS[role] || role}
        </span>
      </div>

      <div className="px-4 -mt-4">
        {/* Contact info */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          {user.telephone && (
            <div className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 bg-primary-l rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-grey">Téléphone</p>
                <p className="text-sm font-semibold text-text-dark">{user.telephone}</p>
              </div>
            </div>
          )}
          {user.email && (
            <div className="flex items-center gap-3 py-2.5 border-t border-divider">
              <div className="w-8 h-8 bg-primary-l rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-grey">Email</p>
                <p className="text-sm font-semibold text-text-dark">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-card mb-4 overflow-hidden">
          {isDash && (
            <MenuItem
              icon="📊"
              label="Mon tableau de bord"
              onClick={() => navigate(role === 'proprietaire' ? '/proprietaire' : '/demarcheur')}
            />
          )}
          <MenuItem icon="✏️" label="Modifier mon profil" onClick={() => navigate('/profil/edit')} />
          <MenuItem icon="🔒" label="Changer le mot de passe" onClick={() => navigate('/profil/password')} />
          <MenuItem icon="📅" label="Mes visites" onClick={() => navigate('/mes-visites')} />
          <MenuItem icon="❤️" label="Mes favoris" onClick={() => navigate('/favoris')} />
        </div>

        <div className="bg-white rounded-2xl shadow-card mb-6 overflow-hidden">
          <MenuItem
            icon="🚪"
            label="Se déconnecter"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 border-b border-divider last:border-0 active:bg-surface-g"
    >
      <span className="text-xl">{icon}</span>
      <span className={`flex-1 text-left text-sm font-semibold ${danger ? 'text-danger' : 'text-text-dark'}`}>
        {label}
      </span>
      <svg className="w-4 h-4 text-text-grey" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
