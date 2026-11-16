import { useMemo, type ReactNode } from 'react'
import { useToast } from '../context/useToast'
import { useAuth } from '../context/useAuth'
import { ConfirmProvider } from '../shared/dialogues/confirmation'
import { GestionEnvoisProvider } from '../shared/uploads/GestionEnvois'
import type { Envoyeur } from '../shared/uploads/fileEnvoi'
import { biensApi } from '../api/biensApi'
import { brouillonsApi } from '../api/brouillonsApi'
import { stockageEtatLocal, useSynchroBrouillons } from '../shared/brouillons/useSynchroBrouillons'
import { CLE_ETAT_SYNCHRO, magasinsProprietaire } from '../pages/bien/brouillons/magasinsProprietaire'
import ConfirmDialog from './ConfirmDialog'
import IndicateurEnvois from './IndicateurEnvois'

const envoyerMedia: Envoyeur = async (bienId, el) => {
  const fichier = el.fichier instanceof File ? el.fichier : new File([el.fichier], el.nom, { type: el.fichier.type })
  if (el.genre === 'video') await biensApi.uploadVideo(bienId, fichier)
  else await biensApi.uploadPhoto(bienId, fichier, el.id)
}

const stockageSynchro = stockageEtatLocal(CLE_ETAT_SYNCHRO)

/**
 * Lot 1 — dialogues de confirmation et envois en arrière-plan, communs à toutes les pages.
 * Lot 6 — brouillons de publication synchronisés avec le serveur tant qu'un compte est connecté.
 */
export default function SocleApp({ children }: { children: ReactNode }) {
  const toast = useToast()
  const { user } = useAuth()
  const utilisateurId = user?.id ?? null
  const magasins = useMemo(() => (utilisateurId == null ? [] : magasinsProprietaire(utilisateurId)), [utilisateurId])
  useSynchroBrouillons({ compte: utilisateurId, api: brouillonsApi, magasins, stockage: stockageSynchro })
  return (
    <ConfirmProvider Rendu={ConfirmDialog}>
      <GestionEnvoisProvider envoyer={envoyerMedia} notifier={toast} utilisateurId={utilisateurId}>
        {children}
        <IndicateurEnvois />
      </GestionEnvoisProvider>
    </ConfirmProvider>
  )
}
