import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePageTitle } from '../../utils/usePageTitle'
import { GREEN, TEAL } from './shared'
import type { Tab } from './shared'
import { TABS } from './tabsConfig'
import { IcChat } from './icons'
import MonLogementTab from './tabs/MonLogementTab'
import ActiviteTab from './tabs/ActiviteTab'
import AlertesTab from './tabs/AlertesTab'
import ProfilTab from './tabs/ProfilTab'
import Sidebar from './tabs/Sidebar'

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function LocataireDashboard() {
  usePageTitle('Mon espace')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('logement')
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  const title = tab === 'logement' ? 'Mon Logement'
    : tab === 'activite' ? 'Activité'
    : tab === 'messages' ? 'Messages'
    : tab === 'alertes' ? 'Alertes'
    : 'Mon Profil'

  return (
    <div className="flex h-dvh" style={{ background: '#F0FDF4' }}>
      <Sidebar tab={tab} setTab={setTab} user={user} navigate={navigate} logout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex-shrink-0 px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-5" style={{ background: `linear-gradient(135deg, #065F46, ${GREEN})` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">REFUGE · Locataire</p>
              <p className="text-white font-bold text-xl mt-0.5">{title}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}>{initials}</div>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-between px-8 h-16" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)' }}>
          <p className="font-bold text-text-dark text-xl">{title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tab === 'logement' && <MonLogementTab />}
          {tab === 'activite' && <ActiviteTab />}
          {tab === 'messages' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: TEAL + '20' }}>
                <IcChat />
              </div>
              <p className="font-bold text-text-dark mb-1">Messagerie</p>
              <button onClick={() => navigate('/conversations')} className="mt-3 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90" style={{ background: TEAL }}>
                Ouvrir les conversations
              </button>
            </div>
          )}
          {tab === 'alertes' && <AlertesTab />}
          {tab === 'profil' && <ProfilTab />}
        </div>

        {/* Bottom Nav — mobile only */}
        <div className="md:hidden flex-shrink-0 border-t bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(20,22,30,0.95)] border-black/[0.06] dark:border-white/[0.08]" style={{ backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around px-2 py-2">
            {TABS.map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => t.key === 'messages' ? navigate('/conversations') : setTab(t.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-2xl transition-all ${active ? '' : 'text-black/55 dark:text-white/60'}`}
                  style={active ? { background: GREEN + '18', color: GREEN } : {}}>
                  <span>{t.icon(active)}</span>
                  {/* Libellé toujours visible : une icône seule n'est pas assez explicite */}
                  <span className={`text-micro ${active ? 'font-bold' : 'font-semibold'}`}>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
