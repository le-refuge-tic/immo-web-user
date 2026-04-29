import {
  SearchIcon, BellIcon, ClockIcon, CheckIcon, XIcon, CardIcon, UsersIcon, HomeIcon, AlertIcon,
} from '../../components/Icons';

const STATS = [
  {
    label: 'UTILISATEURS TOTAUX',
    value: '12,480',
    badge: '+14%',
    sign: 'pos',
    iconBg: '#EFF6FF',
    icon: <UsersIcon size={22} />,
    iconColor: '#2563EB',
  },
  {
    label: 'ANNONCES ACTIVES',
    value: '3,120',
    badge: '+5%',
    sign: 'pos',
    iconBg: '#FFF7ED',
    icon: <HomeIcon size={22} />,
    iconColor: '#F97316',
  },
  {
    label: 'VOLUME MOMO (24H)',
    value: '15.4M',
    unit: 'F',
    badge: '+22%',
    sign: 'pos',
    iconBg: '#F0FDF4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    iconColor: '#16A34A',
  },
  {
    label: 'SIGNALEMENTS',
    value: '14',
    badge: '-2',
    sign: 'neg',
    iconBg: '#FEF2F2',
    icon: <AlertIcon size={22} />,
    iconColor: '#DC2626',
  },
];

const VERIFS = [
  { initials: 'M', color: '#94A3B8', name: 'Marc Toudonou',   sub: 'BAILLEUR • CALAVI',    doc: 'CIP / IFU', time: '10 min' },
  { initials: 'M', color: '#94A3B8', name: 'Marc Toudonou',   sub: 'BAILLEUR • CALAVI',    doc: 'CIP / IFU', time: '10 min' },
  { initials: 'A', color: '#F97316', name: 'Afiwa Amoussou',  sub: 'LOCATAIRE • COTONOU',  doc: 'CNI',       time: '25 min' },
];

export default function DashboardPage() {
  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-search-wrap">
          <SearchIcon />
          <input placeholder="Rechercher utilisateur, transaction..." readOnly />
        </div>

        <div className="immo-spacer" />

        <div className="immo-status">
          <div className="immo-status-dot" />
          COTONOU DC-1 ONLINE
        </div>

        <button className="immo-bell-btn">
          <BellIcon />
        </button>

        <div className="immo-admin-block">
          <div className="immo-admin-text">
            <div className="immo-admin-name">Admin_01</div>
            <div className="immo-admin-role">Super Administrateur</div>
          </div>
          <div className="immo-avatar-sq">AD</div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Title */}
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text)', margin: 0 }}>
            Akwaba, Admin !
          </h2>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', letterSpacing: '0.7px', textTransform: 'uppercase', marginTop: 4 }}>
            Vue d'ensemble de la plateforme Bénin
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-top">
                <div className="stat-icon-wrap" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
                <span className={`stat-badge ${s.sign}`}>{s.badge}</span>
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">
                  {s.value}
                  {s.unit && <span className="stat-unit">{s.unit}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Vérifications d'identité */}
          <div className="immo-card" style={{ padding: '20px 24px' }}>
            <div className="section-header">
              <span className="section-title">Vérifications d'identité en attente</span>
              <span className="section-link">VOIR TOUT</span>
            </div>

            {VERIFS.map((v, i) => (
              <div className="verif-row" key={i}>
                <div className="verif-avatar" style={{ background: v.color }}>
                  {v.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="verif-name">{v.name}</div>
                  <div className="verif-sub">{v.sub}</div>
                </div>
                <div className="verif-doc-type">
                  <div className="verif-doc-label">{v.doc}</div>
                  <div className="verif-time">
                    <ClockIcon />
                    {v.time}
                  </div>
                </div>
                <div className="verif-actions">
                  <button className="action-circle ok"><CheckIcon /></button>
                  <button className="action-circle ko"><XIcon /></button>
                </div>
              </div>
            ))}

            <div className="verif-more">32 autres dossiers en attente</div>
          </div>

          {/* Flux MOMO Global */}
          <div className="flux-momo-card">
            <div className="flux-header">
              <CardIcon size={18} />
              FLUX MOMO GLOBAL
            </div>
            <div>
              <div className="flux-amount">2.450.800<span>F</span></div>
              <div className="flux-today" style={{ marginTop: 6 }}>
                <div className="flux-today-dot" />
                Collecté aujourd'hui
              </div>
            </div>
            <div className="flux-split">
              <div className="flux-split-item">
                <div className="flux-split-label">MTN MOMO</div>
                <div className="flux-split-pct orange">65%</div>
              </div>
              <div className="flux-split-item">
                <div className="flux-split-label">MOOV MONEY</div>
                <div className="flux-split-pct">35%</div>
              </div>
            </div>
            <button className="btn-flux-export">EXPORTER RAPPORT FINANCIER</button>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="immo-footer-bar">
        <ClockIcon size={15} />
        <span>
          Dernière sauvegarde système effectuée avec succès à{' '}
          <strong>12:45</strong> (Cotonou Time)
        </span>
        <div className="footer-avatars">
          {[
            { label: 'AD', bg: '#2563EB' },
            { label: 'OP', bg: '#7C3AED' },
            { label: '+3', bg: '#94A3B8' },
          ].map((av) => (
            <div key={av.label} className="footer-av" style={{ background: av.bg }}>
              {av.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
