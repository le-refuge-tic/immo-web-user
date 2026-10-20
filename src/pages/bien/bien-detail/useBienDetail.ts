import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { biensApi } from '../../../api/biensApi'
import { visitesApi } from '../../../api/visitesApi'
import { shareBien } from '../../../services/shareService'
import { bienTypeLabel } from '../../../utils/bienType'
import { usePageTitle } from '../../../utils/usePageTitle'
import { track } from '../../../lib/analytics'
import { isEchoueeVisite } from './helpers'

/** État, chargement et actions de la fiche d'un bien (déplacé tel quel de BienDetailPage). */
export function useBienDetail() {
  const { id } = useParams<{ id: string }>()
  const { isLoggedIn, user } = useAuth()
  const [bien, setBien] = useState<any>(null)
  const bienTitle = bien ? (bien.localisation?.quartier ? `${bienTypeLabel(bien)} — ${bien.localisation.quartier}` : bienTypeLabel(bien)) : ''
  const bienDescription = bien
    ? `${bienTitle}${bien.localisation?.ville ? `, ${bien.localisation.ville}` : ''} : ${Number(bien.prix).toLocaleString('fr-FR')} FCFA${bien.transaction === 'location' ? ' par mois' : ''}. ${String(bien.description ?? '').slice(0, 110)}`.trim()
    : undefined
  usePageTitle(bienTitle, bienDescription)
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- un seul suivi par annonce affichée (identifiant)
  useEffect(() => { if (bien?.id) track('vue_annonce', { type: bien.type, transaction: bien.transaction }) }, [bien?.id])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  const [visitesPlanifiees, setVisitesPlanifiees] = useState<{ total: number; slots: { date: string; count: number }[] } | null>(null)
  const [visitesConfirmees, setVisitesConfirmees] = useState<{ count: number; visites: { id: number; date: string | null }[] } | null>(null)

  const [visiteActive, setVisiteActive] = useState<any>(null)
  const [visiteCancellee, setVisiteCancellee] = useState<any>(null)
  const [visiteEchouee, setVisiteEchouee] = useState<any>(null)
  const [annulerBusy, setAnnulerBusy] = useState(false)
  const [, setConfirmAnnulerVisite] = useState(false)

  const [isOccupeLocal, setIsOccupeLocal] = useState(false)
  const [togglingStatut, setTogglingStatut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [similaires, setSimilaires] = useState<any[]>([])

  useEffect(() => {
    biensApi.byId(Number(id))
      .then(d => { setBien(d); setIsOccupeLocal(d.statut === 'occupe') })
      .catch(() => setError('Bien introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  // Biens à proximité — même transaction (location/vente), hors le bien
  // courant, triés par proximité réelle : même quartier d'abord, puis même
  // ville. On ne filtre plus par type pour ne pas vider la liste dans les
  // quartiers où peu de biens partagent exactement le même type.
  useEffect(() => {
    if (!bien) return
    biensApi.list({ transaction: bien.transaction })
      .then(d => {
        const list = Array.isArray(d) ? d : d.data || []
        const autres = list.filter((b: any) => b.id !== bien.id)
        const quartier = bien.localisation?.quartier
        const ville = bien.localisation?.ville
        const parPrixCroissant = (a: any, b: any) => Number(a.prix) - Number(b.prix)
        const memeQuartier = (quartier ? autres.filter((b: any) => b.localisation?.quartier === quartier) : []).sort(parPrixCroissant)
        const memeVille = autres
          .filter((b: any) => b.localisation?.ville === ville && !memeQuartier.some((m: any) => m.id === b.id))
          .sort(parPrixCroissant)
        setSimilaires([...memeQuartier, ...memeVille].slice(0, 6))
      })
      .catch(() => {})
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- la liste de biens proches ne dépend que de l'identité du bien affiché, pas de chaque champ
  }, [bien?.id])

  const partager = async () => {
    // Feature detection au tap : share sheet natif si dispo, sinon fenêtre custom
    const shared = await shareBien(bien)
    if (!shared) setShareOpen(true)
  }

  const isOwnBien = !!(isLoggedIn && user && bien && bien.user_id === user.id)

  // Vues + visite active du client (non-propriétaire, connecté)
  useEffect(() => {
    if (!bien || !isLoggedIn || isOwnBien) return
    biensApi.incrementerVue(bien.id).catch(() => {})
    visitesApi.mesVisites()
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || []
        const pourCeBien = list.filter((v: any) => v.bien?.id === bien.id)
        let active: any = null, cancellee: any = null, echouee: any = null
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
      .catch(() => {})
  }, [bien, isLoggedIn, isOwnBien])

  // Visites confirmées — vue owner (avec accès) ou publique (créneaux seuls)
  useEffect(() => {
    if (!bien) return
    if (isOwnBien) {
      visitesApi.visitesConfirmeesParBien(bien.id).then(setVisitesConfirmees).catch(() => {})
    } else {
      biensApi.visitesPlanifiees(bien.id).then(setVisitesPlanifiees).catch(() => {})
    }
  }, [bien, isOwnBien])

  const toggleDisponibilite = async () => {
    if (!bien || togglingStatut) return
    setTogglingStatut(true)
    const newStatut = isOccupeLocal ? 'actif' : 'occupe'
    try {
      await biensApi.updateStatut(bien.id, newStatut)
      setIsOccupeLocal(!isOccupeLocal)
    } catch {}
    setTogglingStatut(false)
  }

  const annulerVisite = async () => {
    if (!visiteActive) return
    setConfirmAnnulerVisite(false)
    setAnnulerBusy(true)
    try {
      await visitesApi.annuler(visiteActive.id)
      setVisiteCancellee(visiteActive); setVisiteActive(null)
    } catch {}
    setAnnulerBusy(false)
  }

  return {
    bien, setBien, loading, error, bienTitle, isLoggedIn, isOwnBien,
    photoIdx, setPhotoIdx,
    visitesPlanifiees, visitesConfirmees,
    visiteActive, visiteCancellee, visiteEchouee, annulerBusy,
    isOccupeLocal, togglingStatut,
    editing, setEditing, shareOpen, setShareOpen,
    similaires, partager, toggleDisponibilite, annulerVisite,
  }
}
