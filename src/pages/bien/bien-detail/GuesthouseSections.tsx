import type { Bien } from '../../../types/api'
import { libelleLits, regles } from '../../../utils/guesthouse'
import { SectionTitle } from './DetailSections'
import { BlocEquipements } from './BlocEquipements'

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-black/5 last:border-0">
      <dt className="text-sm text-text-grey">{libelle}</dt>
      <dd className="text-sm font-semibold text-text-dark text-right">{valeur}</dd>
    </div>
  )
}

/** Sections propres à une guesthouse : tarif, capacité, équipements, garage, règles et horaires. */
export function GuesthouseSections({ bien }: { bien: Bien }) {
  const d = bien.details_guesthouse
  if (!d) return null

  return (
    <>
      <div>
        <SectionTitle title="Tarif" />
        <dl className="rounded-2xl bg-white border border-black/5 px-4">
          <Ligne libelle="Prix par nuit" valeur={fcfa(d.prix_nuitee)} />
          {d.caution != null && d.caution > 0 && <Ligne libelle="Caution" valeur={fcfa(d.caution)} />}
          <Ligne libelle="Séjour minimum" valeur={`${d.nuitees_min} nuit${d.nuitees_min > 1 ? 's' : ''}`} />
        </dl>
        <p className="text-xs text-text-grey mt-2">Location meublée à la nuitée. Contactez l’annonceur pour vérifier les disponibilités.</p>
      </div>

      <div>
        <SectionTitle title="Capacité" />
        <dl className="rounded-2xl bg-white border border-black/5 px-4">
          <Ligne libelle="Voyageurs" valeur={String(d.capacite)} />
          <Ligne libelle="Chambres" valeur={String(d.nb_chambres)} />
          <Ligne libelle="Lits" valeur={libelleLits(d.lits)} />
          <Ligne libelle="Salles de bain" valeur={String(d.nb_salles_bain)} />
        </dl>
      </div>

      <BlocEquipements bien={bien} />

      <div>
        <SectionTitle title="Garage, règles et horaires" />
        <ul className="rounded-2xl bg-white border border-black/5 px-4">
          {regles(d).map(r => (
            <li key={r} className="py-2 text-sm text-text-dark border-b border-black/5 last:border-0">{r}</li>
          ))}
        </ul>
      </div>
    </>
  )
}
