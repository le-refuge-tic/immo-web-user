import { useState, useEffect, useRef } from 'react'
import { delegationApi } from '../../api/delegationApi'
import { biensApi } from '../../api/biensApi'
import { bienTypeLabel } from '../../utils/bienType'
import { apiMessage } from '../../utils/apiMessage'
import { ModalSheet } from '../../components/ui/ModalSheet'
import type { Bien, User } from '../../types/api'
import type { DelegationEmise } from '../../types/proprietaire'
import { withAlpha } from '../../utils/color'
import ErrorState from '../../components/ErrorState'

type Props = { onClose: () => void }

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: 'En attente', color: 'var(--tx-amber)' },
  active:     { label: 'Active',     color: 'var(--tx-green)' },
  revoquee:   { label: 'Révoquée',   color: 'var(--c-grey)' },
  expiree:    { label: 'Expirée',    color: 'var(--c-grey)' },
  refusee:    { label: 'Refusée',    color: 'var(--tx-red)' },
}


export default function DelegationModal({ onClose }: Props) {
  const [view, setView] = useState<'liste' | 'nouvelle'>('liste')
  const [delegations, setDelegations] = useState<DelegationEmise[]>([])
  const [loading, setLoading] = useState(true)
  const [listeError, setListeError] = useState(false)
  const [revoqueError, setRevoqueError] = useState('')
  const [biensError, setBiensError] = useState(false)
  const [searchError, setSearchError] = useState(false)

  const [biens, setBiens] = useState<Bien[]>([])
  const [bienId, setBienId] = useState('')
  const [search, setSearch] = useState('')
  const [resultats, setResultats] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [demarcheur, setDemarcheur] = useState<User | null>(null)
  const [dateFin, setDateFin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const chargerListe = () => {
    setLoading(true)
    setListeError(false)
    delegationApi.emises()
      .then(d => setDelegations(Array.isArray(d) ? d : d.data || []))
      .catch(() => setListeError(true))
      .finally(() => setLoading(false))
  }
  useEffect(() => { chargerListe() }, [])

  const chargerBiens = () => {
    setBiensError(false)
    biensApi.mesBiens().then(d => setBiens(Array.isArray(d) ? d : d.data || [])).catch(() => setBiensError(true))
  }
  useEffect(() => { if (view === 'nouvelle' && biens.length === 0) chargerBiens() }, [view, biens.length])

  const rechercher = (terme: string) => {
    setSearching(true)
    setSearchError(false)
    delegationApi.rechercherDemarcheur(terme)
      .then(d => setResultats(Array.isArray(d) ? d : d.data || []))
      .catch(() => { setResultats([]); setSearchError(true) })
      .finally(() => setSearching(false))
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchError(false)
    if (search.trim().length < 2) { setResultats([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(() => rechercher(search.trim()), 350)
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
    } catch (err: unknown) {
      setError(apiMessage(err) || "Erreur lors de l'envoi de la proposition")
    }
    setSaving(false)
  }

  const revoquer = async (id: number) => {
    setRevoqueError('')
    try {
      await delegationApi.revoquer(id)
      setDelegations(prev => prev.map(d => d.id === id ? { ...d, statut: 'revoquee' } : d))
    } catch (err: unknown) {
      // Le bouton « Révoquer » reste affiché : la personne peut simplement recliquer.
      setRevoqueError(apiMessage(err) || 'La révocation a échoué. Réessayez.')
    }
  }

  return (
    <ModalSheet open onClose={onClose} label="Déléguer la gestion" placement="center" panelClassName="w-full max-w-md" backdropOpacity={0.4}>
      <div
        className="rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--p-card)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0" style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
          <h2 className="font-bold" style={{ color: 'var(--p-text)' }}>
            {view === 'liste' ? 'Déléguer la gestion' : 'Nouvelle délégation'}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--p-deep)', color: 'var(--p-muted)' }}>✕</button>
        </div>

        {view === 'liste' ? (
          <div className="p-5 space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--p-muted)' }}>
              Confiez la gestion d'un bien (ou de tous vos biens) à un démarcheur : gestion des demandes de visite, confirmation des visites, signature de contrat — selon ce que vous autorisez.
            </p>
            <button onClick={() => setView('nouvelle')}
              className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'var(--c-brand)' }}>
              + Proposer une délégation
            </button>

            <p className="text-xs font-bold uppercase tracking-wide pt-2" style={{ color: 'var(--p-muted)' }}>Mes délégations émises</p>
            {revoqueError && <p role="alert" className="text-sm text-danger">{revoqueError}</p>}
            {loading ? (
              <div className="space-y-2">{[1, 2].map(n => <div key={n} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--p-deep)' }} />)}</div>
            ) : listeError ? (
              <ErrorState palette="proprietaire" title="Impossible de charger vos délégations" onRetry={chargerListe} className="py-6" />
            ) : delegations.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--p-muted)' }}>Aucune délégation pour l'instant</p>
            ) : (
              <div className="space-y-2">
                {delegations.map(d => {
                  const st = STATUT_LABELS[d.statut] || { label: d.statut, color: 'var(--p-muted)' }
                  return (
                    <div key={d.id} className="rounded-xl p-3.5" style={{ background: 'var(--p-deep)', border: '1px solid var(--p-border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>
                            {d.demarcheur?.prenom} {d.demarcheur?.nom}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>
                            {d.bien ? `${bienTypeLabel(d.bien)} — ${d.bien.localisation?.ville || ''}` : 'Tous mes biens'}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-micro font-bold px-2 py-0.5 rounded-full" style={{ background: withAlpha(st.color, '18'), color: st.color }}>{st.label}</span>
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
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="del-bien" className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Bien concerné</label>
              <select id="del-bien" value={bienId} onChange={e => setBienId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }}>
                <option value="">Tous mes biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{bienTypeLabel(b)} — {b.localisation?.ville}</option>)}
              </select>
              {biensError && (
                <p role="alert" className="text-xs mt-1.5 text-danger">
                  Impossible de charger vos biens.{' '}
                  <button type="button" onClick={chargerBiens} className="font-semibold underline">Réessayer</button>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="delegation-demarcheur" className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Démarcheur</label>
              {demarcheur ? (
                <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ background: 'rgba(65,96,242,0.071)', border: '1px solid rgba(65,96,242,0.251)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{demarcheur.prenom} {demarcheur.nom} · {demarcheur.telephone}</span>
                  <button onClick={() => { setDemarcheur(null); setSearch('') }} className="text-xs" style={{ color: 'var(--p-muted)' }}>Changer</button>
                </div>
              ) : (
                <>
                  <input id="delegation-demarcheur" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom ou téléphone…"
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
                  {!searching && searchError && (
                    <p role="alert" className="text-xs mt-1.5 text-danger">
                      La recherche a échoué.{' '}
                      <button type="button" onClick={() => rechercher(search.trim())} className="font-semibold underline">Réessayer</button>
                    </p>
                  )}
                  {!searching && !searchError && search.trim().length >= 2 && resultats.length === 0 && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--p-muted)' }}>Aucun démarcheur trouvé</p>
                  )}
                </>
              )}
            </div>

            <div>
              <label htmlFor="delegation-modal-198" className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--p-text)' }}>Date de fin (optionnel)</label>
              <input id="delegation-modal-198" type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }} />
              <p className="text-caption mt-1" style={{ color: 'var(--p-muted)' }}>Laisser vide pour une délégation sans date de fin.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setView('liste')} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }}>
                Annuler
              </button>
              <button onClick={proposer} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: 'var(--c-brand)' }}>
                {saving ? 'Envoi…' : 'Proposer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalSheet>
  )
}
