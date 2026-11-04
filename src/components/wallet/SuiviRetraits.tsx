import { COULEUR_TON, infoStatutRetrait, libelleOperateur } from '../../utils/retrait'
import { withAlpha } from '../../utils/color'
import type { RetraitProprio } from '../../types/proprietaire'

const fcfa = (n: number | string) => `${Number(n).toLocaleString('fr-FR')} FCFA`
const jour = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/**
 * Suivi des demandes de retrait : montant, statut, destination et, en cas d'échec, la phrase
 * rassurante du serveur (montant remboursé). `variant` suit le thème de l'écran (sombre : espace
 * propriétaire ; clair : espace client).
 */
export default function SuiviRetraits({ retraits, variant, titre = 'Mes retraits', max = 5 }: {
  retraits: RetraitProprio[]
  variant: 'sombre' | 'clair'
  titre?: string
  max?: number
}) {
  if (retraits.length === 0) return null
  const sombre = variant === 'sombre'
  const classTitre = sombre ? 'font-bold text-p-text mb-3' : 'font-bold text-text-dark mb-4'
  const classCarte = sombre ? 'card-navy' : 'card-soft'
  const classTexte = sombre ? 'text-p-text' : 'text-text-dark'
  const classMuet = sombre ? 'text-p-muted' : 'text-text-grey'

  return (
    <section className="mb-6" aria-label={titre}>
      <p className={classTitre}>{titre}</p>
      <ul aria-live="polite">
        {retraits.slice(0, max).map(r => {
          const { label, ton } = infoStatutRetrait(r.statut)
          const couleur = COULEUR_TON[ton]
          const operateur = libelleOperateur(r.operateur)
          return (
            <li key={r.id} className={`${classCarte} rounded-xl p-3.5 mb-2`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${classTexte}`}>{fcfa(r.montant)}</p>
                  <p className={`text-[11px] ${classMuet} truncate`}>
                    {r.numero_masque ? `vers ${r.numero_masque}` : ''}{operateur ? ` · ${operateur}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold"
                    style={{ background: withAlpha(couleur, '1F'), color: couleur }}>{label}</span>
                  <p className={`text-[11px] ${classMuet} mt-1`}>{jour(r.created_at)}</p>
                </div>
              </div>
              {ton === 'echec' && r.message && (
                <p className="text-xs mt-2" style={{ color: couleur }}>{r.message}</p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
