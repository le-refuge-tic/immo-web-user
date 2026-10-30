

import { BLUE, TYPES_BIEN, STANDING_OPTS, STANDING_AUTRE_MAX, baseInputStyle } from '../options'
import { Card, Section, ChoiceList, Chip, MoneyInput } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'

export function StepTypePrix({ form }: { form: NouveauBienForm }) {
  const {
    typeBien,
    setTypeBien,
    typeTransaction,
    setTypeTransaction,
    prix,
    setPrix,
    estMeuble,
    setEstMeuble,
    etatMeubleMaison,
    setEtatMeubleMaison,
    etatConstructionMaison,
    setEtatConstructionMaison,
    sanitaire,
    setSanitaire,
    sanitaireAutre,
    setSanitaireAutre,
    standing,
    setStanding,
    standingAutre,
    setStandingAutre,
    prixLongSejour,
    setPrixLongSejour,
    prixSejourRestreint,
    setPrixSejourRestreint,
    prixHeure,
    setPrixHeure,
    tarifsAutres,
    setTarifsAutres,
    onSelectSanitaire,
    onSelectFinition,
    isSmallUnit,
    peutEtreMeuble,
    isMeuble,
  } = form
  return (
      <div className="space-y-4">
        <Card>
          <Section title="Type de bien" />
          <div className="flex flex-wrap gap-2">
            {TYPES_BIEN.map(t => (
              <button key={t.key} type="button" onClick={() => setTypeBien(t.key)}
                className="px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                style={{
                  borderColor: typeBien === t.key ? BLUE : 'var(--p-border)',
                  background: typeBien === t.key ? BLUE : 'transparent',
                  color: typeBien === t.key ? 'white' : 'var(--p-muted)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {isSmallUnit && (
          <Card>
            <Section title="Standing" />
            <ChoiceList options={STANDING_OPTS} value={standing} onChange={setStanding} />
            {standing === 'autre' && (
              <input value={standingAutre} onChange={e => setStandingAutre(e.target.value.slice(0, STANDING_AUTRE_MAX))}
                maxLength={STANDING_AUTRE_MAX}
                placeholder="Précisez le standing (50 caractères max)"
                className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
                style={baseInputStyle} />
            )}
          </Card>
        )}

        {peutEtreMeuble && (
          <Card>
            <Section title={typeBien === 'maison' ? 'État du meuble' : 'État du bien'} />
            {typeBien === 'maison' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Chip label="Non meublée" active={etatMeubleMaison === 'non_meuble'} onClick={() => setEtatMeubleMaison('non_meuble')} />
                <Chip label="Semi-meublée" active={etatMeubleMaison === 'semi_meuble'} onClick={() => setEtatMeubleMaison('semi_meuble')} />
                <Chip label="Meublée" active={etatMeubleMaison === 'meuble'} onClick={() => setEtatMeubleMaison('meuble')} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Vide" active={!estMeuble} onClick={() => setEstMeuble(false)} />
                <Chip label="Meublé" active={estMeuble} onClick={() => setEstMeuble(true)} />
              </div>
            )}
          </Card>
        )}

        {typeBien === 'maison' && (
          <Card>
            <Section title="État de construction" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Chip label="Semi-construite" active={etatConstructionMaison === 'semi_construite'} onClick={() => setEtatConstructionMaison('semi_construite')} />
              <Chip label="Totalement construite" active={etatConstructionMaison === 'totalement_construite'} onClick={() => setEtatConstructionMaison('totalement_construite')} />
            </div>
          </Card>
        )}

        <Card>
          <Section title="Transaction" />
          <div className="grid grid-cols-2 gap-2.5">
            <Chip label="Location" active={typeTransaction === 'location'} onClick={() => setTypeTransaction('location')} />
            <Chip label="Vente" active={typeTransaction === 'vente'} onClick={() => setTypeTransaction('vente')} />
          </div>
        </Card>

        {isMeuble ? (
          <Card>
            <Section title="Tarification (par durée de séjour)" />
            <div className="space-y-3">
              {[
                { label: 'Court séjour (par nuit)', value: prixSejourRestreint, onChange: setPrixSejourRestreint },
                { label: 'Long séjour (mensuel)', value: prixLongSejour, onChange: setPrixLongSejour },
                { label: "À l'heure", value: prixHeure, onChange: setPrixHeure },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2.5">
                  <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--p-text)' }}>{row.label}</span>
                  <div className="w-32"><MoneyInput value={row.value} onChange={row.onChange} /></div>
                </div>
              ))}
              {tarifsAutres.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={t.label}
                    onChange={e => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Libellé"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border"
                    style={baseInputStyle} />
                  <div className="w-28">
                    <MoneyInput value={t.prix} onChange={v => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                  </div>
                  <button type="button" onClick={() => setTarifsAutres(a => a.filter((_, idx) => idx !== i))} style={{ color: 'var(--tx-red)' }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={() => setTarifsAutres(a => [...a, { label: '', prix: '' }])}
                className="text-xs font-bold" style={{ color: BLUE }}>+ Ajouter un tarif</button>
            </div>
          </Card>
        ) : (
          <Card>
            <Section title={typeTransaction === 'location' ? 'Loyer mensuel (FCFA)' : 'Prix de vente (FCFA)'} />
            <MoneyInput value={prix} onChange={setPrix} />
          </Card>
        )}
      </div>
  )
}
