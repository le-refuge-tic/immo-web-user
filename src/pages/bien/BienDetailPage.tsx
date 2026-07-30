import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { infosLogementRows, infosTerrainRows, type InfoRow } from '../../utils/amenites'

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

// ─── Composition (chips groupées par type de pièce) ────────────────────────
const PIECE_ICONS: Record<string, string> = {
  Chambre: 'M4 18v-6a4 4 0 014-4h8a4 4 0 014 4v6M4 18h16M4 18v2M20 18v2M8 14v-2m8 2v-2',
  Salon: 'M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4M3 12h18v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM6 19v2m12-2v2',
  Cuisine: 'M4 7h16M6 7v13a1 1 0 001 1h10a1 1 0 001-1V7M9 3h6l1 4H8l1-4z',
  'Salle de bain': 'M4 12h16M6 12V6a2 2 0 012-2h2a2 2 0 012 2v6M7 12v8a1 1 0 001 1h8a1 1 0 001-1v-8',
  Toilette: 'M8 4h8v4H8V4zM6 8h12v4a6 6 0 01-12 0V8z',
  Garage: 'M4 21V9l8-5 8 5v12M4 21h16M4 21v-4h16v4M9 9h.01M15 9h.01',
  Terrasse: 'M4 20h16M4 20V9l8-5 8 5v11M8 20v-6h8v6',
  Bureau: 'M3 7h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V7zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2',
  Entrée: 'M5 21V4a1 1 0 011-1h9l4 4v14M5 21h14M5 21v-2m10-13v13',
}
function pieceIconPath(nom: string) {
  return PIECE_ICONS[nom] || 'M4 4h16v16H4z'
}
function pluralPiece(nom: string, n: number) {
  if (n <= 1) return nom
  if (nom === 'Salle de bain') return `${n} Salles de bain`
  return `${n} ${nom}s`
}

function buildComposition(bien: any): { icon: string; label: string }[] | null {
  const sousType = bien.amenites?.sous_type
  const pieces: any[] = bien.pieces || []
  if (sousType === 'boutique' || sousType === 'terrain' || pieces.length === 0) return null

  const counts: Record<string, number> = {}
  for (const p of pieces) counts[p.nom] = (counts[p.nom] || 0) + 1

  if (sousType === 'chambre_salon' || sousType === 'entree_coucher') {
    const chips: { icon: string; label: string }[] = []
    const chambres = counts['Chambre'] || 0
    const salons = counts['Salon'] || 0
    const entrees = counts['Entrée'] || 0
    if (chambres > 0) chips.push({ icon: pieceIconPath('Chambre'), label: `${chambres} Chambre${chambres > 1 ? 's' : ''}` })
    if (salons > 0) chips.push({ icon: pieceIconPath('Salon'), label: `${salons} Salon${salons > 1 ? 's' : ''}` })
    if (entrees > 0) chips.push({ icon: pieceIconPath('Entrée'), label: `${entrees} Entrée${entrees > 1 ? 's' : ''}` })
    return chips.length > 0 ? chips : null
  }

  const chips = Object.entries(counts).map(([nom, n]) => ({ icon: pieceIconPath(nom), label: pluralPiece(nom, n) }))
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

  useEffect(() => {
    biensApi.byId(Number(id))
      .then(d => { setBien(d); setIsOccupeLocal(d.statut === 'occupe') })
      .catch(() => setError('Bien introuvable'))
      .finally(() => setLoading(false))
  }, [id])

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
              />
            </div>
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
            <span className="px-3 py-1 rounded-full text-xs font-bold glass-btn text-text-dark">{typeLabel}</span>
            {bien.statut === 'occupe' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-danger">Occupé</span>
            )}
          </div>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            {prix} FCFA{isLocation && <span className="text-base font-medium text-text-grey">/mois</span>}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
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
        />
      </div>
    </div>
  )
}

// ─── Contenu partagé (mobile & desktop) — sections empilées, sans onglets ────
function DetailContent({ bien, isOwnBien, isLocation, composition, logementRows, terrainRows, voisinageLabels, visitesPlanifiees, visitesConfirmees }: {
  bien: any; isOwnBien: boolean; isLocation: boolean
  composition: { icon: string; label: string }[] | null
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
          {bien.pieces?.length > 0 && <FeatureChip label={`${bien.pieces.length} pièce${bien.pieces.length > 1 ? 's' : ''}`} />}
          {bien.details_maison?.superficie > 0 && <FeatureChip label={`${bien.details_maison.superficie} m²`} />}
          {bien.details_terrain?.superficie > 0 && <FeatureChip label={`${bien.details_terrain.superficie} m²`} />}
          {bien.details_appart?.entree_personnelle && <FeatureChip label="Entrée privée" />}
          {(bien.details_maison?.cloture || bien.details_terrain?.cloture) && <FeatureChip label="Clôturé" />}
          {bien.amenites?.parking && <FeatureChip label={bien.amenites?.parking_capacite ? `Parking ×${bien.amenites.parking_capacite}` : 'Parking'} />}
          {bien.amenites?.cour && <FeatureChip label="Cour" />}
          {bien.amenites?.boyerie && <FeatureChip label="Boyerie" />}
          {bien.amenites?.sanitaire === true && <FeatureChip label="Sanitaire" />}
          {bien.amenites?.sanitaire === false && <FeatureChip label="Non sanitaire" />}
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
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
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
          <InfoCard rows={logementRows} />
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

function FeatureChip({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-grey" style={{ background: 'rgba(0,0,0,0.045)' }}>
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

function InfoCard({ rows }: { rows: InfoRow[] }) {
  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm divide-y divide-divider">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <p className="text-[11px] text-text-grey">{r.label}</p>
            <p className="text-[13px] font-semibold text-text-dark mt-0.5">{r.value}</p>
          </div>
        </div>
      ))}
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

  const rows: { icon: string; color: string; label: string; amount: number; note?: string }[] = []
  if (avanceMois > 0) rows.push({ icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 6v6l4 2', color: '#7B2FBE', label: `Avance (${avanceMois} mois)`, amount: montantAvance })
  if (prepayeMois > 0) rows.push({ icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#22C55E', label: `Prépayé (${prepayeMois} mois)`, amount: montantPrepaye })
  if (cautionEau > 0) rows.push({ icon: 'M12 21c-4 0-7-3-7-6.5C5 10 12 3 12 3s7 7 7 11.5c0 3.5-3 6.5-7 6.5z', color: '#2E86C1', label: 'Caution eau', amount: cautionEau })
  if (cautionElec > 0) rows.push({ icon: 'M13 2L4.5 12.5H11L10 22l9.5-11.5H13L13 2z', color: '#FFCC00', label: 'Caution électricité', amount: cautionElec })
  for (const f of autresFrais) {
    const montant = Number(f.montant) || 0
    if (montant > 0) rows.push({ icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#8E44AD', label: f.label || 'Autre frais', amount: montant })
  }
  if (!isOwnBien && commission > 0) rows.push({ icon: 'M8 12h8m-8 0a4 4 0 01-4-4V6a2 2 0 012-2h1m9 8a4 4 0 004-4V6a2 2 0 00-2-2h-1m-8 0h8', color: '#2E86C1', label: 'Commission agence', amount: commission, note: "Frais d'agence inclus dans votre paiement" })

  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm overflow-hidden">
      <div className="divide-y divide-divider">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <svg className="w-[22px] h-[22px] flex-shrink-0" style={{ color: r.color }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={r.icon} /></svg>
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
function BottomCta({ isOwnBien, isOccupeLocal, togglingStatut, onToggleDisponibilite, visiteActive, visiteCancellee, visiteEchouee, onAnnuler, annulerBusy, onProposerVisite }: {
  isOwnBien: boolean; isOccupeLocal: boolean; togglingStatut: boolean; onToggleDisponibilite: () => void
  visiteActive: any; visiteCancellee: any; visiteEchouee: any
  onAnnuler: () => void; annulerBusy: boolean
  onProposerVisite: () => void
}) {
  if (isOwnBien) {
    return (
      <button onClick={onToggleDisponibilite} disabled={togglingStatut}
        className="w-full h-[54px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
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
