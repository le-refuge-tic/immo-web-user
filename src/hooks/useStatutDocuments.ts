import { useState } from 'react'
import type { StatutVerificationDocuments as Statut } from '../utils/verificationDocuments'

/**
 * Statut de vérification des pièces d'identité affiché : celui du serveur, sauf juste après un
 * envoi, où la demande repasse « en attente » côté serveur. Cet affichage local ne dure que tant
 * que le statut reçu n'a pas changé : un rechargement qui apporte « validé » ou « refusé » l'emporte.
 */
export function useStatutDocuments(statutServeur: Statut | null | undefined): [Statut | null | undefined, () => void] {
  const [envoiDepuis, setEnvoiDepuis] = useState<{ statut: Statut | null | undefined } | null>(null)
  const statut = envoiDepuis && envoiDepuis.statut === statutServeur ? 'en_attente' : statutServeur
  return [statut, () => setEnvoiDepuis({ statut: statutServeur })]
}
