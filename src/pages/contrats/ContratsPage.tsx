import { useState, useEffect, useCallback } from 'react';
import { FileCheckIcon, AlertIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getContrat } from '../../api/getContrat';
import ContratStatutBadge from './ContratStatutBadge';

const LIMIT = 15;

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function nomOuId(u: any, fallbackId: any) {
  return u ? `${u.prenom} ${u.nom}` : `#${fallbackId}`;
}

export default function ContratsPage() {
  const [contrats, setContrats]   = useState([] as any[]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [filtre, setFiltre]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [totalActifs, setTotalActifs] = useState(0);
  const [totalExpires, setTotalExpires] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, actifs, expires] = await Promise.all([
        getContrat.list({ page, limit: LIMIT, ...(filtre ? { statut: filtre } : {}) }),
        getContrat.list({ statut: 'actif',  limit: 1, page: 1 }),
        getContrat.list({ statut: 'expire', limit: 1, page: 1 }),
      ]);
      setContrats(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalActifs(actifs.total ?? 0);
      setTotalExpires(expires.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, filtre]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Contrats de location</h1>
          <p>Baux actifs, résiliés et expirés — pour vérification en cas de contrat contesté</p>
        </div>
        <div className="immo-spacer" />
        <select className="immo-select" value={filtre}
          onChange={(e) => { setFiltre(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="resilie">Résilié</option>
          <option value="expire">Expiré</option>
        </select>
      </div>

      <div className="immo-page">
        <div className="mod-stat-cards">
          <div className="mod-stat-card">
            <div>
              <div className="mod-stat-label">Contrats actifs</div>
              <div className="mod-stat-value">{totalActifs}</div>
            </div>
            <div className="mod-stat-icon"><FileCheckIcon size={24} /></div>
          </div>
          <div className="mod-stat-card urgent">
            <div>
              <div className="mod-stat-label">Expirés</div>
              <div className="mod-stat-value">{totalExpires}</div>
            </div>
            <div className="mod-stat-icon"><AlertIcon size={24} /></div>
          </div>
        </div>

        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr' }}>
            <span className="mod-table-col">Bien</span>
            <span className="mod-table-col">Locataire</span>
            <span className="mod-table-col">Gestionnaire</span>
            <span className="mod-table-col">Loyer</span>
            <span className="mod-table-col">Début / Fin</span>
            <span className="mod-table-col">Loyers</span>
            <span className="mod-table-col">Statut</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : contrats.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucun contrat trouvé.</div>
          ) : contrats.map((c: any) => {
            const loyersPayes = (c.loyers ?? []).filter((l: any) => l.statut === 'paye').length;
            const loyersTotal = (c.loyers ?? []).length;
            return (
              <div className="mod-row" key={c.id} style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {c.bien?.type ?? `Bien #${c.bien_id}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                    {c.bien?.localisation ? `${c.bien.localisation.ville}${c.bien.localisation.quartier ? ', ' + c.bien.localisation.quartier : ''}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 13 }}>{nomOuId(c.locataire, c.locataire_id)}</div>
                <div style={{ fontSize: 13 }}>{nomOuId(c.gestionnaire, c.gestionnaire_id)}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {Number(c.loyer_mensuel).toLocaleString('fr-FR')} <span style={{ fontSize: 10, fontWeight: 400 }}>FCFA</span>
                </div>
                <div style={{ fontSize: 12 }}>
                  {formatDate(c.date_debut)}<br/>
                  <span style={{ color: 'var(--c-muted)' }}>→ {formatDate(c.date_fin)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{loyersPayes}/{loyersTotal}</div>
                <div><ContratStatutBadge statut={c.statut} /></div>
              </div>
            );
          })}

          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {total === 0 ? '0 résultat' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}`}
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeftIcon /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
