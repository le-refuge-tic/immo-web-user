import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import logoUrl from '../../../assets/REFUGE-LOGO.webp'
import { GREEN, GREEN_TX } from '../shared'
import { TABS } from '../tabsConfig'
import { IcLogout } from '../icons'
import type { Tab } from '../shared'
import { withAlpha } from '../../../utils/color'

interface SidebarProps {
  tab: Tab
  setTab: (tab: Tab) => void
  user: { prenom?: string; nom?: string } | null
  navigate: NavigateFunction
  logout: () => void
}

// ─── Sidebar (desktop) ──────────────────────────────────────────────────────
export default function Sidebar({ tab, setTab, user, navigate, logout }: SidebarProps) {
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 md:h-dvh md:sticky md:top-0"
      style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(40px) saturate(180%)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5 px-6 pt-6 pb-5 flex-shrink-0">
        <img loading="lazy" src={logoUrl} alt="REFUGE" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--c-cyan)' }}>REFUGE</span>
      </button>
      <p className="px-6 mb-2 text-micro font-bold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Espace Locataire</p>
      <nav className="flex-1 px-3 space-y-1">
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => t.key === 'messages' ? navigate('/conversations') : setTab(t.key)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
              style={{ color: active ? GREEN_TX : 'var(--tx-ink-55)', background: active ? withAlpha(GREEN, '15') : 'transparent' }}>
              <span style={{ color: active ? GREEN_TX : 'rgba(0,0,0,0.4)' }}>{t.icon(active)}</span>
              {t.label}
            </button>
          )
        })}
      </nav>
      <div className="px-3 pb-5 flex-shrink-0">
        <button onClick={() => navigate('/profil')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
          style={{ background: hoveredBtn === 'profil' ? 'rgba(0,0,0,0.04)' : 'transparent' }}
          onMouseEnter={() => setHoveredBtn('profil')}
          onMouseLeave={() => setHoveredBtn(null)}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, var(--c-emerald-dark), ${GREEN})` }}>{initials}</div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-bold text-text-dark truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-micro text-text-grey">Locataire</p>
          </div>
        </button>
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: 'var(--tx-red)', background: hoveredBtn === 'logout' ? 'rgba(239,68,68,0.031)' : 'transparent' }}
          onMouseEnter={() => setHoveredBtn('logout')}
          onMouseLeave={() => setHoveredBtn(null)}>
          <IcLogout /> Déconnexion
        </button>
      </div>
    </aside>
  )
}
