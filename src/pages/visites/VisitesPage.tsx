import { useState, useEffect, useCallback } from 'react';
import { AlertIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { getVisite } from '../../api/getVisite';
import { patchVisite } from '../../api/patchVisite';
import VisiteStatutBadge from './VisiteStatutBadge';

const LIMIT = 15;

function formatDateHeure(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function nomOuId(u: any, fallbackId: any) {
  return u ? `${u.prenom} ${u.nom}` : `#${fallbackId}`;
}

export default function VisitesPage() {
  const [visites, setVisites]           = useState([] as any[]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [filtre, setFiltre]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(false);
  const [totalAnnulees, setTotalAnnulees] = useState(0);
  const [totalLitiges, setTotalLitiges]   = useState(0);
  const [actingId, setActingId]           = useState(null as number | null);
  const [actionError, setActionError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [res, annulees] = await Promise.all([
        getVisite.list({ page, limit: LIMIT, ...(filtre ? { statut: filtre } : {}) }),
        getVisite.list({ statut: 'annulee', limit: 100, page: 1 }),
      ]);
      setVisites(res.data ?? []);
      setTotal(res.total ?? 0);
      const annuleesData = annulees.data ?? [];
      setTotalAnnulees(annulees.total ?? annuleesData.length);
      setTotalLitiges(annuleesData.filter((v: any) => v.annulation?.est_tardive).length);
    } catch {
      setError(true);
      setVisites([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, filtre]);

  useEffect(() => { load(); }, [load]);

  async function withAction(id: number, fn: () => Promise<any>) {
    setActingId(id);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Action impossible.');
    } finally {
      setActingId(null);
    }
  }

  function handleConfirmer(id: number) {
    withAction(id, () => patchVisite.confirmer(id));
  }

  function handleContreProposer(id: number) {
    const saisie = window.prompt('Nouvelle date proposée (JJ/MM/AAAA HH:MM) :');
    if (!saisie) return;
    const [datePart, heurePart] = saisie.trim().split(/\s+/);
    const [j, m, a] = (datePart ?? '').split('/');
    if (!j || !m || !a) { setActionError('Format de date invalide.'); return; }
    const [h = '09', min = '00'] = (heurePart ?? '').split(':');
    const iso = new Date(Number(a), Number(m) - 1, Number(j), Number(h), Number(min)).toISOString();
    withAction(id, () => patchVisite.contreProposer(id, iso));
  }

  function handleMarquerEffectuee(id: number) {
    withAction(id, () => patchVisite.marquerEffectuee(id));
  }

  function handleAnnuler(id: number) {
    const motif = window.prompt('Motif de l\'annulation (optionnel) :') ?? undefined;
    withAction(id, () => patchVisite.annuler(id, motif || undefined));
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Visites &amp; réservations</h1>
          <p>Supervision des rendez-vous — utile en cas de litige ou de no-show</p>
        </div>
        <div className="immo-spacer" />
        <select className="immo-select" value={filtre}
          onChange={(e) => { setFiltre(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="contre_proposee">Contre-proposée</option>
          <option value="confirmee">Confirmée</option>
          <option value="effectuee">Effectuée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      <div className="immo-page">
        {error ? (
          <div className="immo-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--c-red)', marginBottom: 6 }}>
              Endpoint indisponible
            </div>
            <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>
              GET /admin/visites n'est pas encore exposé par le backend — cette page s'activera automatiquement dès qu'il le sera.
            </div>
          </div>
        ) : (
          <>
            <div className="mod-stat-cards">
              <div className="mod-stat-card">
                <div>
                  <div className="mod-stat-label">Visites au total</div>
                  <div className="mod-stat-value">{total}</div>
                </div>
                <div className="mod-stat-icon"><CalendarIcon size={24} /></div>
              </div>
              <div className="mod-stat-card">
                <div>
                  <div className="mod-stat-label">Annulées</div>
                  <div className="mod-stat-value">{totalAnnulees}</div>
                </div>
                <div className="mod-stat-icon"><AlertIcon size={24} /></div>
              </div>
              <div className="mod-stat-card urgent">
                <div>
                  <div className="mod-stat-label">Annulations tardives (litige potentiel)</div>
                  <div className="mod-stat-value">{totalLitiges}</div>
                </div>
                <div className="mod-stat-icon"><AlertIcon size={24} /></div>
              </div>
            </div>

            <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="mod-table-header" style={{ gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr 0.7fr 1.1fr 1.1fr' }}>
                <span className="mod-table-col">Bien</span>
                <span className="mod-table-col">Client</span>
                <span className="mod-table-col">Gestionnaire</span>
                <span className="mod-table-col">Date visite</span>
                <span className="mod-table-col">Statut</span>
                <span className="mod-table-col">Annulation</span>
                <span className="mod-table-col">Actions</span>
              </div>

              {actionError && (
                <div style={{ padding: '8px 20px', fontSize: 12, color: 'var(--c-red)', background: '#FEF2F2' }}>
                  {actionError}
                </div>
              )}

              {loading ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
              ) : visites.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune visite trouvée.</div>
              ) : visites.map((v: any) => (
                <div className="mod-row" key={v.id} style={{ gridTemplateColumns: '1.2fr 0.9fr 0.9fr 0.9fr 0.7fr 1.1fr 1.1fr' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {v.bien?.type ?? `Bien #${v.bien_id}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                      {v.bien?.localisation ? `${v.bien.localisation.ville}${v.bien.localisation.quartier ? ', ' + v.bien.localisation.quartier : ''}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>{nomOuId(v.client, v.client_id)}</div>
                  <div style={{ fontSize: 13 }}>{nomOuId(v.gestionnaire, v.gestionnaire_id)}</div>
                  <div style={{ fontSize: 12 }}>{formatDateHeure(v.date_contre_proposee ?? v.date_souhaitee)}</div>
                  <div><VisiteStatutBadge statut={v.statut} /></div>
                  <div style={{ fontSize: 11.5 }}>
                    {v.annulation ? (
                      <>
                        <div style={{ fontWeight: 600, color: v.annulation.est_tardive ? '#DC2626' : 'var(--c-text)' }}>
                          {v.annulation.cote_annulateur === 'client' ? 'Par le client' : 'Par le gestionnaire'}
                          {v.annulation.est_tardive ? ' · tardive' : ''}
                        </div>
                        {v.annulation.motif && (
                          <div style={{ color: 'var(--c-muted)', marginTop: 2 }}>{v.annulation.motif}</div>
                        )}
                        {v.annulation.penalite_appliquee && (
                          <div style={{ color: '#D97706', marginTop: 2 }}>{v.annulation.penalite_appliquee}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--c-muted)' }}>—</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {actingId === v.id ? (
                      <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>…</span>
                    ) : v.statut === 'en_attente' ? (
                      <>
                        <button className="btn-validate-circle" style={{ width: 'auto', padding: '3px 8px', borderRadius: 6, fontSize: 11 }} onClick={() => handleConfirmer(v.id)}>Confirmer</button>
                        <button className="page-btn" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleContreProposer(v.id)}>Contre-proposer</button>
                        <button className="btn-reject-circle" style={{ width: 'auto', padding: '3px 8px', borderRadius: 6, fontSize: 11 }} onClick={() => handleAnnuler(v.id)}>Annuler</button>
                      </>
                    ) : v.statut === 'contre_proposee' ? (
                      <button className="btn-reject-circle" style={{ width: 'auto', padding: '3px 8px', borderRadius: 6, fontSize: 11 }} onClick={() => handleAnnuler(v.id)}>Annuler</button>
                    ) : v.statut === 'confirmee' ? (
                      <>
                        <button className="btn-validate-circle" style={{ width: 'auto', padding: '3px 8px', borderRadius: 6, fontSize: 11 }} onClick={() => handleMarquerEffectuee(v.id)}>Marquer effectuée</button>
                        <button className="btn-reject-circle" style={{ width: 'auto', padding: '3px 8px', borderRadius: 6, fontSize: 11 }} onClick={() => handleAnnuler(v.id)}>Annuler</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>—</span>
                    )}
                  </div>
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
          </>
        )}
      </div>
    </>
  );
}
