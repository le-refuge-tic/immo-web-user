import type { Visite } from '../../../types/api'
import { infoCouverture } from './infoCouverture'

export function CouvertureVisite({ visite }: { visite: Visite }) {
  const info = infoCouverture(visite)
  if (!info) return null
  return (
    <p className="text-xs font-semibold rounded-xl px-3 py-2 mb-3" style={{ color: info.couleur, background: info.fond }}>
      {info.texte}
    </p>
  )
}
