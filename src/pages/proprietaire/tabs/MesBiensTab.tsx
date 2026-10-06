import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../../api/biensApi'
import EditBienModal from '../../bien/EditBienModal'
import { AnimatedGroup } from '../../../components/ui/animated-group'
import { IcRefresh } from './icons'
import { IcPlus, IcPin, IcTrash, IcEdit, BLUE, bienLabel, bienComposition, fmtPrix, statutBien } from './shared'
import type { Tab } from './shared'
import type { Bien } from '../../../types/api'

// ─── Tab: Mes Biens ───────────────────────────────────────────────────────────
export function MesBiensTab({ onScrolled }: { onScrolled?: (v: boolean) => void }) {
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const [sortByVues, setSortByVues] = useState(false)
  const [editingBien, setEditingBien] = useState<any>(null)
  const [confirmDeleteBienId, setConfirmDeleteBienId] = useState<number | null>(null)
  const [hoveredEl, setHoveredEl] = useState<string | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [carouselPaused, setCarouselPaused] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try { const d = await biensApi.mesBiens(); setBiens(Array.isArray(d) ? d : d.data || []) } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (carouselPaused || biens.length === 0) return
    const id = setInterval(() => {
      const el = carouselRef.current
      if (!el || carouselPaused) return
      const count = Math.min(5, biens.length)
      const cardW = el.scrollWidth / count
      const maxScroll = el.scrollWidth - el.clientWidth
      const isAtEnd = el.scrollLeft + cardW >= maxScroll - 1
      const next = isAtEnd ? 0 : el.scrollLeft + cardW
      el.scrollTo({ left: next, behavior: 'smooth' })
      setCarouselIdx(isAtEnd ? 0 : Math.round(next / cardW))
    }, 3500)
    return () => clearInterval(id)
  }, [carouselPaused, biens.length])

  const FILTERS = ['Tous', 'Location', 'Vente', 'Publié', 'En attente', 'Rejeté', 'Occupé']
  const byFilter = filter === 'Tous' ? biens
    : filter === 'Location' ? biens.filter(b => b.transaction === 'location')
    : filter === 'Vente' ? biens.filter(b => b.transaction === 'vente')
    : filter === 'Publié' ? biens.filter(b => b.statut_moderation === 'approuve')
    : filter === 'En attente' ? biens.filter(b => b.statut_moderation === 'en_attente')
    : filter === 'Occupé' ? biens.filter(b => b.statut === 'occupe')
    : biens.filter(b => b.statut_moderation === 'rejete')

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    const searched = !q ? byFilter : byFilter.filter(b => {
      const loc = b.localisation
      return `${bienLabel(b)} ${loc?.quartier || ''} ${loc?.ville || ''}`.toLowerCase().includes(q)
    })
    return sortByVues ? [...searched].sort((a, b) => (b.nb_consultations || 0) - (a.nb_consultations || 0)) : searched
  })()

  const del = async (id: number) => {
    try { await biensApi.delete(id); load() } catch (_) {}
    setConfirmDeleteBienId(null)
  }

  const IcSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  const IcEye = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      {editingBien && (
        <EditBienModal bien={editingBien} onClose={() => setEditingBien(null)}
          onSaved={updated => { setBiens(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditingBien(null) }} />
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>
        {/* ── Carousel biens récents ── */}
        {biens.length > 0 && (() => {
          const recentBiens = [...biens]
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5)
          return (
            <div className="px-5 md:px-8 xl:px-10 pt-6 pb-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--p-muted)' }}>Biens récents</p>
              <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
              >
                {recentBiens.map(b => {
                  const { label: sLabel, color: sColor } = statutBien(b.statut_moderation || 'en_attente')
                  const loc = b.localisation
                  const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                  const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                  const compo = bienComposition(b)
                  return (
                    <div
                      key={b.id}
                      className="flex-shrink-0 snap-start group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(75,107,255,0.14)] w-[85%] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
                      style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
                      onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                    >
                      <div className="relative overflow-hidden" style={{ height: 160 }}>
                        {cover?.url
                          ? <img loading="lazy" src={cover.url} alt={bienLabel(b)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1a2a4a, ${BLUE}30)` }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-10 h-10 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            </div>
                        }
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: sColor }}>{sLabel}</span>
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.50)', color: '#fff' }}>
                          {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                        </span>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-black text-[15px] leading-none drop-shadow">
                            {fmtPrix(b.prix)}{b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70"> /mois</span>}
                          </p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-[14px] leading-tight mb-1.5 truncate" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                        <div className="flex items-center gap-1 mb-2">
                          <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                          <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                        </div>
                        {compo && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>{compo}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {recentBiens.length > 3 && (
                <div className="flex justify-center gap-2 mt-4">
                  {recentBiens.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const el = carouselRef.current
                        if (!el) return
                        const cardW = el.scrollWidth / recentBiens.length
                        el.scrollTo({ left: cardW * i, behavior: 'smooth' })
                        setCarouselIdx(i)
                      }}
                      style={{ width: carouselIdx === i ? 20 : 8, height: 8, borderRadius: 4, background: carouselIdx === i ? '#4B6BFF' : 'rgba(75,107,255,0.25)', transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0 }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        <div className="px-5 md:px-8 xl:px-10 pt-8 pb-4">

          {/* ── En-tête ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Portefeuille</p>
              <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
                Mes biens
                <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{biens.length}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ color: 'var(--p-muted)', borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
                <IcRefresh /> Actualiser
              </button>
              <button onClick={() => navigate('/nouveau-bien')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)`, color: '#fff', boxShadow: `0 4px 14px ${BLUE}40` }}>
                <IcPlus /> Nouveau bien
              </button>
            </div>
          </div>

          {/* ── Recherche + tri ── */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--p-muted)' }}><IcSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un bien…"
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border transition-colors"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}
                onFocus={e => (e.target.style.borderColor = BLUE)}
                onBlur={e => (e.target.style.borderColor = 'var(--p-border)')} />
            </div>
            <button onClick={() => setSortByVues(s => !s)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={sortByVues
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              <IcEye /> Vues
            </button>
          </div>

          {/* ── Filtres ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={filter === f
                  ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                  : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenu ── */}
        <div className="px-5 md:px-8 xl:px-10 pb-24">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                  <div className="h-48 w-full" style={{ background: 'var(--p-border)' }} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.4} className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              </div>
              <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun bien trouvé</p>
              <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>
                {search ? 'Essayez un autre terme de recherche' : 'Publiez votre premier bien dès maintenant'}
              </p>
              <button onClick={() => navigate('/nouveau-bien')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #3A5AEE)`, color: '#fff', boxShadow: `0 4px 16px ${BLUE}40` }}>
                <IcPlus /> Ajouter un bien
              </button>
            </div>
          ) : (
            <AnimatedGroup preset="blur-slide" stagger={0.06}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(b => {
                  const { label, color } = statutBien(b.statut_moderation || 'en_attente')
                  const loc = b.localisation
                  const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
                  const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                  const nbPieces = Array.isArray(b.pieces) ? b.pieces.length : 0
                  const superficie = b.details_maison?.superficie ?? b.details_terrain?.superficie ?? null
                  const compo = bienComposition(b)
                  return (
                    <div key={b.id}
                      onClick={() => navigate(`/proprietaire/biens/${b.id}`, { state: { fromDashboard: true } })}
                      role="button" tabIndex={0}
                      className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(75,107,255,0.12),_0_2px_8px_rgba(15,23,42,0.08)]"
                      style={{
                        background: 'var(--p-card)',
                        border: '1px solid var(--p-border)',
                        boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                      }}>

                      {/* Photo */}
                      <div className="relative overflow-hidden" style={{ height: 192 }}>
                        {cover?.url
                          ? <img loading="lazy" src={cover.url} alt={bienLabel(b)}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <div className="w-full h-full flex items-center justify-center"
                              style={{ background: `linear-gradient(135deg, #EEF1FB, ${BLUE}18)` }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={1.2} className="w-12 h-12 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            </div>
                        }
                        {/* Gradient overlay */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                        {/* Badge statut */}
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                          style={{ background: color, boxShadow: `0 2px 8px ${color}55` }}>
                          {label}
                        </span>
                        {/* Badge transaction */}
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                          {b.transaction === 'location' ? 'À louer' : 'À vendre'}
                        </span>
                        {/* Prix en bas de la photo */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <p className="text-white font-black text-[17px] leading-none drop-shadow">
                            {fmtPrix(b.prix)}
                            {b.transaction === 'location' && <span className="text-[11px] font-normal text-white/70">/mois</span>}
                          </p>
                          {(b.nb_consultations ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-white/80">
                              <IcEye /> {b.nb_consultations}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Corps */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-bold text-[15px] leading-tight" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                          {b.statut === 'occupe' && (
                            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#22C55E15', color: '#15803D' }}>● Occupé</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mb-3">
                          <span style={{ color: 'var(--p-muted)' }}><IcPin /></span>
                          <span className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{adresse}</span>
                        </div>

                        {/* Chips pièces / surface / composition */}
                        {(nbPieces > 0 || superficie || compo) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {nbPieces > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: BLUE + '10', color: BLUE }}>
                                {nbPieces} pièce{nbPieces > 1 ? 's' : ''}
                              </span>
                            )}
                            {superficie && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>
                                {superficie} m²
                              </span>
                            )}
                            {compo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--p-border)', color: 'var(--p-muted)' }}>
                                {compo}
                              </span>
                            )}
                          </div>
                        )}

                        {b.statut_moderation === 'rejete' && b.motif_refus && (
                          <p className="text-[10px] mb-3 truncate" style={{ color: '#DC2626' }}>⚠ {b.motif_refus}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--p-border)' }}
                          onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditingBien(b)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: hoveredEl === `modifier-${b.id}` ? BLUE + '20' : BLUE + '10', color: BLUE, border: `1px solid ${BLUE}20` }}
                            onMouseEnter={() => setHoveredEl(`modifier-${b.id}`)}
                            onMouseLeave={() => setHoveredEl(null)}>
                            <IcEdit /> Modifier
                          </button>
                          {confirmDeleteBienId === b.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => del(b.id)} className="px-2 py-1 rounded-lg text-xs font-bold text-white flex-shrink-0" style={{ background: '#DC2626', border: 'none' }}>Supprimer</button>
                              <button onClick={() => setConfirmDeleteBienId(null)} className="px-2 py-1 rounded-lg text-xs flex-shrink-0" style={{ background: '#F3F4F6', border: 'none' }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteBienId(b.id)}
                              className="flex items-center justify-center w-9 h-9 rounded-xl text-xs transition-all flex-shrink-0"
                              style={{ background: '#EF444410', color: '#DC2626', border: '1px solid #EF444420' }}>
                              <IcTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AnimatedGroup>
          )}
        </div>
      </div>
    </div>
  )
}

