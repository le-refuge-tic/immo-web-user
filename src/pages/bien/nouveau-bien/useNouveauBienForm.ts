import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../../utils/usePageTitle'
import { biensApi, type BienPayload } from '../../../api/biensApi'
import { useAuth } from '../../../context/AuthContext'
import { QUARTIERS } from '../../../data/quartiers'

import { track } from '../../../lib/analytics'
import { apiMessage } from '../../../utils/apiMessage'
import { useFormDraft, useDraftState } from '../../../hooks/useFormDraft'
import { useMediaDraft } from '../../../hooks/useMediaDraft'
import { suggestPush } from '../../../lib/push'

import { normalizeStr, parsePrix } from './options'
import type { TarifCustom, DetailCustom } from './options'
export function useNouveauBienForm() {
  usePageTitle('Publier une annonce')
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemarcheur = (user?.roles_actifs ?? (user?.role_principal ? [user.role_principal] : [])).includes('demarcheur')

  // Brouillon par compte : une session expirée ne fait plus perdre la saisie (FE-B-002)
  const draftKey = `rg_draft_nouveau_bien_${user?.id ?? 'anon'}`
  const draft = useFormDraft(draftKey)
  const [isScrolled, setIsScrolled] = useState(false)
  const [step, setStep] = useState(0)
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [created, setCreated] = useState(false)
  // Fichiers dont l'envoi a échoué après la création du bien : gardés pour un nouvel essai depuis
  // l'écran de confirmation (aucun autre écran ne permet d'ajouter des photos à un bien publié).
  const [echecsEnvoi, setEchecsEnvoi] = useState<{ photos: File[]; video: File | null }>({ photos: [], video: null })
  const [renvoiEnCours, setRenvoiEnCours] = useState(false)
  const envoisEchoues = { photos: echecsEnvoi.photos.length, video: !!echecsEnvoi.video }

  /** Envoie les fichiers au bien ; renvoie ceux qui ont encore échoué. */
  const envoyerFichiers = async (bienId: number, aEnvoyer: File[], videoAEnvoyer: File | null, progression?: (fait: number) => void) => {
    const photosRatees: File[] = []
    for (let i = 0; i < aEnvoyer.length; i++) {
      try {
        await biensApi.uploadPhoto(bienId, aEnvoyer[i])
      } catch {
        photosRatees.push(aEnvoyer[i])
      }
      progression?.(i + 1)
    }
    let videoRatee: File | null = null
    if (videoAEnvoyer) {
      try { await biensApi.uploadVideo(bienId, videoAEnvoyer) } catch { videoRatee = videoAEnvoyer }
    }
    return { photos: photosRatees, video: videoRatee }
  }

  const renvoyerEchecs = async () => {
    if (!createdId || renvoiEnCours) return
    setRenvoiEnCours(true)
    setEchecsEnvoi(await envoyerFichiers(createdId, echecsEnvoi.photos, echecsEnvoi.video))
    setRenvoiEnCours(false)
  }
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  // Photos et vidéo du brouillon, gardées à part dans IndexedDB (FE-B-002)
  const medias = useMediaDraft(draftKey, photos, video, setPhotos, setVideo)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [hoveredDropzone, setHoveredDropzone] = useState<string | null>(null)
  const [hoveredQuartierIdx, setHoveredQuartierIdx] = useState<number | null>(null)

  // ── Étape 0 ───────────────────────────────────────────────────────────────
  const [typeBien, setTypeBien] = useDraftState(draft, 'typeBien', 'chambre_salon')
  const [typeTransaction, setTypeTransaction] = useDraftState<'location' | 'vente'>(draft, 'typeTransaction', 'location')
  const [prix, setPrix] = useDraftState(draft, 'prix', '')
  const [estMeuble, setEstMeuble] = useDraftState(draft, 'estMeuble', false)
  const [sanitaire, setSanitaire] = useDraftState<string | null>(draft, 'sanitaire', null)
  const [sanitaireAutre, setSanitaireAutre] = useDraftState(draft, 'sanitaireAutre', '')
  const [finition, setFinition] = useDraftState<string | null>(draft, 'finition', null)
  const [standing, setStanding] = useDraftState<string | null>(draft, 'standing', null)
  const [standingAutre, setStandingAutre] = useDraftState(draft, 'standingAutre', '')
  // Mutual exclusion (Flutter): sanitaire=interieur ↔ finition≠ordinaire
  const onSelectSanitaire = (v: string) => {
    setSanitaire(v)
    if (v === 'interieur' && finition === 'ordinaire') setFinition(null)
  }
  const onSelectFinition = (v: string) => {
    setFinition(v)
    if (v === 'ordinaire' && sanitaire === 'interieur') setSanitaire('cour')
  }
  const [prixLongSejour, setPrixLongSejour] = useDraftState(draft, 'prixLongSejour', '')
  const [prixSejourRestreint, setPrixSejourRestreint] = useDraftState(draft, 'prixSejourRestreint', '')
  const [prixHeure, setPrixHeure] = useDraftState(draft, 'prixHeure', '')
  const [tarifsAutres, setTarifsAutres] = useDraftState<TarifCustom[]>(draft, 'tarifsAutres', [])

  // ── Étape 1 ───────────────────────────────────────────────────────────────
  const [ville, setVille] = useDraftState(draft, 'ville', '')
  const [quartier, setQuartier] = useDraftState(draft, 'quartier', '')
  const [arrondissement, setArrondissement] = useDraftState(draft, 'arrondissement', '')
  const [indicationAdresse, setIndicationAdresse] = useDraftState(draft, 'indicationAdresse', '')
  const [quartierSearch, setQuartierSearch] = useDraftState(draft, 'quartierSearch', '')
  const [quartierInputFocused, setQuartierInputFocused] = useState(false)

  // ── Étape 2 ───────────────────────────────────────────────────────────────
  const [chambres, setChambres] = useDraftState(draft, 'chambres', 1)
  const [salons, setSalons] = useDraftState(draft, 'salons', 1)
  const [cuisines, setCuisines] = useDraftState(draft, 'cuisines', 1)
  const [douches, setDouches] = useDraftState(draft, 'douches', 1)
  const [typeCuisine, setTypeCuisine] = useDraftState(draft, 'typeCuisine', 'separee_douche')
  const [cuisineAutre, setCuisineAutre] = useDraftState(draft, 'cuisineAutre', '')
  const [chambreACouloir, setChambreACouloir] = useDraftState(draft, 'chambreACouloir', false)
  const [typeCour, setTypeCour] = useDraftState(draft, 'typeCour', 'commune')
  const [nbVoisins, setNbVoisins] = useDraftState(draft, 'nbVoisins', 0)
  const [accesVehicule, setAccesVehicule] = useDraftState<boolean | null>(draft, 'accesVehicule', null)
  const [nbVehicules, setNbVehicules] = useDraftState(draft, 'nbVehicules', 1)
  const [avanceMois, setAvanceMois] = useDraftState(draft, 'avanceMois', 0)
  const [avanceAutre, setAvanceAutre] = useDraftState(draft, 'avanceAutre', false)
  const [avanceAutreText, setAvanceAutreText] = useDraftState(draft, 'avanceAutreText', '')
  const [echeanceMois, setEcheanceMois] = useDraftState(draft, 'echeanceMois', 5)
  const [echeanceAutre, setEcheanceAutre] = useDraftState(draft, 'echeanceAutre', false)
  const [echeanceAutreText, setEcheanceAutreText] = useDraftState(draft, 'echeanceAutreText', '')
  const [loyerPrepayeMois, setLoyerPrepayeMois] = useDraftState(draft, 'loyerPrepayeMois', 0)
  const [loyerPrepayeAutre, setLoyerPrepayeAutre] = useDraftState(draft, 'loyerPrepayeAutre', false)
  const [loyerPrepayeAutreText, setLoyerPrepayeAutreText] = useDraftState(draft, 'loyerPrepayeAutreText', '')
  const [cautionEau, setCautionEau] = useDraftState(draft, 'cautionEau', '')
  const [cautionElec, setCautionElec] = useDraftState(draft, 'cautionElec', '')
  const [electricite, setElectricite] = useDraftState(draft, 'electricite', 'non')
  const [prixKwh, setPrixKwh] = useDraftState(draft, 'prixKwh', '')
  const [eau, setEau] = useDraftState(draft, 'eau', 'non')
  const [forageGestion, setForageGestion] = useDraftState<string | null>(draft, 'forageGestion', null)
  const [prixM3, setPrixM3] = useDraftState(draft, 'prixM3', '')
  const [prixForage, setPrixForage] = useDraftState(draft, 'prixForage', '')
  const [equipementsBonus, setEquipementsBonus] = useDraftState<string[]>(draft, 'equipementsBonus', [])
  const [alentours, setAlentours] = useDraftState<string[]>(draft, 'alentours', [])
  const [disponibilite, setDisponibilite] = useDraftState<'immediate' | 'en_finition'>(draft, 'disponibilite', 'immediate')
  const [disponibleA, setDisponibleA] = useDraftState(draft, 'disponibleA', '')
  const [showMoreOptions, setShowMoreOptions] = useDraftState(draft, 'showMoreOptions', false)

  // Terrain
  const [titreTerrain, setTitreTerrain] = useDraftState(draft, 'titreTerrain', '')
  const [titreFoncier, setTitreFoncier] = useDraftState<boolean | null>(draft, 'titreFoncier', null)
  const [superficieTerrain, setSuperficieTerrain] = useDraftState(draft, 'superficieTerrain', '')
  const [superficieUnite, setSuperficieUnite] = useDraftState<'m2' | 'ha'>(draft, 'superficieUnite', 'm2')
  const [documentTerrain, setDocumentTerrain] = useDraftState<string | null>(draft, 'documentTerrain', null)
  const [positionTerrain, setPositionTerrain] = useDraftState(draft, 'positionTerrain', 'bord_goudron')
  const [angleRue, setAngleRue] = useDraftState(draft, 'angleRue', false)
  const [permissionConstruire, setPermissionConstruire] = useDraftState(draft, 'permissionConstruire', false)
  const [descriptionConstruction, setDescriptionConstruction] = useDraftState(draft, 'descriptionConstruction', '')
  const [estLoti, setEstLoti] = useDraftState<'lotie' | 'non_lotie' | 'autre' | null>(draft, 'estLoti', null)
  const [detailsSupplementaires, setDetailsSupplementaires] = useDraftState<DetailCustom[]>(draft, 'detailsSupplementaires', [])

  // Boutique
  const [typeVoie, setTypeVoie] = useDraftState(draft, 'typeVoie', 'goudron')
  const [visibiliteBoutique, setVisibiliteBoutique] = useDraftState(draft, 'visibiliteBoutique', 'directe')
  const [parkingClients, setParkingClients] = useDraftState(draft, 'parkingClients', 'aucun')

  // ── Étape 3 ───────────────────────────────────────────────────────────────
  const [fraisVisite, setFraisVisite] = useDraftState(draft, 'fraisVisite', '')
  const [visiteGratuite, setVisiteGratuite] = useDraftState(draft, 'visiteGratuite', false)
  const [description, setDescription] = useDraftState(draft, 'description', '')
  const [commissionMontant, setCommissionMontant] = useDraftState(draft, 'commissionMontant', '')
  const [autresFrais, setAutresFrais] = useDraftState<TarifCustom[]>(draft, 'autresFrais', [])

  // ── Getters dérivés ────────────────────────────────────────────────────────
  const isTerrain = typeBien === 'terrain'
  const isBoutique = typeBien === 'boutique'
  const isSmallUnit = typeBien === 'entree_coucher' || typeBien === 'chambre_salon'
  const peutEtreMeuble = typeBien === 'appartement' || typeBien === 'villa' || typeBien === 'maison'
  const isMeuble = peutEtreMeuble && estMeuble
  const showPieces = ['appartement', 'villa', 'maison', 'chambre_salon'].includes(typeBien)
  // Nombre de pièces = chambres + salons (cuisines et douches non comptées) ; une entrée-coucher compte 1 pièce
  const nbPieces = showPieces ? chambres + salons : typeBien === 'entree_coucher' ? 1 : 0
  const hasAtLeastOneTarif = !!(parsePrix(prixLongSejour) || parsePrix(prixSejourRestreint) || parsePrix(prixHeure) || tarifsAutres.some(t => parsePrix(t.prix)))

  const superficieM2 = (() => {
    const n = parseFloat(superficieTerrain.replace(',', '.'))
    if (isNaN(n)) return undefined
    return Math.round(superficieUnite === 'ha' ? n * 10000 : n)
  })()

  const typeBackend = isTerrain ? 'terrain'
    : (typeBien === 'villa' || typeBien === 'maison' || isBoutique) ? 'maison'
    : isMeuble ? 'appart_meuble' : 'appart_vide'

  const sousType = typeBien === 'appartement' ? (isMeuble ? 'appart_meuble' : 'appartement')
    : typeBien === 'maison' ? 'maison_individuelle'
    : typeBien

  const montantBrut = (() => {
    const loyer = parsePrix(prix) ?? 0
    const cEau = parsePrix(cautionEau) ?? 0
    const cElec = parsePrix(cautionElec) ?? 0
    const autres = autresFrais.reduce((a, f) => a + (parsePrix(f.prix) ?? 0), 0)
    return loyer * (avanceMois + loyerPrepayeMois) + cEau + cElec + autres
  })()

  const STEP_LABELS = ['Type & Prix', 'Localisation', isTerrain ? 'Terrain' : isBoutique ? 'Boutique' : 'Confort', 'Honoraires', 'Photos']

  // Quartier search
  const filteredQuartiers = quartierSearch.trim()
    ? QUARTIERS.filter(q => normalizeStr(q.nom).includes(normalizeStr(quartierSearch))).slice(0, 60)
    : QUARTIERS.slice(0, 40)
  const selectQuartier = (name: string, arr: string | null, vi: string | null) => {
    setQuartier(name)
    setArrondissement(arr ?? '')
    setVille(vi ?? '')
    setQuartierSearch(name)
    setQuartierInputFocused(false)
  }
  const clearQuartier = () => { setQuartier(''); setArrondissement(''); setVille(''); setQuartierSearch('') }

  // Label helpers (used in récap)
  const labelFinition = (v: string) => ({ ordinaire: 'Ordinaire', semi_staffe: 'Semi-Staffé', staffe_carele: 'Staffé', haut_standing: 'Haut Standing / VIP' } as Record<string,string>)[v] ?? v
  const labelSanitaire = (v: string) => v === 'interieur' ? 'Sanitaire' : v === 'cour' ? 'Douche et WC extérieurs' : (sanitaireAutre.trim() || 'Autre à préciser')
  const labelCuisine = (v: string) => v === 'separee_douche' ? 'Cuisine séparée de la douche' : v === 'americaine' ? 'Cuisine américaine' : (cuisineAutre.trim() || 'Autres')
  const labelCour = (v: string) => v === 'entree_personnelle' ? 'Entrée personnelle' : 'Cour commune'
  const labelElec = (v: string) => { const p = parsePrix(prixKwh); return v === 'sbee' ? 'SBEE' : v === 'decompteur' ? `Décompteur${p !== undefined ? ` (${Math.round(p)} FCFA/kWh)` : ''}` : 'Non' }
  const labelEau = (v: string) => {
    const p = parsePrix(prixForage)
    const pm3 = parsePrix(prixM3)
    if (v === 'soneb') return 'SONEB'
    if (v === 'decompteur_soneb') return `Décompteur SONEB${pm3 !== undefined ? ` (${Math.round(pm3)} FCFA/m³)` : ''}`
    if (v === 'forage') { const suf = forageGestion === 'voisins' ? ' (entre voisins)' : forageGestion === 'mensuel' ? ' (abonnement mensuel)' : ''; return `Forage${suf}${p !== undefined ? ` · ${Math.round(p)} FCFA` : ''}` }
    return 'Non'
  }

  const goNext = () => {
    if (step === 0) {
      if (!isMeuble && !parsePrix(prix)) { setError('Veuillez entrer le prix'); return }
      if (isMeuble && !hasAtLeastOneTarif) { setError('Renseignez au moins un tarif'); return }
    }
    if (step === 1 && !quartier.trim()) {
      // Un nom tapé en toutes lettres (sans cliquer la suggestion) est reconnu s'il figure dans la liste (B-010)
      const typed = quartierSearch.trim()
      const exact = typed ? QUARTIERS.find(q => normalizeStr(q.nom) === normalizeStr(typed)) : undefined
      if (exact) selectQuartier(exact.nom, exact.arrondissement, exact.ville)
      else {
        setError(typed
          ? `« ${typed} » n'est pas dans la liste. Choisissez une suggestion, ou touchez « Utiliser « ${typed} » comme quartier » pour le garder tel quel.`
          : 'Veuillez sélectionner un quartier')
        return
      }
    }
    if (step === 2 && isTerrain && !titreTerrain.trim()) { setError('Veuillez donner un nom à ce bien'); return }
    if (step === 2 && isTerrain && !superficieM2) { setError('Veuillez indiquer la superficie du terrain'); return }
    setError('')
    if (step === 4) { handleCreate(); return }
    setStep(s => s + 1)
  }

  const buildTarifsMeuble = () => {
    const t: Record<string, unknown> = {}
    if (parsePrix(prixLongSejour) !== undefined) t.prix_long_sejour = parsePrix(prixLongSejour)
    if (parsePrix(prixSejourRestreint) !== undefined) t.prix_sejour_restreint = parsePrix(prixSejourRestreint)
    if (parsePrix(prixHeure) !== undefined) t.prix_heure = parsePrix(prixHeure)
    const autres = tarifsAutres.filter(x => parsePrix(x.prix) !== undefined)
    if (autres.length) t.autres = autres.map(x => ({ label: x.label.trim() || 'Autre', prix: parsePrix(x.prix) }))
    return t
  }

  const buildAmenites = () => {
    const a: Record<string, unknown> = { sous_type: sousType }

    if (isTerrain) {
      if (documentTerrain) a.document = documentTerrain
      a.position = positionTerrain
      a.angle_rue = angleRue
      a.permission_construire = permissionConstruire
      if (permissionConstruire && descriptionConstruction.trim()) a.description_construction = descriptionConstruction.trim()
      if (estLoti !== null) a.loti = estLoti
      if (titreFoncier !== null) a.titre_foncier = titreFoncier
      const details = detailsSupplementaires.filter(d => d.label.trim() && d.valeur.trim())
      if (details.length) a.details_supplementaires = details.map(d => ({ label: d.label.trim(), valeur: d.valeur.trim() }))
      return a
    }

    if (standing) {
      a.standing = standing
      if (standing === 'autre' && standingAutre.trim()) a.standing_autre = standingAutre.trim().slice(0, 50)
    }
    a.disponibilite = disponibilite
    if (equipementsBonus.length) a.equipements = equipementsBonus
    if (alentours.length) a.voisinage = alentours

    if (isBoutique) {
      a.type_voie = typeVoie
      a.visibilite = visibiliteBoutique
      a.parking_clients = parkingClients
    } else {
      const cEau = parsePrix(cautionEau) ?? 0
      const cElec = parsePrix(cautionElec) ?? 0
      a.type_cuisine = typeCuisine
      if (typeCuisine === 'autre' && cuisineAutre.trim()) a.cuisine_autre_detail = cuisineAutre.trim()
      a.type_cour = typeCour
      if (typeCour === 'commune') a.nb_voisins = nbVoisins
      if (typeCour === 'commune' && accesVehicule !== null) a.acces_vehicule = accesVehicule
      if (typeCour === 'commune' && accesVehicule === true) a.nb_vehicules = nbVehicules
      if (typeBien === 'chambre_salon') a.chambre_couloir = chambreACouloir
      a.avance_mois = avanceMois
      if (loyerPrepayeMois > 0) a.loyer_prepaye_mois = loyerPrepayeMois
      if (typeTransaction === 'location') {
        a.echeance_mois = echeanceMois
        a.commission_agence = isDemarcheur ? (parsePrix(commissionMontant) ?? 0) : (parsePrix(prix) ?? 0) * 0.5
      }
      if (cEau > 0) a.caution_eau = cEau
      if (cElec > 0) a.caution_elec = cElec
      a.electricite = electricite
      if (electricite === 'decompteur' && parsePrix(prixKwh) !== undefined) a.prix_kwh = parsePrix(prixKwh)
      a.eau = eau
      if (eau === 'decompteur_soneb' && parsePrix(prixM3) !== undefined) a.prix_m3 = parsePrix(prixM3)
      if (eau === 'forage' && parsePrix(prixForage) !== undefined) a.prix_forage = parsePrix(prixForage)
      if (eau === 'forage' && forageGestion) a.forage_gestion = forageGestion
      if (isMeuble) a.tarifs_meuble = buildTarifsMeuble()
    }

    // FE-B-012 : « gratuite » est un choix explicite ; un montant vide ou à 0 reçoit le barème du serveur
    if (isDemarcheur && visiteGratuite) a.visite_gratuite = true

    const validAutres = autresFrais.filter(f => parsePrix(f.prix) !== undefined)
    if (validAutres.length) {
      a.autres_frais = validAutres.map(f => ({ label: f.label.trim() || 'Autre frais', montant: parsePrix(f.prix) }))
    }
    return a
  }

  const buildPieces = () => {
    if (isTerrain || isBoutique) return []
    if (typeBien === 'entree_coucher') return [{ nom: 'Chambre', surface: 0 }, { nom: 'Entrée', surface: 0 }]
    if (typeBien === 'chambre_salon') {
      const p: { nom: string; surface: number }[] = []
      for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre', surface: 0 })
      for (let i = 0; i < salons; i++) p.push({ nom: 'Salon', surface: 0 })
      return p
    }
    const p: { nom: string; surface: number }[] = []
    for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre', surface: 0 })
    for (let i = 0; i < salons; i++) p.push({ nom: 'Salon', surface: 0 })
    for (let i = 0; i < cuisines; i++) p.push({ nom: 'Cuisine', surface: 0 })
    for (let i = 0; i < douches; i++) p.push({ nom: 'Salle de bain', surface: 0 })
    return p
  }

  const handleCreate = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      let prixFinal: number
      if (isMeuble) {
        prixFinal = parsePrix(prixLongSejour) ?? parsePrix(prixSejourRestreint) ?? parsePrix(prixHeure)
          ?? (tarifsAutres.length ? parsePrix(tarifsAutres[0].prix) : undefined) ?? 0
      } else {
        prixFinal = parsePrix(prix) ?? 0
      }

      const notes = description.trim()
      const titre = isTerrain ? titreTerrain.trim() : ''
      const descFull = titre ? (notes ? `${titre}\n\n${notes}` : titre) : notes

      const body: BienPayload = {
        type: typeBackend,
        transaction: typeTransaction,
        prix: prixFinal,
        frais_visite: isDemarcheur && !visiteGratuite ? (parsePrix(fraisVisite) ?? 0) : 0,
        description: descFull || undefined,
        localisation: {
          adresse: indicationAdresse.trim() || [quartier, arrondissement].filter(Boolean).join(', ') || quartier,
          ville: ville || quartier || undefined,
          quartier: quartier || undefined,
          arrondissement: arrondissement || undefined,
          latitude: 6.3654,
          longitude: 2.4183,
        },
        amenites: buildAmenites(),
      }

      if (isTerrain && superficieM2 !== undefined) {
        body.details_terrain = { superficie: superficieM2, cloture: false }
      } else if (typeBackend === 'appart_vide' || typeBackend === 'appart_meuble') {
        body.details_appart = { entree_personnelle: typeCour === 'entree_personnelle' }
      }

      if (!isTerrain && disponibilite === 'en_finition' && disponibleA) body.disponible_a = disponibleA

      const pieces = buildPieces()
      if (pieces.length) body.pieces = pieces

      const data = await biensApi.create(body)
      const bien = data.data || data.bien || data
      setCreatedId(bien.id)
      track('annonce_publiee', { type: String(bien.type ?? '') })

      if (bien.id) {
        setEchecsEnvoi(await envoyerFichiers(bien.id, photos, video,
          fait => setUploadProgress(Math.round((fait / photos.length) * 100))))
      }

      draft.clear()
      // Sans attendre : le bien est créé, un stockage lent ne doit pas retarder la confirmation.
      void medias.clear()
      suggestPush()
      setCreated(true)
    } catch (err: unknown) {
      setError(apiMessage(err) || 'Erreur lors de la création')
    }
    setSubmitting(false)
  }

  // ── Navbar style ──────────────────────────────────────────────────────────
  const navStyle: CSSProperties = {
    background: isScrolled ? 'var(--p-surface-glass)' : 'var(--p-surface)',
    borderColor: 'var(--p-border)',
    borderStyle: 'solid',
    borderBottomWidth: '1px',
    borderTopWidth: isScrolled ? '1px' : '0px',
    borderLeftWidth: isScrolled ? '1px' : '0px',
    borderRightWidth: isScrolled ? '1px' : '0px',
    borderRadius: isScrolled ? '1rem' : '0px',
    marginTop: isScrolled ? '8px' : '0px',
    maxWidth: isScrolled ? '72rem' : '100%',
    paddingLeft: isScrolled ? '1rem' : '0.75rem',
    paddingRight: isScrolled ? '1rem' : '0.75rem',
    boxShadow: isScrolled ? '0 8px 32px rgba(0,0,0,0.18)' : '0 1px 0 rgba(75,107,255,0.08)',
  }

  return {
    isScrolled,
    setIsScrolled,
    step,
    setStep,
    draftBannerDismissed,
    setDraftBannerDismissed,
    submitting,
    setSubmitting,
    error,
    setError,
    createdId,
    setCreatedId,
    created,
    envoisEchoues,
    renvoyerEchecs,
    renvoiEnCours,
    setCreated,
    photos,
    setPhotos,
    video,
    setVideo,
    uploadProgress,
    setUploadProgress,
    hoveredDropzone,
    setHoveredDropzone,
    hoveredQuartierIdx,
    setHoveredQuartierIdx,
    typeBien,
    setTypeBien,
    typeTransaction,
    setTypeTransaction,
    prix,
    setPrix,
    estMeuble,
    setEstMeuble,
    sanitaire,
    setSanitaire,
    sanitaireAutre,
    setSanitaireAutre,
    finition,
    setFinition,
    standing,
    setStanding,
    standingAutre,
    setStandingAutre,
    prixLongSejour,
    setPrixLongSejour,
    prixSejourRestreint,
    setPrixSejourRestreint,
    prixHeure,
    setPrixHeure,
    tarifsAutres,
    setTarifsAutres,
    ville,
    setVille,
    quartier,
    setQuartier,
    arrondissement,
    setArrondissement,
    indicationAdresse,
    setIndicationAdresse,
    quartierSearch,
    setQuartierSearch,
    quartierInputFocused,
    setQuartierInputFocused,
    chambres,
    setChambres,
    salons,
    setSalons,
    cuisines,
    setCuisines,
    douches,
    setDouches,
    typeCuisine,
    setTypeCuisine,
    cuisineAutre,
    setCuisineAutre,
    chambreACouloir,
    setChambreACouloir,
    typeCour,
    setTypeCour,
    nbVoisins,
    setNbVoisins,
    accesVehicule,
    setAccesVehicule,
    nbVehicules,
    setNbVehicules,
    avanceMois,
    setAvanceMois,
    avanceAutre,
    setAvanceAutre,
    avanceAutreText,
    setAvanceAutreText,
    echeanceMois,
    setEcheanceMois,
    echeanceAutre,
    setEcheanceAutre,
    echeanceAutreText,
    setEcheanceAutreText,
    loyerPrepayeMois,
    setLoyerPrepayeMois,
    loyerPrepayeAutre,
    setLoyerPrepayeAutre,
    loyerPrepayeAutreText,
    setLoyerPrepayeAutreText,
    cautionEau,
    setCautionEau,
    cautionElec,
    setCautionElec,
    electricite,
    setElectricite,
    prixKwh,
    setPrixKwh,
    eau,
    setEau,
    forageGestion,
    setForageGestion,
    prixM3,
    setPrixM3,
    prixForage,
    setPrixForage,
    equipementsBonus,
    setEquipementsBonus,
    alentours,
    setAlentours,
    disponibilite,
    setDisponibilite,
    disponibleA,
    setDisponibleA,
    showMoreOptions,
    setShowMoreOptions,
    titreTerrain,
    setTitreTerrain,
    titreFoncier,
    setTitreFoncier,
    superficieTerrain,
    setSuperficieTerrain,
    superficieUnite,
    setSuperficieUnite,
    documentTerrain,
    setDocumentTerrain,
    positionTerrain,
    setPositionTerrain,
    angleRue,
    setAngleRue,
    permissionConstruire,
    setPermissionConstruire,
    descriptionConstruction,
    setDescriptionConstruction,
    estLoti,
    setEstLoti,
    detailsSupplementaires,
    setDetailsSupplementaires,
    typeVoie,
    setTypeVoie,
    visibiliteBoutique,
    setVisibiliteBoutique,
    parkingClients,
    setParkingClients,
    fraisVisite,
    setFraisVisite,
    visiteGratuite,
    setVisiteGratuite,
    description,
    setDescription,
    commissionMontant,
    setCommissionMontant,
    autresFrais,
    setAutresFrais,
    navigate,
    isDemarcheur,
    draft,
    medias,
    onSelectSanitaire,
    onSelectFinition,
    isTerrain,
    isBoutique,
    isSmallUnit,
    peutEtreMeuble,
    isMeuble,
    showPieces,
    nbPieces,
    hasAtLeastOneTarif,
    superficieM2,
    typeBackend,
    sousType,
    montantBrut,
    STEP_LABELS,
    filteredQuartiers,
    selectQuartier,
    clearQuartier,
    labelFinition,
    labelSanitaire,
    labelCuisine,
    labelCour,
    labelElec,
    labelEau,
    goNext,
    buildTarifsMeuble,
    buildAmenites,
    buildPieces,
    handleCreate,
    navStyle,
  }
}

export type NouveauBienForm = ReturnType<typeof useNouveauBienForm>
