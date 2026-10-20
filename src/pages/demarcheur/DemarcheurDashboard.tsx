import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { userApi } from '../../api/userApi'
import { commercialApi, type CompteursCommercial, type PerfHebdoSemaine } from '../../api/commercialApi'
import { usePageTitle } from '../../utils/usePageTitle'
import { useNotifications } from '../../context/NotificationsContext'
import { ModalSheet } from '../../components/ui/ModalSheet'
import type { Bien } from '../../types/api'
import type { ProfilDemarcheur } from '../../types/demarcheur'
import { unwrapList } from '../../utils/unwrapList'
import { PURPLE, DARK_PURPLE, MID_PURPLE, isCommercial, type Tab } from './shared'
import { IcDash, IcHome, IcCal, IcPerson, IcPlus, IcVerif, IcEye, IcStar, IcBell, IcWallet } from './icons'
import TableauTab from './tabs/TableauTab'
import MesBiensTab from './tabs/MesBiensTab'
import ReservationsTab from './tabs/ReservationsTab'
import NotificationsTab from './tabs/NotificationsTab'
import PortefeuilleTab from './tabs/PortefeuilleTab'
import DelegationsRecuesTab from './tabs/DelegationsRecuesTab'
import ProfilTab from './tabs/ProfilTab'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'tableau',      label: 'Tableau',      icon: <IcDash /> },
  { key: 'biens',        label: 'Mes biens',    icon: <IcHome /> },
  { key: 'reservations',  label: 'Réservations', icon: <IcCal /> },
  { key: 'notifications', label: 'Notifications', icon: <IcBell /> },
  { key: 'portefeuille',  label: 'Portefeuille', icon: <IcWallet /> },
  { key: 'profil',        label: 'Profil',       icon: <IcPerson /> },
]

const PRIMARY_TABS: Tab[] = ['tableau', 'biens', 'reservations']

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function DemarcheurDashboard() {
  usePageTitle('Espace démarcheur')
  const { user: authUser } = useAuth()
  const { unreadAlertesEspace: unreadAlertes } = useNotifications()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('tableau')
  const [moreOpen, setMoreOpen] = useState(false)
  const [user, setUser] = useState<ProfilDemarcheur | null>(null)
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [compteurs, setCompteurs] = useState<CompteursCommercial | null>(null)
  const [perfHebdo, setPerfHebdo] = useState<PerfHebdoSemaine[]>([])

  const loadData = async () => {
    try {
      const [u, b] = await Promise.allSettled([userApi.me(), biensApi.mesBiens()])
      const me = u.status === 'fulfilled' ? (u.value?.user || u.value) : null
      if (me) setUser(me)
      if (b.status === 'fulfilled') setBiens(unwrapList(b.value))

      // Compteurs + performance hebdo : uniquement pour les commerciaux, sur leur propre id.
      if (me && isCommercial(me) && me.id) {
        const [c, p] = await Promise.allSettled([
          commercialApi.compteurs(me.id),
          commercialApi.performanceHebdo(me.id, 8),
        ])
        if (c.status === 'fulfilled') setCompteurs(c.value)
        if (p.status === 'fulfilled') setPerfHebdo(p.value)
      }
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const me = user || authUser
  const initials = `${me?.prenom?.[0] || ''}${me?.nom?.[0] || ''}`.toUpperCase()
  const score = me?.score_credibilite ?? 100

  return (
    <div className="flex flex-col xl:flex-row h-full bg-[#F4F6FA] dark:bg-[#0F0F14] relative">

      {/* Sidebar (desktop only) */}
      <aside className="hidden xl:flex xl:flex-col xl:w-64 2xl:w-72 flex-shrink-0 bg-white border-r border-divider">
        <div className="px-6 pt-8 pb-6 flex items-center gap-3 border-b border-divider">
          <div className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-dark text-sm truncate">{loading ? '…' : `${me?.prenom || ''} ${me?.nom || ''}`.trim()}</p>
            <p className="text-xs text-text-grey">Démarcheur</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={active ? { background: PURPLE + '15', color: PURPLE } : { color: '#5F6B7A' }}>
                <span style={{ color: active ? PURPLE : '#5F6672' }}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-divider">
          <button onClick={() => navigate('/nouveau-bien')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: PURPLE }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:pt-8 xl:pt-8 pb-6 md:pb-8" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE} 0%, ${MID_PURPLE} 60%, ${PURPLE} 100%)` }}>
        <div className="md:max-w-5xl md:mx-auto xl:max-w-none xl:mx-0">
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-[13px] flex items-center justify-center border flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="text-white font-bold text-sm md:text-base">{initials}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs md:text-sm">Bonjour 👋</p>
              <p className="text-white font-bold text-base md:text-xl truncate">{loading ? '…' : `${me?.prenom || ''} ${me?.nom || ''}`.trim()}</p>
            </div>
            {/* Cloche → onglet notifications interne à l'espace démarcheur */}
            <button onClick={() => setTab('notifications')} title="Notifications"
              className="relative w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 transition-colors"
              style={{ background: tab === 'notifications' ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}>
              <IcBell />
              {unreadAlertes > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#FF3B30', borderColor: MID_PURPLE }} />}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border flex-shrink-0 xl:hidden"
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}>
              <IcVerif />
              <span className="text-white text-caption md:text-xs font-semibold">Démarcheur</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-4 md:max-w-xl">
            {[
              { icon: <IcHome />, value: `${biens.length}`, label: 'Biens' },
              { icon: <IcEye />,  value: '--',              label: 'Vues' },
              { icon: <IcCal />,  value: '--',              label: 'Visites' },
              { icon: <IcStar />, value: `${score}`,        label: 'Crédibilité' },
            ].map(s => (
              <div key={s.label} className="rounded-xl py-2.5 md:py-3.5 px-1 text-center border transition-transform md:hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.15)' }}>
                <span className="text-white flex justify-center mb-1">{s.icon}</span>
                <p className="text-white font-bold text-base md:text-lg leading-none">{s.value}</p>
                <p className="text-micro md:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:max-w-5xl md:mx-auto md:w-full xl:max-w-none xl:mx-0">
        {tab === 'tableau' && (
          <TableauTab me={me} biens={biens} loading={loading} score={score} compteurs={compteurs} perfHebdo={perfHebdo}
            onOpenTab={setTab} onNouveauBien={() => navigate('/nouveau-bien')} />
        )}
        {tab === 'biens'         && <MesBiensTab />}
        {tab === 'reservations'  && <ReservationsTab />}
        {tab === 'notifications' && <NotificationsTab onOpenTab={setTab} />}
        {tab === 'portefeuille' && <PortefeuilleTab />}
        {tab === 'delegations'  && <DelegationsRecuesTab onBack={() => setTab('profil')} />}
        {tab === 'profil'       && <ProfilTab user={me} onOpenDelegations={() => setTab('delegations')} />}
      </div>

      {/* FAB */}
      {(tab === 'tableau' || tab === 'biens') && (
        <div className="xl:hidden absolute bottom-20 right-4 md:bottom-24 md:right-8 z-20">
          <button onClick={() => navigate('/nouveau-bien')}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full text-white font-bold shadow-lg active:scale-95 md:hover:-translate-y-0.5 transition-transform"
            style={{ background: PURPLE, boxShadow: `0 4px 15px ${PURPLE}60` }}>
            <IcPlus /> Nouveau bien
          </button>
        </div>
      )}

      {/* Bottom Nav (mobile & tablet only — desktop uses the sidebar) : 4 onglets + « Plus », libellés visibles */}
      <div className="xl:hidden flex-shrink-0 md:px-6 md:pb-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-white dark:bg-[#14161E] border-t border-divider dark:border-white/10 md:border md:rounded-2xl" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-around px-2 py-2 md:max-w-lg md:mx-auto">
            {TABS.filter(t => PRIMARY_TABS.includes(t.key)).map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)} aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[60px] rounded-[14px] transition-all ${active ? '' : 'text-[#6B6B70] dark:text-white/60'}`}
                  style={active ? { background: PURPLE + '18', color: PURPLE } : {}}>
                  <span>{t.icon}</span>
                  <span className={`text-[10px] ${active ? 'font-bold' : 'font-semibold'}`}>{t.label}</span>
                </button>
              )
            })}
            {(() => {
              const moreActive = !PRIMARY_TABS.includes(tab)
              return (
                <button onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen}
                  aria-current={moreActive ? 'page' : undefined}
                  aria-label={'Plus' + (unreadAlertes > 0 ? ', alertes non lues' : '')}
                  className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[60px] rounded-[14px] transition-all ${moreActive ? '' : 'text-[#6B6B70] dark:text-white/60'}`}
                  style={moreActive ? { background: PURPLE + '18', color: PURPLE } : {}}>
                  <span className="relative">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    {unreadAlertes > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full" style={{ background: '#FF3B30' }} />}
                  </span>
                  <span className={`text-[10px] ${moreActive ? 'font-bold' : 'font-semibold'}`}>{moreActive ? (TABS.find(t => t.key === tab)?.label ?? 'Plus') : 'Plus'}</span>
                </button>
              )
            })()}
          </div>
        </div>
      </div>

      <ModalSheet open={moreOpen} onClose={() => setMoreOpen(false)} label="Plus d'options">
        <div className="rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-white dark:bg-[#14161E]">
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-black/10 dark:bg-white/15" />
          <ul className="grid grid-cols-3 gap-2">
            {TABS.filter(t => !PRIMARY_TABS.includes(t.key)).map(t => {
              const active = tab === t.key
              return (
                <li key={t.key}>
                  <button onClick={() => { setTab(t.key); setMoreOpen(false) }}
                    className={`w-full flex flex-col items-center gap-1.5 py-3.5 rounded-2xl text-xs font-semibold border border-divider dark:border-white/10 ${active ? '' : 'text-text-dark'}`}
                    style={active ? { background: PURPLE + '18', color: PURPLE } : {}}>
                    <span style={{ color: active ? PURPLE : undefined }} className={active ? '' : 'text-text-grey'}>{t.icon}</span>
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </ModalSheet>
      </div>
    </div>
  )
}
