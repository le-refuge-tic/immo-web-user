
import { BLUE, formatFcfa, baseInputStyle } from '../options'
import { Card, Section, MoneyInput } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'
import { withAlpha } from '../../../../utils/color'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE } from '../../../../api/apiBase'

export function StepHonoraires({ form }: { form: NouveauBienForm }) {
  const [fraisPromotionnels, setFraisPromotionnels] = useState(500)
  useEffect(() => {
    axios.get<{ montant: number }>(`${BASE}/configuration/frais-visite`)
      .then(response => setFraisPromotionnels(response.data.montant))
      .catch(() => setFraisPromotionnels(500))
  }, [])
  const {
    typeTransaction,
    fraisVisite,
    setFraisVisite,
    visiteGratuite,
    setVisiteGratuite,
    description,
    setDescription,
    commissionMontant,
    setCommissionMontant,
    autresFrais,
    setAutresFrais,
    isDemarcheur,
    isTerrain,
    montantBrut,
  } = form
  return (
      <div className="space-y-4">
        {isDemarcheur && (
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1px solid #fdba74',
              color: '#9a3412',
            }}
          >
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest">Promotion visite</div>
              <div className="text-sm font-bold">Frais standards réduits à {formatFcfa(fraisPromotionnels)}</div>
            </div>
            <div className="text-lg font-black whitespace-nowrap">{formatFcfa(fraisPromotionnels)}</div>
          </div>
        )}
        {isDemarcheur && (
          <Card>
            <Section title="Frais de visite" />
            <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>
              Montant payé par chaque client pour visiter ce bien. Laissé vide, le tarif standard s'applique ({isTerrain ? '5 000' : fraisPromotionnels.toLocaleString('fr-FR')} FCFA).
            </p>
            <label className="mb-3 flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Visite gratuite</span>
              <input type="checkbox" checked={visiteGratuite} onChange={e => setVisiteGratuite(e.target.checked)} className="w-5 h-5 accent-blue-500" />
            </label>
            {!visiteGratuite && <MoneyInput value={fraisVisite} onChange={setFraisVisite} />}
          </Card>
        )}

        {isDemarcheur && !isTerrain && (
          <Card>
            <Section title="Commission d'agence" />
            <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Montant direct de votre commission.</p>
            <MoneyInput value={commissionMontant} onChange={setCommissionMontant} />
          </Card>
        )}

        <Card>
          <Section title="Notes / Précisions (optionnel)" />
          <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Ces informations s'afficheront dans votre annonce.</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
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
                  <input value={f.label}
                    onChange={e => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Libellé (ex: Frais de dossier)"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={baseInputStyle} />
                  <div className="w-28">
                    <MoneyInput value={f.prix} onChange={v => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                  </div>
                  <button type="button" onClick={() => setAutresFrais(a => a.filter((_, idx) => idx !== i))} style={{ color: 'var(--tx-red)' }}>✕</button>
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
