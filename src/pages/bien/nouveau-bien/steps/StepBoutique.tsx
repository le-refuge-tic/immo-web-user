

import { BLUE, EQUIPEMENTS_BOUTIQUE, ALENTOURS_OPTS } from '../options'
import { Card, Section, ChoiceList, Chip } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'

export function StepBoutique({ form }: { form: NouveauBienForm }) {
  const {
    equipementsBonus,
    setEquipementsBonus,
    alentours,
    setAlentours,
    disponibilite,
    setDisponibilite,
    showMoreOptions,
    setShowMoreOptions,
    typeVoie,
    setTypeVoie,
    visibiliteBoutique,
    setVisibiliteBoutique,
    parkingClients,
    setParkingClients,
  } = form
  return (
      <div className="space-y-4">
        <Card>
          <Section title="Position sur la voie" />
          <ChoiceList options={[
            { value: 'goudron', label: 'Au bord du goudron (Premier choix)' },
            { value: 'ruelle', label: 'Dans la ruelle' },
          ]} value={typeVoie} onChange={setTypeVoie} />
        </Card>

        <Card>
          <Section title="Visibilité depuis la rue" />
          <div className="grid grid-cols-2 gap-2.5">
            <Chip label="Façade directe" active={visibiliteBoutique === 'directe'} onClick={() => setVisibiliteBoutique('directe')} />
            <Chip label="Dans une galerie" active={visibiliteBoutique === 'galerie'} onClick={() => setVisibiliteBoutique('galerie')} />
          </div>
        </Card>

        <Card>
          <Section title="Parking clients" />
          <ChoiceList options={[
            { value: 'aucun', label: 'Aucun parking' },
            { value: 'motos', label: 'Trottoir pour motos' },
            { value: 'dedie', label: 'Parking voitures dédié' },
          ]} value={parkingClients} onChange={setParkingClients} />
        </Card>

        <button type="button" onClick={() => setShowMoreOptions(v => !v)}
          className="text-sm font-bold" style={{ color: BLUE }}>
          {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
        </button>

        {showMoreOptions && (
          <>
            <Card>
              <Section title="Commodités internes" />
              <div className="flex flex-wrap gap-2">
                {EQUIPEMENTS_BOUTIQUE.map(o => (
                  <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                    onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                ))}
              </div>
            </Card>
            <Card>
              <Section title="À proximité" />
              <div className="flex flex-wrap gap-2">
                {ALENTOURS_OPTS.map(o => (
                  <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                    onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                ))}
              </div>
            </Card>
          </>
        )}

        <Card>
          <Section title="Disponibilité" />
          <div className="grid grid-cols-2 gap-2.5">
            <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
            <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
          </div>
        </Card>
      </div>
  )
}
