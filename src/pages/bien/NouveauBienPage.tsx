import type { ReactNode, CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { useAuth } from '../../context/AuthContext'
import { QUARTIERS } from '../../data/quartiers'
import logoUrl from '../../assets/REFUGE-LOGO.png'

const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const BLUE = '#4B6BFF'

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
  { value: 'interieur', label: 'Sanitaire',        sub: 'Douche intérieure au logement' },
  { value: 'cour',      label: 'Non sanitaire',    sub: 'Douche extérieure / commune' },
  { value: 'autre',     label: 'Autre à préciser', sub: '' },
]

const FINITION_OPTS = [
  { value: 'ordinaire',     label: 'Ordinaire',           sub: '' },
  { value: 'semi_staffe',   label: 'Semi-Staffé',         sub: 'Salon staffé et carrelé ; chambre au plafond propre, sans carrelage.' },
  { value: 'staffe_carele', label: 'Staffé',              sub: 'Staff complet moderne et carreaux récents partout.' },
  { value: 'haut_standing', label: 'Haut Standing / VIP', sub: 'Baies vitrées, douche moderne, climatisation.' },
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

// ─── UI components — dark-themed ──────────────────────────────────────────

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className ?? ''}`}
      style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', padding: '1rem' }}>
      {children}
    </div>
  )
}

function Section({ title, required }: { title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--p-muted)' }}>{title}</p>
      {required && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: BLUE, background: BLUE + '20' }}>Obligatoire</span>
      )}
    </div>
  )
}

function ChoiceList({ options, value, onChange, disabledValues, onDeselect }: {
  options: { value: string; label: string; sub?: string }[]
  value: string | null
  onChange: (v: string) => void
  disabledValues?: string[]
  onDeselect?: () => void
}) {
  return (
    <div className="space-y-2">
      {options.map(o => {
        const isDisabled = disabledValues?.includes(o.value) ?? false
        const isActive = value === o.value
        return (
          <button key={o.value} type="button" disabled={isDisabled}
            onClick={() => (isActive && onDeselect) ? onDeselect() : onChange(o.value)}
            className="w-full flex items-start justify-between gap-2 px-4 py-3 rounded-xl border-2 text-left transition-all"
            style={{
              borderColor: isActive ? BLUE : 'var(--p-border)',
              background: isActive ? BLUE + '18' : 'var(--p-deep)',
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}>
            <span>
              <span className="block text-sm font-semibold"
                style={{ color: isActive ? BLUE : 'var(--p-text)' }}>{o.label}</span>
              {o.sub && <span className="block text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>{o.sub}</span>}
            </span>
            {isActive && !isDisabled && <span className="font-bold shrink-0" style={{ color: BLUE }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-4 py-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all"
      style={{
        borderColor: active ? BLUE : 'var(--p-border)',
        background: active ? BLUE + '18' : 'transparent',
        color: active ? BLUE : 'var(--p-muted)',
      }}>
      {label}
    </button>
  )
}

function Counter({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold border disabled:opacity-40 transition-colors"
          style={{ background: 'var(--p-deep)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}>−</button>
        <span className="w-6 text-center font-bold" style={{ color: 'var(--p-text)' }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors"
          style={{ background: BLUE + '20', color: BLUE }}>+</button>
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
          className="mt-2.5 w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
          style={{ background: 'var(--p-deep)', borderColor: BLUE, color: 'var(--p-text)' }} />
      )}
    </div>
  )
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '0'}
        className="w-full rounded-xl pl-4 pr-16 py-3 text-sm outline-none border transition-colors"
        style={{ background: 'var(--p-deep)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}
        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
        style={{ color: 'var(--p-muted)' }}>FCFA</span>
    </div>
  )
}

const baseInputStyle: CSSProperties = {
  background: 'var(--p-deep)',
  borderColor: 'var(--p-border)',
  color: 'var(--p-text)',
}

// ─── RecapSection helper ────────────────────────────────────────────────────
function RecapSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--p-border)' }}>
      <p className="text-xs font-bold mb-2" style={{ color: BLUE }}>{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
          <span className="font-bold text-xs shrink-0" style={{ color: BLUE }}>•</span>
          <span className="text-sm leading-snug" style={{ color: 'var(--p-text)' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────
export default function NouveauBienPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemarcheur = (user?.roles_actifs ?? (user?.role_principal ? [user.role_principal] : [])).includes('demarcheur')

  const [isScrolled, setIsScrolled] = useState(false)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [created, setCreated] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // ── Étape 0 ───────────────────────────────────────────────────────────────
  const [typeBien, setTypeBien] = useState('chambre_salon')
  const [typeTransaction, setTypeTransaction] = useState<'location' | 'vente'>('location')
  const [prix, setPrix] = useState('')
  const [estMeuble, setEstMeuble] = useState(false)
  const [sanitaire, setSanitaire] = useState<string | null>(null)
  const [sanitaireAutre, setSanitaireAutre] = useState('')
  const [finition, setFinition] = useState<string | null>(null)
  // Mutual exclusion (Flutter): sanitaire=interieur ↔ finition≠ordinaire
  const onSelectSanitaire = (v: string) => {
    setSanitaire(v)
    if (v === 'interieur' && finition === 'ordinaire') setFinition(null)
  }
  const onSelectFinition = (v: string) => {
    setFinition(v)
    if (v === 'ordinaire' && sanitaire === 'interieur') setSanitaire('cour')
  }
  const [prixLongSejour, setPrixLongSejour] = useState('')
  const [prixSejourRestreint, setPrixSejourRestreint] = useState('')
  const [prixHeure, setPrixHeure] = useState('')
  const [tarifsAutres, setTarifsAutres] = useState<TarifCustom[]>([])

  // ── Étape 1 ───────────────────────────────────────────────────────────────
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [arrondissement, setArrondissement] = useState('')
  const [indicationAdresse, setIndicationAdresse] = useState('')
  const [quartierSearch, setQuartierSearch] = useState('')
  const [quartierInputFocused, setQuartierInputFocused] = useState(false)

  // ── Étape 2 ───────────────────────────────────────────────────────────────
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
  const [forageGestion, setForageGestion] = useState<string | null>(null)
  const [prixM3, setPrixM3] = useState('')
  const [prixForage, setPrixForage] = useState('')
  const [equipementsBonus, setEquipementsBonus] = useState<string[]>([])
  const [alentours, setAlentours] = useState<string[]>([])
  const [disponibilite, setDisponibilite] = useState<'immediate' | 'en_finition'>('immediate')
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Terrain
  const [titreTerrain, setTitreTerrain] = useState('')
  const [titreFoncier, setTitreFoncier] = useState<boolean | null>(null)
  const [superficieTerrain, setSuperficieTerrain] = useState('')
  const [superficieUnite, setSuperficieUnite] = useState<'m2' | 'ha'>('m2')
  const [documentTerrain, setDocumentTerrain] = useState<string | null>(null)
  const [positionTerrain, setPositionTerrain] = useState('bord_goudron')
  const [angleRue, setAngleRue] = useState(false)
  const [permissionConstruire, setPermissionConstruire] = useState(false)
  const [descriptionConstruction, setDescriptionConstruction] = useState('')
  const [estLoti, setEstLoti] = useState<'lotie' | 'non_lotie' | 'autre' | null>(null)
  const [detailsSupplementaires, setDetailsSupplementaires] = useState<DetailCustom[]>([])

  // Boutique
  const [typeVoie, setTypeVoie] = useState('goudron')
  const [visibiliteBoutique, setVisibiliteBoutique] = useState('directe')
  const [parkingClients, setParkingClients] = useState('aucun')

  // ── Étape 3 ───────────────────────────────────────────────────────────────
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
  const labelSanitaire = (v: string) => v === 'interieur' ? 'Sanitaire' : v === 'cour' ? 'Non sanitaire' : (sanitaireAutre.trim() || 'Autre à préciser')
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
    if (step === 1 && !quartier.trim()) { setError('Veuillez sélectionner un quartier'); return }
    if (step === 2 && isTerrain && !titreTerrain.trim()) { setError('Veuillez donner un nom à ce bien'); return }
    if (step === 2 && isTerrain && !superficieM2) { setError('Veuillez indiquer la superficie du terrain'); return }
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
    if (sanitaire === 'cour') a.sanitaire = false
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
      if (eau === 'decompteur_soneb' && parsePrix(prixM3) !== undefined) a.prix_m3 = parsePrix(prixM3)
      if (eau === 'forage' && parsePrix(prixForage) !== undefined) a.prix_forage = parsePrix(prixForage)
      if (eau === 'forage' && forageGestion) a.forage_gestion = forageGestion
      if (isMeuble) a.tarifs_meuble = buildTarifsMeuble()
    }

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
      const titre = isTerrain ? titreTerrain.trim() : ''
      const descFull = titre ? (notes ? `${titre}\n\n${notes}` : titre) : notes

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

      if (isTerrain && superficieM2 !== undefined) {
        body.details_terrain = { superficie: superficieM2, cloture: false }
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
      if (video && bien.id) {
        try { await biensApi.uploadVideo(bien.id, video) } catch (_) {}
      }

      setCreated(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création')
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="proprio-root proprio-light h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--p-deep)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: BLUE + '20' }}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ color: BLUE }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--p-text)' }}>Bien soumis !</h2>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--p-muted)' }}>
          En attente de validation par l'administrateur. Vous serez notifié une fois approuvé.
        </p>
        <button onClick={() => navigate(createdId ? `/biens/${createdId}` : '/')}
          className="px-8 py-4 rounded-xl font-bold"
          style={{ background: BLUE, color: 'white', boxShadow: `0 4px 24px ${BLUE}44` }}>
          Voir mon annonce
        </button>
        <button onClick={() => navigate('/proprietaire', { state: { tab: 'biens' } })}
          className="mt-3 px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ color: 'var(--p-muted)' }}>
          Retour à mes biens
        </button>
      </div>
    )
  }

  return (
    <div className="proprio-root proprio-light h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--p-deep)' }}>

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-300${isScrolled ? ' px-2' : ''}`}>
        <nav className="mx-auto pointer-events-auto backdrop-blur-xl transition-all duration-300" style={navStyle}>
          <div className="flex items-center gap-2.5 py-3">
            <img src={logoUrl} alt="REFUGE" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />

            <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {step > 0 ? 'Retour' : 'Annuler'}
            </button>

            <div className="flex-1 text-center min-w-0">
              <p className="text-[13px] font-bold truncate" style={{ color: 'var(--p-text)' }}>Nouveau bien</p>
              <p className="text-[10px] uppercase tracking-[0.12em] truncate" style={{ color: 'var(--p-muted)' }}>
                {STEP_LABELS[step]}
              </p>
            </div>

            <div className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border"
              style={{ borderColor: BLUE + '40', background: BLUE + '15', color: BLUE }}>
              {step + 1}/{STEP_LABELS.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] w-full" style={{ background: 'var(--p-border)' }}>
            <div className="h-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%`, background: BLUE }} />
          </div>
        </nav>
      </header>

      {/* ── Content + Footer ── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="flex-1 overflow-y-auto px-4 py-5 md:max-w-2xl md:mx-auto md:w-full"
          onScroll={e => setIsScrolled(e.currentTarget.scrollTop > 40)}>

          {error && (
            <div className="rounded-xl px-4 py-3 border mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
            </div>
          )}

          {/* ═══ ÉTAPE 0 : TYPE & PRIX ═══ */}
          {step === 0 && (
            <div className="space-y-4">
              <Card>
                <Section title="Type de bien" />
                <div className="flex flex-wrap gap-2">
                  {TYPES_BIEN.map(t => (
                    <button key={t.key} type="button" onClick={() => setTypeBien(t.key)}
                      className="px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all"
                      style={{
                        borderColor: typeBien === t.key ? BLUE : 'var(--p-border)',
                        background: typeBien === t.key ? BLUE : 'transparent',
                        color: typeBien === t.key ? 'white' : 'var(--p-muted)',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </Card>

              {isSmallUnit && (
                <Card>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} onDeselect={() => setSanitaire(null)} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
                      style={baseInputStyle} />
                  )}
                  <div className="mt-5">
                    <Section title="Finition / Standing" />
                    <ChoiceList options={FINITION_OPTS} value={finition} onChange={onSelectFinition} />
                  </div>
                </Card>
              )}

              {peutEtreMeuble && (
                <Card>
                  <Section title="État du bien" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Chip label="Vide" active={!estMeuble} onClick={() => setEstMeuble(false)} />
                    <Chip label="Meublé / Guesthouse" active={estMeuble} onClick={() => setEstMeuble(true)} />
                  </div>
                </Card>
              )}

              <Card>
                <Section title="Transaction" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Location" active={typeTransaction === 'location'} onClick={() => setTypeTransaction('location')} />
                  <Chip label="Vente" active={typeTransaction === 'vente'} onClick={() => setTypeTransaction('vente')} />
                </div>
              </Card>

              {isMeuble ? (
                <Card>
                  <Section title="Tarification (par durée de séjour)" />
                  <div className="space-y-3">
                    {[
                      { label: 'Court séjour (par nuit)', value: prixSejourRestreint, onChange: setPrixSejourRestreint },
                      { label: 'Long séjour (mensuel)', value: prixLongSejour, onChange: setPrixLongSejour },
                      { label: "À l'heure", value: prixHeure, onChange: setPrixHeure },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-2.5">
                        <span className="flex-1 text-xs font-semibold" style={{ color: 'var(--p-text)' }}>{row.label}</span>
                        <div className="w-32"><MoneyInput value={row.value} onChange={row.onChange} /></div>
                      </div>
                    ))}
                    {tarifsAutres.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={t.label}
                          onChange={e => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Libellé"
                          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border"
                          style={baseInputStyle} />
                        <div className="w-28">
                          <MoneyInput value={t.prix} onChange={v => setTarifsAutres(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                        </div>
                        <button type="button" onClick={() => setTarifsAutres(a => a.filter((_, idx) => idx !== i))} style={{ color: '#EF4444' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setTarifsAutres(a => [...a, { label: '', prix: '' }])}
                      className="text-xs font-bold" style={{ color: BLUE }}>+ Ajouter un tarif</button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <Section title={typeTransaction === 'location' ? 'Loyer mensuel (FCFA)' : 'Prix de vente (FCFA)'} />
                  <MoneyInput value={prix} onChange={setPrix} />
                </Card>
              )}
            </div>
          )}

          {/* ═══ ÉTAPE 1 : LOCALISATION ═══ */}
          {step === 1 && (
            <Card>
              <div className="space-y-4">
                {/* Quartier — recherche inline dark-themed */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block" style={{ color: 'var(--p-muted)' }}>
                    Quartier
                  </label>
                  {quartier ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                      style={{ background: 'rgba(72,199,116,0.09)', borderColor: 'rgba(72,199,116,0.45)' }}>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: '#48C774' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="flex-1 text-sm font-semibold" style={{ color: '#48C774' }}>
                        {quartier}{arrondissement ? `, ${arrondissement}` : ''}{ville ? `, ${ville}` : ''}
                      </span>
                      <button type="button" onClick={clearQuartier}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(72,199,116,0.2)', color: '#48C774' }}>✕</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={quartierSearch}
                        onChange={e => setQuartierSearch(e.target.value)}
                        onFocus={() => setQuartierInputFocused(true)}
                        onBlur={() => setQuartierInputFocused(false)}
                        placeholder="Rechercher un quartier…"
                        className="w-full rounded-xl pl-9 pr-4 py-3 text-sm outline-none border transition-colors"
                        style={baseInputStyle}
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--p-muted)' }}>
                        <circle cx={11} cy={11} r={8} /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      {quartierInputFocused && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border overflow-auto z-20"
                          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', maxHeight: 260 }}>
                          {filteredQuartiers.length === 0 ? (
                            quartierSearch.trim() ? (
                              <button type="button"
                                onMouseDown={() => selectQuartier(quartierSearch.trim(), null, null)}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: BLUE }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                </svg>
                                <span style={{ color: BLUE }}>Utiliser « {quartierSearch.trim()} » comme quartier</span>
                              </button>
                            ) : (
                              <p className="px-4 py-3 text-sm" style={{ color: 'var(--p-muted)' }}>Commencez à taper…</p>
                            )
                          ) : filteredQuartiers.map(q => (
                            <button key={q.nom + q.arrondissement} type="button"
                              onMouseDown={() => selectQuartier(q.nom, q.arrondissement, q.ville)}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm border-b transition-colors"
                              style={{ borderColor: 'var(--p-border)', color: 'var(--p-text)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-surface)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--p-muted)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="flex-1">{q.nom}</span>
                              <span className="text-[11px]" style={{ color: 'var(--p-muted)' }}>{q.arrondissement}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2 block" style={{ color: 'var(--p-muted)' }}>
                    Indication précise <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <input value={indicationAdresse} onChange={e => setIndicationAdresse(e.target.value)}
                    placeholder="Ex: Derrière le CEG, à 200m du goudron..."
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none border transition-colors"
                    style={baseInputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
                </div>
              </div>
            </Card>
          )}

          {/* ═══ ÉTAPE 2 : TERRAIN ═══ */}
          {step === 2 && isTerrain && (
            <div className="space-y-4">
              <Card>
                <Section title="Nom du bien" required />
                <textarea value={titreTerrain} onChange={e => setTitreTerrain(e.target.value)} rows={2} maxLength={120}
                  placeholder="Ex: Parcelle bâtie à vendre en angle de rue à Cotonou Saint Jean"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-colors"
                  style={baseInputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
              </Card>

              <Card>
                <Section title="Superficie" required />
                <div className="flex gap-2.5">
                  <input type="number" value={superficieTerrain} onChange={e => setSuperficieTerrain(e.target.value)}
                    placeholder={superficieUnite === 'ha' ? 'Ex: 2.5' : 'Ex: 25000'}
                    className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none border transition-colors"
                    style={baseInputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
                  <div className="flex rounded-xl border p-1 flex-shrink-0"
                    style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
                    {(['m2', 'ha'] as const).map(u => (
                      <button key={u} type="button"
                        onClick={() => {
                          if (u === superficieUnite) return
                          const n = parseFloat(superficieTerrain.replace(',', '.'))
                          if (!isNaN(n)) setSuperficieTerrain(String(u === 'ha' ? n / 10000 : Math.round(n * 10000)))
                          setSuperficieUnite(u)
                        }}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: superficieUnite === u ? BLUE : 'transparent',
                          color: superficieUnite === u ? 'white' : 'var(--p-muted)',
                        }}>
                        {u === 'm2' ? 'm²' : 'ha'}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <Section title="Document" />
                <ChoiceList options={DOCUMENT_TERRAIN_OPTS} value={documentTerrain} onChange={setDocumentTerrain} onDeselect={() => setDocumentTerrain(null)} />
              </Card>

              <Card>
                <Section title="Position" />
                <ChoiceList options={[
                  { value: 'bord_goudron', label: 'Au bord du goudron' },
                  { value: 'ruelle', label: 'Dans la ruelle' },
                  { value: 'autre', label: 'Autre' },
                ]} value={positionTerrain} onChange={setPositionTerrain} />
                <label className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer"
                  style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Parcelle en angle de rue</span>
                  <input type="checkbox" checked={angleRue} onChange={e => setAngleRue(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                </label>
              </Card>

              <Card>
                <Section title="Permission de construire ?" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Oui" active={permissionConstruire} onClick={() => setPermissionConstruire(true)} />
                  <Chip label="Non" active={!permissionConstruire} onClick={() => setPermissionConstruire(false)} />
                </div>
                {permissionConstruire && (
                  <textarea value={descriptionConstruction} onChange={e => setDescriptionConstruction(e.target.value)} rows={3}
                    placeholder="Ex: Rez de deux chambres un salon d'une fondation R+5, 05 boutiques"
                    className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none transition-colors"
                    style={baseInputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
                )}
              </Card>

              <Card>
                <Section title="Zone lotie ?" />
                <div className="grid grid-cols-3 gap-2.5">
                  <Chip label="Lotie" active={estLoti === 'lotie'} onClick={() => setEstLoti('lotie')} />
                  <Chip label="Non lotie" active={estLoti === 'non_lotie'} onClick={() => setEstLoti('non_lotie')} />
                  <Chip label="Autre" active={estLoti === 'autre'} onClick={() => setEstLoti('autre')} />
                </div>
              </Card>

              <Card>
                <Section title="Titre foncier ?" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Oui" active={titreFoncier === true} onClick={() => setTitreFoncier(true)} />
                  <Chip label="Non" active={titreFoncier === false} onClick={() => setTitreFoncier(false)} />
                </div>
              </Card>

              <Card>
                <Section title="Détails supplémentaires" />
                <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Ajoutez toute information utile non couverte ci-dessus.</p>
                <div className="space-y-2.5">
                  {detailsSupplementaires.map((d, i) => (
                    <div key={i} className="p-3 rounded-xl border space-y-2"
                      style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
                      <div className="flex items-center gap-2">
                        <input value={d.label}
                          onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Ex: Distance de la route"
                          className="flex-1 text-sm font-semibold outline-none bg-transparent"
                          style={{ color: 'var(--p-text)' }} />
                        <button type="button" onClick={() => setDetailsSupplementaires(arr => arr.filter((_, idx) => idx !== i))} style={{ color: '#EF4444' }}>✕</button>
                      </div>
                      <input value={d.valeur}
                        onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, valeur: e.target.value } : x))}
                        placeholder="Ex: 50 mètres"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: 'var(--p-card)', color: 'var(--p-text)' }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setDetailsSupplementaires(arr => [...arr, { label: '', valeur: '' }])}
                    className="w-full py-2.5 rounded-xl border text-xs font-bold"
                    style={{ borderColor: BLUE + '40', color: BLUE }}>
                    + Ajouter un détail
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 2 : BOUTIQUE ═══ */}
          {step === 2 && isBoutique && (
            <div className="space-y-4">
              <Card>
                <Section title="Position sur la voie" />
                <ChoiceList options={[
                  { value: 'goudron', label: 'Au bord du goudron (Premier choix)' },
                  { value: 'ruelle', label: 'Dans la ruelle' },
                ]} value={typeVoie} onChange={setTypeVoie} />
              </Card>

              <Card>
                <Section title="Visibilité depuis la rue" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Façade directe" active={visibiliteBoutique === 'directe'} onClick={() => setVisibiliteBoutique('directe')} />
                  <Chip label="Dans une galerie" active={visibiliteBoutique === 'galerie'} onClick={() => setVisibiliteBoutique('galerie')} />
                </div>
              </Card>

              <Card>
                <Section title="Parking clients" />
                <ChoiceList options={[
                  { value: 'aucun', label: 'Aucun parking' },
                  { value: 'motos', label: 'Trottoir pour motos' },
                  { value: 'dedie', label: 'Parking voitures dédié' },
                ]} value={parkingClients} onChange={setParkingClients} />
              </Card>

              <button type="button" onClick={() => setShowMoreOptions(v => !v)}
                className="text-sm font-bold" style={{ color: BLUE }}>
                {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
              </button>

              {showMoreOptions && (
                <>
                  <Card>
                    <Section title="Commodités internes" />
                    <div className="flex flex-wrap gap-2">
                      {EQUIPEMENTS_BOUTIQUE.map(o => (
                        <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                          onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                      ))}
                    </div>
                  </Card>
                  <Card>
                    <Section title="À proximité" />
                    <div className="flex flex-wrap gap-2">
                      {ALENTOURS_OPTS.map(o => (
                        <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                          onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                      ))}
                    </div>
                  </Card>
                </>
              )}

              <Card>
                <Section title="Disponibilité" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
                  <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 2 : RÉSIDENTIEL ═══ */}
          {step === 2 && !isTerrain && !isBoutique && (
            <div className="space-y-4">
              {showPieces && (
                <Card>
                  <Section title="Nombre de pièces" />
                  <div className="divide-y" style={{ borderColor: 'var(--p-border)' }}>
                    <Counter label="Chambres" value={chambres} onChange={setChambres} min={1} />
                    <Counter label="Salons" value={salons} onChange={setSalons} />
                    {typeBien !== 'chambre_salon' && (
                      <>
                        <Counter label="Cuisines" value={cuisines} onChange={setCuisines} />
                        <Counter label="Douches" value={douches} onChange={setDouches} />
                      </>
                    )}
                  </div>
                </Card>
              )}

              {!isSmallUnit && (
                <Card>
                  <Section title="Sanitaires" />
                  <ChoiceList options={SANITAIRE_OPTS} value={sanitaire} onChange={onSelectSanitaire} onDeselect={() => setSanitaire(null)} />
                  {sanitaire === 'autre' && (
                    <input value={sanitaireAutre} onChange={e => setSanitaireAutre(e.target.value)}
                      placeholder="Précisez la configuration des sanitaires"
                      className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                      style={baseInputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
                  )}
                  <div className="mt-5">
                    <Section title="Finition / Standing" />
                    <ChoiceList options={FINITION_OPTS} value={finition} onChange={onSelectFinition} />
                  </div>
                </Card>
              )}

              <Card>
                <Section title="Type de cuisine" />
                <ChoiceList options={CUISINE_OPTS} value={typeCuisine} onChange={setTypeCuisine} />
                {typeCuisine === 'autre' && (
                  <input value={cuisineAutre} onChange={e => setCuisineAutre(e.target.value)}
                    placeholder="Précisez le type de cuisine"
                    className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors"
                    style={baseInputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
                )}
              </Card>

              {typeBien === 'chambre_salon' && (
                <Card>
                  <Section title="Chambre à couloir ?" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Chip label="Oui" active={chambreACouloir} onClick={() => setChambreACouloir(true)} />
                    <Chip label="Non" active={!chambreACouloir} onClick={() => setChambreACouloir(false)} />
                  </div>
                </Card>
              )}

              <Card>
                <Section title="Type de cour / Accès" />
                <ChoiceList options={COUR_OPTS} value={typeCour} onChange={setTypeCour} />
                {COUR_DESC[typeCour] && (
                  <p className="text-xs italic mt-2" style={{ color: BLUE }}>{COUR_DESC[typeCour]}</p>
                )}
                {typeCour === 'commune' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Nombre de voisins dans la cour</p>
                      <Counter label="Voisins" value={nbVoisins} onChange={setNbVoisins} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Accès véhicule</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <Chip label="Oui" active={accesVehicule === true} onClick={() => setAccesVehicule(true)} />
                        <Chip label="Non" active={accesVehicule === false} onClick={() => setAccesVehicule(false)} />
                      </div>
                    </div>
                    {accesVehicule === true && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Nombre de véhicules</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Chip key={n} label={`${n}`} active={nbVehicules === n} onClick={() => setNbVehicules(n)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card>
                <Section title="Avance (mois de loyer)" />
                <NumberPicker presets={[0, 1, 2, 3, 4, 5]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                  value={avanceMois} isCustom={avanceAutre}
                  onPick={n => { setAvanceMois(n); setAvanceAutre(false) }}
                  onCustomStart={() => setAvanceAutre(true)}
                  customText={avanceAutreText}
                  onCustomText={t => { setAvanceAutreText(t); setAvanceMois(Number(t) || 0) }}
                />
                {(parsePrix(prix) ?? 0) > 0 && avanceMois > 0 && (
                  <p className="text-sm font-bold mt-2" style={{ color: BLUE }}>
                    = {formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}
                  </p>
                )}
              </Card>

              {typeTransaction === 'location' && (
                <Card>
                  <Section title="Échéance du mois" />
                  <NumberPicker presets={[5, 10, 15, 20, 25, 30]} unit={n => `${n}`}
                    value={echeanceMois} isCustom={echeanceAutre}
                    onPick={n => { setEcheanceMois(n); setEcheanceAutre(false) }}
                    onCustomStart={() => setEcheanceAutre(true)}
                    customText={echeanceAutreText}
                    onCustomText={t => { setEcheanceAutreText(t); setEcheanceMois(Number(t) || 5) }}
                  />
                </Card>
              )}

              <Card>
                <Section title="Loyer prépayé (optionnel)" />
                <NumberPicker presets={[0, 1, 2, 3]} unit={n => n === 0 ? 'Aucun' : `${n} mois`}
                  value={loyerPrepayeMois} isCustom={loyerPrepayeAutre}
                  onPick={n => { setLoyerPrepayeMois(n); setLoyerPrepayeAutre(false) }}
                  onCustomStart={() => setLoyerPrepayeAutre(true)}
                  customText={loyerPrepayeAutreText}
                  onCustomText={t => { setLoyerPrepayeAutreText(t); setLoyerPrepayeMois(Number(t) || 0) }}
                />
                {loyerPrepayeMois > 0 && (
                  <p className="text-xs italic mt-2" style={{ color: BLUE }}>
                    {loyerPrepayeMois === 1
                      ? 'Le locataire ne paiera pas de loyer pour le 1er mois après intégration.'
                      : `Le locataire ne paiera pas de loyer pour les ${loyerPrepayeMois} premiers mois après intégration.`}
                  </p>
                )}
              </Card>

              <Card>
                <Section title="Électricité" />
                <ChoiceList options={[
                  { value: 'non', label: 'Non' },
                  { value: 'sbee', label: 'SBEE' },
                  { value: 'decompteur', label: 'Décompteur' },
                ]} value={electricite} onChange={setElectricite} />
                {electricite === 'decompteur' && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du kWh</p>
                    <MoneyInput value={prixKwh} onChange={setPrixKwh} placeholder="Ex: 150" />
                  </div>
                )}
              </Card>

              <Card>
                <Section title="Eau" />
                <ChoiceList options={[
                  { value: 'non',             label: 'Non' },
                  { value: 'soneb',           label: 'SONEB' },
                  { value: 'decompteur_soneb', label: 'Décompteur SONEB' },
                  { value: 'forage',          label: 'Forage' },
                ]} value={eau} onChange={setEau} />
                {eau === 'decompteur_soneb' && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du m³</p>
                    <MoneyInput value={prixM3} onChange={setPrixM3} placeholder="Ex: 150" />
                  </div>
                )}
                {eau === 'forage' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Prix du forage</p>
                      <MoneyInput value={prixForage} onChange={setPrixForage} placeholder="Ex: 50000" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--p-muted)' }}>Comment c'est géré ?</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <Chip label="Entre voisins" active={forageGestion === 'voisins'} onClick={() => setForageGestion(g => g === 'voisins' ? null : 'voisins')} />
                        <Chip label="Abonnement mensuel" active={forageGestion === 'mensuel'} onClick={() => setForageGestion(g => g === 'mensuel' ? null : 'mensuel')} />
                      </div>
                      {forageGestion === 'voisins' && <p className="text-xs italic mt-2" style={{ color: BLUE }}>Le coût du forage est partagé entre les voisins.</p>}
                      {forageGestion === 'mensuel' && <p className="text-xs italic mt-2" style={{ color: BLUE }}>Chaque locataire paie un abonnement mensuel fixe.</p>}
                    </div>
                  </div>
                )}
              </Card>

              {(eau === 'soneb' || eau === 'decompteur_soneb' || electricite !== 'non') && (
                <Card>
                  <Section title="Caution" />
                  <div className="space-y-3">
                    {(eau === 'soneb' || eau === 'decompteur_soneb') && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--p-muted)' }}>Caution eau</p>
                        <MoneyInput value={cautionEau} onChange={setCautionEau} />
                        <p className="text-[11px] mt-1" style={{ color: 'var(--p-muted)' }}>Saisir 0 si pas de caution eau</p>
                      </div>
                    )}
                    {electricite !== 'non' && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--p-muted)' }}>
                          Caution électricité ({electricite === 'sbee' ? 'SBEE' : 'Décompteur'})
                        </p>
                        <MoneyInput value={cautionElec} onChange={setCautionElec} />
                        <p className="text-[11px] mt-1" style={{ color: 'var(--p-muted)' }}>Saisir 0 si pas de caution électricité</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {(!isSmallUnit || finition === 'haut_standing') && (
                <>
                  <button type="button" onClick={() => setShowMoreOptions(v => !v)}
                    className="text-sm font-bold" style={{ color: BLUE }}>
                    {showMoreOptions ? "Moins d'options" : "Plus d'options (facultatif)"}
                  </button>
                  {showMoreOptions && (
                    <>
                      {!isSmallUnit && (
                        <Card>
                          <Section title="Équipements & Atouts" />
                          <div className="flex flex-wrap gap-2">
                            {EQUIPEMENTS_RESIDENTIEL.map(o => (
                              <Chip key={o.value} label={o.label} active={equipementsBonus.includes(o.value)}
                                onClick={() => setEquipementsBonus(e => e.includes(o.value) ? e.filter(x => x !== o.value) : [...e, o.value])} />
                            ))}
                          </div>
                        </Card>
                      )}
                      {finition === 'haut_standing' && (
                        <Card>
                          <Section title="À proximité du bien" />
                          <div className="flex flex-wrap gap-2">
                            {ALENTOURS_OPTS.map(o => (
                              <Chip key={o.value} label={o.label} active={alentours.includes(o.value)}
                                onClick={() => setAlentours(a => a.includes(o.value) ? a.filter(x => x !== o.value) : [...a, o.value])} />
                            ))}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}

              <Card>
                <Section title="Disponibilité" />
                <div className="grid grid-cols-2 gap-2.5">
                  <Chip label="Immédiate" active={disponibilite === 'immediate'} onClick={() => setDisponibilite('immediate')} />
                  <Chip label="En finition / Bientôt" active={disponibilite === 'en_finition'} onClick={() => setDisponibilite('en_finition')} />
                </div>
              </Card>
            </div>
          )}

          {/* ═══ ÉTAPE 3 : HONORAIRES ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              {isDemarcheur && (
                <Card>
                  <Section title="Frais de visite" />
                  <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Montant payé par chaque client pour visiter ce bien.</p>
                  <MoneyInput value={fraisVisite} onChange={setFraisVisite} />
                </Card>
              )}

              {isDemarcheur && !isTerrain && (
                <Card>
                  <Section title="Commission d'agence" />
                  <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Montant direct de votre commission.</p>
                  <MoneyInput value={commissionMontant} onChange={setCommissionMontant} />
                </Card>
              )}

              <Card>
                <Section title="Notes / Précisions (optionnel)" />
                <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Ces informations s'afficheront dans votre annonce.</p>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                  placeholder="Points forts, accès, conditions particulières, règles de la maison..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-colors"
                  style={baseInputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
              </Card>

              {!isTerrain && (
                <Card>
                  <Section title="Autres frais (optionnel)" />
                  <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Frais supplémentaires inclus dans le total à payer à l'intégration.</p>
                  <div className="space-y-2.5">
                    {autresFrais.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={f.label}
                          onChange={e => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                          placeholder="Libellé (ex: Frais de dossier)"
                          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border"
                          style={baseInputStyle} />
                        <div className="w-28">
                          <MoneyInput value={f.prix} onChange={v => setAutresFrais(a => a.map((x, idx) => idx === i ? { ...x, prix: v } : x))} />
                        </div>
                        <button type="button" onClick={() => setAutresFrais(a => a.filter((_, idx) => idx !== i))} style={{ color: '#EF4444' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setAutresFrais(a => [...a, { label: '', prix: '' }])}
                      className="text-xs font-bold" style={{ color: BLUE }}>+ Ajouter un frais</button>
                  </div>
                </Card>
              )}

              {!isTerrain && typeTransaction === 'location' && montantBrut > 0 && (
                <div className="rounded-2xl border p-4"
                  style={{ background: BLUE + '0E', borderColor: BLUE + '30' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>
                    Montant minimum à verser avant intégration
                  </p>
                  <p className="text-2xl font-bold" style={{ color: BLUE }}>{formatFcfa(montantBrut)}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ÉTAPE 4 : RÉCAPITULATIF + PHOTOS + VIDÉO ═══ */}
          {step === 4 && (
            <div className="space-y-4">

              {/* ── Récapitulatif ── */}
              <Card>
                <p className="text-sm font-bold mb-4" style={{ color: 'var(--p-text)' }}>Récapitulatif de votre annonce</p>

                <RecapSection title="Type de bien" items={[
                  TYPES_BIEN.find(t => t.key === typeBien)?.label ?? typeBien,
                  ...(finition ? [labelFinition(finition)] : []),
                  ...(sanitaire ? [labelSanitaire(sanitaire)] : []),
                  ...(isMeuble ? ['Meublé / Guesthouse'] : []),
                ]} />

                <RecapSection title="Localisation" items={[
                  ...(quartier ? [`Quartier : ${quartier}`] : []),
                  ...(arrondissement ? [`Arrondissement : ${arrondissement}`] : []),
                  ...(ville ? [`Ville : ${ville}`] : []),
                  ...(indicationAdresse.trim() ? [`Adresse : ${indicationAdresse.trim()}`] : []),
                ]} />

                {!isTerrain && (parsePrix(prix) ?? 0) > 0 && (
                  <RecapSection title="Prix" items={[
                    `${typeTransaction === 'location' ? 'Loyer mensuel' : 'Prix de vente'} : ${formatFcfa(parsePrix(prix) ?? 0)}`
                  ]} />
                )}

                {!isTerrain && !isBoutique && typeTransaction === 'location' && (
                  <>
                    <RecapSection title="Conditions d'entrée" items={[
                      avanceMois > 0
                        ? `Avance : ${avanceMois} mois × ${formatFcfa(parsePrix(prix) ?? 0)} = ${formatFcfa((parsePrix(prix) ?? 0) * avanceMois)}`
                        : 'Avance : Aucune',
                      ...(loyerPrepayeMois > 0 ? [`Loyer prépayé : ${loyerPrepayeMois} mois`] : []),
                      ...((parsePrix(cautionEau) ?? 0) > 0 ? [`Caution eau : ${formatFcfa(parsePrix(cautionEau) ?? 0)}`] : []),
                      ...((parsePrix(cautionElec) ?? 0) > 0 ? [`Caution électricité : ${formatFcfa(parsePrix(cautionElec) ?? 0)}`] : []),
                    ]} />
                    {montantBrut > 0 && (
                      <div className="rounded-xl p-3.5 mb-2" style={{ background: BLUE + '12', border: `1px solid ${BLUE}30` }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--p-muted)' }}>Montant minimum à verser avant intégration</p>
                        <p className="text-xl font-bold" style={{ color: BLUE }}>{formatFcfa(montantBrut)}</p>
                      </div>
                    )}
                  </>
                )}

                {!isTerrain && !isBoutique && (
                  <RecapSection title="Confort" items={[
                    `Cuisine : ${labelCuisine(typeCuisine)}`,
                    `Accès / Cour : ${labelCour(typeCour)}`,
                    `Électricité : ${labelElec(electricite)}`,
                    `Eau : ${labelEau(eau)}`,
                  ]} />
                )}

                {equipementsBonus.length > 0 && (
                  <RecapSection title="Équipements" items={equipementsBonus.map(e =>
                    (EQUIPEMENTS_RESIDENTIEL.find(o => o.value === e) ?? EQUIPEMENTS_BOUTIQUE.find(o => o.value === e))?.label ?? e
                  )} />
                )}
                {alentours.length > 0 && (
                  <RecapSection title="À proximité" items={alentours.map(a => ALENTOURS_OPTS.find(o => o.value === a)?.label ?? a)} />
                )}
                {!isTerrain && (
                  <RecapSection title="Disponibilité" items={[
                    disponibilite === 'immediate' ? 'Disponible immédiatement' : 'En finition — Bientôt disponible'
                  ]} />
                )}
                {autresFrais.filter(f => parsePrix(f.prix) !== undefined).length > 0 && (
                  <RecapSection title="Autres frais" items={autresFrais
                    .filter(f => parsePrix(f.prix) !== undefined)
                    .map(f => `${f.label.trim() || 'Autre frais'} : ${formatFcfa(parsePrix(f.prix)!)}`)} />
                )}
                {description.trim() && (
                  <RecapSection title="Notes" items={[description.trim()]} />
                )}
              </Card>

              {/* ── Photos ── */}
              <Card>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Photos du bien</p>
                <p className="text-xs mb-4" style={{ color: 'var(--p-muted)' }}>
                  Maximum 5 photos (PNG, JPEG, WEBP) — les photos augmentent les visites de 3×
                </p>

                {photos.length < 5 && (
                  <label className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--p-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--p-border)')}>
                    <div className="flex justify-center mb-3">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                        style={{ color: 'var(--p-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Choisir des photos</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--p-muted)' }}>JPG, PNG, WEBP (max 5 photos)</p>
                    <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []).slice(0, 5 - photos.length)
                        setPhotos(p => [...p, ...files].slice(0, 5))
                      }} />
                  </label>
                )}

                {photos.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {photos.map((f, i) => (
                        <div key={i} className="relative aspect-square">
                          <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl" />
                          <button type="button" onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: 'var(--p-muted)' }}>
                      {photos.length}/5 photo{photos.length > 1 ? 's' : ''} — encore {5 - photos.length} possible{5 - photos.length > 1 ? 's' : ''}
                    </p>
                  </>
                )}

                {submitting && uploadProgress > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--p-muted)' }}>
                      <span>Upload photos…</span><span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'var(--p-deep)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: BLUE }} />
                    </div>
                  </div>
                )}
              </Card>

              {/* ── Vidéo ── */}
              <Card>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Vidéo du bien <span className="font-normal text-xs" style={{ color: 'var(--p-muted)' }}>(optionnel)</span></p>
                <p className="text-xs mb-4" style={{ color: 'var(--p-muted)' }}>Maximum 1 vidéo (MP4 uniquement)</p>

                {video ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: BLUE + '20' }}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: BLUE }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>{video.name}</span>
                    <button type="button" onClick={() => setVideo(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ background: '#EF4444' }}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--p-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--p-border)')}>
                    <div className="flex justify-center mb-3">
                      <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                        style={{ color: 'var(--p-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Ajouter une vidéo (MP4)</p>
                    <input type="file" accept="video/mp4" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) setVideo(f)
                      }} />
                  </label>
                )}
              </Card>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* ── Footer CTA ── */}
        <div className="shrink-0 px-4 py-2.5 border-t" style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)' }}>
          <button onClick={goNext} disabled={submitting}
            className="mx-auto block px-10 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: BLUE, color: 'white', boxShadow: `0 2px 16px ${BLUE}38` }}>
            {submitting ? 'Publication…' : step < 4 ? 'Continuer →' : 'Publier le bien'}
          </button>
        </div>
      </div>
    </div>
  )
}
