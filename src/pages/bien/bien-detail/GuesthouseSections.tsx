import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Wifi, AirVent, Fan, Tv, Droplets, Laptop, Shield, Utensils, Refrigerator, Flame, Microwave,
  CookingPot, Coffee, Bed, Bath, Sparkles, Wind, WashingMachine, Shirt, Waves, Trees, Sun, Sunrise,
  Car, Bike, Zap, ShieldCheck, Camera, FireExtinguisher, BriefcaseMedical, Plane, ChefHat, Check,
} from 'lucide-react'
import type { Bien } from '../../../types/api'
import { grouperEquipements, libelleLits, regles } from '../../../utils/guesthouse'
import { SectionTitle } from './DetailSections'

/** Icône par code d'équipement ; un équipement ajouté plus tard au référentiel prend la coche. */
const ICONES: Record<string, LucideIcon> = {
  wifi: Wifi, climatisation: AirVent, ventilateur: Fan, television: Tv, eau_chaude: Droplets,
  espace_travail: Laptop, moustiquaires: Shield, cuisine_equipee: Utensils, refrigerateur: Refrigerator,
  gaziniere: Flame, micro_ondes: Microwave, ustensiles: CookingPot, bouilloire: Coffee, draps: Bed,
  serviettes: Bath, produits_toilette: Sparkles, seche_cheveux: Wind, machine_laver: WashingMachine,
  fer_repasser: Shirt, piscine: Waves, jardin: Trees, terrasse: Sun, balcon: Sunrise, barbecue: Flame,
  parking_visiteurs: Car, parking_moto: Bike, groupe_electrogene: Zap, panneaux_solaires: Sun,
  forage_citerne: Droplets, gardien: ShieldCheck, cameras: Camera, extincteur: FireExtinguisher,
  trousse_secours: BriefcaseMedical, menage: Sparkles, petit_dejeuner: Coffee, blanchisserie: WashingMachine,
  navette_aeroport: Plane, cuisinier: ChefHat,
}

/** Équipements visibles avant « Voir tout ». */
const APERCU = 6

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
  const [toutVoir, setToutVoir] = useState(false)
  const d = bien.details_guesthouse
  if (!d) return null

  const groupes = grouperEquipements(bien.equipements_liste)
  const total = groupes.reduce((n, g) => n + g.equipements.length, 0)
  // Aperçu : les 6 premiers équipements dans l'ordre des catégories
  let restants = toutVoir ? Infinity : APERCU
  const visibles = groupes
    .map(g => {
      const equipements = g.equipements.slice(0, Math.max(restants, 0))
      restants -= equipements.length
      return { ...g, equipements }
    })
    .filter(g => g.equipements.length > 0)

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

      {total > 0 && (
        <div>
          <SectionTitle title="Équipements et services" />
          <div className="space-y-3">
            {visibles.map(g => (
              <div key={g.categorie}>
                <p className="text-xs font-bold uppercase tracking-wider text-text-grey mb-1.5">{g.libelle}</p>
                <ul className="flex flex-wrap gap-2">
                  {g.equipements.map(e => {
                    const Icone = ICONES[e.code] ?? Check
                    return (
                      <li key={e.code} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-dark" style={{ background: 'rgba(0,0,0,0.045)' }}>
                        <Icone className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        {e.libelle}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          {total > APERCU && (
            <button type="button" onClick={() => setToutVoir(v => !v)} aria-expanded={toutVoir}
              className="mt-3 text-sm font-semibold text-primary underline underline-offset-2">
              {toutVoir ? 'Voir moins' : `Voir tout (${total})`}
            </button>
          )}
        </div>
      )}

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
