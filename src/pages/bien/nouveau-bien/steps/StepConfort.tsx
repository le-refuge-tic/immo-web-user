

import { BLUE, STANDING_OPTS, STANDING_AUTRE_MAX, CUISINE_OPTS, COUR_OPTS, COUR_DESC, EQUIPEMENTS_RESIDENTIEL, ALENTOURS_OPTS, parsePrix, formatFcfa, baseInputStyle } from '../options'
import { Card, Section, ChoiceList, Chip, Counter, NumberPicker, MoneyInput } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'
import { DisponibiliteCard } from './DisponibiliteCard'

export function StepConfort({ form }: { form: NouveauBienForm }) {
  const {
    typeBien,
    typeTransaction,
    prix,
    sanitaire,
    setSanitaire,
    sanitaireAutre,
    setSanitaireAutre,
    standing,
    setStanding,
    standingAutre,
    setStandingAutre,
    chambres,
    setChambres,
    salons,
    setSalons,
    cuisines,
    setCuisines,
    douches,
    setDouches,
    typeCuisine,
    setTypeCuisine,
    cuisineAutre,
    setCuisineAutre,
    chambreACouloir,
    setChambreACouloir,
    typeCour,
    setTypeCour,
    nbVoisins,
    setNbVoisins,
    accesVehicule,
    setAccesVehicule,
    nbVehicules,
    setNbVehicules,
    avanceMois,
    setAvanceMois,
    avanceAutre,
    setAvanceAutre,
    avanceAutreText,
    setAvanceAutreText,
    echeanceMois,
    setEcheanceMois,
    echeanceAutre,
    setEcheanceAutre,
    echeanceAutreText,
    setEcheanceAutreText,
    loyerPrepayeMois,
    setLoyerPrepayeMois,
    loyerPrepayeAutre,
    setLoyerPrepayeAutre,
    loyerPrepayeAutreText,
    setLoyerPrepayeAutreText,
    cautionEau,
    setCautionEau,
    cautionElec,
    setCautionElec,
    electricite,
    setElectricite,
    prixKwh,
    setPrixKwh,
    eau,
    setEau,
    forageGestion,
    setForageGestion,
    prixM3,
    setPrixM3,
    prixForage,
    setPrixForage,
    equipementsBonus,
    setEquipementsBonus,
    alentours,
    setAlentours,
    showMoreOptions,
    setShowMoreOptions,
    onSelectSanitaire,
    onSelectFinition,
    isSmallUnit,
    showPieces,
    nbPieces,
  } = form
  return (
      <div className="space-y-4">
        {showPieces && (
          <Card>
            <Section title="Nombre de pièces" />
            <div className="divide-y" style={{ borderColor: 'var(--p-border)' }}>
              <Counter label="Chambres" item="Une chambre" value={chambres} onChange={setChambres} min={1} />
              <Counter label="Salons" item="Un salon" value={salons} onChange={setSalons} />
              {typeBien !== 'chambre_salon' && (
                <>
                  <Counter label="Cuisines" item="Une cuisine" value={cuisines} onChange={setCuisines} />
                  <Counter label="Douches" item="Une douche" value={douches} onChange={setDouches} />
                </>
              )}
            </div>
            <p className="mt-2 text-sm font-bold" style={{ color: BLUE }} aria-live="polite">
              Total : {nbPieces} pièce{nbPieces > 1 ? 's' : ''} <span className="font-normal" style={{ color: 'var(--p-muted)' }}>(chambres + salons)</span>
            </p>
          </Card>
        )}

        {!isSmallUnit && (
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

        <Card>
          <Section title="Type de cuisine" />
          <ChoiceList options={CUISINE_OPTS} value={typeCuisine} onChange={setTypeCuisine} />
          {typeCuisine === 'autre' && (
            <input value={cuisineAutre} onChange={e => setCuisineAutre(e.target.value)}
              placeholder="Précisez le type de cuisine"
              className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
              style={baseInputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
          )}
        </Card>

        {typeBien === 'chambre_salon' && (
          <Card>
            <Section title="Chambre à couloir ?" />
            <div className="grid grid-cols-2 gap-2.5">
              <Chip label="Oui" active={chambreACouloir} onClick={() => setChambreACouloir(true)} />
              <Chip label="Non" active={!chambreACouloir} onClick={() => setChambreACouloir(false)} />
            </div>
          </Card>
        )}

        <Card>
          <Section title="Type de cour / Accès" />
          <ChoiceList options={COUR_OPTS} value={typeCour} onChange={setTypeCour} />
          {COUR_DESC[typeCour] && (
            <p className="text-xs italic mt-2" style={{ color: BLUE }}>{COUR_DESC[typeCour]}</p>
          )}
          {typeCour === 'commune' && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Nombre de voisins dans la cour</p>
                <Counter label="Voisins" item="Un voisin" value={nbVoisins} onChange={setNbVoisins} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Accès véhicule</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Oui" active={accesVehicule === true} onClick={() => setAccesVehicule(true)} />
                  <Chip label="Non" active={accesVehicule === false} onClick={() => setAccesVehicule(false)} />
                </div>
              </div>
              {accesVehicule === true && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Nombre de véhicules</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Chip key={n} label={`${n}`} active={nbVehicules === n} onClick={() => setNbVehicules(n)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <Section title="Avance (mois de loyer)" />
          <NumberPicker presets={[0, 1, 2, 3, 4, 5]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
            value={avanceMois} isCustom={avanceAutre}
            onPick={n => { setAvanceMois(n); setAvanceAutre(false) }}
            onCustomStart={() => setAvanceAutre(true)}
            customText={avanceAutreText}
            onCustomText={t => { setAvanceAutreText(t); setAvanceMois(Number(t) || 0) }}
          />
          {(parsePrix(prix) ?? 0) > 0 && avanceMois > 0 && (
            <p className="text-sm font-bold mt-2" style={{ color: BLUE }}>
              = {formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}
            </p>
          )}
        </Card>

        {typeTransaction === 'location' && (
          <Card>
            <Section title="Échéance du mois" />
            <NumberPicker presets={[5, 10, 15, 20, 25, 30]} unit={n => `${n}`}
              value={echeanceMois} isCustom={echeanceAutre}
              onPick={n => { setEcheanceMois(n); setEcheanceAutre(false) }}
              onCustomStart={() => setEcheanceAutre(true)}
              customText={echeanceAutreText}
              onCustomText={t => { setEcheanceAutreText(t); setEcheanceMois(Number(t) || 5) }}
            />
          </Card>
        )}

        <Card>
          <Section title="Loyer prépayé (optionnel)" />
          <NumberPicker presets={[0, 1, 2, 3]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
            value={loyerPrepayeMois} isCustom={loyerPrepayeAutre}
            onPick={n => { setLoyerPrepayeMois(n); setLoyerPrepayeAutre(false) }}
            onCustomStart={() => setLoyerPrepayeAutre(true)}
            customText={loyerPrepayeAutreText}
            onCustomText={t => { setLoyerPrepayeAutreText(t); setLoyerPrepayeMois(Number(t) || 0) }}
          />
          {loyerPrepayeMois > 0 && (
            <p className="text-xs italic mt-2" style={{ color: BLUE }}>
              {loyerPrepayeMois === 1
                ? 'Le locataire ne paiera pas de loyer pour le 1er mois après intégration.'
                : `Le locataire ne paiera pas de loyer pour les ${loyerPrepayeMois} premiers mois après intégration.`}
            </p>
          )}
        </Card>

        <Card>
          <Section title="Électricité" />
          <ChoiceList options={[
            { value: 'non', label: 'Non' },
            { value: 'sbee', label: 'SBEE' },
            { value: 'decompteur', label: 'Décompteur' },
          ]} value={electricite} onChange={setElectricite} />
          {electricite === 'decompteur' && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du kWh</p>
              <MoneyInput value={prixKwh} onChange={setPrixKwh} placeholder="Ex: 150" />
            </div>
          )}
        </Card>

        <Card>
          <Section title="Eau" />
          <ChoiceList options={[
            { value: 'non',             label: 'Non' },
            { value: 'soneb',           label: 'SONEB' },
            { value: 'decompteur_soneb', label: 'Décompteur SONEB' },
            { value: 'forage',          label: 'Forage' },
          ]} value={eau} onChange={setEau} />
          {eau === 'decompteur_soneb' && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du m³</p>
              <MoneyInput value={prixM3} onChange={setPrixM3} placeholder="Ex: 150" />
            </div>
          )}
          {eau === 'forage' && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du forage</p>
                <MoneyInput value={prixForage} onChange={setPrixForage} placeholder="Ex: 50000" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Comment c'est géré ?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Entre voisins" active={forageGestion === 'voisins'} onClick={() => setForageGestion(g => g === 'voisins' ? null : 'voisins')} />
                  <Chip label="Abonnement mensuel" active={forageGestion === 'mensuel'} onClick={() => setForageGestion(g => g === 'mensuel' ? null : 'mensuel')} />
                </div>
                {forageGestion === 'voisins' && <p className="text-xs italic mt-2" style={{ color: BLUE }}>Le coût du forage est partagé entre les voisins.</p>}
                {forageGestion === 'mensuel' && <p className="text-xs italic mt-2" style={{ color: BLUE }}>Chaque locataire paie un abonnement mensuel fixe.</p>}
              </div>
            </div>
          )}
        </Card>

        {(eau === 'soneb' || eau === 'decompteur_soneb' || electricite !== 'non') && (
          <Card>
            <Section title="Caution" />
            <div className="space-y-3">
              {(eau === 'soneb' || eau === 'decompteur_soneb') && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--p-muted)' }}>Caution eau</p>
                  <MoneyInput value={cautionEau} onChange={setCautionEau} />
                  <p className="text-caption mt-1" style={{ color: 'var(--p-muted)' }}>Saisir 0 si pas de caution eau</p>
                </div>
              )}
              {electricite !== 'non' && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--p-muted)' }}>
                    Caution électricité ({electricite === 'sbee' ? 'SBEE' : 'Décompteur'})
                  </p>
                  <MoneyInput value={cautionElec} onChange={setCautionElec} />
                  <p className="text-caption mt-1" style={{ color: 'var(--p-muted)' }}>Saisir 0 si pas de caution électricité</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {(!isSmallUnit || standing === 'haut_standing_vip') && (
          <>
            <button type="button" onClick={() => setShowMoreOptions(v => !v)}
              className="text-sm font-bold" style={{ color: BLUE }}>
              {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
            </button>
            {showMoreOptions && (
              <>
                {!isSmallUnit && (
                  <Card>
                    <Section title="Équipements & Atouts" />
                    <div className="flex flex-wrap gap-2">
                      {EQUIPEMENTS_RESIDENTIEL.map(o => (
                        <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                          onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                      ))}
                    </div>
                  </Card>
                )}
                {standing === 'haut_standing_vip' && (
                  <Card>
                    <Section title="À proximité du bien" />
                    <div className="flex flex-wrap gap-2">
                      {ALENTOURS_OPTS.map(o => (
                        <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                          onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        <DisponibiliteCard form={form} />
      </div>
  )
}
