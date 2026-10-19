import { useState, useEffect } from 'react'
import { IcPayments } from './icons'
import { BLUE, bienLabel, fmtPrix } from './shared'
import { loyerStatut, CONTRAT_STATUT, moisLabel, dateLabel } from './LoyersTab'

export function ContratDetailModal({ contrat, onClose }: { contrat: any; onClose: () => void }) {
  const c = contrat
  const cStatut = CONTRAT_STATUT[c.statut] || { label: c.statut, color: 'var(--p-muted)' }
  const initiale = (c.locataire?.prenom || c.locataire?.nom || '?').charAt(0).toUpperCase()
  const cover = c.bien?.photos?.find((p: any) => p.is_cover) || c.bien?.photos?.[0]
  const payesCount: number = c.payesCount ?? 0
  const totalCount: number = c.totalCount ?? 0
  const progressPct = totalCount > 0 ? Math.round((payesCount / totalCount) * 100) : 0

  const [shown, setShown] = useState(false)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const handleClose = () => {
    setShown(false)
    setClosing(true)
    setTimeout(onClose, 220)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: shown ? 'rgba(10,16,30,0.45)' : 'rgba(10,16,30,0)',
        backdropFilter: shown ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
        pointerEvents: closing ? 'none' : 'auto',
      }}
      onClick={handleClose}>
      <div role="dialog" aria-modal="true" aria-label="Détail du bien" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: '#F8FAFF',
          boxShadow: '0 32px 96px rgba(10,16,30,0.32), 0 8px 24px rgba(10,16,30,0.12)',
          transform: shown ? 'scale(1)' : 'scale(0.82)',
          opacity: shown ? 1 : 0,
          transition: shown
            ? 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease'
            : 'transform 0.2s cubic-bezier(0.4,0,1,1), opacity 0.18s ease',
          transformOrigin: 'center center',
        }}
        onClick={e => e.stopPropagation()}>

        {/* ── Photo banner ── */}
        <div className="relative overflow-hidden rounded-t-2xl" style={{ height: 140 }}>
          {cover?.url
            ? <img loading="lazy" src={cover.url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${BLUE}18, ${BLUE}08)` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-4xl"
                  style={{ background: BLUE + '20', color: BLUE }}>{initiale}</div>
              </div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
          <button onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>✕</button>
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
            style={{ background: cStatut.color }}>
            {cStatut.label}
          </span>
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-[16px] leading-tight drop-shadow">
              {c.locataire?.prenom} {c.locataire?.nom}
            </p>
            <p className="text-white/70 text-[12px]">
              {c.bien ? bienLabel(c.bien) : ''} ·{c.bien?.localisation?.quartier ? `${c.bien.localisation.quartier}, ` : ''}{c.bien?.localisation?.ville || '—'}
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3">

          {/* ── Loyer + progression ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Loyer mensuel</p>
              <p className="font-black text-[20px]" style={{ color: BLUE }}>{fmtPrix(c.loyer_mensuel)}</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Progression</p>
              <p className="font-black text-[20px]" style={{ color: progressPct === 100 ? '#16A34A' : BLUE }}>
                {payesCount}<span className="text-sm font-medium text-gray-500">/{totalCount}</span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#E8EDFB' }}>
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#16A34A' : BLUE }} />
              </div>
            </div>
          </div>

          {/* ── Infos contrat ── */}
          <div className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Détails du contrat</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y" style={{ borderColor: '#E8EDFB' }}>
              {[
                { label: 'Début', value: dateLabel(c.date_debut) },
                { label: 'Fin', value: c.date_fin ? dateLabel(c.date_fin) : 'En cours' },
                { label: 'Échéance', value: `Le ${c.jour_echeance ?? 10} du mois` },
                { label: 'Prépayé', value: c.loyer_prepaye_mois > 0 ? `${c.loyer_prepaye_mois} mois` : 'Aucun' },
              ].map(row => (
                <div key={row.label} className="px-4 py-3" style={{ borderColor: '#E8EDFB' }}>
                  <p className="text-[10px] text-gray-500 mb-0.5">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                </div>
              ))}
            </div>
            {c.gestion_via_app === false && (
              <div className="px-4 py-2.5 border-t text-xs text-gray-500 italic" style={{ borderColor: '#E8EDFB' }}>
                Gestion déléguée (hors application)
              </div>
            )}
          </div>

          {/* ── Historique des échéances ── */}
          <div className="rounded-xl border overflow-hidden" style={{ background: '#fff', borderColor: '#E8EDFB' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: '#E8EDFB' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Historique des échéances</p>
            </div>
            {(!c.loyersTries || c.loyersTries.length === 0) ? (
              <p className="text-xs text-gray-500 py-8 text-center">Aucune échéance générée</p>
            ) : (
              <div className="divide-y" style={{ borderColor: '#E8EDFB' }}>
                {[...c.loyersTries].reverse().map((l: any) => {
                  const { label, color } = loyerStatut(l.statut)
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '14', color }}>
                        <IcPayments />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{moisLabel(l.mois)}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Échéance {dateLabel(l.date_echeance)}
                          {l.statut === 'paye' && l.date_paiement && ` · payé le ${dateLabel(l.date_paiement)}`}
                          {l.jours_retard > 0 && l.statut !== 'paye' && ` · ${l.jours_retard} j de retard`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-800">{fmtPrix(l.montant)}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: color + '18', color }}>{label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

