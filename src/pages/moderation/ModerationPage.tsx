import { useState } from 'react';
import {
  BellIcon, SearchIcon, CheckIcon, XIcon, EditIcon,
  HomeIcon, AlertIcon, CastleIcon, EyeIcon, ImageIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '../../components/Icons';

type Tab = 'valider' | 'plaintes';

interface ModRow {
  id: number;
  photoType: 'image' | 'eye' | 'house';
  typeLabel: string;
  typeColor?: string;
  nom: string;
  sousTitre: string;
  alerteText?: string;
  caution: string;
  agentInitials: string;
  agentBg: string;
  agentNom: string;
  agentStatut: string;
  agentVerified: boolean;
  risque: 'minimal' | 'moyen' | 'critique';
  action: 'approve' | 'block';
}

const MOD_ROWS: ModRow[] = [
  {
    id: 1,
    photoType: 'image',
    typeLabel: 'Appartement',
    typeColor: '#2563EB',
    nom: '3 PIÈCES – FIDJROSSÈ KPOTA',
    sousTitre: '150.000 FCFA/mois • 2e Étage',
    caution: '3+1\nMois',
    agentInitials: 'KM',
    agentBg: '#F97316',
    agentNom: 'Koffi M.',
    agentStatut: 'Agent certifié',
    agentVerified: true,
    risque: 'minimal',
    action: 'approve',
  },
  {
    id: 2,
    photoType: 'eye',
    typeLabel: 'Villa Meublée',
    typeColor: '#F97316',
    nom: 'VILLA LUXE – HAIE VIVE',
    sousTitre: '',
    alerteText: 'Alerte : Tentative d\'arnaque hors plateforme',
    caution: 'LIBRE',
    agentInitials: '?',
    agentBg: '#CBD5E1',
    agentNom: 'Inconnu_97',
    agentStatut: 'Numéro non vérifié',
    agentVerified: false,
    risque: 'critique',
    action: 'block',
  },
  {
    id: 3,
    photoType: 'house',
    typeLabel: 'Studio',
    typeColor: '#2563EB',
    nom: 'ENTRÉE COUCHÉE – CALAVI ITA',
    sousTitre: '45.000 FCFA/mois • Eau/Élec inclus',
    caution: '2+1\nMois',
    agentInitials: 'SB',
    agentBg: '#6366F1',
    agentNom: 'Samuel B.',
    agentStatut: 'Propriétaire particulier',
    agentVerified: true,
    risque: 'moyen',
    action: 'approve',
  },
];

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('valider');

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Files de Modération</h1>
          <p>Focus : Locations immobilières</p>
        </div>
        <div className="immo-spacer" />
        <div className="immo-status">
          <div className="immo-status-dot" />
          COTONOU DC-1 ONLINE
        </div>
        <button className="immo-bell-btn"><BellIcon /></button>
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
        {/* Stat cards */}
        <div className="mod-stat-cards">
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Nouveaux Appartements</div>
              <div className="mod-stat-value">28</div>
            </div>
            <div className="mod-stat-icon">
              <HomeIcon size={24} />
            </div>
          </div>
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Nouvelles Villas</div>
              <div className="mod-stat-value">14</div>
            </div>
            <div className="mod-stat-icon">
              <CastleIcon size={24} />
            </div>
          </div>
          <div className="mod-stat-card urgent">
            <div>
              <div className="mod-stat-label">Signalements Urgents</div>
              <div className="mod-stat-value">07</div>
            </div>
            <div className="mod-stat-icon">
              <AlertIcon size={24} />
            </div>
          </div>
        </div>

        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="mod-tabs">
            <button
              className={`mod-tab ${activeTab === 'valider' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('valider')}
            >
              À Valider
            </button>
            <button
              className={`mod-tab ${activeTab === 'plaintes' ? 'active' : 'inactive'}`}
              onClick={() => setActiveTab('plaintes')}
            >
              Plaintes (Signalements)
            </button>
          </div>
          <div className="mod-search-wrap">
            <SearchIcon />
            <input placeholder="Rechercher une annonce..." />
          </div>
        </div>

        {/* Table */}
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div className="mod-table-header">
            <span className="mod-table-col">Détails Location</span>
            <span className="mod-table-col">Caution</span>
            <span className="mod-table-col">Auteur / Agent</span>
            <span className="mod-table-col">Niveau Risque</span>
            <span className="mod-table-col">Actions</span>
          </div>

          {/* Rows */}
          {MOD_ROWS.map((row) => (
            <div
              key={row.id}
              className={`mod-row${row.photoType === 'eye' ? ' alert-row' : ''}`}
            >
              {/* Detail cell */}
              <div className="mod-detail-cell">
                <div className={`mod-photo${row.photoType === 'eye' ? ' alert-icon' : ''}`}>
                  {row.photoType === 'image' && <ImageIcon />}
                  {row.photoType === 'eye' && <EyeIcon />}
                  {row.photoType === 'house' && <HomeIcon size={22} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <span className={`mod-type-tag${row.photoType === 'eye' ? ' villa' : ''}`} style={{ color: row.typeColor }}>
                      {row.typeLabel}
                    </span>
                    <span className="mod-type-name">{row.nom}</span>
                  </div>
                  {row.sousTitre && <div className="mod-sub">{row.sousTitre}</div>}
                  {row.alerteText && <div className="mod-alert-text">{row.alerteText}</div>}
                </div>
              </div>

              {/* Caution */}
              <div>
                {row.caution === 'LIBRE' ? (
                  <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 600 }}>LIBRE</span>
                ) : (
                  <div style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                    <span className="mod-caution">{row.caution.split('\n')[0]}</span>
                    <br />
                    <span className="mod-caution-unit">{row.caution.split('\n')[1]}</span>
                  </div>
                )}
              </div>

              {/* Agent */}
              <div className="mod-agent-cell">
                <div
                  className="agent-av"
                  style={{ background: row.agentBg }}
                >
                  {row.agentInitials}
                </div>
                <div>
                  <div className="agent-name">{row.agentNom}</div>
                  <div className={`agent-status${!row.agentVerified ? ' unverified' : ''}`}>
                    {row.agentStatut}
                  </div>
                </div>
              </div>

              {/* Risque */}
              <div className="risk-cell">
                {row.risque === 'minimal' && (
                  <>
                    <div className="risk-dot" style={{ background: 'var(--c-green)' }} />
                    <span className="risk-label minimal">MINIMAL</span>
                  </>
                )}
                {row.risque === 'moyen' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="risk-label moyen">MOYEN</span>
                    <div className="risk-bar moyen" />
                  </div>
                )}
                {row.risque === 'critique' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span className="risk-label critique">CRITIQUE</span>
                    <div className="risk-bar critique" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mod-actions-cell">
                {row.action === 'approve' && (
                  <>
                    <button className="btn-validate-circle"><CheckIcon size={15} /></button>
                    {row.risque === 'minimal' ? (
                      <button className="btn-reject-circle"><XIcon size={14} /></button>
                    ) : (
                      <button className="btn-icon-sm"><EditIcon /></button>
                    )}
                  </>
                )}
                {row.action === 'block' && (
                  <button className="btn-block-ban">BLOQUER & BANNIR</button>
                )}
              </div>
            </div>
          ))}

          {/* Footer table */}
          <div style={{
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--c-border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Affichage de 1 à 3 sur 42 annonces locatives
            </span>
            <div className="immo-pagination">
              <button className="page-btn"><ChevronLeftIcon /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn"><ChevronRightIcon /></button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mod-footer-row">
          {/* Règle d'or */}
          <div className="regle-or-card">
            <div className="regle-or-title">
              <div className="regle-or-dot" />
              Règle d'or Modération
            </div>
            <p className="regle-or-text">
              "Toute annonce de location exigeant un paiement de visite ou de dossier par Mobile Money
              sans visite physique préalable doit être immédiatement signalée et bloquée."
            </p>
          </div>

          {/* Indices de confiance */}
          <div className="indices-card">
            <div className="indices-title">Indices de confiance</div>
            {[
              'Authenticité des photos (AI Scan)',
              'Analyse des prix du secteur',
              'Vérification numéro de téléphone',
              'Score de fiabilité vendeur',
            ].map((label) => (
              <div className="indice-row" key={label}>
                <span>{label}</span>
                <span className="badge-actif">ACTIF</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
