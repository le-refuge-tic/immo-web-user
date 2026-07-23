import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { useAuth } from '../../context/AuthContext'
import QuartierPicker from '../../components/QuartierPicker'
import { trouverQuartierExact } from '../../data/quartiers'

type TarifCustom = { label: string; prix: string }
type DetailCustom = { label: string; valeur: string }

const TYPES_BIEN = [
  { key: 'entree_coucher', label: 'Entrée-Coucher' },
  { key: 'chambre_salon', label: 'Chambre-Salon' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'villa', label: 'Villa' },
  { key: 'maison', label: 'Maison' },
  { key: 'terrain', label: 'Terrain / Parcelle' },
  { key: 'boutique', label: 'Boutique' },
]

const SANITAIRE_OPTS = [
  { value: 'ordinaire', label: 'Ordinaire' },
  { value: 'interieur', label: 'Sanitaire' },
  { value: 'semi_sanitaire', label: 'Semi-Sanitaire' },
  { value: 'autre', label: 'Autre à préciser' },
]

const FINITION_OPTS = [
  { value: 'staffe', label: 'Staffé', sub: '' },
  { value: 'haut_standing', label: 'Haut Standing', sub: 'Baies vitrées, douche moderne, climatisation.' },
]

const CUISINE_OPTS = [
  { value: 'separee_douche', label: 'Cuisine séparée de la douche' },
  { value: 'americaine', label: 'Cuisine américaine' },
  { value: 'autre', label: 'Autres (à préciser)' },
]

const COUR_OPTS = [
  { value: 'commune', label: 'Cour commune' },
  { value: 'entree_personnelle', label: 'Entrée personnelle' },
]

const COUR_DESC: Record<string, string> = {
  commune: 'La cour est partagée entre plusieurs occupants du bâtiment.',
  entree_personnelle: "Une entrée qui vous est propre, séparée des autres occupants, pour plus d'intimité.",
}

const DOCUMENT_TERRAIN_OPTS = [
  { value: 'permis_construire', label: 'Permis de construire' },
  { value: 'titre_foncier', label: 'Titre foncier' },
  { value: 'attestation_recasement', label: 'Attestation de recasement' },
  { value: 'convention_vente', label: 'Convention de vente' },
  { value: 'autre', label: 'Autre' },
]

const EQUIPEMENTS_RESIDENTIEL = [
  { value: 'garage_auto', label: 'Garage auto' },
  { value: 'garage_moto', label: 'Garage moto fermé' },
  { value: 'gardien', label: 'Gardien / Sécurité' },
  { value: 'balcon', label: 'Balcon' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'chauffe_eau', label: 'Chauffe-eau' },
  { value: 'baie_vitree', label: 'Baies vitrées' },
]

const EQUIPEMENTS_BOUTIQUE = [
  { value: 'toilette_interne', label: 'Toilette interne' },
  { value: 'arriere_boutique', label: 'Arrière-boutique / Stock' },
  { value: 'sol_carele', label: 'Sol carrelé' },
  { value: 'plafond_staffe', label: 'Plafond staffé' },
  { value: 'climatisation', label: 'Climatisation' },
]

const ALENTOURS_OPTS = [
  { value: 'marche', label: 'Marché' },
  { value: 'eglise', label: 'Église / Cathédrale' },
  { value: 'mosquee', label: 'Mosquée' },
  { value: 'ecole', label: 'École primaire' },
  { value: 'lycee', label: 'Collège / Lycée' },
  { value: 'universite', label: 'Université / Campus' },
  { value: 'hopital', label: 'Hôpital / Clinique' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'banque', label: 'Banque / DAB' },
  { value: 'station', label: 'Station-service' },
  { value: 'bar_maquis', label: 'Bar / Maquis' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'taxi_zem', label: 'Gare taxi / Zem' },
  { value: 'supermarche', label: 'Supermarché / Épicerie' },
  { value: 'plage', label: 'Plage / Bord de mer' },
]

const parsePrix = (t: string): number | undefined => {
  const c = t.trim().replace(/\s/g, '').replace(',', '')
  if (!c) return undefined
  const n = Number(c)
  return Number.isFinite(n) ? n : undefined
}

const formatFcfa = (v: number) => v > 0 ? `${Math.round(v).toLocaleString('fr-FR')} FCFA` : '0 FCFA'

// ─── Petits composants réutilisables ───────────────────────────────────────
function Section({ title, required }: { title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <p className="text-sm font-bold text-text-dark">{title}</p>
      {required && <span className="text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">Obligatoire</span>}
    </div>
  )
}

function ChoiceList({ options, value, onChange, disabledValues }: { options: { value: string; label: string; sub?: string }[]; value: string | null; onChange: (v: string) => void; disabledValues?: string[] }) {
  return (
    <div className="space-y-2">
      {options.map(o => {
        const isDisabled = disabledValues?.includes(o.value) ?? false
        return (
          <button key={o.value} type="button" disabled={isDisabled} onClick={() => onChange(o.value)}
            className={`w-full flex items-start justify-between gap-2 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              isDisabled ? 'border-divider bg-surface-g opacity-40 cursor-not-allowed' : value === o.value ? 'border-primary bg-primary-l' : 'border-divider bg-white'
            }`}>
            <span>
              <span className={`block text-sm font-semibold ${isDisabled ? 'text-text-grey' : value === o.value ? 'text-primary' : 'text-text-dark'}`}>{o.label}</span>
              {o.sub && <span className="block text-xs text-text-grey mt-0.5">{o.sub}</span>}
            </span>
            {value === o.value && !isDisabled && <span className="text-primary font-bold shrink-0">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
        active ? 'border-primary bg-primary-l text-primary' : 'border-divider bg-white text-text-grey'
      }`}>
      {label}
    </button>
  )
}

function Counter({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold text-text-dark">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="w-8 h-8 rounded-lg bg-surface-g disabled:opacity-40 flex items-center justify-center font-bold text-text-dark">−</button>
        <span className="w-6 text-center font-bold text-text-dark">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-primary-l text-primary flex items-center justify-center font-bold">+</button>
      </div>
    </div>
  )
}

function NumberPicker({ presets, unit, value, isCustom, onPick, onCustomStart, customText, onCustomText }: {
  presets: number[]; unit: (n: number) => string; value: number; isCustom: boolean
  onPick: (n: number) => void; onCustomStart: () => void; customText: string; onCustomText: (t: string) => void
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map(n => (
          <Chip key={n} label={unit(n)} active={!isCustom && value === n} onClick={() => onPick(n)} />
        ))}
        <Chip label="Saisir" active={isCustom} onClick={onCustomStart} />
      </div>
      {isCustom && (
        <input type="number" value={customText} onChange={e => onCustomText(e.target.value)} placeholder="Nombre"
          className="mt-2.5 w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
      )}
    </div>
  )
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '0'}
        className="w-full bg-white border border-divider rounded-xl pl-4 pr-16 py-3 text-sm outline-none focus:border-primary" />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-grey">FCFA</span>
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────
export default function NouveauBienPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemarcheur = (user?.roles_actifs ?? (user?.role_principal ? [user.role_principal] : [])).includes('demarcheur')

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [created, setCreated] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // ── Étape 0 : Type & Prix ─────────────────────────────────────────────────
  const [typeBien, setTypeBien] = useState('chambre_salon')
  const [typeTransaction, setTypeTransaction] = useState<'location' | 'vente'>('location')
  const [prix, setPrix] = useState('')
  const [estMeuble, setEstMeuble] = useState(false)
  const [sanitaire, setSanitaire] = useState<string | null>(null)
  const [sanitaireAutre, setSanitaireAutre] = useState('')
  const [finition, setFinition] = useState<string | null>(null)
  const finitionDisabled = sanitaire === 'ordinaire' ? ['haut_standing'] : []
  const onSelectSanitaire = (v: string) => {
    setSanitaire(v)
    if (v === 'ordinaire' && finition === 'haut_standing') setFinition('staffe')
  }
  const [prixLongSejour, setPrixLongSejour] = useState('')
  const [prixSejourRestreint, setPrixSejourRestreint] = useState('')
  const [prixHeure, setPrixHeure] = useState('')
  const [tarifsAutres, setTarifsAutres] = useState<TarifCustom[]>([])

  // ── Étape 1 : Localisation ────────────────────────────────────────────────
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [arrondissement, setArrondissement] = useState('')
  const [indicationAdresse, setIndicationAdresse] = useState('')

  // ── Étape 2 : Confort / Terrain / Boutique ────────────────────────────────
  const [chambres, setChambres] = useState(1)
  const [salons, setSalons] = useState(1)
  const [cuisines, setCuisines] = useState(1)
  const [douches, setDouches] = useState(1)
  const [typeCuisine, setTypeCuisine] = useState('separee_douche')
  const [cuisineAutre, setCuisineAutre] = useState('')
  const [chambreACouloir, setChambreACouloir] = useState(false)
  const [typeCour, setTypeCour] = useState('commune')
  const [nbVoisins, setNbVoisins] = useState(0)
  const [accesVehicule, setAccesVehicule] = useState<boolean | null>(null)
  const [nbVehicules, setNbVehicules] = useState(1)
  const [avanceMois, setAvanceMois] = useState(0)
  const [avanceAutre, setAvanceAutre] = useState(false)
  const [avanceAutreText, setAvanceAutreText] = useState('')
  const [echeanceMois, setEcheanceMois] = useState(5)
  const [echeanceAutre, setEcheanceAutre] = useState(false)
  const [echeanceAutreText, setEcheanceAutreText] = useState('')
  const [loyerPrepayeMois, setLoyerPrepayeMois] = useState(0)
  const [loyerPrepayeAutre, setLoyerPrepayeAutre] = useState(false)
  const [loyerPrepayeAutreText, setLoyerPrepayeAutreText] = useState('')
  const [cautionEau, setCautionEau] = useState('')
  const [cautionElec, setCautionElec] = useState('')
  const [electricite, setElectricite] = useState('non')
  const [prixKwh, setPrixKwh] = useState('')
  const [eau, setEau] = useState('non')
  const [sonebGestion, setSonebGestion] = useState<string | null>(null)
  const [prixM3, setPrixM3] = useState('')
  const [prixForage, setPrixForage] = useState('')
  const [equipementsBonus, setEquipementsBonus] = useState<string[]>([])
  const [alentours, setAlentours] = useState<string[]>([])
  const [disponibilite, setDisponibilite] = useState<'immediate' | 'en_finition'>('immediate')
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Terrain
  const [titreTerrain, setTitreTerrain] = useState('')
  const [superficieTerrain, setSuperficieTerrain] = useState('')
  const [documentTerrain, setDocumentTerrain] = useState<string | null>(null)
  const [positionTerrain, setPositionTerrain] = useState('bord_goudron')
  const [angleRue, setAngleRue] = useState(false)
  const [permissionConstruire, setPermissionConstruire] = useState(false)
  const [descriptionConstruction, setDescriptionConstruction] = useState('')
  const [estLoti, setEstLoti] = useState<boolean | null>(null)
  const [titreFoncier, setTitreFoncier] = useState<boolean | null>(null)
  const [detailsSupplementaires, setDetailsSupplementaires] = useState<DetailCustom[]>([])

  // Boutique
  const [typeVoie, setTypeVoie] = useState('goudron')
  const [visibiliteBoutique, setVisibiliteBoutique] = useState('directe')
  const [parkingClients, setParkingClients] = useState('aucun')

  // ── Étape 3 : Honoraires ──────────────────────────────────────────────────
  const [fraisVisite, setFraisVisite] = useState('')
  const [description, setDescription] = useState('')
  const [commissionMontant, setCommissionMontant] = useState('')
  const [autresFrais, setAutresFrais] = useState<TarifCustom[]>([])

  // ── Getters dérivés ────────────────────────────────────────────────────────
  const isTerrain = typeBien === 'terrain'
  const isBoutique = typeBien === 'boutique'
  const isSmallUnit = typeBien === 'entree_coucher' || typeBien === 'chambre_salon'
  const peutEtreMeuble = typeBien === 'appartement' || typeBien === 'villa' || typeBien === 'maison'
  const isMeuble = peutEtreMeuble && estMeuble
  const showPieces = ['appartement', 'villa', 'maison', 'chambre_salon'].includes(typeBien)
  const hasAtLeastOneTarif = !!(parsePrix(prixLongSejour) || parsePrix(prixSejourRestreint) || parsePrix(prixHeure) || tarifsAutres.some(t => parsePrix(t.prix)))

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

  // ── Validation par étape ──────────────────────────────────────────────────
  const goNext = () => {
    if (step === 0) {
      if (!isMeuble && !parsePrix(prix)) { setError('Veuillez entrer le prix'); return }
      if (isMeuble && !hasAtLeastOneTarif) { setError('Renseignez au moins un tarif'); return }
    }
    if (step === 1 && !quartier.trim()) { setError('Veuillez sélectionner un quartier'); return }
    if (step === 2 && isTerrain && !parsePrix(superficieTerrain)) { setError('Veuillez indiquer la superficie du terrain'); return }
    setError('')
    if (step === 4) { handleCreate(); return }
    setStep(s => s + 1)
  }

  const buildTarifsMeuble = () => {
    const t: any = {}
    if (parsePrix(prixLongSejour) !== undefined) t.prix_long_sejour = parsePrix(prixLongSejour)
    if (parsePrix(prixSejourRestreint) !== undefined) t.prix_sejour_restreint = parsePrix(prixSejourRestreint)
    if (parsePrix(prixHeure) !== undefined) t.prix_heure = parsePrix(prixHeure)
    const autres = tarifsAutres.filter(x => parsePrix(x.prix) !== undefined)
    if (autres.length) t.autres = autres.map(x => ({ label: x.label.trim() || 'Autre', prix: parsePrix(x.prix) }))
    return t
  }

  const buildAmenites = () => {
    const a: any = { sous_type: sousType }

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

    if (sanitaire === 'interieur') a.sanitaire = true
    if (sanitaire === 'ordinaire') { a.sanitaire = false; a.sanitaire_autre = 'Ordinaire' }
    if (sanitaire === 'semi_sanitaire') { a.sanitaire = true; a.sanitaire_autre = 'Semi-Sanitaire' }
    if (sanitaire === 'autre' && sanitaireAutre.trim()) a.sanitaire_autre = sanitaireAutre.trim()
    if (finition) a.finition = finition
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
      if (eau === 'soneb' && sonebGestion) a.soneb_gestion = sonebGestion
      if (eau === 'soneb' && sonebGestion === 'prix_m3' && parsePrix(prixM3) !== undefined) a.prix_m3 = parsePrix(prixM3)
      if (eau === 'forage' && parsePrix(prixForage) !== undefined) a.prix_forage = parsePrix(prixForage)
      if (isMeuble) a.tarifs_meuble = buildTarifsMeuble()
    }

    const validAutres = autresFrais.filter(f => parsePrix(f.prix) !== undefined)
    if (validAutres.length) {
      a.autres_frais = validAutres.map(f => ({ label: f.label.trim() || 'Autre frais', montant: parsePrix(f.prix) }))
    }
    return a
  }

  const buildPieces = () => {
    // surface: 0 = non précisée par le propriétaire — BienDetailPage n'affiche
    // la taille que si surface > 0, donc aucune fausse valeur n'est montrée au client.
    if (isTerrain || isBoutique) return []
    if (typeBien === 'entree_coucher') return [{ nom: 'Chambre', surface: 0 }, { nom: 'Entrée', surface: 0 }]
    if (typeBien === 'chambre_salon') {
      const p: any[] = []
      for (let i = 0; i < chambres; i++) p.push({ nom: 'Chambre', surface: 0 })
      for (let i = 0; i < salons; i++) p.push({ nom: 'Salon', surface: 0 })
      return p
    }
    const p: any[] = []
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
      const descFull = isTerrain && titreTerrain.trim()
        ? (notes ? `${titreTerrain.trim()}\n\n${notes}` : titreTerrain.trim())
        : notes

      const body: any = {
        type: typeBackend,
        transaction: typeTransaction,
        prix: prixFinal,
        frais_visite: isDemarcheur ? (parsePrix(fraisVisite) ?? 0) : 0,
        description: descFull || undefined,
        localisation: {
          adresse: indicationAdresse.trim() || [quartier, arrondissement].filter(Boolean).join(', ') || quartier,
          ville: ville || quartier || undefined,
          quartier: quartier || undefined,
          latitude: 6.3654,
          longitude: 2.4183,
        },
        amenites: buildAmenites(),
      }

      if (isTerrain && parsePrix(superficieTerrain) !== undefined) {
        body.details_terrain = { superficie: parsePrix(superficieTerrain), cloture: false }
      } else if (typeBackend === 'appart_vide' || typeBackend === 'appart_meuble') {
        body.details_appart = { entree_personnelle: typeCour === 'entree_personnelle' }
      }

      const pieces = buildPieces()
      if (pieces.length) body.pieces = pieces

      const data = await biensApi.create(body)
      const bien = data.data || data.bien || data
      setCreatedId(bien.id)

      if (photos.length > 0 && bien.id) {
        for (let i = 0; i < photos.length; i++) {
          try {
            await biensApi.uploadPhoto(bien.id, photos[i])
            setUploadProgress(Math.round(((i + 1) / photos.length) * 100))
          } catch (_) {}
        }
      }

      setCreated(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création')
    }
    setSubmitting(false)
  }

  if (created) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-dark mb-2">Bien soumis !</h2>
        <p className="text-text-grey text-sm mb-6">En attente de validation par l'administrateur. Vous serez notifié une fois approuvé.</p>
        <button onClick={() => navigate(createdId ? `/biens/${createdId}` : '/')}
          className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-btn">
          Voir mon annonce
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col md:max-w-2xl md:mx-auto md:mt-6">
      {/* Header */}
      <div className="bg-white px-4 pt-12 md:pt-6 pb-4 border-b border-divider rounded-t-2xl md:rounded-2xl sticky top-0 md:top-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-text-dark">Nouveau bien</h1>
            <p className="text-xs text-text-grey">{STEP_LABELS[step]} ({step + 1}/{STEP_LABELS.length})</p>
          </div>
        </div>
        <div className="h-1.5 bg-surface-g rounded-full">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* ═══ ÉTAPE 0 : TYPE & PRIX ═══ */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Section title="Type de bien" />
              <div className="flex flex-wrap gap-2">
                {TYPES_BIEN.map(t => (
                  <button key={t.key} type="button"
                    onClick={() => setTypeBien(t.key)}
                    className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      typeBien === t.key ? 'border-primary bg-primary text-white' : 'border-divider bg-white text-text-dark'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {isSmallUnit && (
              <>
                <div>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      className="mt-2 w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  )}
                </div>
                <div>
                  <Section title="Finition / Standing" />
                  <ChoiceList options={FINITION_OPTS} value={finition} onChange={setFinition} disabledValues={finitionDisabled} />
                </div>
              </>
            )}

            {peutEtreMeuble && (
              <div>
                <Section title="État du bien" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Vide" active={!estMeuble} onClick={() => setEstMeuble(false)} />
                  <Chip label="Meublé / Guesthouse" active={estMeuble} onClick={() => setEstMeuble(true)} />
                </div>
              </div>
            )}

            <div>
              <Section title="Transaction" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Location" active={typeTransaction === 'location'} onClick={() => setTypeTransaction('location')} />
                <Chip label="Vente" active={typeTransaction === 'vente'} onClick={() => setTypeTransaction('vente')} />
              </div>
            </div>

            {isMeuble ? (
              <div>
                <Section title="Tarification (par durée de séjour)" />
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1 text-xs font-semibold text-text-dark">Court séjour (par nuit)</span>
                    <div className="w-32"><MoneyInput value={prixSejourRestreint} onChange={setPrixSejourRestreint} /></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1 text-xs font-semibold text-text-dark">Long séjour (mensuel)</span>
                    <div className="w-32"><MoneyInput value={prixLongSejour} onChange={setPrixLongSejour} /></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1 text-xs font-semibold text-text-dark">À l'heure</span>
                    <div className="w-32"><MoneyInput value={prixHeure} onChange={setPrixHeure} /></div>
                  </div>
                  {tarifsAutres.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={t.label} onChange={e => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Libellé" className="flex-1 bg-white border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
                      <div className="w-28"><MoneyInput value={t.prix} onChange={v => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} /></div>
                      <button type="button" onClick={() => setTarifsAutres(a => a.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTarifsAutres(a => [...a, { label: '', prix: '' }])}
                    className="text-primary text-xs font-bold">+ Ajouter un tarif</button>
                </div>
              </div>
            ) : (
              <div>
                <Section title={typeTransaction === 'location' ? 'Loyer mensuel (FCFA)' : 'Prix de vente (FCFA)'} />
                <MoneyInput value={prix} onChange={setPrix} />
              </div>
            )}
          </div>
        )}

        {/* ═══ ÉTAPE 1 : LOCALISATION ═══ */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Quartier</label>
              <QuartierPicker
                value={quartier}
                onChange={v => setQuartier(v)}
                onSelect={q => { setVille(q.ville); setArrondissement(q.arrondissement) }}
                onBlur={() => {
                  if (!quartier.trim()) return
                  const trouve = trouverQuartierExact(quartier)
                  if (trouve) { setVille(trouve.ville); setArrondissement(trouve.arrondissement) }
                  else { setVille(''); setArrondissement('') }
                }}
                placeholder="Ex: Cadjèhoun, Godomey…"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Arrondissement</label>
              <input value={arrondissement} readOnly disabled placeholder="Se remplit avec le quartier"
                className="w-full bg-surface-g border border-divider rounded-xl px-4 py-3 text-sm outline-none text-text-grey" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Ville</label>
              <input value={ville} readOnly disabled placeholder="Se remplit avec le quartier"
                className="w-full bg-surface-g border border-divider rounded-xl px-4 py-3 text-sm outline-none text-text-grey" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Indication précise (optionnel)</label>
              <input value={indicationAdresse} onChange={e => setIndicationAdresse(e.target.value)}
                placeholder="Ex: Derrière le CEG, à 200m du goudron..."
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2 : TERRAIN ═══ */}
        {step === 2 && isTerrain && (
          <div className="space-y-5">
            <div>
              <Section title="Nom du bien" required />
              <textarea value={titreTerrain} onChange={e => setTitreTerrain(e.target.value)} rows={2}
                placeholder="Ex: Parcelle bâtie à vendre en angle de rue à Cotonou Saint Jean"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none" />
            </div>
            <div>
              <Section title="Superficie (m²)" required />
              <input type="number" value={superficieTerrain} onChange={e => setSuperficieTerrain(e.target.value)} placeholder="Ex: 612"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <Section title="Document" />
              <ChoiceList options={DOCUMENT_TERRAIN_OPTS} value={documentTerrain} onChange={setDocumentTerrain} />
            </div>
            <div>
              <Section title="Position" />
              <ChoiceList options={[{ value: 'bord_goudron', label: 'Au bord du goudron' }, { value: 'ruelle', label: 'Dans la ruelle' }]}
                value={positionTerrain} onChange={setPositionTerrain} />
              <label className="mt-2.5 flex items-center justify-between px-4 py-3 rounded-xl border-2 border-divider bg-white cursor-pointer">
                <span className="text-sm font-semibold text-text-dark">Parcelle en angle de rue</span>
                <input type="checkbox" checked={angleRue} onChange={e => setAngleRue(e.target.checked)} className="w-5 h-5 accent-primary" />
              </label>
            </div>
            <div>
              <Section title="Permission de construire ?" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Oui" active={permissionConstruire} onClick={() => setPermissionConstruire(true)} />
                <Chip label="Non" active={!permissionConstruire} onClick={() => setPermissionConstruire(false)} />
              </div>
              {permissionConstruire && (
                <textarea value={descriptionConstruction} onChange={e => setDescriptionConstruction(e.target.value)} rows={3}
                  placeholder="Ex: Rez de deux chambres un salon d'une fondation R+5, 05 boutiques"
                  className="mt-2.5 w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none" />
              )}
            </div>
            <div>
              <Section title="Zone lotie ?" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Lotie" active={estLoti === true} onClick={() => setEstLoti(true)} />
                <Chip label="Non lotie" active={estLoti === false} onClick={() => setEstLoti(false)} />
              </div>
            </div>
            <div>
              <Section title="Titre foncier ?" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Oui" active={titreFoncier === true} onClick={() => setTitreFoncier(true)} />
                <Chip label="Non" active={titreFoncier === false} onClick={() => setTitreFoncier(false)} />
              </div>
            </div>
            <div>
              <Section title="Détails supplémentaires" />
              <p className="text-xs text-text-grey mb-2.5">Ajoutez toute information utile non couverte ci-dessus.</p>
              <div className="space-y-2.5">
                {detailsSupplementaires.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl border border-divider bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={d.label} onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Ex: Distance de la route" className="flex-1 text-sm font-semibold text-text-dark outline-none" />
                      <button type="button" onClick={() => setDetailsSupplementaires(arr => arr.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
                    </div>
                    <input value={d.valeur} onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, valeur: e.target.value } : x))}
                      placeholder="Ex: 50 mètres" className="w-full bg-surface-g rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                ))}
                <button type="button" onClick={() => setDetailsSupplementaires(arr => [...arr, { label: '', valeur: '' }])}
                  className="w-full py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-bold">+ Ajouter un détail</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2 : BOUTIQUE ═══ */}
        {step === 2 && isBoutique && (
          <div className="space-y-5">
            <div>
              <Section title="Position sur la voie" />
              <ChoiceList options={[{ value: 'goudron', label: 'Au bord du goudron (Premier choix)' }, { value: 'ruelle', label: 'Dans la ruelle' }]}
                value={typeVoie} onChange={setTypeVoie} />
            </div>
            <div>
              <Section title="Visibilité depuis la rue" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Façade directe" active={visibiliteBoutique === 'directe'} onClick={() => setVisibiliteBoutique('directe')} />
                <Chip label="Dans une galerie" active={visibiliteBoutique === 'galerie'} onClick={() => setVisibiliteBoutique('galerie')} />
              </div>
            </div>
            <div>
              <Section title="Parking clients" />
              <ChoiceList options={[
                { value: 'aucun', label: 'Aucun parking' },
                { value: 'motos', label: 'Trottoir pour motos' },
                { value: 'dedie', label: 'Parking voitures dédié' },
              ]} value={parkingClients} onChange={setParkingClients} />
            </div>
            <button type="button" onClick={() => setShowMoreOptions(v => !v)} className="text-primary text-sm font-bold">
              {showMoreOptions ? 'Moins d\'options' : 'Plus d\'options (facultatif)'}
            </button>
            {showMoreOptions && (
              <>
                <div>
                  <Section title="Commodités internes" />
                  <div className="flex flex-wrap gap-2">
                    {EQUIPEMENTS_BOUTIQUE.map(o => (
                      <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                        onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                    ))}
                  </div>
                </div>
                <div>
                  <Section title="À proximité" />
                  <div className="flex flex-wrap gap-2">
                    {ALENTOURS_OPTS.map(o => (
                      <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                        onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <Section title="Disponibilité" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
                <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2 : RÉSIDENTIEL (Confort) ═══ */}
        {step === 2 && !isTerrain && !isBoutique && (
          <div className="space-y-5">
            {showPieces && (
              <div>
                <Section title="Nombre de pièces" />
                <div className="bg-white rounded-xl border border-divider px-4 divide-y divide-divider">
                  <Counter label="Chambres" value={chambres} onChange={setChambres} min={1} />
                  <Counter label="Salons" value={salons} onChange={setSalons} />
                  {typeBien !== 'chambre_salon' && (
                    <>
                      <Counter label="Cuisines" value={cuisines} onChange={setCuisines} />
                      <Counter label="Douches" value={douches} onChange={setDouches} />
                    </>
                  )}
                </div>
              </div>
            )}

            {!isSmallUnit && (
              <>
                <div>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      className="mt-2 w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  )}
                </div>
                <div>
                  <Section title="Finition / Standing" />
                  <ChoiceList options={FINITION_OPTS} value={finition} onChange={setFinition} disabledValues={finitionDisabled} />
                </div>
              </>
            )}

            <div>
              <Section title="Type de cuisine" />
              <ChoiceList options={CUISINE_OPTS} value={typeCuisine} onChange={setTypeCuisine} />
              {typeCuisine === 'autre' && (
                <input value={cuisineAutre} onChange={e => setCuisineAutre(e.target.value)}
                  placeholder="Précisez le type de cuisine"
                  className="mt-2 w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
              )}
            </div>

            {typeBien === 'chambre_salon' && (
              <div>
                <Section title="Chambre à couloir ?" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Oui" active={chambreACouloir} onClick={() => setChambreACouloir(true)} />
                  <Chip label="Non" active={!chambreACouloir} onClick={() => setChambreACouloir(false)} />
                </div>
              </div>
            )}

            <div>
              <Section title="Type de cour / Accès" />
              <ChoiceList options={COUR_OPTS} value={typeCour} onChange={setTypeCour} />
              {COUR_DESC[typeCour] && <p className="text-xs text-primary italic mt-1.5">{COUR_DESC[typeCour]}</p>}
              {typeCour === 'commune' && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-text-dark mb-2">Nombre de voisins dans la cour</p>
                    <div className="bg-white rounded-xl border border-divider px-4">
                      <Counter label="Voisins" value={nbVoisins} onChange={setNbVoisins} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-dark mb-2">Accès véhicule</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Chip label="Oui" active={accesVehicule === true} onClick={() => setAccesVehicule(true)} />
                      <Chip label="Non" active={accesVehicule === false} onClick={() => setAccesVehicule(false)} />
                    </div>
                  </div>
                  {accesVehicule === true && (
                    <div>
                      <p className="text-xs font-semibold text-text-dark mb-2">Nombre de véhicules</p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map(n => <Chip key={n} label={`${n}`} active={nbVehicules === n} onClick={() => setNbVehicules(n)} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Section title="Avance (mois de loyer)" />
              <NumberPicker presets={[0, 1, 2, 3, 4, 5]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                value={avanceMois} isCustom={avanceAutre}
                onPick={n => { setAvanceMois(n); setAvanceAutre(false) }}
                onCustomStart={() => setAvanceAutre(true)}
                customText={avanceAutreText}
                onCustomText={t => { setAvanceAutreText(t); setAvanceMois(Number(t) || 0) }}
              />
              {(parsePrix(prix) ?? 0) > 0 && avanceMois > 0 && (
                <p className="text-sm font-bold text-primary mt-2">= {formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}</p>
              )}
            </div>

            {typeTransaction === 'location' && (
              <div>
                <Section title="Échéance du mois" />
                <NumberPicker presets={[5, 10, 15, 20, 25, 30]} unit={n => `${n}`}
                  value={echeanceMois} isCustom={echeanceAutre}
                  onPick={n => { setEcheanceMois(n); setEcheanceAutre(false) }}
                  onCustomStart={() => setEcheanceAutre(true)}
                  customText={echeanceAutreText}
                  onCustomText={t => { setEcheanceAutreText(t); setEcheanceMois(Number(t) || 5) }}
                />
              </div>
            )}

            <div>
              <Section title="Loyer prépayé (optionnel)" />
              <NumberPicker presets={[0, 1, 2, 3]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                value={loyerPrepayeMois} isCustom={loyerPrepayeAutre}
                onPick={n => { setLoyerPrepayeMois(n); setLoyerPrepayeAutre(false) }}
                onCustomStart={() => setLoyerPrepayeAutre(true)}
                customText={loyerPrepayeAutreText}
                onCustomText={t => { setLoyerPrepayeAutreText(t); setLoyerPrepayeMois(Number(t) || 0) }}
              />
              {loyerPrepayeMois > 0 && (
                <p className="text-xs text-primary italic mt-2">
                  {loyerPrepayeMois === 1
                    ? 'Le locataire ne paiera pas de loyer pour le 1er mois après intégration.'
                    : `Le locataire ne paiera pas de loyer pour les ${loyerPrepayeMois} premiers mois après intégration.`}
                </p>
              )}
            </div>

            <div>
              <Section title="Électricité" />
              <ChoiceList options={[{ value: 'non', label: 'Non' }, { value: 'sbee', label: 'SBEE' }, { value: 'decompteur', label: 'Décompteur' }]}
                value={electricite} onChange={setElectricite} />
              {electricite === 'decompteur' && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-text-dark mb-1.5">Prix du kWh</p>
                  <MoneyInput value={prixKwh} onChange={setPrixKwh} placeholder="Ex: 150" />
                </div>
              )}
            </div>

            <div>
              <Section title="Eau" />
              <ChoiceList options={[{ value: 'non', label: 'Non' }, { value: 'soneb', label: 'SONEB' }, { value: 'forage', label: 'Forage' }]}
                value={eau} onChange={setEau} />
              {eau === 'soneb' && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-text-dark mb-1.5">Comment c'est géré ?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Chip label="Entre voisins" active={sonebGestion === 'voisins'} onClick={() => setSonebGestion('voisins')} />
                    <Chip label="Prix du m³" active={sonebGestion === 'prix_m3'} onClick={() => setSonebGestion('prix_m3')} />
                  </div>
                  {sonebGestion === 'voisins' && <p className="text-xs text-primary italic mt-1.5">La facture SONEB est partagée entre les voisins.</p>}
                  {sonebGestion === 'prix_m3' && (
                    <div className="mt-2.5">
                      <p className="text-xs font-semibold text-text-dark mb-1.5">Prix du m³</p>
                      <MoneyInput value={prixM3} onChange={setPrixM3} placeholder="Ex: 500" />
                    </div>
                  )}
                </div>
              )}
              {eau === 'forage' && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-text-dark mb-1.5">Prix du forage</p>
                  <MoneyInput value={prixForage} onChange={setPrixForage} placeholder="Ex: 50000" />
                </div>
              )}
            </div>

            {(eau === 'soneb' || electricite !== 'non') && (
              <div>
                <Section title="Caution" />
                <div className="bg-white rounded-xl border border-divider p-4 space-y-3">
                  {eau === 'soneb' && (
                    <div>
                      <p className="text-xs font-semibold text-text-dark mb-1.5">Caution eau (SONEB)</p>
                      <MoneyInput value={cautionEau} onChange={setCautionEau} />
                      <p className="text-[11px] text-text-grey mt-1">Saisir 0 si pas de caution eau</p>
                    </div>
                  )}
                  {electricite !== 'non' && (
                    <div>
                      <p className="text-xs font-semibold text-text-dark mb-1.5">Caution électricité ({electricite === 'sbee' ? 'SBEE' : 'Décompteur'})</p>
                      <MoneyInput value={cautionElec} onChange={setCautionElec} />
                      <p className="text-[11px] text-text-grey mt-1">Saisir 0 si pas de caution électricité</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(!isSmallUnit || finition === 'haut_standing') && (
              <>
                <button type="button" onClick={() => setShowMoreOptions(v => !v)} className="text-primary text-sm font-bold">
                  {showMoreOptions ? 'Moins d\'options' : 'Plus d\'options (facultatif)'}
                </button>
                {showMoreOptions && (
                  <>
                    {!isSmallUnit && (
                      <div>
                        <Section title="Équipements & Atouts" />
                        <div className="flex flex-wrap gap-2">
                          {EQUIPEMENTS_RESIDENTIEL.map(o => (
                            <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                              onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                          ))}
                        </div>
                      </div>
                    )}
                    {finition === 'haut_standing' && (
                      <div>
                        <Section title="À proximité du bien" />
                        <div className="flex flex-wrap gap-2">
                          {ALENTOURS_OPTS.map(o => (
                            <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                              onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div>
              <Section title="Disponibilité" />
              <div className="grid grid-cols-2 gap-2.5">
                <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
                <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3 : HONORAIRES ═══ */}
        {step === 3 && (
          <div className="space-y-5">
            {isDemarcheur && (
              <div>
                <Section title="Frais de visite" />
                <p className="text-xs text-text-grey mb-2.5">Montant payé par chaque client pour visiter ce bien.</p>
                <MoneyInput value={fraisVisite} onChange={setFraisVisite} />
              </div>
            )}

            {isDemarcheur && !isTerrain && (
              <div>
                <Section title="Commission d'agence" />
                <p className="text-xs text-text-grey mb-2.5">Montant direct de votre commission.</p>
                <MoneyInput value={commissionMontant} onChange={setCommissionMontant} />
              </div>
            )}

            <div>
              <Section title="Notes / Précisions (optionnel)" />
              <p className="text-xs text-text-grey mb-2.5">Ces informations s'afficheront dans votre annonce.</p>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                placeholder="Points forts, accès, conditions particulières, règles de la maison..."
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none" />
            </div>

            <div>
              <Section title="Autres frais (optionnel)" />
              <p className="text-xs text-text-grey mb-2.5">Frais supplémentaires inclus dans le total à payer à l'intégration.</p>
              <div className="space-y-2.5">
                {autresFrais.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={f.label} onChange={e => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                      placeholder="Libellé (ex: Frais de dossier)" className="flex-1 bg-white border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    <div className="w-28"><MoneyInput value={f.prix} onChange={v => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} /></div>
                    <button type="button" onClick={() => setAutresFrais(a => a.filter((_, idx) => idx !== i))} className="text-danger">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setAutresFrais(a => [...a, { label: '', prix: '' }])}
                  className="text-primary text-xs font-bold">+ Ajouter un frais</button>
              </div>
            </div>

            {!isTerrain && typeTransaction === 'location' && montantBrut > 0 && (
              <div className="bg-primary-l rounded-xl p-4">
                <p className="text-xs font-semibold text-text-dark mb-1">Montant minimum à verser avant intégration</p>
                <p className="text-xl font-bold text-primary">{formatFcfa(montantBrut)}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ ÉTAPE 4 : PHOTOS ═══ */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-text-dark">Photos du bien</p>
            <p className="text-xs text-text-grey">Maximum 5 photos (PNG, JPEG, WEBP) — les photos augmentent les visites de 3×</p>

            <label className="block border-2 border-dashed border-divider rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <div className="flex justify-center mb-2">
                <svg className="w-10 h-10 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-dark">Choisir des photos</p>
              <p className="text-xs text-text-grey mt-1">JPG, PNG, WEBP (max 5 photos)</p>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
                  setPhotos(p => [...p, ...files].slice(0, 5))
                }} />
            </label>

            {photos.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-text-grey">{photos.length}/5 photo{photos.length > 1 ? 's' : ''} — encore {5 - photos.length} possible{5 - photos.length > 1 ? 's' : ''}</p>
              </>
            )}

            {submitting && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs text-text-grey mb-1">
                  <span>Upload photos…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-surface-g rounded-full">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-divider px-4 py-3 safe-bottom">
        <button onClick={goNext} disabled={submitting}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn disabled:opacity-60">
          {submitting ? 'Publication…' : step < 4 ? 'Continuer →' : 'Publier le bien'}
        </button>
      </div>
    </div>
  )
}
