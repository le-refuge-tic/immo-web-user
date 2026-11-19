
import { BLUE, formatFcfa, baseInputStyle } from '../options'
import { Card, Section, MoneyInput } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'
import { withAlpha } from '../../../../utils/color'

export function StepHonoraires({ form }: { form: NouveauBienForm }) {
  const {
    typeTransaction,
    description,
    setDescription,
    autresFrais,
    setAutresFrais,
    isTerrain,
    montantBrut,
  } = form
  return (
      <div className="space-y-4">


        <Card>
          <Section title="Notes / Précisions (optionnel)" htmlFor="nouveau-bien-notes" />
          <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Ces informations s'afficheront dans votre annonce.</p>
          <textarea id="nouveau-bien-notes" value={description} onChange={e => setDescription(e.target.value)} rows={5}
            placeholder="Points forts, accès, conditions particulières, règles de la maison..."
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-colors"
            style={baseInputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
        </Card>

        {!isTerrain && (
          <Card>
            <Section title="Autres frais (optionnel)" />
            <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Frais supplémentaires inclus dans le total à payer à l'intégration.</p>
            <div className="space-y-2.5">
              {autresFrais.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f.label} aria-label={`Libellé du frais ${i + 1}`}
                    onChange={e => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Libellé (ex: Frais de dossier)"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={baseInputStyle} />
                  <div className="w-28">
                    <MoneyInput label={`Montant du frais ${i + 1}`} value={f.prix} onChange={v => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                  </div>
                  <button type="button" onClick={() => setAutresFrais(a => a.filter((_, idx) => idx !== i))} aria-label={`Supprimer le frais ${i + 1}`} style={{ color: 'var(--tx-red)' }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setAutresFrais(a => [...a, { label: '', prix: '' }])}
                className="text-xs font-bold" style={{ color: BLUE }}>+ Ajouter un frais</button>
            </div>
          </Card>
        )}

        {!isTerrain && typeTransaction === 'location' && montantBrut > 0 && (
          <div className="rounded-2xl border p-4"
            style={{ background: withAlpha(BLUE, '0E'), borderColor: withAlpha(BLUE, '30') }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>
              Montant minimum à verser avant intégration
            </p>
            <p className="text-2xl font-bold" style={{ color: BLUE }}>{formatFcfa(montantBrut)}</p>
          </div>
        )}
      </div>
  )
}
