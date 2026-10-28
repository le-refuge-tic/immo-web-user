import type { CompteursCommercial, PerfHebdoSemaine } from '../../../api/commercialApi'
import { bienTypeLabel } from '../../../utils/bienType'
import { PURPLE, DARK_PURPLE, fmtPrix, fmtSemaine, statutBien, isCommercial, type Tab, PURPLE_TX } from '../shared'
import { IcHome, IcCal, IcShield, IcPin } from '../icons'
import type { Bien } from '../../../types/api'
import type { ProfilDemarcheur } from '../../../types/demarcheur'
import { withAlpha } from '../../../utils/color'

function QuickAction({ icon, color, label, onClick }: { icon: React.ReactNode; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 card-soft rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className="w-11 h-11 rounded-[13px] flex items-center justify-center" style={{ background: withAlpha(color, '20') }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-caption font-semibold text-text-dark text-center leading-tight">{label}</span>
    </button>
  )
}

interface TableauTabProps {
  me: ProfilDemarcheur | null | undefined
  biens: Bien[]
  loading: boolean
  score: number
  compteurs: CompteursCommercial | null
  perfHebdo: PerfHebdoSemaine[]
  onOpenTab: (t: Tab) => void
  onNouveauBien: () => void
}

export default function TableauTab({ me, biens, loading, score, compteurs, perfHebdo, onOpenTab, onNouveauBien }: TableauTabProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 md:px-8 xl:px-10 py-5 md:py-8">
        <p className="text-[17px] md:text-lg font-bold text-text-dark mb-3.5">Actions rapides</p>
        <div className="flex gap-3 mb-7 md:max-w-md">
          <QuickAction icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} color={PURPLE} label="Nouveau bien" onClick={onNouveauBien} />
          <QuickAction icon={<IcCal />} color="var(--c-brand)" label="Réservations" onClick={() => onOpenTab('reservations')} />
        </div>

        {/* Score de crédibilité card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})`, boxShadow: `0 8px 20px ${withAlpha(PURPLE, '4D')}` }}>
          <div className="flex items-center justify-between mb-4">
            <span className="px-2.5 py-1 rounded-xl text-white text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>Mon profil</span>
            <span className="text-white/70"><IcShield /></span>
          </div>
          <p className="text-white/70 text-sm">Score de crédibilité</p>
          <p className="text-white text-[26px] font-bold mt-1 mb-1">{score} / 100</p>
          <p className="text-white/60 text-caption mb-2">Note de fiabilité sur 100. Elle baisse de 10 points à chaque annulation tardive d'une visite.</p>
          <div className="h-1.5 rounded-full bg-white/20 mb-4">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${score}%` }} />
          </div>
          <div className="flex items-center">
            {[
              { label: 'Biens',    value: `${biens.length}` },
              { label: 'Étoiles', value: `${me?.nb_etoiles ?? 0}` },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center flex-1">
                {i > 0 && <div className="w-px h-8 mr-3" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                <div>
                  <p className="text-micro" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
                  <p className="text-white font-bold text-sm">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compteurs + performance hebdo — commerciaux uniquement */}
        {isCommercial(me) && compteurs && (
          <div className="mb-6">
            <p className="text-[17px] font-bold text-text-dark mb-3.5">Mes performances</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Biens publiés', value: compteurs.total_publies, color: PURPLE_TX },
                { label: 'En vérification', value: compteurs.en_verification, color: 'var(--tx-amber)' },
                { label: 'Validés', value: compteurs.valides, color: 'var(--tx-green)' },
                { label: 'Validés cette semaine', value: compteurs.valides_semaine, color: 'var(--tx-blue)' },
              ].map(c => (
                <div key={c.label} className="card-soft rounded-xl p-4">
                  <p className="text-[26px] font-bold" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-xs text-text-grey mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {perfHebdo.length > 0 && (
              <div className="card-soft rounded-xl p-4">
                <p className="text-sm font-bold text-text-dark mb-3">Historique hebdomadaire</p>
                <div className="space-y-2.5">
                  {perfHebdo.map(s => (
                    <div key={s.semaine_debut} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-text-grey">{fmtSemaine(s.semaine_debut)}</span>
                        <span className="text-caption px-1.5 py-0.5 rounded" style={{ background: withAlpha(PURPLE, '15'), color: PURPLE_TX }}>
                          {s.nb_biens_valides} bien{s.nb_biens_valides !== 1 ? 's' : ''}
                        </span>
                        {s.palier_atteint && (
                          <span className="text-caption px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(34,197,94,0.125)', color: 'var(--tx-green)' }}>Palier 20</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-text-dark flex-shrink-0">{fmtPrix(s.montant)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Biens récents */}
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[17px] font-bold text-text-dark">Mes biens récents</p>
          <button onClick={() => onOpenTab('biens')} className="text-sm font-semibold" style={{ color: PURPLE_TX }}>Voir tout</button>
        </div>
        {loading ? (
          [1,2].map(n => <div key={n} className="h-20 skeleton rounded-xl mb-2.5" />)
        ) : biens.length === 0 ? (
          <div className="card-soft rounded-xl p-5 text-center">
            <p className="text-text-grey text-sm">Aucun bien publié pour l'instant</p>
          </div>
        ) : biens.slice(0, 3).map(b => {
          const { label, color } = statutBien(b.statut_moderation || 'en_attente')
          const loc = b.localisation
          const adresse = loc ? `${loc.quartier ? loc.quartier + ', ' : ''}${loc.ville || ''}` : '—'
          return (
            <div key={b.id} className="card-soft rounded-[14px] p-3.5 mb-2.5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(PURPLE, '15') }}>
                <span style={{ color: PURPLE_TX }}><IcHome /></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-dark text-sm">{bienTypeLabel(b)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-text-grey"><IcPin /></span>
                  <p className="text-xs text-text-grey truncate">{adresse}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-text-dark text-xs">{fmtPrix(b.prix)}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-micro font-bold" style={{ background: withAlpha(color, '20'), color }}>{label}</span>
              </div>
            </div>
          )
        })}
        <div className="h-24" />
      </div>
    </div>
  )
}
