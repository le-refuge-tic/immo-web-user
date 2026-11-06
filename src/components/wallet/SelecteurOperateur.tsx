import { OPERATEURS } from '../../utils/retrait'
import type { OperateurRetrait } from '../../types/wallet'

/**
 * Choix de l'opérateur Mobile Money (MTN ou Moov) du numéro de retrait, à faire à chaque demande.
 * Simple choix de formulaire : aucun code SMS, aucune suspension. `variant` suit le thème de l'écran.
 */
export default function SelecteurOperateur({ variant, valeur, onChange, disabled }: {
  variant: 'sombre' | 'clair'
  valeur: OperateurRetrait | null
  onChange: (operateur: OperateurRetrait) => void
  disabled?: boolean
}) {
  const sombre = variant === 'sombre'
  return (
    <div role="radiogroup" aria-label="Opérateur Mobile Money">
      <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${sombre ? 'text-p-text' : 'text-text-dark'}`}>Opérateur de ce numéro</p>
      <div className="flex gap-2">
        {OPERATEURS.map(o => {
          const choisi = valeur === o.value
          return (
            <button key={o.value} type="button" role="radio" aria-checked={choisi} disabled={disabled} onClick={() => onChange(o.value)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors disabled:opacity-60 ${choisi ? 'text-white' : sombre ? 'text-p-text border-p-border' : 'text-text-dark border-divider'}`}
              style={choisi ? { background: 'var(--c-brand)', borderColor: 'var(--c-brand)' } : { background: 'transparent' }}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
