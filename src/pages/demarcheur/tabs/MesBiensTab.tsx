import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onActivateKey } from '../../../utils/keyboard'
import { biensApi } from '../../../api/biensApi'
import EditBienModal from '../../bien/EditBienModal'
import { bienTypeLabel } from '../../../utils/bienType'
import { PURPLE, DARK_PURPLE, fmtPrix, statutBien, PURPLE_TX } from '../shared'
import { IcPlus, IcPin, IcTrash, IcEdit, IcRefresh } from '../icons'
import { unwrapList } from '../../../utils/unwrapList'
import type { Bien } from '../../../types/api'
import { withAlpha } from '../../../utils/color'
import { apiMessage } from '../../../utils/apiMessage'
import ErrorState from '../../../components/ErrorState'
import RefreshFailedNotice from '../../../components/RefreshFailedNotice'

export default function MesBiensTab() {
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [confirmDeleteBienId, setConfirmDeleteBienId] = useState<number | null>(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try { const d = await biensApi.mesBiens(); setBiens(unwrapList(d)) } catch { setLoadError(true) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = filter === 'Tous' ? biens
    : filter === 'Publié' ? biens.filter(b => b.statut_moderation === 'approuve')
    : filter === 'En attente' ? biens.filter(b => b.statut_moderation === 'en_attente')
    : biens.filter(b => b.statut_moderation === 'rejete')

  const del = async (id: number) => {
    setDeleteError('')
    try { await biensApi.delete(id); load() } catch (e: unknown) {
      setDeleteError(apiMessage(e) || 'La suppression du bien a échoué. Réessayez.')
    }
    setConfirmDeleteBienId(null)
  }

  const [editingBien, setEditingBien] = useState<Bien | null>(null)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {editingBien && (
        <EditBienModal bien={editingBien} onClose={() => setEditingBien(null)}
          onSaved={updated => { setBiens(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditingBien(null) }} />
      )}
      <div className="bg-white px-4 py-3 border-b border-divider flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-text-dark">{biens.length} bien{biens.length > 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ background: PURPLE }}>
              <IcPlus /> Ajouter
            </button>
            <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: withAlpha(PURPLE, '15'), color: PURPLE_TX }}>
              <IcRefresh /> Actualiser
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['Tous', 'Publié', 'En attente', 'Rejeté'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
              style={filter === f ? { background: PURPLE, color: 'rgb(255,255,255)', borderColor: PURPLE } : { color: 'var(--c-grey)', borderColor: '#E8EAED' }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        {deleteError && <RefreshFailedNotice message={deleteError} />}
        {loadError && !loading && biens.length > 0 && <RefreshFailedNotice onRetry={load} />}
        {loading ? (
          <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {[1,2,3].map(n => <div key={n} className="h-48 skeleton rounded-2xl mb-3 sm:mb-0" />)}
          </div>
        ) : loadError && biens.length === 0 ? (
          <ErrorState title="Impossible de charger vos biens" onRetry={load} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: withAlpha(PURPLE, '15') }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth={1.5} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            </div>
            <p className="font-bold text-text-dark mb-1">Aucun bien trouvé</p>
            <p className="text-sm text-text-grey mb-5">Publiez votre premier bien</p>
            <button onClick={() => navigate('/nouveau-bien')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm" style={{ background: PURPLE }}>
              <IcPlus /> Ajouter un bien
            </button>
          </div>
        ) : (
          <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {filtered.map(b => {
              const { label, fill } = statutBien(b.statut_moderation || 'en_attente')
              const loc = b.localisation
              const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
              const cover = b.photos?.find(p => p.is_cover) || b.photos?.[0]
              return (
                <div key={b.id} onClick={() => navigate(`/biens/${b.id}`)} onKeyDown={onActivateKey(() => navigate(`/biens/${b.id}`))} role="button" tabIndex={0}
                  className="focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 card-soft rounded-2xl overflow-hidden mb-3 sm:mb-0 cursor-pointer transition-transform hover:-translate-y-0.5">
                  <div className="relative h-32">
                    {cover?.url
                      ? <img loading="lazy" src={cover.url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${withAlpha(DARK_PURPLE, 'cc')}, ${withAlpha(PURPLE, 'aa')})` }}><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>
                    }
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-white text-caption font-bold" style={{ background: fill }}>{label}</span>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); setEditingBien(b) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><IcEdit /></button>
                      {confirmDeleteBienId === b.id ? (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); del(b.id) }} className="px-2 h-8 rounded-lg text-white text-caption font-bold flex-shrink-0" style={{ background: 'var(--c-danger)' }}>Suppr.</button>
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteBienId(null) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>✕</button>
                        </>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteBienId(b.id) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><IcTrash /></button>
                      )}
                    </div>
                    <span className="absolute bottom-3 left-3 text-white text-sm font-bold">{fmtPrix(b.prix)}{b.transaction === 'location' ? '/mois' : ''}</span>
                  </div>
                  <div className="p-3.5">
                    <p className="font-bold text-text-dark text-sm">{bienTypeLabel(b)}</p>
                    <div className="flex items-center gap-1 mt-0.5"><span className="text-text-grey"><IcPin /></span><span className="text-xs text-text-grey">{adresse}</span></div>
                    {b.statut_moderation === 'rejete' && b.motif_refus && (
                      <div className="mt-2 p-2 rounded-lg bg-danger/5 border border-danger/20"><p className="text-danger text-xs">{b.motif_refus}</p></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
