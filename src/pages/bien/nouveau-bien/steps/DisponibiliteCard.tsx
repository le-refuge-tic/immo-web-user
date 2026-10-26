import { BLUE, baseInputStyle } from '../options'
import { Card, Section, Chip } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'

/** Date du jour au format YYYY-MM-DD, en heure locale (toISOString décalerait d'un jour la nuit). */
const aujourdhui = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Disponibilité du bien ; « En finition / Bientôt » ouvre le choix d'une date future (optionnelle). */
export function DisponibiliteCard({ form }: { form: NouveauBienForm }) {
  const { disponibilite, setDisponibilite, disponibleA, setDisponibleA } = form

  return (
    <Card>
      <Section title="Disponibilité" />
      <div className="grid grid-cols-2 gap-2.5">
        <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
        <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
      </div>
      {disponibilite === 'en_finition' && (
        <div className="mt-3">
          <label htmlFor="nouveau-bien-disponible-a" className="block mb-2 text-caption font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--p-muted)' }}>
            Disponible à partir du <span className="normal-case tracking-normal font-normal">(optionnel)</span>
          </label>
          <input id="nouveau-bien-disponible-a" type="date" value={disponibleA} min={aujourdhui()}
            onChange={e => setDisponibleA(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
            style={baseInputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
        </div>
      )}
    </Card>
  )
}
