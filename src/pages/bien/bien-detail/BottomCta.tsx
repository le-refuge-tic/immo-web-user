import { useState } from 'react'
import type { Visite } from '../../../types/api'
import { fmtVisiteDate } from './helpers'

// ─── Barre d'action (bottom bar mobile fixe / panneau desktop) ─────────────
export function BottomCta({ isOwnBien, isOccupeLocal, togglingStatut, onToggleDisponibilite, visiteActive, visiteCancellee, visiteEchouee, onAnnuler, annulerBusy, onProposerVisite, onModifier, fraisVisite }: {
  isOwnBien: boolean; isOccupeLocal: boolean; togglingStatut: boolean; onToggleDisponibilite: () => void
  fraisVisite?: number | string | null
  visiteActive: Visite | null; visiteCancellee: Visite | null; visiteEchouee: Visite | null
  onAnnuler: () => void; annulerBusy: boolean
  onProposerVisite: () => void
  onModifier: () => void
}) {
  const [confirmAnnuler, setConfirmAnnuler] = useState(false)
  if (isOwnBien) {
    return (
      <div className="flex gap-2.5">
        <button onClick={onModifier}
          className="w-[54px] h-[54px] flex-shrink-0 rounded-xl border-2 border-divider flex items-center justify-center transition-colors hover:border-primary"
          aria-label="Modifier le bien">
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onToggleDisponibilite} disabled={togglingStatut}
          className="flex-1 h-[54px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: isOccupeLocal ? '#DC2626' : '#15803D' }}>
          {togglingStatut ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {isOccupeLocal
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-9 4h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
              </svg>
              {isOccupeLocal ? 'Marquer comme disponible' : 'Marquer comme occupé'}
            </>
          )}
        </button>
      </div>
    )
  }

  if (visiteActive) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: visiteActive.statut === 'confirmee' ? '#15803D' : '#FF6B35' }} />
          <p className="text-xs text-text-grey truncate">
            Visite {visiteActive.statut === 'confirmee' ? 'confirmée' : 'en attente'} · {fmtVisiteDate(visiteActive.date_contre_proposee || visiteActive.date_souhaitee)}
          </p>
        </div>
        {confirmAnnuler ? (
          <div className="flex gap-2.5">
            <button onClick={() => { onAnnuler(); setConfirmAnnuler(false) }} disabled={annulerBusy}
              className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background: '#DC2626' }}>
              {annulerBusy ? '…' : 'Confirmer l\'annulation'}
            </button>
            <button onClick={() => setConfirmAnnuler(false)}
              className="flex-1 py-3 rounded-xl border text-sm font-bold text-text-dark border-divider">
              Retour
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <div className="flex-1 py-3 rounded-xl border text-sm font-bold text-primary border-primary flex items-center justify-center">
              {fmtVisiteDate(visiteActive.date_contre_proposee || visiteActive.date_souhaitee)}
            </div>
            <button onClick={() => setConfirmAnnuler(true)} disabled={annulerBusy}
              className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background: '#DC2626' }}>
              Annuler la visite
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {visiteEchouee ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <svg className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--tx-red)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--tx-red)' }}>Visite échouée · {fmtVisiteDate(visiteEchouee.date_contre_proposee || visiteEchouee.date_souhaitee)}</p>
        </div>
      ) : visiteCancellee ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <svg className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--tx-red)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--tx-red)' }}>Visite annulée · {fmtVisiteDate(visiteCancellee.date_contre_proposee || visiteCancellee.date_souhaitee)}</p>
        </div>
      ) : null}
      <button onClick={onProposerVisite}
        className="w-full h-[54px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #4160F2 0%, #7B4BFF 100%)' }}>
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        {fraisVisite && Number(fraisVisite) > 0
          ? `Réserver une visite · ${Number(fraisVisite).toLocaleString('fr-FR')} F`
          : 'Réserver une visite'}
      </button>
      {/* Ce que recouvre « annonce modérée » : sans survendre une vérification du bien lui-même */}
      <p className="text-caption leading-snug mt-2.5 text-center" style={{ color: 'var(--tx-grey, #5E5E63)' }}>
        Annonce examinée par l'équipe REFUGE avant publication. Seule la visite permet de vérifier l'état réel du bien.
      </p>
    </div>
  )
}
