import { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getDelegation } from '../../api/getDelegation';
import DelegationStatutBadge from './DelegationStatutBadge';

const LIMIT = 15;

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function nomOuId(u: any, fallbackId: any) {
  return u ? `${u.prenom} ${u.nom}` : `#${fallbackId}`;
}

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState([] as any[]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [filtre, setFiltre]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getDelegation.list({ page, limit: LIMIT, ...(filtre ? { statut: filtre } : {}) });
      setDelegations(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setError(true);
      setDelegations([]);
      setTotal(0);
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
          <h1>Délégations de gestion</h1>
          <p>Biens confiés par un propriétaire à un démarcheur</p>
        </div>
        <div className="immo-spacer" />
        <select className="immo-select" value={filtre}
          onChange={(e) => { setFiltre(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="active">Active</option>
          <option value="revoquee">Révoquée</option>
          <option value="expiree">Expirée</option>
          <option value="refusee">Refusée</option>
        </select>
      </div>

      <div className="immo-page">
        {error ? (
          <div className="immo-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--c-red)', marginBottom: 6 }}>
              Endpoint indisponible
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
              GET /admin/delegations n'est pas encore exposé par le backend — cette page s'activera automatiquement dès qu'il le sera.
            </div>
          </div>
        ) : (
          <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="mod-table-header" style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 1fr 0.8fr' }}>
              <span className="mod-table-col">Propriétaire</span>
              <span className="mod-table-col">Démarcheur</span>
              <span className="mod-table-col">Bien</span>
              <span className="mod-table-col">Commission</span>
              <span className="mod-table-col">Période</span>
              <span className="mod-table-col">Statut</span>
            </div>

            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
            ) : delegations.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune délégation trouvée.</div>
            ) : delegations.map((d: any) => (
              <div className="mod-row" key={d.id} style={{ gridTemplateColumns: '1fr 1fr 1.2fr 0.8fr 1fr 0.8fr' }}>
                <div style={{ fontSize: 13 }}>{nomOuId(d.proprietaire, d.proprietaire_id)}</div>
                <div style={{ fontSize: 13 }}>{nomOuId(d.demarcheur, d.demarcheur_id)}</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                  {d.bien_id ? (d.bien?.type ?? `Bien #${d.bien_id}`) : 'Tous les biens'}
                </div>
                <div style={{ fontSize: 13 }}>{Number(d.taux_commission_demarcheur).toFixed(0)}%</div>
                <div style={{ fontSize: 12 }}>
                  {formatDate(d.date_debut)} → {formatDate(d.date_fin)}
                </div>
                <div><DelegationStatutBadge statut={d.statut} /></div>
              </div>
            ))}

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
        )}
      </div>
    </>
  );
}
