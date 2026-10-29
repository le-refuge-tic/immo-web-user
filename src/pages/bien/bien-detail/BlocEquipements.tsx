import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Wifi, AirVent, Fan, Tv, Droplets, Laptop, Shield, Utensils, Refrigerator, Flame, Microwave,
  CookingPot, Coffee, Bed, Bath, Sparkles, Wind, WashingMachine, Shirt, Waves, Trees, Sun, Sunrise,
  Car, Bike, Zap, ShieldCheck, Camera, FireExtinguisher, BriefcaseMedical, Plane, ChefHat, Check,
  Speaker, Mic, Lightbulb, Drama, Music, Projector, Table2, Armchair, Snowflake, DoorOpen, Toilet, Accessibility,
} from 'lucide-react'
import type { Bien } from '../../../types/api'
import { grouperEquipements } from '../../../utils/guesthouse'
import { SectionTitle } from './DetailSections'

/** Icône par code d'équipement ; un équipement ajouté plus tard au référentiel prend la coche. */
const ICONES: Record<string, LucideIcon> = {
  // Guesthouse
  wifi: Wifi, climatisation: AirVent, ventilateur: Fan, television: Tv, eau_chaude: Droplets,
  espace_travail: Laptop, moustiquaires: Shield, cuisine_equipee: Utensils, refrigerateur: Refrigerator,
  gaziniere: Flame, micro_ondes: Microwave, ustensiles: CookingPot, bouilloire: Coffee, draps: Bed,
  serviettes: Bath, produits_toilette: Sparkles, seche_cheveux: Wind, machine_laver: WashingMachine,
  fer_repasser: Shirt, piscine: Waves, jardin: Trees, terrasse: Sun, balcon: Sunrise, barbecue: Flame,
  parking_visiteurs: Car, parking_moto: Bike, groupe_electrogene: Zap, panneaux_solaires: Sun,
  forage_citerne: Droplets, gardien: ShieldCheck, cameras: Camera, extincteur: FireExtinguisher,
  trousse_secours: BriefcaseMedical, menage: Sparkles, petit_dejeuner: Coffee, blanchisserie: WashingMachine,
  navette_aeroport: Plane, cuisinier: ChefHat,
  // Salle de fêtes
  sonorisation: Speaker, micros: Mic, eclairage_scene: Lightbulb, scene_estrade: Drama, piste_danse: Music,
  videoprojecteur: Projector, tables: Table2, chaises: Armchair, nappes_housses: Shirt, office_traiteur: ChefHat,
  chambre_froide: Snowflake, loges_vestiaires: DoorOpen, toilettes_separees: Toilet, acces_pmr: Accessibility,
}

/** Équipements visibles avant « Voir tout ». */
const APERCU = 6

/** Équipements cochés d'un bien (guesthouse, salle de fêtes), par catégorie, avec « Voir tout ». */
export function BlocEquipements({ bien }: { bien: Bien }) {
  const [toutVoir, setToutVoir] = useState(false)
  const groupes = grouperEquipements(bien.equipements_liste)
  const total = groupes.reduce((n, g) => n + g.equipements.length, 0)
  if (total === 0) return null

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
  )
}
