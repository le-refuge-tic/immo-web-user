import { useState, useEffect } from 'react'
import { biensApi } from '../../../api/biensApi'
import { loyersApi } from '../../../api/loyersApi'
import AjouterBienGestionModal from '../AjouterBienGestionModal'
import { AnimatedGroup } from '../../../components/ui/animated-group'
import { IcPayments, IcRefresh } from './icons'
import { IcHome, IcClock, IcWallet, IcPlus, IcShield, IcShare, BLUE, bienLabel, fmtPrix } from './shared'
import type { Tab } from './shared'
import { ContratDetailModal } from './ContratDetailModal'

// ─── Tab: Loyers ──────────────────────────────────────────────────────────────
// Statut d'un loyer — couvre les 4 valeurs réelles du backend (`en_attente`,
// `en_retard`, `paye`, `impaye`). `impaye` correspond à un loyer escaladé à
// l'administration (`escalade_admin`) : distingué du simple retard.
export function loyerStatut(s: string): { label: string; color: string } {
  if (s === 'paye')      return { label: 'Payé',       color: '#4CAF50' }
  if (s === 'en_retard') return { label: 'En retard',  color: '#F44336' }
  if (s === 'impaye')    return { label: 'Impayé',     color: '#C62828' }
  return { label: 'En attente', color: '#B45309' }
}
export const CONTRAT_STATUT: Record<string, { label: string; color: string }> = {
  actif:   { label: 'Actif',   color: '#4CAF50' },
  resilie: { label: 'Résilié', color: 'var(--p-muted)' },
  expire:  { label: 'Expiré',  color: '#F44336' },
}
export function moisLabel(d: any) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  const s = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
export function dateLabel(d: any) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LoyersTab({ onScrolled }: { onScrolled?: (v: boolean) => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'tous' | 'actif' | 'resilie' | 'expire' | 'gestion'>('tous')
  const [detailContrat, setDetailContrat] = useState<any>(null)
  useEffect(() => { loyersApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false)) }, [])

  // ── Biens en gestion (sans annonce publique, liés par code d'invitation) ──
  const [biensGestion, setBiensGestion] = useState<any[]>([])
  const [loadingGestion, setLoadingGestion] = useState(false)
  const [gestionLoaded, setGestionLoaded] = useState(false)
  const [showAjoutGestion, setShowAjoutGestion] = useState(false)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  const chargerGestion = () => {
    setLoadingGestion(true)
    biensApi.mesBiensGestion()
      .then(d => setBiensGestion(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => { setLoadingGestion(false); setGestionLoaded(true) })
  }

  useEffect(() => {
    if (filter === 'gestion' && !gestionLoaded) chargerGestion()
  }, [filter, gestionLoaded])

  const partagerCode = (bien: any) => {
    const code = bien.code_invitation
    if (!code) return
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopiedCode(bien.id)
    setTimeout(() => setCopiedCode(null), 1500)
    const msg = encodeURIComponent(
      `Bonjour, votre propriétaire vous invite à rejoindre REFUGE pour suivre votre location. Utilisez le code ${code} dans l'application (section "Rejoindre un bien") pour lier votre compte.`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const regenererCode = async (bien: any) => {
    try {
      const { code_invitation } = await biensApi.regenererCode(bien.id)
      setBiensGestion(prev => prev.map(b => b.id === bien.id ? { ...b, code_invitation } : b))
    } catch (_) {}
  }

  const stats = data?.stats || {}
  const contrats: any[] = data?.contrats || []
  const allLoyers: any[] = contrats.flatMap((c: any) => c.loyers || [])
  const enAttenteMontant = allLoyers.filter(l => l.statut === 'en_attente' || l.statut === 'en_retard').reduce((s, l) => s + Number(l.montant || 0), 0)
  const enRetardCount = stats.loyers_en_retard ?? allLoyers.filter(l => l.statut === 'en_retard').length
  const impayesCount = allLoyers.filter(l => l.statut === 'impaye').length

  const contratsResume = contrats.map((c: any) => {
    const loyersTries = [...(c.loyers || [])].sort((a: any, b: any) => new Date(a.date_echeance || a.mois || 0).getTime() - new Date(b.date_echeance || b.mois || 0).getTime())
    const impayesOuAttente = loyersTries.filter((l: any) => l.statut !== 'paye')
    const prochain = impayesOuAttente[0] || null
    const payesCount = loyersTries.filter((l: any) => l.statut === 'paye').length
    const totalCount = loyersTries.length
    const enProblemeCount = loyersTries.filter((l: any) => l.statut === 'en_retard' || l.statut === 'impaye').length
    return { ...c, loyersTries, prochain, payesCount, totalCount, enProblemeCount }
  })

  const filtered = filter === 'tous' ? contratsResume : contratsResume.filter((c: any) => c.statut === filter)
  const sorted = [...filtered].sort((a: any, b: any) => {
    const urg = (c: any) => c.prochain?.statut === 'impaye' ? 0 : c.prochain?.statut === 'en_retard' ? 1 : c.prochain ? 2 : 3
    return urg(a) - urg(b)
  })

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'tous',    label: 'Tous' },
    { key: 'actif',   label: 'Actifs' },
    { key: 'resilie', label: 'Résiliés' },
    { key: 'expire',  label: 'Expirés' },
    { key: 'gestion', label: 'Gestion' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>

      {/* ── En-tête ── */}
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Gestion</p>
            <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
              Loyers
              {filter === 'gestion'
                ? (gestionLoaded && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{biensGestion.length}</span>)
                : (!loading && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{sorted.length}</span>)}
            </h2>
          </div>
        </div>

        {/* ── KPI cards ── */}
        {!loading && data && (() => {
          const kpis = [
            { label: 'TOTAL PERÇU', value: `${Number(stats.revenus_total ?? 0).toLocaleString('fr-FR')} F`, color: BLUE,      icon: <IcWallet /> },
            { label: 'CE MOIS',     value: `${Number(stats.revenus_mois ?? 0).toLocaleString('fr-FR')} F`,  color: '#16A34A', icon: <IcPayments /> },
            { label: 'EN ATTENTE',  value: `${Number(enAttenteMontant).toLocaleString('fr-FR')} F`,          color: '#B45309', icon: <IcClock /> },
            { label: 'EN RETARD',   value: `${enRetardCount + impayesCount}`,                                color: enRetardCount + impayesCount > 0 ? '#DC2626' : '#16A34A', icon: <IcShield /> },
          ] as { label: string; value: string; color: string; icon: React.ReactNode }[]
          return (
            <div className="rounded-2xl overflow-hidden mb-3"
              style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              {/* Mobile : grille 2×2 */}
              <div className="grid grid-cols-2 sm:hidden">
                {kpis.map((k, i) => (
                  <div key={k.label} className="flex flex-col gap-2 p-3"
                    style={{
                      borderLeft: i % 2 === 1 ? '1px solid var(--p-border)' : undefined,
                      borderTop: i >= 2 ? '1px solid var(--p-border)' : undefined,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: k.color + '14', color: k.color }}>{k.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
                      <p className="text-[16px] font-black leading-none truncate" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Tablette / desktop : ligne unique */}
              <div className="hidden sm:flex">
                {kpis.map((k, i) => (
                  <div key={k.label} className="flex-1 flex items-center gap-2.5 px-2 py-6"
                    style={{ borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: k.color + '14', color: k.color }}>{k.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5" style={{ color: 'var(--p-muted)' }}>{k.label}</p>
                      <p className="text-[23px] font-black leading-none truncate" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── Filtres ── */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={filter === f.key
                ? { background: BLUE, color: '#fff', borderColor: BLUE, boxShadow: `0 4px 12px ${BLUE}35` }
                : { background: 'var(--p-card)', color: 'var(--p-muted)', borderColor: 'var(--p-border)' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 md:px-8 xl:px-10 pb-24"
        onScroll={e => onScrolled?.(e.currentTarget.scrollTop > 50)}>

        {filter === 'gestion' ? (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--p-text)' }}>Biens en gestion</p>
                <p className="text-xs" style={{ color: 'var(--p-muted)' }}>Sans annonce publique — suivi de loyers uniquement</p>
              </div>
              <button onClick={() => setShowAjoutGestion(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: BLUE }}>
                <IcPlus /> Ajouter un bien
              </button>
            </div>

            {loadingGestion ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(n => (
                  <div key={n} className="rounded-2xl overflow-hidden animate-pulse h-32" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }} />
                ))}
              </div>
            ) : biensGestion.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
                  <IcHome />
                </div>
                <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun bien en gestion</p>
                <p className="text-sm text-center max-w-xs mb-5" style={{ color: 'var(--p-muted)' }}>
                  Ajoutez un bien que vous louez déjà pour suivre ses loyers ici, sans le publier en annonce.
                </p>
                <button onClick={() => setShowAjoutGestion(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: BLUE }}>
                  Ajouter un bien en gestion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {biensGestion.map((b: any) => (
                  <div key={b.id} className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--p-text)' }}>{bienLabel(b)}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>{b.localisation?.quartier ? `${b.localisation.quartier}, ` : ''}{b.localisation?.ville || '—'}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-bold" style={{ color: BLUE }}>{fmtPrix(b.prix)}<span className="font-normal opacity-70">/mois</span></span>
                    </div>

                    {b.locataire ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-2" style={{ background: '#16A34A12' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        <span className="text-xs font-bold truncate" style={{ color: '#16A34A' }}>Lié à {b.locataire.prenom} {b.locataire.nom}</span>
                      </div>
                    ) : (
                      <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: '#F59E0B12', border: '1px dashed #F59E0B55' }}>
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--tx-amber)' }}>En attente de liaison</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-sm tracking-wider" style={{ color: 'var(--p-text)' }}>{b.code_invitation || '—'}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => partagerCode(b)} title="Copier et partager via WhatsApp"
                              className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--p-border)', color: 'var(--p-text)' }}>
                              {copiedCode === b.id ? '✓' : <IcShare />}
                            </button>
                            <button onClick={() => regenererCode(b)} title="Régénérer le code"
                              className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--p-border)', color: 'var(--p-text)' }}>
                              <IcRefresh />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                <div className="h-40 w-full" style={{ background: 'var(--p-border)' }} />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded-full w-2/3" style={{ background: 'var(--p-border)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--p-border)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
              <IcPayments />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun contrat</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--p-muted)' }}>
              {filter === 'tous' ? 'Vos contrats de location apparaîtront ici' : `Aucun contrat « ${filter} »`}
            </p>
          </div>
        ) : (
          <AnimatedGroup preset="blur-slide" stagger={0.055}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {sorted.map((c: any) => {
                const cStatut = CONTRAT_STATUT[c.statut] || { label: c.statut, color: 'var(--p-muted)' }
                const initiale = (c.locataire?.prenom || c.locataire?.nom || '?').charAt(0).toUpperCase()
                const aJour = !c.prochain
                const prochainStatut = c.prochain ? loyerStatut(c.prochain.statut) : null
                const cover = c.bien?.photos?.find((p: any) => p.is_cover) || c.bien?.photos?.[0]
                const progressPct = c.totalCount > 0 ? Math.round((c.payesCount / c.totalCount) * 100) : 0
                const alertColor = aJour ? '#16A34A' : prochainStatut!.color

                return (
                  <div key={c.id}
                    className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(75,107,255,0.12),_0_2px_8px_rgba(15,23,42,0.08)]"
                    style={{
                      background: 'var(--p-card)',
                      border: '1px solid var(--p-border)',
                      boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
                    }}
                    onClick={() => setDetailContrat(c)}>

                    {/* ── Visuel haut ── */}
                    <div className="relative overflow-hidden" style={{ height: 148 }}>
                      {cover?.url
                        ? <img loading="lazy" src={cover.url} alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${alertColor}14, ${BLUE}10)` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                              style={{ background: alertColor + '20', color: alertColor }}>{initiale}</div>
                          </div>
                      }
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 52%)' }} />

                      {/* Statut contrat haut-gauche */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: cStatut.color, boxShadow: `0 2px 8px ${cStatut.color}55` }}>
                        {cStatut.label}
                      </span>

                      {/* Loyer mensuel haut-droite */}
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                        {fmtPrix(c.loyer_mensuel)}<span className="font-normal opacity-70">/mois</span>
                      </span>

                      {/* Locataire bas-gauche */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-[14px] leading-tight drop-shadow truncate">
                          {c.locataire?.prenom} {c.locataire?.nom}
                        </p>
                        <p className="text-white/70 text-[11px] truncate">
                          {c.bien ? bienLabel(c.bien) : ''} ·{c.bien?.localisation?.ville || '—'}
                        </p>
                      </div>
                    </div>

                    {/* ── Corps ── */}
                    <div className="p-4">
                      {/* Statut du prochain loyer */}
                      {aJour ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
                          style={{ background: '#16A34A12' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          <span className="text-xs font-bold" style={{ color: '#16A34A' }}>À jour</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
                          style={{ background: prochainStatut!.color + '12' }}>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium" style={{ color: 'var(--p-muted)' }}>Prochain dû</p>
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--p-text)' }}>
                              {moisLabel(c.prochain.mois)}
                              {c.prochain.jours_retard > 0 && <span className="font-bold ml-1.5" style={{ color: prochainStatut!.color }}>· {c.prochain.jours_retard} j</span>}
                            </p>
                          </div>
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: prochainStatut!.color + '22', color: prochainStatut!.color }}>
                            {prochainStatut!.label}
                          </span>
                        </div>
                      )}

                      {/* Barre de progression loyers */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-border)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#16A34A' : BLUE }} />
                        </div>
                        <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'var(--p-muted)' }}>
                          {c.payesCount}/{c.totalCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </AnimatedGroup>
        )}
      </div>

      {detailContrat && (
        <ContratDetailModal contrat={detailContrat} onClose={() => setDetailContrat(null)} />
      )}

      {showAjoutGestion && (
        <AjouterBienGestionModal
          onClose={() => setShowAjoutGestion(false)}
          onCreated={() => { setShowAjoutGestion(false); chargerGestion() }}
        />
      )}
    </div>
  )
}

