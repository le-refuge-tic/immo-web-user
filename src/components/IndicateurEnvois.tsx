import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useZoneNotifs } from '../context/useToast'
import { useGestionEnvois } from '../shared/uploads/useGestionEnvois'
import { avancement } from '../shared/uploads/fileEnvoi'

const bouton = 'min-h-[40px] rounded-xl px-3 text-xs font-semibold'

/**
 * Lot 1 — suivi discret des envois de photos, visible sur toutes les pages :
 * « Envoi des photos de Villa Fidjrossè : 3/6 », reprise après un rechargement,
 * et en cas d'échec « Réessayer » ou « Compléter les photos ».
 */
export default function IndicateurEnvois() {
  const { lots, interrompus, reprendre, abandonner } = useGestionEnvois()
  const navigate = useNavigate()
  const zone = useZoneNotifs()
  if (!lots.length && !interrompus.length) return null

  // Dans la pile des toasts quand elle existe (sinon les deux se superposaient au même
  // endroit) ; position fixe propre en repli, hors de ToastProvider.
  const contenu = (
    <div
      role="status"
      aria-live="polite"
      className={zone
        ? 'pointer-events-auto flex flex-col gap-2'
        : 'fixed right-4 left-4 md:left-auto z-[900] flex flex-col gap-2 md:w-[360px]'}
      style={zone ? undefined : { bottom: 'calc(var(--bottom-nav-h, 0px) + 16px)' }}
    >
      {interrompus.map(lot => {
        const { faits, total } = avancement(lot)
        return (
          <div key={lot.id} className="rounded-2xl border border-[var(--p-border)] bg-[var(--p-card)] text-[var(--p-text)] p-3 text-sm shadow-xl">
            <p className="font-semibold">Envoi interrompu : {lot.libelle}</p>
            <p className="text-[var(--p-muted)] text-xs mt-0.5">{faits}/{total} fichiers envoyés avant la fermeture de la page.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={`${bouton} bg-primary text-white`} onClick={() => reprendre(lot.id)}>Reprendre l’envoi</button>
              <button type="button" className={`${bouton} border border-[var(--p-border)]`} onClick={() => abandonner(lot.id)}>Ignorer</button>
            </div>
          </div>
        )
      })}
      {lots.map(lot => {
        const { faits, total, echecs, enCours } = avancement(lot)
        const pourcent = total ? Math.round((faits / total) * 100) : 100
        return (
          <div key={lot.id} className="rounded-2xl border border-[var(--p-border)] bg-[var(--p-card)] text-[var(--p-text)] p-3 text-sm shadow-xl">
            <p className="font-semibold">
              {enCours
                ? `Envoi des photos de ${lot.libelle} : ${faits}/${total}`
                : `${echecs} fichier${echecs > 1 ? 's' : ''} non envoyé${echecs > 1 ? 's' : ''} (${lot.libelle})`}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded bg-[var(--p-deep)]">
              <div
                className={`h-full transition-all ${echecs && !enCours ? 'bg-[var(--tx-red)]' : 'bg-primary'}`}
                style={{ width: `${pourcent}%` }}
              />
            </div>
            {!enCours && echecs > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={`${bouton} bg-primary text-white`} onClick={() => reprendre(lot.id)}>Réessayer</button>
                {lot.lien && (
                  <button type="button" className={`${bouton} border border-[var(--p-border)]`} onClick={() => { abandonner(lot.id); navigate(lot.lien!) }}>
                    Compléter les photos
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
  return zone ? createPortal(contenu, zone) : contenu
}
