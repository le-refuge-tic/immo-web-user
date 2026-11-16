import type { ReactNode } from 'react'
import { Card, Section, Counter, MoneyInput, Chip } from '../nouveau-bien/ui'
import type { GroupeEquipements, TypeEvenement } from '../../../api/referentielsBiens'
import {
  CONFIGURATIONS, DUREE_HEURES_MAX, PIECES_ANNEXES, POLITIQUES_ANNULATION, TRAITEURS, apercuPrix, finLendemain,
  type SalleFeteForm,
} from '../../../shared/biens/formulaires/salleFete'
import { ChoixFacultatif, Entier, Heure, Libelle, OuiNon } from './champs'
import { ChoixEquipements } from './EtapesGuesthouse'

type Props = { form: SalleFeteForm; maj: (p: Partial<SalleFeteForm>) => void }
const basculer = <T extends string>(liste: T[], code: T): T[] => (liste.includes(code) ? liste.filter(c => c !== code) : [...liste, code])

/** Même étape que le commercial : prix, durée couverte, minimum, caution, ménage, forfaits, capacité. */
export function EtapeTarifSalle({ form, maj, totaux }: Props & { totaux: ReactNode }) {
  const apercu = apercuPrix(form.prix, form.dureeHeures)
  return (
    <div className="flex flex-col gap-4">
      <p role="note" className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-[var(--p-accent-text)]">Location · prix à l’heure</p>
      <Card>
        <Section title="Tarif" required />
        <div className="flex flex-col gap-4">
          <div><Libelle>Prix</Libelle><MoneyInput value={form.prix} onChange={v => maj({ prix: v })} placeholder="45000" /></div>
          <div>
            <Libelle htmlFor="salle-duree">Heures couvertes par ce prix</Libelle>
            <select id="salle-duree" value={form.dureeHeures} onChange={e => maj({ dureeHeures: Number(e.target.value) })}
              className="w-full rounded-xl border border-[var(--p-border)] bg-[var(--p-deep)] px-3 py-2.5 text-sm text-[var(--p-text)]">
              {Array.from({ length: DUREE_HEURES_MAX }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h} h</option>)}
            </select>
            {apercu && <p className="mt-1 text-xs text-[var(--p-muted)]">{apercu.affiche}{apercu.parHeure ? ` · ${apercu.parHeure}` : ''}</p>}
          </div>
          <Counter label="Durée minimum (heures)" value={form.heuresMin} min={1} max={DUREE_HEURES_MAX} onChange={v => maj({ heuresMin: v })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Libelle facultatif>Caution</Libelle><MoneyInput value={form.caution} onChange={v => maj({ caution: v })} placeholder="0" /></div>
            <div><Libelle facultatif>Frais de ménage</Libelle><MoneyInput value={form.fraisMenage} onChange={v => maj({ fraisMenage: v })} placeholder="0" /></div>
          </div>
        </div>
      </Card>
      <Card>
        <Section title="Forfaits" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Libelle facultatif>Forfait journée</Libelle><MoneyInput value={form.forfaitJournee} onChange={v => maj({ forfaitJournee: v })} placeholder="250000" /></div>
          <div><Libelle facultatif>Forfait week-end</Libelle><MoneyInput value={form.forfaitWeekend} onChange={v => maj({ forfaitWeekend: v })} placeholder="450000" /></div>
        </div>
      </Card>
      {totaux}
      <Card>
        <Section title="Capacité et configuration" required />
        <div className="flex flex-col gap-4">
          <div><Libelle htmlFor="salle-cap">Capacité</Libelle><Entier id="salle-cap" value={form.capacite} onChange={v => maj({ capacite: v })} unite="personnes" placeholder="300" /></div>
          <div><Libelle htmlFor="salle-sup" facultatif>Superficie</Libelle><Entier id="salle-sup" value={form.superficie} onChange={v => maj({ superficie: v })} unite="m²" /></div>
          <div><Libelle>Configuration</Libelle>
            <div className="flex flex-wrap gap-2">{CONFIGURATIONS.map(c => <Chip key={c.value} label={c.label} active={form.configuration === c.value} onClick={() => maj({ configuration: c.value })} />)}</div>
          </div>
        </div>
      </Card>
      <Card>
        <Section title="Mobilier fourni" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Libelle htmlFor="salle-tables" facultatif>Tables</Libelle><Entier id="salle-tables" value={form.nbTables} onChange={v => maj({ nbTables: v })} unite="tables" /></div>
          <div><Libelle htmlFor="salle-chaises" facultatif>Chaises</Libelle><Entier id="salle-chaises" value={form.nbChaises} onChange={v => maj({ nbChaises: v })} unite="chaises" /></div>
        </div>
      </Card>
    </div>
  )
}

/** Événements, équipements, parking, horaires, règles, espaces et accessibilité, annulation. */
export function EtapeReglesSalle({ form, maj, evenements, erreurEvenements, groupes, erreurEquipements, reessayer }: Props & {
  evenements: TypeEvenement[] | null; erreurEvenements: string; groupes: GroupeEquipements[] | null; erreurEquipements: string; reessayer: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Section title="Événements acceptés" required />
        {erreurEvenements
          ? <p className="text-sm text-[var(--tx-red)]">{erreurEvenements} <button type="button" onClick={reessayer} className="font-bold underline">Réessayer</button></p>
          : !evenements ? <p className="text-sm text-[var(--p-muted)]">Chargement…</p>
          : <div className="flex flex-wrap gap-2">{evenements.map(e => <Chip key={e.code} label={e.libelle} active={form.evenements.includes(e.code)} onClick={() => maj({ evenements: basculer(form.evenements, e.code) })} />)}</div>}
      </Card>
      <Card><Section title="Équipements et services" /><ChoixEquipements groupes={groupes} erreur={erreurEquipements} reessayer={reessayer} selection={form.equipements} basculer={c => maj({ equipements: basculer(form.equipements, c) })} /></Card>
      <Card>
        <Section title="Parking" required />
        <OuiNon libelle="Parking" value={form.parking} onChange={v => maj({ parking: v, placesParking: v ? form.placesParking : '' })} />
        {form.parking && <div className="mt-3"><Libelle htmlFor="salle-places">Places</Libelle><Entier id="salle-places" value={form.placesParking} onChange={v => maj({ placesParking: v })} unite="places" /></div>}
      </Card>
      <Card>
        <Section title="Horaires" required />
        <div className="grid grid-cols-2 gap-3">
          <div><Libelle htmlFor="salle-ouv">Ouverture</Libelle><Heure id="salle-ouv" value={form.heureOuverture} onChange={v => maj({ heureOuverture: v })} /></div>
          <div><Libelle htmlFor="salle-fin">Fin au plus tard</Libelle><Heure id="salle-fin" value={form.heureFinMax} onChange={v => maj({ heureFinMax: v })} /></div>
        </div>
        {finLendemain(form.heureOuverture, form.heureFinMax) && <p className="mt-2 text-xs text-[var(--p-muted)]">La fin tombe le lendemain.</p>}
        <div className="mt-3"><Libelle htmlFor="salle-musique" facultatif>Fin de la musique</Libelle><Heure id="salle-musique" value={form.heureFinMusique} onChange={v => maj({ heureFinMusique: v })} /></div>
      </Card>
      <Card>
        <Section title="Règles de la salle (facultatif)" />
        <p className="mb-3 text-xs text-[var(--p-muted)]">Touchez à nouveau un choix pour l’annuler.</p>
        <div className="flex flex-col gap-3">
          <div><Libelle>Traiteur</Libelle><ChoixFacultatif libelle="Traiteur" options={TRAITEURS} value={form.traiteur} onChange={v => maj({ traiteur: v })} /></div>
          <div><Libelle>Décoration</Libelle><OuiNon libelle="Décoration" annulable value={form.deco} oui="Autorisée" non="Interdite" onChange={v => maj({ deco: v })} /></div>
          <div><Libelle>Alcool</Libelle><OuiNon libelle="Alcool" annulable value={form.alcool} oui="Autorisé" non="Interdit" onChange={v => maj({ alcool: v })} /></div>
          <div><Libelle>Insonorisation</Libelle><OuiNon libelle="Insonorisation" annulable value={form.insonorisee} oui="Insonorisée" non="Non insonorisée" onChange={v => maj({ insonorisee: v })} /></div>
        </div>
      </Card>
      <Card>
        <Section title="Espaces et accessibilité (facultatif)" />
        <div className="flex flex-col gap-3">
          <div><Libelle>Pièces annexes</Libelle>
            <div className="flex flex-wrap gap-2">{PIECES_ANNEXES.map(p => <Chip key={p.value} label={p.label} active={form.piecesAnnexes.includes(p.value)} onClick={() => maj({ piecesAnnexes: basculer(form.piecesAnnexes, p.value) })} />)}</div>
          </div>
          <div><Libelle htmlFor="salle-sani">Sanitaires</Libelle><Entier id="salle-sani" value={form.nbSanitaires} onChange={v => maj({ nbSanitaires: v })} unite="sanitaires" /></div>
          <div><Libelle>Accès PMR</Libelle><OuiNon libelle="Accès PMR" annulable value={form.accesPmr} oui="Accessible" non="Non accessible" onChange={v => maj({ accesPmr: v })} /></div>
          <div><Libelle>Politique d’annulation</Libelle><ChoixFacultatif libelle="Politique d’annulation" options={POLITIQUES_ANNULATION} value={form.politiqueAnnulation} onChange={v => maj({ politiqueAnnulation: v })} /></div>
        </div>
      </Card>
    </div>
  )
}
