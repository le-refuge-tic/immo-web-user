import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { infosLogementRows, infosTerrainRows, type InfoRow } from '../../utils/amenites'
import EditBienModal from './EditBienModal'
import logoSbee from '../../assets/logo-SBEE.png'
import logoSoneb from '../../assets/logo-SONEB.png'

const BACKEND = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '') + '/'

function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BACKEND + url
}

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement vide',
  appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain',
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

function fmtSlot(iso: string) {
  try {
    const dt = new Date(iso)
    return `${WEEKDAYS[(dt.getDay() + 6) % 7]} ${dt.getDate()} ${MONTHS[dt.getMonth()]} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return iso }
}

function fmtVisiteDate(iso: string | null | undefined) {
  if (!iso) return '--'
  try {
    const dt = new Date(iso)
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} à ${String(dt.getHours()).padStart(2, '0')}h${String(dt.getMinutes()).padStart(2, '0')}`
  } catch { return iso }
}

function fcfa(v: number) {
  return `${Math.round(v).toLocaleString('fr-FR').replace(/,/g, ' ')} FCFA`
}

function isEchoueeVisite(v: any): boolean {
  if (v.statut === 'effectuee' || v.statut === 'annulee') return false
  const raw = v.date_contre_proposee || v.date_souhaitee
  if (!raw) return false
  return new Date(raw).getTime() < Date.now()
}

// ─── Icônes — formes simples construites à partir de primitives SVG,
// fidèles aux icônes Material utilisées par l'écran mobile équivalent
// (bed_rounded, chair_rounded, kitchen_rounded, bathtub_rounded, wc_rounded,
// garage_rounded, deck_rounded, work_rounded, door_front_door_rounded…). ────
type IconType =
  | 'bed' | 'sofa' | 'kitchen' | 'bathtub' | 'toilet' | 'garage' | 'deck' | 'briefcase' | 'door' | 'room'
  | 'ruler' | 'fence' | 'parking' | 'yard' | 'person' | 'people'
  | 'countertop' | 'plant' | 'shower' | 'paintroller' | 'car' | 'slidingdoor'
  | 'wallet' | 'calendargrid' | 'waterdrop' | 'bolt' | 'document' | 'tag' | 'clockrepeat'
  | 'gridon' | 'verified' | 'construction' | 'turnright' | 'map' | 'homework'

function Icon({ type, className }: { type: IconType; className?: string }) {
  const cls = className || 'w-4 h-4'
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: cls }
  switch (type) {
    case 'bed':
      return <svg {...common}><rect x="3" y="11" width="18" height="7" rx="1.5" /><path d="M3 18v2M21 18v2" /><rect x="4" y="8" width="6" height="4" rx="1" /></svg>
    case 'sofa':
      return <svg {...common}><path d="M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4" /><rect x="3" y="12" width="18" height="6" rx="1.5" /><path d="M6 18v2M18 18v2" /></svg>
    case 'kitchen':
      return <svg {...common}><rect x="5" y="10" width="14" height="9" rx="1.5" /><path d="M3 11h2M19 11h2" /><path d="M9 10V7a3 3 0 016 0v3" /></svg>
    case 'bathtub':
      return <svg {...common}><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3z" /><path d="M4 12V9a2 2 0 012-2h1" /><path d="M4 19v2M20 19v2" /></svg>
    case 'toilet':
      return <svg {...common}><rect x="8" y="3" width="8" height="5" rx="1.5" /><path d="M7 8h10l-1 5a4 4 0 01-4 4h0a4 4 0 01-4-4l-1-5z" /><path d="M8 17l-1 4M16 17l1 4" /></svg>
    case 'garage':
      return <svg {...common}><path d="M3 16l1.5-5A2 2 0 016.4 9.5h11.2a2 2 0 011.9 1.5L21 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7.5" cy="20" r="1.3" fill="currentColor" /><circle cx="16.5" cy="20" r="1.3" fill="currentColor" /></svg>
    case 'deck':
      return <svg {...common}><path d="M12 3c4 0 7 2.5 7 6H5c0-3.5 3-6 7-6z" /><path d="M12 9v10M9 21h6" /></svg>
    case 'briefcase':
      return <svg {...common}><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" /><path d="M3 13h18" /></svg>
    case 'door':
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="14.5" cy="12" r="1" fill="currentColor" /></svg>
    case 'ruler':
      return <svg {...common}><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
    case 'fence':
      return <svg {...common}><path d="M4 21V9l4-3 4 3v12M4 13h8M12 21V9l4-3 4 3v12M12 13h8" /></svg>
    case 'parking':
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M10 16V8h3a3 3 0 010 6h-3" /></svg>
    case 'yard':
      return <svg {...common}><path d="M12 3c-3 0-5 2-5 5 0 2 1 3 2 4h6c1-1 2-2 2-4 0-3-2-5-5-5z" /><path d="M12 12v9" /></svg>
    case 'person':
      return <svg {...common}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    case 'people':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0" /><circle cx="16" cy="9" r="2.5" /><path d="M13 20a5 5 0 019 0" /></svg>
    case 'countertop':
      return <svg {...common}><rect x="3" y="9" width="18" height="3" rx="1" /><rect x="5" y="12" width="14" height="8" rx="1" /><path d="M9 16v4M15 16v4" /></svg>
    case 'plant':
      return <svg {...common}><path d="M12 21v-8" /><path d="M12 13c0-3.2-2.2-5.5-5.5-5.5C6.5 10.7 8.8 13 12 13z" /><path d="M12 13c0-3.2 2.2-5.5 5.5-5.5C17.5 10.7 15.2 13 12 13z" /></svg>
    case 'shower':
      return <svg {...common}><path d="M7 4.5A5 5 0 0117 4.5" /><path d="M4 9h16" /><path d="M8 13v2M12 13v3M16 13v2" /></svg>
    case 'paintroller':
      return <svg {...common}><rect x="4" y="4" width="12" height="6" rx="1.5" /><path d="M9 10v4h3v6" /></svg>
    case 'car':
      return <svg {...common}><path d="M3 16l1.5-5A2 2 0 016.4 9.5h11.2a2 2 0 011.9 1.5L21 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7.5" cy="20" r="1.3" fill="currentColor" /><circle cx="16.5" cy="20" r="1.3" fill="currentColor" /></svg>
    case 'slidingdoor':
      return <svg {...common}><rect x="3" y="4" width="9" height="16" rx="1" /><rect x="12" y="4" width="9" height="16" rx="1" /><path d="M8 12h.01M16 12h.01" /></svg>
    case 'wallet':
      return <svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1.1" fill="currentColor" /></svg>
    case 'calendargrid':
      return <svg {...common}><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M9 5v15M15 5v15" /></svg>
    case 'waterdrop':
      return <svg {...common}><path d="M12 21c-4 0-7-3-7-6.5C5 10 12 3 12 3s7 7 7 11.5c0 3.5-3 6.5-7 6.5z" /></svg>
    case 'bolt':
      return <svg {...common}><path d="M13 2L4.5 12.5H11L10 22l9.5-11.5H13L13 2z" /></svg>
    case 'document':
      return <svg {...common}><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 16h6" /></svg>
    case 'tag':
      return <svg {...common}><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.169.659 1.591l9.581 9.581c.699.699 1.83.699 2.528 0l7.409-7.409a1.79 1.79 0 000-2.528l-9.581-9.581A2.25 2.25 0 009.568 3z" /><circle cx="6.75" cy="6.75" r="1" fill="currentColor" /></svg>
    case 'clockrepeat':
      return <svg {...common}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M12 6v6l4 2" /></svg>
    case 'gridon':
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
    case 'verified':
      return <svg {...common}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    case 'construction':
      return <svg {...common}><path d="M12 3l9 16H3L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>
    case 'turnright':
      return <svg {...common}><path d="M4 6h11a4 4 0 014 4v3" /><path d="M15 9l4-4-4-4" transform="translate(0 4)" /></svg>
    case 'map':
      return <svg {...common}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
    case 'homework':
      return <svg {...common}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
    case 'room':
    default:
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="14.5" cy="12" r="1" fill="currentColor" /></svg>
  }
}

// ─── Composition (chips groupées par type de pièce) ────────────────────────
const PIECE_ICON: Record<string, IconType> = {
  Chambre: 'bed', Salon: 'sofa', Cuisine: 'kitchen', 'Salle de bain': 'bathtub',
  Toilette: 'toilet', Garage: 'garage', Terrasse: 'deck', Bureau: 'briefcase', Entrée: 'door',
}
function pieceIconType(nom: string): IconType {
  return PIECE_ICON[nom] || 'room'
}
function pluralPiece(nom: string, n: number) {
  if (n <= 1) return nom
  if (nom === 'Salle de bain') return `${n} Salles de bain`
  return `${n} ${nom}s`
}

function buildComposition(bien: any): { icon: IconType; label: string }[] | null {
  const sousType = bien.amenites?.sous_type
  const pieces: any[] = bien.pieces || []
  if (sousType === 'boutique' || sousType === 'terrain' || pieces.length === 0) return null

  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1

  if (sousType === 'chambre_salon' || sousType === 'entree_coucher') {
    const chips: { icon: IconType; label: string }[] = []
    const chambres = counts['Chambre'] || 0
    const salons = counts['Salon'] || 0
    const entrees = counts['Entrée'] || 0
    if (chambres > 0) chips.push({ icon: pieceIconType('Chambre'), label: `${chambres} Chambre${chambres > 1 ? 's' : ''}` })
    if (salons > 0) chips.push({ icon: pieceIconType('Salon'), label: `${salons} Salon${salons > 1 ? 's' : ''}` })
    if (entrees > 0) chips.push({ icon: pieceIconType('Entrée'), label: `${entrees} Entrée${entrees > 1 ? 's' : ''}` })
    return chips.length > 0 ? chips : null
  }

  const chips = Object.entries(counts).map(([nom, n]) => ({ icon: pieceIconType(nom), label: pluralPiece(nom, n) }))
  return chips.length > 0 ? chips : null
}

export default function BienDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()
  const [bien, setBien] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoIdx, setPhotoIdx] = useState(0)

  const [visitesPlanifiees, setVisitesPlanifiees] = useState<{ total: number; slots: { date: string; count: number }[] } | null>(null)
  const [visitesConfirmees, setVisitesConfirmees] = useState<{ count: number; visites: { id: number; date: string | null }[] } | null>(null)

  const [visiteActive, setVisiteActive] = useState<any>(null)
  const [visiteCancellee, setVisiteCancellee] = useState<any>(null)
  const [visiteEchouee, setVisiteEchouee] = useState<any>(null)
  const [annulerBusy, setAnnulerBusy] = useState(false)

  const [isOccupeLocal, setIsOccupeLocal] = useState(false)
  const [togglingStatut, setTogglingStatut] = useState(false)
  const [editing, setEditing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [similaires, setSimilaires] = useState<any[]>([])

  useEffect(() => {
    biensApi.byId(Number(id))
      .then(d => { setBien(d); setIsOccupeLocal(d.statut === 'occupe') })
      .catch(() => setError('Bien introuvable'))
      .finally(() => setLoading(false))
  }, [id])

  // Biens similaires — même type & même ville, hors le bien courant.
  useEffect(() => {
    if (!bien) return
    biensApi.list({ transaction: bien.transaction, type: bien.type })
      .then(d => {
        const list = Array.isArray(d) ? d : d.data || []
        setSimilaires(
          list.filter((b: any) => b.id !== bien.id && b.localisation?.ville === bien.localisation?.ville).slice(0, 4)
        )
      })
      .catch(() => {})
  }, [bien?.id])

  const partager = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }).catch(() => {})
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
    } catch (_) {}
    setTogglingStatut(false)
  }

  const annulerVisite = async () => {
    if (!visiteActive) return
    if (!confirm("Confirmer l'annulation de cette visite ?")) return
    setAnnulerBusy(true)
    try {
      await visitesApi.annuler(visiteActive.id)
      setVisiteCancellee(visiteActive); setVisiteActive(null)
    } catch (_) {}
    setAnnulerBusy(false)
  }

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error || !bien) return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(75,107,255,0.10)' }}>
        <svg className="w-10 h-10 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-text-dark font-semibold">Bien introuvable</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold flex items-center gap-1 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Retour
      </button>
    </div>
  )

  const photos: any[] = bien.photos || []
  const allUrls = photos.map((p: any) => resolveUrl(p.url))
  const isLocation = bien.transaction === 'location'
  const typeLabel = TYPE_LABELS[bien.type] || bien.type
  const prix = Number(bien.prix).toLocaleString('fr-FR')
  const accentColor = isLocation ? '#4B6BFF' : '#FF6B35'

  const am = bien.amenites
  const voisinageLabels: string[] = am?.voisinage && Array.isArray(am.voisinage) ? am.voisinage : []
  const logementRows: InfoRow[] = am ? infosLogementRows(am) : []
  const terrainRows: InfoRow[] = am ? infosTerrainRows(am) : []
  const composition = buildComposition(bien)

  const chambres = (bien.pieces || []).filter((p: any) => p.nom?.toLowerCase().includes('chambre')).length
  const superficie = bien.details_maison?.superficie || bien.details_terrain?.superficie || 0
  const nbConsultations = bien.nb_consultations ?? 0

  return (
    <div className="min-h-full pb-32 lg:pb-0">

      {/* ── MOBILE header / galerie ── */}
      <div className="lg:hidden relative h-72 md:h-[420px]" style={{ background: 'rgba(0,0,0,0.04)' }}>
        {allUrls.length > 0 ? (
          <img src={allUrls[photoIdx]} alt="photo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <svg className="w-20 h-20 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}
        <button onClick={() => navigate(-1)} className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {allUrls.length > 1 && (
          <>
            <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
              {photoIdx + 1} / {allUrls.length}
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden lg:block w-full px-6 md:px-16 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-grey hover:text-primary transition-colors mb-6 group text-sm font-medium">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Retour aux annonces
        </button>

        <div className="grid grid-cols-[1fr_400px] gap-8 items-start">
          <div>
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 480, background: 'rgba(0,0,0,0.04)' }}>
              {allUrls.length > 0 ? (
                <img src={allUrls[photoIdx]} alt="photo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <svg className="w-24 h-24 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
              {allUrls.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                    {photoIdx + 1} / {allUrls.length}
                  </div>
                </>
              )}
            </div>
            {allUrls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allUrls.map((url, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8">
              <DetailContent
                bien={bien} isOwnBien={isOwnBien} isLocation={isLocation}
                composition={composition} logementRows={logementRows} terrainRows={terrainRows}
                voisinageLabels={voisinageLabels}
                visitesPlanifiees={visitesPlanifiees} visitesConfirmees={visitesConfirmees}
              />
            </div>
          </div>

          {/* ── Panneau infos sticky desktop ── */}
          <div className="sticky top-20">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
                  {isLocation ? 'À LOUER' : 'À VENDRE'}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold glass-btn text-text-dark">{typeLabel}</span>
                {bien.statut === 'occupe' && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-danger">Occupé</span>
                )}
              </div>

              <div className="mb-5">
                <p className="text-3xl font-bold" style={{ color: accentColor }}>
                  {prix} <span className="text-base font-medium text-text-grey">FCFA{isLocation ? '/mois' : ''}</span>
                </p>
              </div>

              <div className="h-px bg-divider mb-5" />

              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">
                    {bien.localisation?.quartier && `${bien.localisation.quartier}, `}{bien.localisation?.ville}
                  </p>
                  {bien.localisation?.adresse && (
                    <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>
                  )}
                </div>
              </div>

              {(chambres > 0 || superficie > 0 || isOwnBien) && (
                <div className="flex items-center gap-3 mb-5 text-xs text-text-grey">
                  {chambres > 0 && <span>{chambres} ch</span>}
                  {superficie > 0 && <span>{superficie} m²</span>}
                  {isOwnBien && <span className="ml-auto flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {nbConsultations} vue{nbConsultations !== 1 ? 's' : ''}
                  </span>}
                </div>
              )}

              <BottomCta
                isOwnBien={isOwnBien} isOccupeLocal={isOccupeLocal} togglingStatut={togglingStatut}
                onToggleDisponibilite={toggleDisponibilite}
                visiteActive={visiteActive} visiteCancellee={visiteCancellee} visiteEchouee={visiteEchouee}
                onAnnuler={annulerVisite} annulerBusy={annulerBusy}
                onProposerVisite={() => { if (!isLoggedIn) { navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
                onModifier={() => setEditing(true)}
              />

              <button onClick={partager}
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-divider text-text-grey hover:text-text-dark hover:border-text-grey/40 transition-colors">
                {linkCopied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="#22C55E" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span style={{ color: '#22C55E' }}>Lien copié</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342a2.996 2.996 0 000-2.684m0 2.684a3 3 0 100 2.684m0-2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.368-2.684 3 3 0 00-5.368 2.684zm0 9.632a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Partager ce bien
                  </>
                )}
              </button>
            </div>

          {/* Biens similaires */}
          {similaires.length > 0 && (
            <div className="mt-5">
              <p className="font-bold text-text-dark text-sm mb-3">Biens similaires</p>
              <div className="space-y-2.5">
                {similaires.map(b => {
                  const cover = b.photos?.find((p: any) => p.is_cover) || b.photos?.[0]
                  return (
                    <button key={b.id} onClick={() => navigate(`/biens/${b.id}`)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl glass-card text-left hover:-translate-y-0.5 transition-transform">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(0,0,0,0.04)' }}>
                        {cover ? <img src={resolveUrl(cover.url)} alt="" className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-dark truncate">{Number(b.prix).toLocaleString('fr-FR')} FCFA{b.transaction === 'location' ? '/mois' : ''}</p>
                        <p className="text-xs text-text-grey truncate">{b.localisation?.quartier ? `${b.localisation.quartier}, ` : ''}{b.localisation?.ville}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── MOBILE content ── */}
      <div className="lg:hidden px-4 md:px-8 py-5 md:py-8 space-y-4 md:max-w-2xl md:mx-auto">
        <div>
          <div className="flex gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${isLocation ? 'bg-primary' : 'bg-secondary'}`}>
              {isLocation ? 'À LOUER' : 'À VENDRE'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-text-dark" style={{ background: 'rgba(0,0,0,0.05)' }}>{typeLabel}</span>
            {bien.statut === 'occupe' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-danger">Occupé</span>
            )}
          </div>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            {prix} FCFA{isLocation && <span className="text-base font-medium text-text-grey">/mois</span>}
          </p>
        </div>

        <div className="card-soft rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-dark">{bien.localisation?.quartier && `${bien.localisation.quartier}, `}{bien.localisation?.ville}</p>
            {bien.localisation?.adresse && <p className="text-xs text-text-grey mt-0.5">{bien.localisation.adresse}</p>}
            {(chambres > 0 || superficie > 0 || isOwnBien) && (
              <div className="flex items-center gap-3 mt-1.5 text-xs text-text-grey">
                {chambres > 0 && <span>{chambres} ch</span>}
                {superficie > 0 && <span>{superficie} m²</span>}
                {isOwnBien && <span className="ml-auto">{nbConsultations} vue{nbConsultations !== 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>
        </div>

        <DetailContent
          bien={bien} isOwnBien={isOwnBien} isLocation={isLocation}
          composition={composition} logementRows={logementRows} terrainRows={terrainRows}
          voisinageLabels={voisinageLabels}
          visitesPlanifiees={visitesPlanifiees} visitesConfirmees={visitesConfirmees}
        />
      </div>

      {/* ── Barre CTA fixe (mobile/tablette) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-divider px-5 py-3 safe-bottom">
        <BottomCta
          isOwnBien={isOwnBien} isOccupeLocal={isOccupeLocal} togglingStatut={togglingStatut}
          onToggleDisponibilite={toggleDisponibilite}
          visiteActive={visiteActive} visiteCancellee={visiteCancellee} visiteEchouee={visiteEchouee}
          onAnnuler={annulerVisite} annulerBusy={annulerBusy}
          onProposerVisite={() => { if (!isLoggedIn) { navigate('/login'); return } navigate(`/reservation/${bien.id}`) }}
          onModifier={() => setEditing(true)}
        />
      </div>

      {editing && (
        <EditBienModal bien={bien} onClose={() => setEditing(false)}
          onSaved={updated => { setBien((prev: any) => ({ ...prev, ...updated })); setEditing(false) }} />
      )}
    </div>
  )
}

// ─── Contenu partagé (mobile & desktop) — sections empilées, sans onglets ────
function DetailContent({ bien, isOwnBien, isLocation, composition, logementRows, terrainRows, voisinageLabels, visitesPlanifiees, visitesConfirmees }: {
  bien: any; isOwnBien: boolean; isLocation: boolean
  composition: { icon: IconType; label: string }[] | null
  logementRows: InfoRow[]; terrainRows: InfoRow[]; voisinageLabels: string[]
  visitesPlanifiees: { total: number; slots: { date: string; count: number }[] } | null
  visitesConfirmees: { count: number; visites: { id: number; date: string | null }[] } | null
}) {
  const hasFeatureChips = (bien.pieces?.length > 0) || (bien.details_maison?.superficie > 0) ||
    (bien.details_terrain?.superficie > 0) || bien.details_appart?.entree_personnelle ||
    bien.details_maison?.cloture || bien.details_terrain?.cloture ||
    bien.amenites?.parking || bien.amenites?.cour || bien.amenites?.boyerie || bien.amenites?.sanitaire != null

  return (
    <div className="space-y-6">
      {/* Visites confirmées */}
      {isOwnBien
        ? (visitesConfirmees && visitesConfirmees.count > 0 && (
          <VisitesBanner
            title={`${visitesConfirmees.count} visite${visitesConfirmees.count > 1 ? 's' : ''} confirmée${visitesConfirmees.count > 1 ? 's' : ''} en attente`}
            lines={visitesConfirmees.visites.slice(0, 3).map(v => v.date ? fmtSlot(v.date) : '')}
          />
        ))
        : (visitesPlanifiees && visitesPlanifiees.total > 0 && (
          <VisitesBanner
            title={`${visitesPlanifiees.total} visite${visitesPlanifiees.total > 1 ? 's' : ''} confirmée${visitesPlanifiees.total > 1 ? 's' : ''} planifiée${visitesPlanifiees.total > 1 ? 's' : ''}`}
            lines={visitesPlanifiees.slots.slice(0, 3).map(s => fmtSlot(s.date))}
          />
        ))}

      {/* Feature chips */}
      {hasFeatureChips && (
        <div className="flex flex-wrap gap-2.5">
          {bien.pieces?.length > 0 && <FeatureChip icon="room" label={`${bien.pieces.length} pièce${bien.pieces.length > 1 ? 's' : ''}`} />}
          {bien.details_maison?.superficie > 0 && <FeatureChip icon="ruler" label={`${bien.details_maison.superficie} m²`} />}
          {bien.details_terrain?.superficie > 0 && <FeatureChip icon="ruler" label={`${bien.details_terrain.superficie} m²`} />}
          {bien.details_appart?.entree_personnelle && <FeatureChip icon="door" label="Entrée privée" />}
          {(bien.details_maison?.cloture || bien.details_terrain?.cloture) && <FeatureChip icon="fence" label="Clôturé" />}
          {bien.amenites?.parking && <FeatureChip icon="parking" label={bien.amenites?.parking_capacite ? `Parking ×${bien.amenites.parking_capacite}` : 'Parking'} />}
          {bien.amenites?.cour && <FeatureChip icon="yard" label="Cour" />}
          {bien.amenites?.boyerie && <FeatureChip icon="person" label="Boyerie" />}
          {bien.amenites?.sanitaire === true && <FeatureChip icon="bathtub" label="Sanitaire" />}
          {bien.amenites?.sanitaire === false && <FeatureChip icon="people" label="Non sanitaire" />}
        </div>
      )}

      {/* Frais de visite */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border" style={{ background: 'rgba(75,107,255,0.06)', borderColor: 'rgba(75,107,255,0.2)' }}>
        <svg className="w-[18px] h-[18px] text-primary flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 010-4V7a2 2 0 00-2-2H5z" /></svg>
        <p className="text-sm font-semibold text-primary">Frais de visite : 500 FCFA</p>
      </div>

      {/* Description */}
      {bien.description && (
        <div>
          <SectionTitle title="Description" />
          <p className="text-sm text-text-grey leading-relaxed">{bien.description}</p>
        </div>
      )}

      {/* Composition */}
      {composition && composition.length > 0 && (
        <div>
          <SectionTitle title="Composition" />
          <div className="flex flex-wrap gap-2.5">
            {composition.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-primary/25 shadow-sm">
                <Icon type={c.icon} className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-text-dark">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infos logement */}
      {logementRows.length > 0 && (
        <div>
          <SectionTitle title="Informations logement" />
          <InfoCard rows={logementRows} amenites={bien.amenites} />
        </div>
      )}

      {/* Voisinage */}
      {voisinageLabels.length > 0 && (
        <div>
          <SectionTitle title="Voisinage & environnement" />
          <div className="flex flex-wrap gap-2">
            {voisinageLabels.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(46,134,193,0.08)', color: '#2E86C1', border: '1px solid rgba(46,134,193,0.25)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Informations terrain */}
      {terrainRows.length > 0 && (
        <div>
          <SectionTitle title="Informations terrain" />
          <InfoCard rows={terrainRows} />
        </div>
      )}

      {/* Conditions à l'entrée (location uniquement) */}
      {isLocation && (
        <div>
          <SectionTitle title="Conditions à l'entrée" />
          <IntegrationCard bien={bien} isOwnBien={isOwnBien} />
        </div>
      )}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <p className="font-bold text-text-dark text-[15px] mb-3">{title}</p>
}

function FeatureChip({ icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-grey" style={{ background: 'rgba(0,0,0,0.045)' }}>
      <Icon type={icon} className="w-[13px] h-[13px]" />
      {label}
    </span>
  )
}

function VisitesBanner({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="p-3.5 rounded-xl border" style={{ background: 'rgba(39,174,96,0.07)', borderColor: 'rgba(39,174,96,0.25)' }}>
      <div className="flex items-center gap-2">
        <svg className="w-[18px] h-[18px]" style={{ color: '#27AE60' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <p className="text-sm font-bold" style={{ color: '#27AE60' }}>{title}</p>
      </div>
      {lines.filter(Boolean).length > 0 && (
        <div className="mt-2 space-y-1">
          {lines.filter(Boolean).map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" style={{ color: '#27AE60' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs text-text-dark">{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Icône + couleur par ligne — miroir exact de _buildInfosLogement / _buildTerrainSection
// (électricité et eau/SONEB utilisent le vrai logo du fournisseur, pas une icône).
const INFO_ROW_META: Record<string, { icon: IconType; color: string }> = {
  'Eau': { icon: 'waterdrop', color: '#2E86C1' },
  'Cuisine': { icon: 'countertop', color: '#FF6B35' },
  'Cour / Accès': { icon: 'plant', color: '#4CAF50' },
  'Accès véhicule': { icon: 'car', color: '#5E6AD2' },
  'Maison à couloir': { icon: 'slidingdoor', color: '#8E6ABE' },
  'Sanitaires': { icon: 'shower', color: '#26A69A' },
  'Finition': { icon: 'paintroller', color: '#E67E22' },
  'Loyer': { icon: 'clockrepeat', color: '#7B2FBE' },
  'Document disponible': { icon: 'document', color: '#2980B9' },
  'Terrain loti': { icon: 'gridon', color: '#27AE60' },
  'Titre foncier': { icon: 'verified', color: '#16A085' },
  'Permission de construire': { icon: 'construction', color: '#E67E22' },
  'Angle de rue': { icon: 'turnright', color: '#8E6ABE' },
  'Position': { icon: 'map', color: '#2980B9' },
  'Construction existante': { icon: 'homework', color: '#5D6D7E' },
}

function InfoCard({ rows, amenites }: { rows: InfoRow[]; amenites?: any }) {
  const isSonebEau = (amenites?.eau ?? amenites?.compteur_eau) === 'soneb'
  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm divide-y divide-divider">
      {rows.map((r, i) => {
        const isElec = r.label === 'Électricité'
        const isEau = r.label === 'Eau'
        const meta = INFO_ROW_META[r.label] || { icon: 'document' as IconType, color: '#6B7280' }
        return (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              {isElec ? (
                <img src={logoSbee} alt="SBEE" className="h-7 w-auto object-contain" />
              ) : isEau && isSonebEau ? (
                <img src={logoSoneb} alt="SONEB" className="h-7 w-auto object-contain" />
              ) : (
                <span style={{ color: meta.color }}><Icon type={meta.icon} className="w-[22px] h-[22px]" /></span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-text-grey">{r.label}</p>
              <p className="text-[13px] font-semibold text-text-dark mt-0.5">{r.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IntegrationCard({ bien, isOwnBien }: { bien: any; isOwnBien: boolean }) {
  const a = bien.amenites || {}
  const avanceMois = a.avance_mois ?? 2
  const prepayeMois = a.loyer_prepaye_mois ?? 0
  const cautionEau = Number(a.caution_eau ?? 0)
  const cautionElec = Number(a.caution_elec ?? 0)
  const commission = Number(a.commission_agence ?? 0)
  const autresFrais: { label: string; montant: number }[] = Array.isArray(a.autres_frais) ? a.autres_frais : []
  const prix = Number(bien.prix)

  const montantAvance = avanceMois * prix
  const montantPrepaye = prepayeMois * prix
  const autresFraisTotal = autresFrais.reduce((s, f) => s + (Number(f.montant) || 0), 0)
  const total = (avanceMois + prepayeMois) * prix + cautionEau + cautionElec + autresFraisTotal + (!isOwnBien ? commission : 0)

  const rows: { icon: IconType; color: string; label: string; amount: number; note?: string }[] = []
  if (avanceMois > 0) rows.push({ icon: 'wallet', color: '#7B2FBE', label: `Avance (${avanceMois} mois)`, amount: montantAvance })
  if (prepayeMois > 0) rows.push({ icon: 'calendargrid', color: '#22C55E', label: `Prépayé (${prepayeMois} mois)`, amount: montantPrepaye })
  if (cautionEau > 0) rows.push({ icon: 'waterdrop', color: '#2E86C1', label: 'Caution eau', amount: cautionEau })
  if (cautionElec > 0) rows.push({ icon: 'bolt', color: '#FFCC00', label: 'Caution électricité', amount: cautionElec })
  for (const f of autresFrais) {
    const montant = Number(f.montant) || 0
    if (montant > 0) rows.push({ icon: 'document', color: '#8E44AD', label: f.label || 'Autre frais', amount: montant })
  }
  if (!isOwnBien && commission > 0) rows.push({ icon: 'tag', color: '#2E86C1', label: 'Commission agence', amount: commission, note: "Frais d'agence inclus dans votre paiement" })

  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm overflow-hidden">
      <div className="divide-y divide-divider">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-shrink-0" style={{ color: r.color }}><Icon type={r.icon} className="w-[22px] h-[22px]" /></span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-text-dark">{r.label}</p>
              {r.note && <p className="text-[11px] text-success mt-0.5">{r.note}</p>}
            </div>
            <p className="text-[13px] font-bold text-text-dark flex-shrink-0">{fcfa(r.amount)}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-4" style={{ background: 'rgba(75,107,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-extrabold text-text-dark">Total à verser à l'entrée</p>
            <p className="text-[11px] text-text-grey">Paiement unique à l'entrée</p>
          </div>
          <p className="text-lg font-black text-primary">{fcfa(total)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Barre d'action (bottom bar mobile fixe / panneau desktop) ─────────────
function BottomCta({ isOwnBien, isOccupeLocal, togglingStatut, onToggleDisponibilite, visiteActive, visiteCancellee, visiteEchouee, onAnnuler, annulerBusy, onProposerVisite, onModifier }: {
  isOwnBien: boolean; isOccupeLocal: boolean; togglingStatut: boolean; onToggleDisponibilite: () => void
  visiteActive: any; visiteCancellee: any; visiteEchouee: any
  onAnnuler: () => void; annulerBusy: boolean
  onProposerVisite: () => void
  onModifier: () => void
}) {
  if (isOwnBien) {
    return (
      <div className="flex gap-2.5">
        <button onClick={onModifier}
          className="w-[54px] h-[54px] flex-shrink-0 rounded-xl border-2 border-divider flex items-center justify-center transition-colors hover:border-primary"
          aria-label="Modifier le bien">
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onToggleDisponibilite} disabled={togglingStatut}
          className="flex-1 h-[54px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: isOccupeLocal ? '#EF4444' : '#22C55E' }}>
          {togglingStatut ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {isOccupeLocal
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-9 4h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
              </svg>
              {isOccupeLocal ? 'Marquer comme disponible' : 'Marquer comme occupé'}
            </>
          )}
        </button>
      </div>
    )
  }

  if (visiteActive) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: visiteActive.statut === 'confirmee' ? '#22C55E' : '#FF6B35' }} />
          <p className="text-xs text-text-grey truncate">
            Visite {visiteActive.statut === 'confirmee' ? 'confirmée' : 'en attente'} · {fmtVisiteDate(visiteActive.date_contre_proposee || visiteActive.date_souhaitee)}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => alert(`Visite ${fmtVisiteDate(visiteActive.date_contre_proposee || visiteActive.date_souhaitee)}`)}
            className="flex-1 py-3 rounded-xl border text-sm font-bold text-primary border-primary">
            Voir le créneau
          </button>
          <button onClick={onAnnuler} disabled={annulerBusy}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60" style={{ background: '#EF4444' }}>
            {annulerBusy ? '…' : 'Annuler'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {visiteEchouee ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <svg className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <p className="text-xs font-semibold truncate" style={{ color: '#EF4444' }}>Visite échouée · {fmtVisiteDate(visiteEchouee.date_contre_proposee || visiteEchouee.date_souhaitee)}</p>
        </div>
      ) : visiteCancellee ? (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <svg className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          <p className="text-xs font-semibold truncate" style={{ color: '#EF4444' }}>Visite annulée · {fmtVisiteDate(visiteCancellee.date_contre_proposee || visiteCancellee.date_souhaitee)}</p>
        </div>
      ) : null}
      <button onClick={onProposerVisite}
        className="w-full h-[54px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}>
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        Proposer une visite
      </button>
    </div>
  )
}
