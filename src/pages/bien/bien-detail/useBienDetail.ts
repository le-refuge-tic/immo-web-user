import { useState, useEffect, useCallback, useMemo, type SetStateAction } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../context/AuthContext'
import { biensApi } from '../../../api/biensApi'
import { queryKeys } from '../../../api/queryKeys'
import { unwrapList } from '../../../utils/unwrapList'
import { visitesApi } from '../../../api/visitesApi'
import { shareBien } from '../../../services/shareService'
import { bienTypeLabel } from '../../../utils/bienType'
import { usePageTitle } from '../../../utils/usePageTitle'
import { track } from '../../../lib/analytics'
import { apiMessage } from '../../../utils/apiMessage'
import type { Bien, Visite } from '../../../types/api'
import { isEchoueeVisite } from './helpers'

/** État, chargement et actions de la fiche d'un bien (déplacé tel quel de BienDetailPage). */
export function useBienDetail() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn, user } = useAuth()
  const bienId = Number(id)
  const queryClient = useQueryClient()
  // Fiche en cache par identifiant (FE-A-004) : un retour sur la fiche l'affiche aussitôt ;
  // une autre adresse a sa propre entrée, jamais l'ancien bien sous la nouvelle adresse.
  const detail = useQuery({
    queryKey: queryKeys.biens.detail(bienId),
    queryFn: ({ signal }) => biensApi.byId(bienId, signal),
  })
  const bien: Bien | null = detail.data ?? null
  const setBien = useCallback((value: SetStateAction<Bien | null>) => {
    queryClient.setQueryData<Bien>(queryKeys.biens.detail(bienId), prev => {
      const next = typeof value === 'function' ? value(prev ?? null) : value
      return next ?? undefined
    })
  }, [queryClient, bienId])
  const bienTitle = bien ? (bien.localisation?.quartier ? `${bienTypeLabel(bien)} — ${bien.localisation.quartier}` : bienTypeLabel(bien)) : ''
  const bienDescription = bien
    ? `${bienTitle}${bien.localisation?.ville ? `, ${bien.localisation.ville}` : ''} : ${Number(bien.prix).toLocaleString('fr-FR')} FCFA${bien.transaction === 'location' ? ' par mois' : ''}. ${String(bien.description ?? '').slice(0, 110)}`.trim()
    : undefined
  usePageTitle(bienTitle, bienDescription)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- un seul suivi par annonce affichée (identifiant)
  useEffect(() => { if (bien?.id) track('vue_annonce', { type: bien.type, transaction: bien.transaction }) }, [bien?.id])
  const loading = detail.isPending
  const statutErreur = (detail.error as { response?: { status?: number } } | null)?.response?.status
  // 404 (absent), 400 (identifiant invalide) et 403 (non accessible) : le bien n'existe pas pour cette personne.
  const introuvable = statutErreur === 404 || statutErreur === 400 || statutErreur === 403
  const error = detail.isError && introuvable ? 'Bien introuvable' : ''
  // Panne (réseau, 5xx) : distincte d'un bien réellement introuvable (404), avec relance possible.
  const loadError = detail.isError && !introuvable
  const [actionError, setActionError] = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  const [visitesPlanifiees, setVisitesPlanifiees] = useState<{ total: number; slots: { date: string; count: number }[] } | null>(null)
  const [visitesConfirmees, setVisitesConfirmees] = useState<{ count: number; visites: { id: number; date: string | null }[] } | null>(null)

  const [visiteActive, setVisiteActive] = useState<Visite | null>(null)
  const [visiteCancellee, setVisiteCancellee] = useState<Visite | null>(null)
  const [visiteEchouee, setVisiteEchouee] = useState<Visite | null>(null)
  const [annulerBusy, setAnnulerBusy] = useState(false)
  const [, setConfirmAnnulerVisite] = useState(false)

  const isOccupeLocal = bien?.statut === 'occupe'
  const [togglingStatut, setTogglingStatut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const { refetch } = detail
  const charger = useCallback(() => { void refetch() }, [refetch])

  // Biens à proximité — même transaction (location/vente), hors le bien
  // courant, triés par proximité réelle : même quartier d'abord, puis même
  // ville. On ne filtre plus par type pour ne pas vider la liste dans les
  // quartiers où peu de biens partagent exactement le même type.
  // Suggestions facultatives : en cas d'échec, la fiche s'affiche sans elles.
  const transaction = bien?.transaction
  const proches = useQuery({
    queryKey: queryKeys.biens.list({ transaction }),
    queryFn: ({ signal }) => biensApi.list({ transaction }, signal).then(unwrapList),
    enabled: !!bien,
  })
  const quartierBien = bien?.localisation?.quartier
  const villeBien = bien?.localisation?.ville
  const similaires = useMemo<Bien[]>(() => {
    const autres = (proches.data ?? []).filter(b => b.id !== bienId)
    const parPrixCroissant = (a: Bien, b: Bien) => Number(a.prix) - Number(b.prix)
    const memeQuartier = (quartierBien ? autres.filter(b => b.localisation?.quartier === quartierBien) : []).sort(parPrixCroissant)
    const memeVille = autres
      .filter(b => b.localisation?.ville === villeBien && !memeQuartier.some(m => m.id === b.id))
      .sort(parPrixCroissant)
    return [...memeQuartier, ...memeVille].slice(0, 6)
  }, [proches.data, bienId, quartierBien, villeBien])

  const partager = async () => {
    // Feature detection au tap : share sheet natif si dispo, sinon fenêtre custom
    if (!bien) return
    const shared = await shareBien(bien)
    if (!shared) setShareOpen(true)
  }

  const isOwnBien = !!(isLoggedIn && user && bien && bien.user_id === user.id)

  // Liés à l'identifiant du bien affiché, pas à l'objet : un rechargement de fond de la fiche
  // (cache périmé) ne renvoie ni la vue ni les requêtes de visites.
  const bienAffiche = bien?.id

  // Vues + visite active du client (non-propriétaire, connecté)
  useEffect(() => {
    if (!bienAffiche || !isLoggedIn || isOwnBien) return
    // Compteur de vues : statistique de fond, sans effet pour la personne
    biensApi.incrementerVue(bienAffiche).catch(() => {})
    visitesApi.mesVisites()
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || []
        const pourCeBien = list.filter((v: Visite) => v.bien?.id === bienAffiche)
        let active: Visite | null = null, cancellee: Visite | null = null, echouee: Visite | null = null
        for (const v of pourCeBien) {
          if (['en_attente', 'contre_proposee', 'confirmee'].includes(v.statut)) {
            if (isEchoueeVisite(v)) echouee = echouee || v
            else active = v
          } else if (v.statut === 'annulee') {
            cancellee = cancellee || v
          }
        }
        setVisiteActive(active); setVisiteCancellee(cancellee); setVisiteEchouee(echouee)
      })
      .catch(() => { /* état de la visite facultatif : la fiche reste consultable, le bouton de réservation s'affiche */ })
  }, [bienAffiche, isLoggedIn, isOwnBien])

  // Visites confirmées — vue owner (avec accès) ou publique (créneaux seuls)
  useEffect(() => {
    if (!bienAffiche) return
    if (isOwnBien) {
      // Créneaux déjà pris : information complémentaire, la fiche s'affiche sans elle
      visitesApi.visitesConfirmeesParBien(bienAffiche).then(setVisitesConfirmees).catch(() => {})
    } else {
      biensApi.visitesPlanifiees(bienAffiche).then(setVisitesPlanifiees).catch(() => {})
    }
  }, [bienAffiche, isOwnBien])

  const toggleDisponibilite = async () => {
    if (!bien || togglingStatut) return
    setTogglingStatut(true)
    const newStatut = isOccupeLocal ? 'actif' : 'occupe'
    setActionError('')
    try {
      await biensApi.updateStatut(bien.id, newStatut)
      // Affiché tout de suite ; biensApi relit ensuite listes et fiche (FE-A-004).
      setBien(prev => (prev ? { ...prev, statut: newStatut } : prev))
    } catch (e: unknown) {
      // Le bouton redevient actif : on peut simplement recliquer.
      setActionError(apiMessage(e) || 'Le changement de disponibilité a échoué. Réessayez.')
    }
    setTogglingStatut(false)
  }

  const annulerVisite = async () => {
    if (!visiteActive) return
    setConfirmAnnulerVisite(false)
    setAnnulerBusy(true)
    setActionError('')
    try {
      await visitesApi.annuler(visiteActive.id)
      setVisiteCancellee(visiteActive); setVisiteActive(null)
    } catch (e: unknown) {
      setActionError(apiMessage(e) || "L'annulation de la visite a échoué. Réessayez.")
    }
    setAnnulerBusy(false)
  }

  return {
    bien, setBien, loading, error, loadError, actionError, recharger: charger, bienTitle, isLoggedIn, isOwnBien,
    photoIdx, setPhotoIdx,
    visitesPlanifiees, visitesConfirmees,
    visiteActive, visiteCancellee, visiteEchouee, annulerBusy,
    isOccupeLocal, togglingStatut,
    editing, setEditing, shareOpen, setShareOpen,
    similaires, partager, toggleDisponibilite, annulerVisite,
  }
}
