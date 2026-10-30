import type { Bien } from '../../../types/api'
import { detailsPrix, libelleConfiguration, libelleMobilier, reglesSalle } from '../../../utils/salleFete'
import { SectionTitle } from './DetailSections'
import { BlocEquipements } from './BlocEquipements'

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-black/5 last:border-0">
      <dt className="text-sm text-text-grey">{libelle}</dt>
      <dd className="text-sm font-semibold text-text-dark text-right">{valeur}</dd>
    </div>
  )
}

/** Sections propres à une salle de fêtes : tarif à l'heure, capacité, événements, équipements, parking et règles. */
export function SalleFeteSections({ bien }: { bien: Bien }) {
  const d = bien.details_salle_fete
  if (!d) return null

  const mobilier = libelleMobilier(d)
  const evenements = bien.evenements ?? []

  return (
    <>
      <div>
        <SectionTitle title="Tarif" />
        <dl className="rounded-2xl bg-white border border-black/5 px-4">
          {detailsPrix(d).map(l => <Ligne key={l.libelle} libelle={l.libelle} valeur={l.valeur} />)}
        </dl>
        <p className="text-xs text-text-grey mt-2">Location à l’heure. Contactez l’annonceur pour vérifier les disponibilités.</p>
      </div>

      <div>
        <SectionTitle title="Capacité" />
        <dl className="rounded-2xl bg-white border border-black/5 px-4">
          <Ligne libelle="Personnes" valeur={d.capacite.toLocaleString('fr-FR')} />
          {d.superficie_m2 != null && <Ligne libelle="Superficie" valeur={`${d.superficie_m2.toLocaleString('fr-FR')} m²`} />}
          <Ligne libelle="Configuration" valeur={libelleConfiguration(d.configuration)} />
          {mobilier && <Ligne libelle="Mobilier fourni" valeur={mobilier} />}
        </dl>
      </div>

      {evenements.length > 0 && (
        <div>
          <SectionTitle title="Événements acceptés" />
          <ul className="flex flex-wrap gap-2">
            {evenements.map(e => (
              <li key={e.code} className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary" style={{ background: 'rgba(75,107,255,0.10)' }}>
                {e.libelle}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BlocEquipements bien={bien} />

      <div>
        <SectionTitle title="Parking, horaires et règles" />
        <ul className="rounded-2xl bg-white border border-black/5 px-4">
          {reglesSalle(d).map(r => (
            <li key={r} className="py-2 text-sm text-text-dark border-b border-black/5 last:border-0">{r}</li>
          ))}
        </ul>
      </div>
    </>
  )
}
