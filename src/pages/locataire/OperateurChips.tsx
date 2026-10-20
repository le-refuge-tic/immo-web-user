import { GREEN, OPERATEURS } from './shared'

export default function OperateurChips({ value, onChange, cotisationSolde }: { value: string; onChange: (v: any) => void; cotisationSolde?: number }) {
  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {cotisationSolde != null && cotisationSolde > 0 && (
        <button onClick={() => onChange('cotisation')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
          style={value === 'cotisation'
            ? { borderColor: GREEN, background: `${GREEN}20`, color: '#1A1A2E' }
            : { borderColor: '#E5E7EB', color: '#6B7280', background: '#fff' }}>
          Cotisation ({cotisationSolde.toLocaleString('fr-FR')} F)
        </button>
      )}
      {OPERATEURS.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
          style={value === o.id
            ? { borderColor: o.accent, background: `${o.accent}20`, color: '#1A1A2E' }
            : { borderColor: '#E5E7EB', color: '#6B7280', background: '#fff' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
