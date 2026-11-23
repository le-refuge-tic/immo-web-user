import { useCallback } from 'react'
import { useConfirm } from '../shared/dialogues/useConfirm'

/**
 * Lot 14 — la déconnexion passe toujours par une boîte de confirmation (règle du projet :
 * toute action engageante est confirmée). Renvoie `true` si la personne confirme.
 */
export function useConfirmerDeconnexion() {
  const { confirmer } = useConfirm()
  return useCallback(
    () => confirmer({
      titre: 'Se déconnecter ?',
      message: 'Vous devrez vous reconnecter pour retrouver votre compte.',
      confirmer: 'Se déconnecter',
    }),
    [confirmer],
  )
}
