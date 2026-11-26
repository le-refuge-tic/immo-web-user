import { GREEN, MODE_FEDAPAY } from './shared'
import type { ModePaiementLoyer } from '../../types/locataire'
import { withAlpha } from '../../utils/color'

export default function OperateurChips({ value, onChange, cotisationSolde }: { value: string; onChange: (v: ModePaiementLoyer) => void; cotisationSolde?: number }) {
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {cotisationSolde != null && cotisationSolde > 0 && (
        <button onClick={() => onChange('cotisation')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
          style={value === 'cotisation'
            ? { borderColor: GREEN, background: `${withAlpha(GREEN, '20')}`, color: 'var(--c-ink-navy)' }
            : { borderColor: 'var(--c-line)', color: 'var(--c-grey)', background: 'rgb(255,255,255)' }}>
          Cotisation ({cotisationSolde.toLocaleString('fr-FR')} F)
        </button>
      )}
      <button onClick={() => onChange(MODE_FEDAPAY.id)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
        style={value === MODE_FEDAPAY.id
          ? { borderColor: MODE_FEDAPAY.accent, background: `${withAlpha(MODE_FEDAPAY.accent, '20')}`, color: 'var(--c-ink-navy)' }
          : { borderColor: 'var(--c-line)', color: 'var(--c-grey)', background: 'rgb(255,255,255)' }}>
        {MODE_FEDAPAY.label}
      </button>
    </div>
  )
}
