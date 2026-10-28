/** Statut de vérification des pièces d'identité (CIP/IFU), exposé par GET /users/me. */
export type StatutVerificationDocuments = 'non_soumis' | 'en_attente' | 'valide' | 'rejete'

export interface EtatVerification {
  ton: 'attente' | 'ok' | 'refus'
  titre: string
  detail?: string
}

/**
 * Message à afficher pour le statut de vérification des documents ; `null` tant que rien n'a été
 * envoyé (l'écran invite déjà à envoyer un document).
 */
export function etatVerification(
  statut: StatutVerificationDocuments | null | undefined,
  motif?: string | null,
): EtatVerification | null {
  switch (statut) {
    case 'en_attente':
      return { ton: 'attente', titre: 'Documents reçus, en cours de vérification', detail: 'Vous serez notifié dès que l’équipe REFUGE les aura examinés.' }
    case 'valide':
      return { ton: 'ok', titre: 'Identité vérifiée' }
    case 'rejete':
      return {
        ton: 'refus',
        titre: 'Documents refusés',
        detail: `${motif?.trim() ? `Motif : ${motif.trim()}. ` : ''}Envoyez un nouveau document lisible.`,
      }
    default:
      return null
  }
}
