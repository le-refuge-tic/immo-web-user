import AppearanceSetting from '../../../components/AppearanceSetting'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { walletApi } from '../../../api/walletApi'
import NumeroRetraitModal from '../../../components/wallet/NumeroRetraitModal'
import { GREEN, GREEN_TX } from '../shared'
import { IcLogout } from '../icons'
import { withAlpha } from '../../../utils/color'

export default function ProfilTab() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const [numeroInfo, setNumeroInfo] = useState<{ masque: string | null } | null>(null)
  const [showNumeroModal, setShowNumeroModal] = useState(false)
  useEffect(() => { walletApi.numeroRetrait().then(setNumeroInfo).catch(() => { /* information secondaire : la ligne reste « non défini » */ }) }, [])
  return (
    <div className="flex-1 overflow-y-auto pb-10 pt-5 md:pt-10 md:max-w-2xl md:mx-auto md:w-full">
      <div className="flex flex-col items-center px-5 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
          style={{ background: `linear-gradient(135deg, var(--c-emerald-dark), ${GREEN})` }}>{initials}</div>
        <p className="font-bold text-text-dark text-lg">{user?.prenom} {user?.nom}</p>
        <p className="text-sm text-text-grey mt-0.5">{user?.email || user?.telephone}</p>
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: withAlpha(GREEN, '20'), color: GREEN_TX }}>Locataire</span>
      </div>
      <div className="px-4 space-y-2">
        {[
          { label: 'Modifier le profil', action: () => navigate('/profil') },
          { label: 'Gérer mes rôles', action: () => navigate('/mes-roles') },
          { label: 'Rejoindre un bien (code d\'invitation)', action: () => navigate('/rejoindre-bien') },
          { label: 'Mon portefeuille', action: () => navigate('/portefeuille') },
          { label: `Numéro de retrait MoMo${numeroInfo?.masque ? ` (${numeroInfo.masque})` : ''}`, action: () => setShowNumeroModal(true) },
          { label: 'Mes transactions', action: () => navigate('/mes-paiements') },
          { label: 'Revenir à l\'accueil', action: () => navigate('/') },
        ].map(item => (
          <button key={item.label} onClick={item.action}
            className="w-full bg-white rounded-xl px-4 py-3.5 flex items-center justify-between shadow-sm">
            <span className="text-sm font-semibold text-text-dark">{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-grey"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
        <div className="w-full glass-card rounded-xl"><AppearanceSetting /></div>
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm border flex items-center justify-center gap-2"
          style={{ color: 'var(--tx-red)', borderColor: 'rgba(239,68,68,0.188)', background: 'rgba(239,68,68,0.031)' }}>
          <IcLogout /> Déconnexion
        </button>
      </div>
      {showNumeroModal && (
        <NumeroRetraitModal
          current={numeroInfo?.masque ?? null}
          accent={GREEN}
          onClose={() => setShowNumeroModal(false)}
          onSaved={() => { setShowNumeroModal(false); walletApi.numeroRetrait().then(setNumeroInfo).catch(() => { /* information secondaire : la ligne reste « non défini » */ }) }}
        />
      )}
    </div>
  )
}
