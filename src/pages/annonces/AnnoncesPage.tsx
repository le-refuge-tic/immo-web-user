import { useState } from 'react';
import { SearchIcon, PinIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';

type Filter = 'tous' | 'appartements' | 'villas' | 'terrains' | 'boosted';

interface Annonce {
  id: number;
  type: string;
  boost: 'or' | 'argent' | null;
  statut: 'actif' | 'en_attente';
  titre: string;
  prix: string;
  prixType: string;
  location: string;
  img: string;
  meta: { label: string; value: string; isLink?: boolean }[];
  pending: boolean;
}

const ANNONCES: Annonce[] = [
  {
    id: 1,
    type: 'VILLA',
    boost: 'or',
    statut: 'actif',
    titre: 'SPLENDIDE VILLA F5 – CALAVI ITA',
    prix: '450.000',
    prixType: 'LOYER MENSUEL',
    location: 'Abomey-Calavi, Bénin',
    img: 'https://picsum.photos/seed/villa1/800/500',
    meta: [
      { label: 'Caution', value: '3+1 Mois' },
      { label: 'Vues', value: '1.240' },
      { label: 'Auteur', value: 'Immo Direct', isLink: true },
    ],
    pending: false,
  },
  {
    id: 2,
    type: 'TERRAIN',
    boost: null,
    statut: 'en_attente',
    titre: 'TERRAIN 500M² – OUIDAH (PAHOU)',
    prix: '8.500.000',
    prixType: 'PRIX DE VENTE',
    location: 'Ouidah, Bénin',
    img: 'https://picsum.photos/seed/terrain1/800/500',
    meta: [
      { label: 'Documents', value: 'Convention' },
      { label: 'Vues', value: '45' },
      { label: 'Auteur', value: 'Particulier' },
    ],
    pending: true,
  },
  {
    id: 3,
    type: 'STUDIO',
    boost: 'argent',
    statut: 'actif',
    titre: 'STUDIO AMÉRICAIN – FIDJROSSÈ',
    prix: '85.000',
    prixType: 'LOYER MENSUEL',
    location: 'Cotonou, Bénin',
    img: 'https://picsum.photos/seed/studio1/800/500',
    meta: [
      { label: 'Caution', value: '3+3 Mois' },
      { label: 'Vues', value: '856' },
      { label: 'Auteur', value: 'Kofh M.', isLink: true },
    ],
    pending: false,
  },
];

const PILLS: { key: Filter; label: string }[] = [
  { key: 'tous', label: 'Tous les biens' },
  { key: 'appartements', label: 'Appartements (124)' },
  { key: 'villas', label: 'Villas (42)' },
  { key: 'terrains', label: 'Terrains (89)' },
  { key: 'boosted', label: 'Boostés uniquement' },
];

export default function AnnoncesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('boosted');

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Catalogue Immobilier</h1>
          <p>Gestion de l'offre et des stocks</p>
        </div>
        <div className="immo-spacer" />
        <div className="immo-search-wrap">
          <SearchIcon />
          <input placeholder="Rechercher une annonce (ID, Ville...)" />
        </div>
        <button className="btn-orange-main">
          + NOUVELLE ANNONCE
        </button>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Filter pills */}
        <div className="filter-pills">
          <span className="filter-label">Filtrer par :</span>
          {PILLS.map((p) => (
            <button
              key={p.key}
              className={`pill ${
                activeFilter === p.key
                  ? p.key === 'boosted'
                    ? 'active-orange'
                    : 'active-blue'
                  : ''
              }`}
              onClick={() => setActiveFilter(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="annonce-grid">
          {ANNONCES.map((a) => (
            <div className="annonce-card" key={a.id}>
              {/* Image */}
              <div className="annonce-img">
                <img src={a.img} alt={a.titre} />
                <div className="annonce-img-badges">
                  <span className="badge-type">{a.type}</span>
                  {a.boost === 'or' && (
                    <span className="badge-boost-or">⚡ BOOST OR</span>
                  )}
                  {a.boost === 'argent' && (
                    <span className="badge-boost-argent">↑ BOOST ARGENT</span>
                  )}
                </div>
                <span className={`badge-statut ${a.statut}`}>
                  {a.statut === 'actif' ? 'ACTIF' : 'EN ATTENTE'}
                </span>
              </div>

              {/* Body */}
              <div className="annonce-body">
                <div className="annonce-title-row">
                  <div className="annonce-name">{a.titre}</div>
                  <div className="annonce-price-block">
                    <div className="annonce-price">{a.prix} <span style={{ fontSize: 13, fontWeight: 600 }}>F</span></div>
                    <div className="annonce-price-type">{a.prixType}</div>
                  </div>
                </div>

                <div className="annonce-location">
                  <PinIcon />
                  {a.location}
                </div>

                <div className="annonce-meta">
                  {a.meta.map((m) => (
                    <div className="annonce-meta-item" key={m.label}>
                      <span className="annonce-meta-label">{m.label}</span>
                      <span className={`annonce-meta-value${m.isLink ? ' link' : ''}`}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="annonce-actions">
                  {a.pending ? (
                    <button className="btn-validate-immo">VALIDER L'ANNONCE</button>
                  ) : (
                    <button className="btn-primary-immo">DÉTAILS</button>
                  )}
                  <button className="btn-icon-sm"><EditIcon /></button>
                  <button className="btn-icon-sm danger"><TrashIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="annonce-pagination-row">
          <span>Affichage de 1–12 sur 255 annonces</span>
          <div className="immo-pagination">
            <button className="page-btn"><ChevronLeftIcon /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><ChevronRightIcon /></button>
          </div>
        </div>
      </div>
    </>
  );
}
