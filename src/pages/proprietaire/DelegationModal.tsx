import { useState, useEffect, useRef } from 'react'
import { delegationApi } from '../../api/delegationApi'
import { biensApi } from '../../api/biensApi'

type Props = { onClose: () => void }

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: '#F59E0B' },
  active:     { label: 'Active',     color: '#16A34A' },
  revoquee:   { label: 'Révoquée',   color: '#6B7280' },
  expiree:    { label: 'Expirée',    color: '#6B7280' },
  refusee:    { label: 'Refusée',    color: '#EF4444' },
}

function typeLabel(t: string) {
  const m: Record<string, string> = { maison: 'Maison', appart_vide: 'Appartement vide', appart_meuble: 'Appartement meublé', terrain: 'Terrain', guesthouse: 'Guesthouse' }
  return m[t] || t
}

export default function DelegationModal({ onClose }: Props) {
  const [view, setView] = useState<'liste' | 'nouvelle'>('liste')
  const [delegations, setDelegations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [biens, setBiens] = useState<any[]>([])
  const [bienId, setBienId] = useState('')
  const [search, setSearch] = useState('')
  const [resultats, setResultats] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [demarcheur, setDemarcheur] = useState<any>(null)
  const [dateFin, setDateFin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const chargerListe = () => {
    setLoading(true)
    delegationApi.emises()
      .then(d => setDelegations(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { chargerListe() }, [])
  useEffect(() => { if (view === 'nouvelle' && biens.length === 0) biensApi.mesBiens().then(d => setBiens(Array.isArray(d) ? d : d.data || [])).catch(() => {}) }, [view])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.trim().length < 2) { setResultats([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(() => {
      delegationApi.rechercherDemarcheur(search.trim())
        .then(d => setResultats(Array.isArray(d) ? d : d.data || []))
        .catch(() => setResultats([]))
        .finally(() => setSearching(false))
    }, 350)
  }, [search])

  const proposer = async () => {
    if (!demarcheur) { setError('Choisissez un démarcheur'); return }
    setSaving(true)
    setError('')
    try {
      await delegationApi.proposer({
        demarcheur_id: demarcheur.id,
        bien_id: bienId ? Number(bienId) : undefined,
        date_fin: dateFin || undefined,
      })
      setView('liste')
      setDemarcheur(null); setSearch(''); setBienId(''); setDateFin('')
      chargerListe()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'envoi de la proposition")
    }
    setSaving(false)
  }

  const revoquer = async (id: number) => {
    try {
      await delegationApi.revoquer(id)
      setDelegations(prev => prev.map(d => d.id === id ? { ...d, statut: 'revoquee' } : d))
    } catch (_) {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ background: 'var(--p-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0" style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
          <h2 className="font-bold" style={{ color: 'var(--p-text)' }}>
            {view === 'liste' ? 'Déléguer la gestion' : 'Nouvelle délégation'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--p-deep)', color: 'var(--p-muted)' }}>✕</button>
        </div>

        {view === 'liste' ? (
          <div className="p-5 space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--p-muted)' }}>
              Confiez la gestion d'un bien (ou de tous vos biens) à un démarcheur : créneaux de visite, confirmation des visites, signature de contrat — selon ce que vous autorisez.
            </p>
            <button onClick={() => setView('nouvelle')}
              className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: '#4B6BFF' }}>
              + Proposer une délégation
            </button>

            <p className="text-xs font-bold uppercase tracking-wide pt-2" style={{ color: 'var(--p-muted)' }}>Mes délégations émises</p>
            {loading ? (
              <div className="space-y-2">{[1, 2].map(n => <div key={n} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--p-deep)' }} />)}</div>
            ) : delegations.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--p-muted)' }}>Aucune délégation pour l'instant</p>
            ) : (
              <div className="space-y-2">
                {delegations.map((d: any) => {
                  const st = STATUT_LABELS[d.statut] || { label: d.statut, color: 'var(--p-muted)' }
                  return (
                    <div key={d.id} className="rounded-xl p-3.5" style={{ background: 'var(--p-deep)', border: '1px solid var(--p-border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>
                            {d.demarcheur?.prenom} {d.demarcheur?.nom}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>
                            {d.bien ? `${typeLabel(d.bien.type)} — ${d.bien.localisation?.ville || ''}` : 'Tous mes biens'}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.color + '18', color: st.color }}>{st.label}</span>
                      </div>
                      {d.statut === 'active' && (
                        <button onClick={() => revoquer(d.id)} className="mt-2 text-xs font-semibold text-danger">Révoquer</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Bien concerné</label>
              <select value={bienId} onChange={e => setBienId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }}>
                <option value="">Tous mes biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{typeLabel(b.type)} — {b.localisation?.ville}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Démarcheur</label>
              {demarcheur ? (
                <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: '#4B6BFF12', border: '1px solid #4B6BFF40' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{demarcheur.prenom} {demarcheur.nom} · {demarcheur.telephone}</span>
                  <button onClick={() => { setDemarcheur(null); setSearch('') }} className="text-xs" style={{ color: 'var(--p-muted)' }}>Changer</button>
                </div>
              ) : (
                <>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom ou téléphone…"
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }} />
                  {searching && <p className="text-xs mt-1.5" style={{ color: 'var(--p-muted)' }}>Recherche…</p>}
                  {resultats.length > 0 && (
                    <div className="mt-1.5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--p-border)' }}>
                      {resultats.map(r => (
                        <button key={r.id} onClick={() => { setDemarcheur(r); setResultats([]) }}
                          className="w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0"
                          style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }}>
                          {r.prenom} {r.nom} · {r.telephone}
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && search.trim().length >= 2 && resultats.length === 0 && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--p-muted)' }}>Aucun démarcheur trouvé</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Date de fin (optionnel)</label>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }} />
              <p className="text-[11px] mt-1" style={{ color: 'var(--p-muted)' }}>Laisser vide pour une délégation sans date de fin.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setView('liste')} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }}>
                Annuler
              </button>
              <button onClick={proposer} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: '#4B6BFF' }}>
                {saving ? 'Envoi…' : 'Proposer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
