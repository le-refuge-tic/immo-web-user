import type { ReactNode } from 'react'
import { Card, Section, Counter, MoneyInput, Chip } from '../nouveau-bien/ui'
import type { GroupeEquipements } from '../../../api/referentielsBiens'
import {
  MODES_RESERVATION, POLITIQUES_ANNULATION, TYPES_LIT, type GuesthouseForm, type Lit,
} from '../../../shared/biens/formulaires/guesthouse'
import { ChoixFacultatif, Heure, Libelle, OuiNon } from './champs'

type Props = { form: GuesthouseForm; maj: (p: Partial<GuesthouseForm>) => void }

/** Même étape que le commercial : prix, ménage, tarifs longue durée, capacité, lits. */
export function EtapeTarifGuesthouse({ form, maj, totaux }: Props & { totaux: ReactNode }) {
  const majLit = (i: number, patch: Partial<Lit>) => maj({ lits: form.lits.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const typeLibre = TYPES_LIT.find(t => !form.lits.some(l => l.type === t.value))?.value ?? 'simple'
  return (
    <div className="flex flex-col gap-4">
      <p role="note" className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-[var(--p-accent-text)]">Location meublée · prix par nuitée</p>
      <Card>
        <Section title="Tarif" required />
        <div className="flex flex-col gap-4">
          <div><Libelle>Prix par nuit</Libelle><MoneyInput value={form.prixNuitee} onChange={v => maj({ prixNuitee: v })} placeholder="25000" /></div>
          <div><Libelle facultatif>Caution</Libelle><MoneyInput value={form.caution} onChange={v => maj({ caution: v })} placeholder="0" /></div>
          <Counter label="Nuitées minimum" value={form.nuiteesMin} min={1} onChange={v => maj({ nuiteesMin: v })} />
          <div><Libelle facultatif>Frais de ménage (par séjour)</Libelle><MoneyInput value={form.fraisMenage} onChange={v => maj({ fraisMenage: v })} placeholder="0" /></div>
        </div>
      </Card>
      <Card>
        <Section title="Tarifs longue durée" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Libelle facultatif>Tarif semaine (7 nuits)</Libelle><MoneyInput value={form.prixSemaine} onChange={v => maj({ prixSemaine: v })} placeholder="150000" /></div>
          <div><Libelle facultatif>Tarif mois (30 nuits)</Libelle><MoneyInput value={form.prixMois} onChange={v => maj({ prixMois: v })} placeholder="550000" /></div>
        </div>
      </Card>
      {totaux}
      <Card>
        <Section title="Capacité" required />
        <Counter label="Voyageurs" value={form.capacite} min={1} onChange={v => maj({ capacite: v })} />
        <Counter label="Chambres" value={form.nbChambres} min={1} onChange={v => maj({ nbChambres: v })} />
        <Counter label="Salles de bain" value={form.nbSallesBain} min={1} onChange={v => maj({ nbSallesBain: v })} />
        {form.voyageursParChambre === null
          ? <button type="button" onClick={() => maj({ voyageursParChambre: 2 })} className="mt-2 rounded-xl border border-dashed border-primary px-3 py-2 text-xs font-bold text-[var(--p-accent-text)]">+ Préciser les voyageurs par chambre</button>
          : <div className="mt-2 flex items-center gap-2">
              <div className="flex-1"><Counter label="Voyageurs par chambre" value={form.voyageursParChambre} min={1} onChange={v => maj({ voyageursParChambre: v })} /></div>
              <button type="button" onClick={() => maj({ voyageursParChambre: null })} className="text-xs text-[var(--p-muted)]">Retirer</button>
            </div>}
      </Card>
      <Card>
        <Section title="Lits" required />
        <div className="flex flex-col gap-3">
          {form.lits.map((lit, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select value={lit.type} aria-label={`Type du lit ${i + 1}`} onChange={e => majLit(i, { type: e.target.value })}
                className="flex-1 rounded-xl border border-[var(--p-border)] bg-[var(--p-deep)] px-3 py-2.5 text-sm text-[var(--p-text)]">
                {TYPES_LIT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="flex-1"><Counter label="Nombre" value={lit.nombre} min={1} onChange={v => majLit(i, { nombre: v })} /></div>
              {form.lits.length > 1 && <button type="button" aria-label={`Retirer le lit ${i + 1}`} onClick={() => maj({ lits: form.lits.filter((_, j) => j !== i) })} className="text-xs font-bold text-[var(--tx-red)]">Retirer</button>}
            </div>
          ))}
          <button type="button" onClick={() => maj({ lits: [...form.lits, { type: typeLibre, nombre: 1 }] })}
            className="self-start rounded-xl border border-dashed border-primary px-3 py-2 text-xs font-bold text-[var(--p-accent-text)]">+ Ajouter un type de lit</button>
        </div>
      </Card>
    </div>
  )
}

export function ChoixEquipements({ groupes, erreur, reessayer, selection, basculer }: {
  groupes: GroupeEquipements[] | null; erreur: string; reessayer: () => void; selection: string[]; basculer: (code: string) => void
}) {
  if (erreur) return <p className="text-sm text-[var(--tx-red)]">{erreur} <button type="button" onClick={reessayer} className="font-bold underline">Réessayer</button></p>
  if (!groupes) return <p className="text-sm text-[var(--p-muted)]">Chargement des équipements…</p>
  return (
    <div className="flex flex-col gap-3">
      {groupes.map(g => (
        <div key={g.categorie}>
          <p className="mb-1.5 text-xs font-bold text-[var(--p-muted)]">{g.libelle}</p>
          <div className="flex flex-wrap gap-2">
            {g.equipements.map(e => <Chip key={e.code} label={e.libelle} active={selection.includes(e.code)} onClick={() => basculer(e.code)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Équipements, garage, horaires, règles, réservation et annulation. */
export function EtapeReglesGuesthouse({ form, maj, groupes, erreur, reessayer }: Props & { groupes: GroupeEquipements[] | null; erreur: string; reessayer: () => void }) {
  const basculer = (code: string) => maj({ equipements: form.equipements.includes(code) ? form.equipements.filter(c => c !== code) : [...form.equipements, code] })
  return (
    <div className="flex flex-col gap-4">
      <Card><Section title="Équipements et services" /><ChoixEquipements groupes={groupes} erreur={erreur} reessayer={reessayer} selection={form.equipements} basculer={basculer} /></Card>
      <Card>
        <Section title="Garage / parking" required />
        <OuiNon libelle="Garage" value={form.garage} onChange={v => maj({ garage: v, typeAccesGarage: v ? form.typeAccesGarage : null })} />
        {form.garage && (
          <div className="mt-3"><Libelle>Type d’accès</Libelle>
            <OuiNon libelle="Type d’accès au garage" value={form.typeAccesGarage === null ? null : form.typeAccesGarage === 'prive'} oui="Privé" non="Commun"
              onChange={v => maj({ typeAccesGarage: v ? 'prive' : 'commun' })} /></div>
        )}
      </Card>
      <Card>
        <Section title="Horaires" required />
        <div className="grid grid-cols-2 gap-3">
          <div><Libelle htmlFor="gh-arrivee">Arrivée</Libelle><Heure id="gh-arrivee" value={form.heureArrivee} onChange={v => maj({ heureArrivee: v })} /></div>
          <div><Libelle htmlFor="gh-depart">Départ</Libelle><Heure id="gh-depart" value={form.heureDepart} onChange={v => maj({ heureDepart: v })} /></div>
        </div>
      </Card>
      <Card>
        <Section title="Règles de la maison" />
        <div className="flex flex-col gap-3">
          <div><Libelle>Animaux</Libelle><OuiNon libelle="Animaux" value={form.animaux} oui="Autorisés" non="Interdits" onChange={v => maj({ animaux: !!v })} /></div>
          <div><Libelle>Fêtes</Libelle><OuiNon libelle="Fêtes" value={form.fetes} oui="Autorisées" non="Interdites" onChange={v => maj({ fetes: !!v })} /></div>
          <div><Libelle>Fumeur</Libelle><OuiNon libelle="Fumeur" value={form.fumeur} oui="Autorisé" non="Interdit" onChange={v => maj({ fumeur: !!v })} /></div>
        </div>
      </Card>
      <Card>
        <Section title="Réservation et annulation" />
        <div className="flex flex-col gap-3">
          <div><Libelle facultatif>Mode de réservation</Libelle><ChoixFacultatif libelle="Mode de réservation" options={MODES_RESERVATION} value={form.modeReservation} onChange={v => maj({ modeReservation: v })} /></div>
          <div><Libelle facultatif>Politique d’annulation</Libelle><ChoixFacultatif libelle="Politique d’annulation" options={POLITIQUES_ANNULATION} value={form.politiqueAnnulation} onChange={v => maj({ politiqueAnnulation: v })} /></div>
        </div>
      </Card>
    </div>
  )
}
