import { useState } from 'react'
import {
  categoriesAvec, sousTypeParCle, sousTypesDe,
  type CategorieBien, type FormulaireBien, type SousTypeReferentiel,
} from '../shared/biens/referentielTypes'

const ICONES: Record<string, string> = {
  maison: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  terrain: 'M3 20h18M5 20l4-9 3 5 3-4 4 8',
  boutique: 'M4 9l1-5h14l1 5M4 9h16v11H4zM9 20v-6h6v6',
  lit: 'M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 14h18M7 9V7',
  fete: 'M5 21l4-12 6 6zM14 4l1 2M19 6l-2 1M18 11l2 1',
}

interface SelecteurTypeBienProps {
  /** Clé du sous-type choisi (référentiel), ex. « villa ». */
  valeur: string
  onChange: (cle: string) => void
  /** Formulaires proposés (défaut : tous). */
  formulaires?: readonly FormulaireBien[]
  /** Sous-type géré par un autre formulaire (guesthouse, salle) : l'appelant confirme et navigue. */
  onFormulaireDedie?: (sousType: SousTypeReferentiel) => void
}

/**
 * Lot 2 — choix du type en deux temps : la catégorie (grandes cartes), puis le sous-type
 * (puces). Types et sous-types ne sont jamais mélangés sur la même ligne.
 */
export default function SelecteurTypeBien({ valeur, onChange, formulaires, onFormulaireDedie }: SelecteurTypeBienProps) {
  const categories = categoriesAvec(formulaires)
  const [categorie, setCategorie] = useState<CategorieBien>(
    () => sousTypeParCle(valeur)?.categorie ?? categories[0]?.cle ?? 'residentiel',
  )
  const sousTypes = sousTypesDe(categorie, formulaires)

  const choisirCategorie = (cle: CategorieBien) => {
    const liste = sousTypesDe(cle, formulaires)
    // Formulaire dédié : l'appelant confirme et navigue ; une annulation laisse le choix intact.
    if (liste.length === 1 && liste[0].formulaire !== 'classique' && onFormulaireDedie) {
      onFormulaireDedie(liste[0])
      return
    }
    setCategorie(cle)
    // Un sous-type d'une autre catégorie n'a plus de sens : on prend le premier de la nouvelle.
    const premiers = sousTypesDe(cle, formulaires)
    if (!premiers.some(s => s.cle === valeur) && premiers[0]) onChange(premiers[0].cle)
  }

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Catégorie de bien" className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {categories.map(c => {
          const actif = c.cle === categorie
          return (
            <button key={c.cle} type="button" role="radio" aria-checked={actif} onClick={() => choisirCategorie(c.cle)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-xs font-bold transition-all ${actif ? 'border-primary bg-primary text-white shadow-md' : 'border-[var(--p-border)] text-[var(--p-muted)] hover:border-primary/50'}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONES[c.icone] ?? ICONES.maison} />
              </svg>
              {c.libelle}
            </button>
          )
        })}
      </div>
      {sousTypes.length > 1 && (
        <div role="radiogroup" aria-label="Type de bien" className="flex flex-wrap gap-2">
          {sousTypes.map(s => {
            const actif = s.cle === valeur
            return (
              <button key={s.cle} type="button" role="radio" aria-checked={actif} onClick={() => onChange(s.cle)}
                className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all ${actif ? 'border-primary bg-primary/10 text-[var(--p-accent-text)]' : 'border-[var(--p-border)] text-[var(--p-muted)] hover:border-primary/50'}`}>
                {s.libelle}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
