import { useState } from 'react';
import {
  SearchIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon,
} from '../../components/Icons';

type TabKey = 'tous' | 'bailleurs' | 'locataires' | 'agents';

interface UserRow {
  id: number;
  initials: string;
  bg: string;
  nom: string;
  telephone: string;
  role: string;
  localisation: string;
  verif: 'verified' | 'pending';
  verifLabel: string;
  date: string;
}

const USERS: UserRow[] = [
  {
    id: 1, initials: 'KB', bg: '#2563EB',
    nom: 'Koffi BENOIT', telephone: '+229 97 00 00 01',
    role: 'Bailleur', localisation: 'Cotonou, Fidjrossè',
    verif: 'verified', verifLabel: '✓ VÉRIFIÉ (CIP)',
    date: '12 Oct 2023',
  },
  {
    id: 2, initials: 'SO', bg: '#F97316',
    nom: 'Sèna Odile', telephone: '+229 61 22 33 44',
    role: 'Locataire', localisation: 'Abomey-Calavi',
    verif: 'pending', verifLabel: '⚠ EN ATTENTE',
    date: '20 Déc 2023',
  },
  {
    id: 3, initials: 'KB', bg: '#2563EB',
    nom: 'Koffi BENOIT', telephone: '+229 97 00 00 01',
    role: 'Bailleur', localisation: 'Cotonou, Fidjrossè',
    verif: 'verified', verifLabel: '✓ VÉRIFIÉ (CIP)',
    date: '12 Oct 2023',
  },
  {
    id: 4, initials: 'SO', bg: '#F97316',
    nom: 'Kodjo luc', telephone: '+229 61 22 33 44',
    role: 'Locataire', localisation: 'Abomey-Calavi',
    verif: 'pending', verifLabel: '⚠ EN ATTENTE',
    date: '20 Déc 2023',
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tous', label: 'Tous (12,480)' },
  { key: 'bailleurs', label: 'Bailleurs' },
  { key: 'locataires', label: 'Locataires' },
  { key: 'agents', label: 'Agents Immo' },
];

export default function UtilisateursPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('tous');

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1 style={{ color: 'var(--c-text)' }}>Gestion des Utilisateurs</h1>
        </div>
        <div className="immo-spacer" />
        <button className="btn-blue-main">
          <PlusIcon /> Ajouter un utilisateur
        </button>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="user-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`user-tab ${activeTab === t.key ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="immo-spacer" />
          <div className="immo-search-wrap">
            <SearchIcon />
            <input placeholder="Rechercher par nom ou téléphone..." style={{ width: 220 }} />
          </div>
        </div>

        {/* Table */}
        <div className="user-table-wrap">
          {/* Header */}
          <div className="user-table-header">
            <span className="user-table-col">Utilisateur</span>
            <span className="user-table-col">Rôle & Localisation</span>
            <span className="user-table-col">Vérification</span>
            <span className="user-table-col">Date d'inscription</span>
            <span className="user-table-col">Actions</span>
          </div>

          {/* Rows */}
          {USERS.map((u) => (
            <div className="user-row" key={u.id}>
              {/* Utilisateur */}
              <div className="user-cell">
                <div className="user-av" style={{ background: u.bg }}>{u.initials}</div>
                <div>
                  <div className="user-name">{u.nom}</div>
                  <div className="user-phone">{u.telephone}</div>
                </div>
              </div>

              {/* Rôle */}
              <div>
                <div className="user-role">{u.role}</div>
                <div className="user-location">{u.localisation}</div>
              </div>

              {/* Vérification */}
              <div>
                <span className={`badge-verif ${u.verif}`}>{u.verifLabel}</span>
              </div>

              {/* Date */}
              <div className="user-date">{u.date}</div>

              {/* Actions */}
              <div className="user-actions">
                <button className="btn-icon-sm"><EditIcon /></button>
                <button className="btn-icon-sm danger"><TrashIcon /></button>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="user-table-footer">
            <span>Affichage de 1–10 sur 12,480</span>
            <div className="immo-pagination">
              <button className="page-btn">Précédent</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">Suivant</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
