import { useState } from 'react'
import { bienTypeLabel } from '../../../utils/bienType'
import { fraisVisiteAPayer, libelleFraisVisite } from '../../../utils/fraisVisite'
import { STATUT_META, SUPPORT_VISITE_PHONE } from './constants'
import { fmtDate, isDatePasseeVisite, isEchoueeVisite } from './helpers'
import type { Visite } from '../../../types/api'

// La carte lit `creneau.debut` (le type de l'API expose `date_debut`) : lecture conservée.
type VisiteAffichee = Visite & { creneau?: { debut?: string } | null }

type VisiteCardProps = {
  visite: VisiteAffichee
  onAnnuler: (v: Visite) => void
  onAccepterCP: (id: number) => void
  onRefuserCP: (v: Visite) => void
  onReproposer: (id: number, isoDate: string) => void | Promise<void>
  onMarquerEffectuee: (v: Visite) => void
  onIntegration: (id: number, integre: boolean, bienId?: number) => void
  onPay: (v: Visite) => void
  onMessage: (bienId: number) => void
  onContacterEchouee: (v: Visite) => void
  onFeedback: (v: Visite) => void
  onPayIntegration: (bienId?: number) => void
}

export function VisiteCard({ visite: v, onAnnuler, onAccepterCP, onRefuserCP, onReproposer, onMarquerEffectuee, onIntegration, onPay, onMessage, onContacterEchouee, onFeedback, onPayIntegration }: VisiteCardProps) {
  const isEchouee = isEchoueeVisite(v)
  const isDatePassee = isDatePasseeVisite(v)
  const meta = isEchouee ? STATUT_META.echouee : (STATUT_META[v.statut] || { label: v.statut, color: 'var(--c-grey)', bg: '#F4F6FA' })
  const bien = v.bien
  const typeStr = bien ? bienTypeLabel(bien) : 'Bien'
  const isCP = v.statut === 'contre_proposee' && !isEchouee
  const [reproposing, setReproposing] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [submittingRepro, setSubmittingRepro] = useState(false)

  const handleSubmitRepro = async () => {
    if (!newDate || !newTime) return
    setSubmittingRepro(true)
    try {
      await onReproposer(v.id, `${newDate}T${newTime}:00`)
      setReproposing(false)
      setNewDate('')
      setNewTime('')
    } catch {}
    setSubmittingRepro(false)
  }

  return (
    <div
      className="glass-card rounded-2xl p-4"
      style={{ border: isCP ? `1.5px solid rgba(230,126,34,0.4)` : undefined }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(75,107,255,0.1)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-dark text-sm truncate">{typeStr}</p>
            <p className="text-xs text-text-grey mt-0.5 truncate">
              {bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}
              {bien?.localisation?.ville || '--'}
            </p>
          </div>
        </div>
        <span
          className="text-caption font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
      </div>

      {/* Dates : « Votre demande » face à « Le gestionnaire propose » (comme sur le mobile) */}
      {isCP && v.date_contre_proposee ? (
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs border border-dashed border-divider">
            <span className="text-text-grey">Votre demande</span>
            <span className="text-text-grey font-medium">{fmtDate(v.date_souhaitee)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(230,126,34,0.10)', border: '1px solid rgba(230,126,34,0.25)' }}>
            <span className="font-semibold text-amber-700 dark:text-amber-400">Le gestionnaire propose</span>
            <span className="font-bold text-text-dark">{fmtDate(v.date_contre_proposee)}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-text-grey mb-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{v.statut === 'confirmee' ? 'Prévue' : 'Souhaitée'} : {fmtDate(v.date_souhaitee || v.creneau?.debut)}</span>
        </div>
      )}

      {/* Contact partagé — visible ~30 min avant une visite confirmée */}
      {!isEchouee && v.statut === 'confirmee' && v.numeros_partages && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl mb-3"
          style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,211,102,0.15)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--c-whatsapp)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-micro font-semibold" style={{ color: 'var(--c-whatsapp)' }}>Visite dans 30 min — Infos visite</p>
            <p className="text-[13px] font-bold text-text-dark">{SUPPORT_VISITE_PHONE}</p>
          </div>
          <a href={`https://wa.me/${SUPPORT_VISITE_PHONE.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg text-caption font-bold flex-shrink-0"
            style={{ background: 'rgb(255,255,255)', border: '1.5px solid var(--c-whatsapp)', color: 'var(--c-whatsapp)' }}>
            WhatsApp
          </a>
        </div>
      )}

      {/* Visite échouée */}
      {isEchouee && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--c-red)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 16l6-6" />
          </svg>
          <p className="text-xs font-medium" style={{ color: 'var(--tx-red)' }}>Cette visite ne s'est pas tenue.</p>
        </div>
      )}

      {isEchouee && bien?.id && (
        <button onClick={() => onContacterEchouee(v)}
          className="w-full py-2.5 rounded-xl text-xs font-bold mb-3 flex items-center justify-center gap-1.5"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.35)', color: 'var(--tx-red)' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Contacter le gestionnaire
        </button>
      )}

      {/* Contre-proposition : créneau dépassé */}
      {isCP && isDatePassee && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-3"
          style={{ background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.35)' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--tx-amber)' }}>
            Le créneau proposé est dépassé. Attendez que le gestionnaire propose une nouvelle date.
          </p>
        </div>
      )}

      {/* Integration decision */}
      {v.statut === 'effectuee' && (v.client_decision_integration === null || v.client_decision_integration === undefined) && (
        <div className="bg-primary/5 rounded-xl p-3 mb-3">
          <p className="text-xs font-bold text-text-dark mb-2">Souhaitez-vous intégrer ce logement ?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onIntegration(v.id, true, bien?.id)}
              className="flex-1 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--tx-green)' }}
            >
              Oui, j'intègre
            </button>
            <button
              onClick={() => onIntegration(v.id, false)}
              className="flex-1 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--tx-red)' }}
            >
              Non, je passe
            </button>
          </div>
        </div>
      )}

      {/* Décision oui, paiement d'intégration effectué */}
      {v.statut === 'effectuee' && v.client_decision_integration === true && v.paiement_integration_effectue && (
        <div className="rounded-xl p-3 mb-3 text-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--tx-green)' }}>Intégré · Terminé</p>
        </div>
      )}

      {/* Décision oui, paiement d'intégration en attente */}
      {v.statut === 'effectuee' && v.client_decision_integration === true && !v.paiement_integration_effectue && (
        <button
          onClick={() => onPayIntegration(bien?.id)}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white mb-3"
          style={{ background: 'var(--c-brand)' }}
        >
          Payer l'intégration
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {/* Contre-proposition: accept / propose another date / refuse */}
        {isCP && !isDatePassee && !reproposing && (
          <>
            {/* Ordre mobile : action destructive à gauche, action principale à droite */}
            <button
              onClick={() => onRefuserCP(v)}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400"
              style={{ border: '1.5px solid rgba(239,68,68,0.4)' }}
            >
              Refuser
            </button>
            <button
              onClick={() => setReproposing(true)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-primary/10 text-primary dark:text-brand-soft"
            >
              Autre date
            </button>
            <button
              onClick={() => onAccepterCP(v.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
              style={{ background: 'var(--c-primary)' }}
            >
              Accepter
            </button>
          </>
        )}

        {/* Confirmée: payer (pas encore payé) + message + annuler */}
        {!isEchouee && v.statut === 'confirmee' && !v.paiement_effectue && (
          <button
            onClick={() => onPay(v)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'var(--c-orange-dark)' }}
          >
            Payer les frais de visite ({libelleFraisVisite(fraisVisiteAPayer(v))})
          </button>
        )}

        {!isEchouee && v.statut === 'confirmee' && bien?.id && (
          <button
            onClick={() => onMessage(bien.id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(75,107,255,0.1)', color: 'var(--tx-blue)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </button>
        )}

        {!isEchouee && v.statut === 'confirmee' && v.paiement_effectue && (
          <button
            onClick={() => onMarquerEffectuee(v)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--tx-green)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Marquer comme effectuée
          </button>
        )}

        {!isEchouee && (v.statut === 'en_attente' || v.statut === 'confirmee') && (
          <button
            onClick={() => onAnnuler(v)}
            className="px-3 py-2 rounded-xl text-xs font-bold"
            style={{ border: '1.5px solid rgba(239,68,68,0.4)', color: 'var(--tx-red)' }}
          >
            Annuler
          </button>
        )}

        {v.statut === 'effectuee' && !v.feedback_donne && (
          <button
            onClick={() => onFeedback(v)}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--tx-amber)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Donner mon avis
          </button>
        )}
      </div>

      {/* Formulaire inline : proposer une autre date */}
      {isCP && reproposing && (
        <div className="mt-3 pt-3 border-t border-divider">
          <p className="text-sm font-bold text-text-dark mb-3">Proposer une autre date</p>
          <div className="space-y-2 mb-3">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
              className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none border border-divider focus:border-primary" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setReproposing(false); setNewDate(''); setNewTime('') }}
              className="flex-1 py-2.5 rounded-xl border border-divider text-sm font-semibold text-text-grey">
              Annuler
            </button>
            <button onClick={handleSubmitRepro} disabled={!newDate || !newTime || submittingRepro}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: 'var(--c-brand)' }}>
              {submittingRepro ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
