import AppearanceSetting from '../../../components/AppearanceSetting'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { walletApi } from '../../../api/walletApi'
import EditProfileModal from '../../profile/EditProfileModal'
import ChangePasswordModal from '../../profile/ChangePasswordModal'
import VerificationCipModal from '../VerificationCipModal'
import DelegationModal from '../DelegationModal'
import NumeroRetraitModal from '../../../components/wallet/NumeroRetraitModal'
import { IcPayments, IcChevron, IcHandshake } from './icons'
import { IcWallet, IcPerson, IcStar, IcShield, IcEdit, IcUpload, BLUE } from './shared'

export function ProfilTab({ user, biens, visites, onOpenTransactions, onOpenRoles, onScrolled }: { user: any; biens: any[]; visites: any[]; onOpenTransactions: () => void; onOpenRoles: () => void; onScrolled?: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [cipOpen, setCipOpen] = useState(false)
  const [delegationOpen, setDelegationOpen] = useState(false)
  const [numeroRetraitOpen, setNumeroRetraitOpen] = useState(false)
  const [numeroRetrait, setNumeroRetrait] = useState<{ masque: string | null } | null>(null)
  const [hoveredEl, setHoveredEl] = useState<string | null>(null)
  useEffect(() => { walletApi.numeroRetrait().then(setNumeroRetrait).catch(() => {}) }, [])
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const score = user?.score_credibilite ?? 100

  const approuves = biens.filter(b => b.statut_moderation === 'approuve').length
  const tauxPublication = biens.length > 0 ? Math.round((approuves / biens.length) * 100) : 0
  const biensOccupes = biens.filter(b => b.statut === 'occupe').length
  const tauxOccupation = biens.length > 0 ? Math.round((biensOccupes / biens.length) * 100) : 0

  const visitesConfirmees = visites.filter(v => v.statut === 'confirmee').length
  const visitesEnAttente = visites.filter(v => v.statut === 'en_attente').length
  const visitesEffectuees = visites.filter(v => v.statut === 'effectuee').length

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  const kpis = [
    { label: 'Score', value: `${Math.round(score)}`, color: BLUE },
    { label: 'Occupation', value: `${tauxOccupation}%`, color: '#16A34A' },
    { label: 'Publiés', value: `${tauxPublication}%`, color: 'var(--tx-amber)' },
  ]

  const menuItems = [
    { icon: <IcEdit />, label: 'Modifier le profil', color: BLUE, onClick: () => setEditOpen(true) },
    { icon: <IcShield />, label: 'Changer le mot de passe', color: '#7B2FBE', onClick: () => setPasswordOpen(true) },
    { icon: <IcUpload />, label: 'Vérification CIP / IFU', color: '#0EA5E9', onClick: () => setCipOpen(true) },
    { icon: <IcHandshake />, label: 'Déléguer la gestion', color: '#EC4899', onClick: () => setDelegationOpen(true) },
    { icon: <IcWallet />, label: 'Numéro de retrait MoMo', color: '#FFB300', onClick: () => setNumeroRetraitOpen(true) },
    { icon: <IcPerson />, label: 'Gérer mes rôles', color: 'var(--tx-amber)', onClick: onOpenRoles },
    { icon: <IcPayments />, label: 'Historique des transactions', color: '#16A34A', onClick: onOpenTransactions },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      <div className="flex-1 overflow-y-auto pb-10"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>COMPTE</p>
            <h2 className="text-[24px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>Mon profil</h2>
          </div>

          <div className="px-4 space-y-3">
            {/* Carte hero — version claire du gradient mobile [#0D1117→#1A1F5E→#0F3460] */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.14)' }}>
              <div className="relative px-5 pt-5 pb-7"
                style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 55%, #DBEAFE 100%)' }}>
                {/* Cercles décoratifs */}
                <div className="absolute top-0 right-0 w-52 h-52 rounded-full pointer-events-none"
                  style={{ background: 'rgba(99,102,241,0.08)', transform: 'translate(35%, -35%)' }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'rgba(59,130,246,0.07)', transform: 'translate(-35%, 35%)' }} />
                {/* Badge rôle */}
                <div className="flex justify-end mb-5">
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                    style={{ background: 'rgba(99,102,241,0.14)', color: '#3730A3' }}>Propriétaire</span>
                </div>
                {/* Avatar + infos */}
                <div className="flex flex-col items-center text-center">
                  {user?.photo_profil
                    ? <img loading="lazy" src={user.photo_profil} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-3"
                        style={{ border: '3px solid rgba(255,255,255,0.9)' }} />
                    : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #4B6BFF, #6366F1)', border: '3px solid rgba(255,255,255,0.9)' }}>
                        {initials}
                      </div>
                  }
                  <p className="font-black text-[19px] leading-tight" style={{ color: '#1E1B4B' }}>{user?.prenom} {user?.nom}</p>
                  <p className="text-[13px] mt-1" style={{ color: '#4338CA' }}>{user?.email || user?.telephone}</p>
                  {memberSince && (
                    <p className="text-[12px] mt-2" style={{ color: '#6366F1' }}>Membre depuis {memberSince}</p>
                  )}
                </div>
              </div>
            </div>

          {/* KPI strip */}
          <div className="flex rounded-2xl overflow-hidden"
            style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {kpis.map((k, i) => (
              <div key={k.label} className="flex-1 flex flex-col items-center justify-center py-5 px-2 text-center"
                style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                <p className="text-[26px] font-black leading-none" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Menu actions */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {menuItems.map((item, i) => (
              <button key={i} onClick={item.onClick}
                className="w-full flex items-center gap-3.5 px-4 py-4 text-left transition-colors"
                style={{ borderTop: i > 0 ? '1px solid var(--p-border)' : 'none', background: hoveredEl === `menu-${i}` ? 'var(--p-deep)' : 'transparent' }}
                onMouseEnter={() => setHoveredEl(`menu-${i}`)}
                onMouseLeave={() => setHoveredEl(null)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.color + '14', color: item.color }}>
                  {item.icon}
                </div>
                <p className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--p-text)' }}>{item.label}</p>
                <span style={{ color: 'var(--p-muted)' }}><IcChevron /></span>
              </button>
            ))}
          </div>

          {/* Visites */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--p-muted)' }}>MES RÉSERVATIONS</p>
            <div className="flex">
              {[
                { label: 'Total', value: visites.length, color: BLUE },
                { label: 'Confirmées', value: visitesConfirmees, color: '#16A34A' },
                { label: 'En attente', value: visitesEnAttente, color: 'var(--tx-amber)' },
                { label: 'Effectuées', value: visitesEffectuees, color: '#7B2FBE' },
              ].map((s, i) => (
                <div key={s.label} className="flex-1 min-w-0 flex flex-col items-center justify-center"
                  style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                  <p className="text-[22px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-1.5 truncate px-1 text-center" style={{ color: 'var(--p-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Biens */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--p-muted)' }}>MES BIENS</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: biens.length, color: BLUE },
                { label: 'Publiés', value: approuves, color: '#16A34A' },
                { label: 'Occupés', value: biensOccupes, color: 'var(--tx-amber)' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center justify-center py-3 rounded-xl"
                  style={{ background: s.color + '0E' }}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--p-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            {user?.nb_etoiles != null && (
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--p-border)' }}>
                <span style={{ color: 'var(--tx-amber)' }}><IcStar /></span>
                <p className="text-[13px] font-bold" style={{ color: 'var(--p-text)' }}>
                  {user.nb_etoiles} étoile{user.nb_etoiles !== 1 ? 's' : ''}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--p-muted)' }}>note moyenne clients</p>
              </div>
            )}
          </div>

          {/* Apparence (seul réglage de thème de l'espace propriétaire) */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
            <AppearanceSetting />
          </div>

          {/* Déconnexion */}
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all"
            style={{ background: hoveredEl === 'logout' ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.08)', color: 'var(--tx-red)', border: '1px solid #EF444433' }}
            onMouseEnter={() => setHoveredEl('logout')}
            onMouseLeave={() => setHoveredEl(null)}>
            Se déconnecter
          </button>
          </div>{/* /space-y-3 */}
        </div>{/* /max-w-2xl */}
      </div>{/* /overflow-y-auto */}
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      {cipOpen && <VerificationCipModal user={user} onClose={() => setCipOpen(false)} />}
      {delegationOpen && <DelegationModal onClose={() => setDelegationOpen(false)} />}
      {numeroRetraitOpen && (
        <NumeroRetraitModal
          current={numeroRetrait?.masque ?? null}
          onClose={() => setNumeroRetraitOpen(false)}
          onSaved={() => { setNumeroRetraitOpen(false); walletApi.numeroRetrait().then(setNumeroRetrait).catch(() => {}) }}
        />
      )}
    </div>
  )
}

