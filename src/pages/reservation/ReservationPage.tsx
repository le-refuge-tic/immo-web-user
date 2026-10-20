import React, { useState, useEffect, useRef } from 'react'
import { API_ORIGIN } from '../../api/apiBase'
import { useParams, useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'
import { chatApi } from '../../api/chatApi'
import { rolesApi } from '../../api/rolesApi'
import { useAuth } from '../../context/AuthContext'
import { usePageTitle } from '../../utils/usePageTitle'
import { track } from '../../lib/analytics'
import { suggestPush } from '../../lib/push'
import { apiMessage } from '../../utils/apiMessage'
import { fraisVisiteBien, libelleFraisVisite } from '../../utils/fraisVisite'
import { ModalSheet } from '../../components/ui/ModalSheet'
import type { Bien } from '../../types/api'

/** Bien affiché : la photo de couverture peut aussi arriver à plat (`photo_couverture`). */
type BienReservation = Bien & { photo_couverture?: string }

/** Rôles autorisés par le backend à réserver une visite (POST /visites → CLIENTS). */
const ROLES_RESERVATION = ['prospect', 'locataire']

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement vide',
  appart_meuble: 'Appartement meublé', guesthouse: 'Guesthouse', terrain: 'Terrain',
}

const SOUS_TYPE_LABELS: Record<string, string> = {
  entree_coucher: 'Entrée-Coucher', chambre_salon: 'Chambre-Salon',
  villa: 'Villa', maison_individuelle: 'Maison', villa_maison: 'Villa / Maison',
  boutique: 'Boutique / Local', terrain: 'Terrain',
}
/** Miroir de Bien.typeLabel (mobile) : privilégie le sous-type quand il existe. */
function bienTypeLabel(bien: Pick<Bien, 'type' | 'amenites'> | null | undefined): string {
  const sous = bien?.amenites?.sous_type
  if (typeof sous === 'string' && sous) {
    if (sous === 'appartement') return bien?.type === 'appart_meuble' ? 'Appartement meublé' : 'Appartement'
    return SOUS_TYPE_LABELS[sous] || sous
  }
  return (bien?.type && TYPE_LABELS[bien.type]) || bien?.type || 'Bien'
}

const TIME_SLOTS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19]

/** Heure et minute courantes en GMT+1, indépendant du fuseau de l'appareil.
 *  UTC+1 = getUTCHours() + 1 — Benin n'a pas de changement d'heure (DST). */
function gmt1Now() {
  const now = new Date()
  return { hour: (now.getUTCHours() + 1) % 24, minute: now.getUTCMinutes() }
}

/** Date "aujourd'hui" en GMT+1 (composantes année/mois/jour). */
function gmt1TodayParts() {
  const t = new Date(Date.now() + 3_600_000) // décale de +1h → jour GMT+1 en UTC
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() }
}

const IMG_BASE = API_ORIGIN
function resolveUrl(url: string) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${IMG_BASE}${url}`
}

const GLASS = {
  background: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(40px) saturate(160%)',
  WebkitBackdropFilter: 'blur(40px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
} as const

export default function ReservationPage() {
  const { bienId } = useParams<{ bienId: string }>()
  const navigate = useNavigate()
  usePageTitle('Proposer une visite')
  const { rolesActifs, updateUser } = useAuth()
  const timeInputRef = useRef<HTMLInputElement>(null)
  const timeSectionRef = useRef<HTMLDivElement>(null)

  // Le backend n'autorise que prospect/locataire à réserver. Un propriétaire ou
  // démarcheur qui explore un bien n'a pas ce rôle → sans garde-fou, le POST
  // renvoie un 403 « Forbidden resource » brut. On détecte le cas en amont pour
  // proposer d'activer le rôle prospect à la volée plutôt que d'échouer.
  const peutReserver = rolesActifs.some(r => ROLES_RESERVATION.includes(r))

  // today/tomorrow : minuit local (l'app cible des appareils en UTC+1, idem GMT+1)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const [bien, setBien] = useState<BienReservation | null>(null)
  const [loadingBien, setLoadingBien] = useState(true)
  const [displayMonth, setDisplayMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(tomorrow)
  const [selectedTime, setSelectedTime] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Écran de confirmation stable (FE-B-018) : il reste affiché jusqu'au choix de la personne
  const [confirmation, setConfirmation] = useState<{ dateLabel: string } | null>(null)
  const [openingChat, setOpeningChat] = useState(false)
  const [chatError, setChatError] = useState('')
  const [activatingRole, setActivatingRole] = useState(false)

  useEffect(() => {
    if (!bienId) return
    biensApi.byId(Number(bienId))
      .then(d => setBien(d.bien || d))
      .catch(() => {})
      .finally(() => setLoadingBien(false))
  }, [bienId])

  const isPast = (d: Date) => d < today
  const isToday = (d: Date) => d.getTime() === today.getTime()
  const isSelected = (d: Date) => d.getTime() === selectedDate.getTime()
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay()

  const prevMonth = () => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))
  const nextMonth = () => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))

  const dateTimeLabel = () => {
    const d = selectedDate
    const label = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
    return selectedTime ? `${label} à ${selectedTime.replace(':', 'h')}` : label
  }

  /** Active le rôle prospect à la volée (le token est rafraîchi par rolesApi),
   *  puis synchronise le contexte pour que `peutReserver` repasse à true. */
  const activerRoleProspect = async () => {
    setActivatingRole(true); setError('')
    try {
      await rolesApi.activer('prospect')
      updateUser({ roles_actifs: [...rolesActifs, 'prospect'] })
    } catch (e: unknown) {
      setError(apiMessage(e) || "Impossible d'activer le profil prospect. Réessayez.")
    } finally {
      setActivatingRole(false)
    }
  }

  // La conversation n'est créée que si la personne choisit d'écrire (pas de conversation vide sinon)
  const ouvrirConversation = async () => {
    setOpeningChat(true); setChatError('')
    try {
      const convData = await chatApi.creerConversation(Number(bienId))
      navigate(`/conversations/${convData.conversationId}`, { replace: true, state: { bienId, bienLabel: bien ? bienTypeLabel(bien) : '' } })
    } catch (e: unknown) {
      setChatError(apiMessage(e) || "Impossible d'ouvrir la conversation pour le moment. Retrouvez-la plus tard depuis vos visites.")
      setOpeningChat(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTime) { setError('Choisissez une heure pour la visite'); return }
    if (!bienId) { setError("Impossible d'envoyer la demande : bien non identifié"); return }
    // Garde-fou : sans rôle prospect/locataire, le backend renverrait un 403.
    // On invite à activer le profil prospect au lieu de laisser passer l'erreur.
    if (!peutReserver) {
      setError('Activez le profil prospect pour proposer une visite.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const [h, m] = selectedTime.split(':').map(Number)
      const dt = new Date(selectedDate); dt.setHours(h, m, 0, 0)
      await visitesApi.reserverVisite(Number(bienId), dt.toISOString())
      track('visite_demandee')
      suggestPush()

      setConfirmation({ dateLabel: dateTimeLabel() })
    } catch (e: unknown) {
      // Fallback si le 403 passe malgré le garde-fou (token pas encore à jour) :
      // message explicite au lieu du « Forbidden resource » brut du backend.
      const msg = (e as { response?: { status?: number } } | null)?.response?.status === 403
        ? 'Activez le profil prospect pour proposer une visite.'
        : (apiMessage(e) || 'Erreur lors de la réservation')
      setError(msg)
      setSubmitting(false)
    }
  }

  const cover = bien?.photos?.[0]?.url
    ? resolveUrl(bien.photos[0].url)
    : bien?.photo_couverture ? resolveUrl(bien.photo_couverture) : null

  const frais: number = bien ? fraisVisiteBien(bien) : 0

  // ── Blocs réutilisables ──────────────────────────────────────────────

  const PropertyCard = () => !loadingBien && bien ? (
    <div className="rounded-2xl overflow-hidden flex gap-3 p-3" style={GLASS}>
      {cover
        ? <img loading="lazy" src={cover} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        : <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: 'rgba(75,107,255,0.1)' }} />
      }
      <div className="flex-1 min-w-0 py-0.5">
        <p className="font-bold text-text-dark text-sm truncate">{bienTypeLabel(bien)}</p>
        <p className="text-xs text-text-grey mt-0.5 truncate">
          {bien.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien.localisation?.ville || ''}
        </p>
      </div>
      <div className="flex flex-col items-end justify-center flex-shrink-0">
        <p className="text-sm font-bold text-primary">{Number(bien.prix).toLocaleString('fr-FR')} FCFA</p>
        {bien.transaction === 'location' && <p className="text-micro text-text-grey">/mois</p>}
      </div>
    </div>
  ) : null

  const CalendarCard = () => (
    <div className="rounded-2xl p-5 md:max-w-sm" style={GLASS}>
      <div className="flex items-center justify-between mb-4">
        <button aria-label="Mois précédent" onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-[10px]" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="text-base font-bold text-text-dark">{MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}</p>
        <button aria-label="Mois suivant" onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-[10px]" style={{ background: 'rgba(0,0,0,0.05)' }}>
          <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => <p key={d} className="text-caption font-semibold text-text-grey text-center">{d}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day); date.setHours(0, 0, 0, 0)
          const past = isPast(date); const todayDay = isToday(date); const sel = isSelected(date)
          return (
            <button key={day} onClick={() => {
              if (past) return
              setSelectedDate(date)
              setSelectedTime('')
              // Miroir du mobile : après avoir choisi une date, on scrolle vers
              // les créneaux ET on ouvre directement le sélecteur d'heure —
              // pas seulement un défilement passif.
              setTimeout(() => {
                timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                timeInputRef.current?.showPicker?.()
              }, 100)
            }} disabled={past}
              className="aspect-square flex flex-col items-center justify-center rounded-[10px] transition-all"
              style={{
                background: sel ? 'var(--c-brand)' : todayDay && !sel ? 'rgba(75,107,255,0.08)' : 'transparent',
                border: todayDay && !sel ? '1.5px solid rgba(75,107,255,0.4)' : 'none',
                opacity: past ? 0.3 : 1,
              }}>
              <span className="text-[13px] font-semibold leading-none"
                style={{ color: sel ? 'rgb(255,255,255)' : past ? '#ccc' : '#1A1A2E', fontWeight: sel || todayDay ? 700 : 500 }}>
                {day}
              </span>
              {!past && !sel && <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'rgba(34,197,94,0.7)' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )

  const TimeCard = () => (
    <div ref={timeSectionRef} className="rounded-2xl p-5" style={GLASS}>
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-sm font-bold text-text-dark">Heure souhaitée</p>
        <span className="text-caption font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(75,107,255,0.08)', color: 'var(--tx-blue)' }}>
          {(() => { const d = selectedDate; const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']; return `${days[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}` })()}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(() => {
          const { hour: curH, minute: curM } = gmt1Now()
          const { y, m, d } = gmt1TodayParts()
          const isDateToday = (
            selectedDate.getFullYear() === y &&
            selectedDate.getMonth()    === m &&
            selectedDate.getDate()     === d
          )
          const visibleSlots = TIME_SLOTS.filter(h =>
            !isDateToday || h > curH || (h === curH && curM < 45)
          )

          if (isDateToday && visibleSlots.length === 0) return (
            <div className="w-full py-3 px-4 rounded-xl flex items-start gap-2.5"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--tx-amber)' }}>Plus de créneaux disponibles aujourd'hui</p>
                <button className="text-xs mt-1 font-semibold" style={{ color: 'var(--tx-blue)' }}
                  onClick={() => { setSelectedDate(tomorrow); setSelectedTime('') }}>
                  Choisir demain
                </button>
              </div>
            </div>
          )

          return visibleSlots.map(h => {
            const value = `${String(h).padStart(2, '0')}:00`
            const sel = selectedTime === value
            return (
              <button key={h} onClick={() => setSelectedTime(value)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  background: sel ? 'var(--c-brand)' : 'rgb(255,255,255)',
                  color: sel ? 'rgb(255,255,255)' : '#1A1A2E',
                  border: `${sel ? 1.5 : 1}px solid ${sel ? 'var(--c-brand)' : '#E5E7EB'}`,
                  boxShadow: sel ? '0 3px 8px rgba(75,107,255,0.25)' : 'none',
                }}>
                {String(h).padStart(2, '00')}h00
              </button>
            )
          })
        })()}
        <button onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid #E5E7EB', color: '#6B7280' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="13" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l2 2M9 3h6" />
          </svg>
          Autre…
        </button>
      </div>
      <input ref={timeInputRef} type="time" aria-label="Heure de visite personnalisée" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="sr-only" />
      {selectedTime && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[10px]" style={{ background: 'rgba(34,197,94,0.08)' }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-semibold" style={{ color: 'var(--tx-green)' }}>Créneau proposé : {dateTimeLabel()}</p>
        </div>
      )}
    </div>
  )

  const PeopleCard = () => (
    <div className="rounded-2xl p-5 flex items-center gap-3" style={GLASS}>
      <div className="w-11 h-11 flex items-center justify-center rounded-[12px] flex-shrink-0" style={{ background: 'rgba(75,107,255,0.1)' }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4160F2" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-text-dark">Nombre de personnes</p>
        <p className="text-xs text-text-grey mt-0.5">Combien viendront visiter</p>
      </div>
      <div className="flex items-center gap-4">
        <button aria-label="Un visiteur de moins" onClick={() => setTravelers(t => Math.max(1, t - 1))}
          className="w-8 h-8 flex items-center justify-center rounded-[9px] transition-all"
          style={{ background: travelers > 1 ? 'rgba(75,107,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={travelers > 1 ? '#4160F2' : '#5F6672'} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
        </button>
        <span className="text-lg font-bold text-text-dark w-5 text-center">{travelers}</span>
        <button aria-label="Un visiteur de plus" onClick={() => setTravelers(t => t + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-[9px]" style={{ background: 'var(--c-brand)' }}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  )

  const SummaryCard = () => (
    <div className="rounded-[18px] p-5" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)', boxShadow: '0 6px 16px rgba(15,52,96,0.3)' }}>
      <p className="text-white/70 text-[13px] font-semibold mb-3">Récapitulatif</p>
      <SummaryRow icon="calendar" label="Date" value={`${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`} />
      <div className="h-2.5" />
      <SummaryRow icon="clock" label="Heure souhaitée" value={selectedTime ? selectedTime.replace(':', 'h') : 'Non sélectionnée'} />
      <div className="h-2.5" />
      <SummaryRow icon="people" label="Personnes" value={`${travelers} personne${travelers > 1 ? 's' : ''}`} />
      <div className="my-3 border-t border-white/20" />
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-caption" style={{ color: 'rgba(255,255,255,0.54)' }}>{frais > 0 ? 'Les frais de visite seront prélevés à la confirmation' : 'Cette visite est gratuite'}</p>
      </div>
    </div>
  )

  // Invite affichée à la place du bouton d'envoi quand l'utilisateur (proprio /
  // démarcheur sans rôle client) n'est pas autorisé à réserver : on lui propose
  // d'activer le profil prospect en un clic plutôt que de le laisser buter sur un 403.
  const ActivateProspectBtn = () => (
    <button onClick={activerRoleProspect} disabled={activatingRole}
      className="w-full py-4 rounded-[16px] font-bold text-white flex items-center justify-center gap-2 transition-all"
      style={{ background: 'var(--c-brand)', boxShadow: '0 4px 12px rgba(75,107,255,0.35)' }}>
      {activatingRole
        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        : <span>Activer le profil prospect pour réserver</span>
      }
    </button>
  )

  // Bandeau explicatif quand le rôle client n'est pas actif.
  const ProspectNotice = () => !peutReserver ? (
    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(75,107,255,0.08)', border: '1px solid rgba(75,107,255,0.25)' }}>
      <p className="text-[13px] font-semibold text-text-dark">Profil prospect requis</p>
      <p className="text-xs text-text-grey mt-0.5">Proposer une visite est réservé aux prospects et locataires. Activez le profil prospect pour continuer — vous gardez vos autres rôles.</p>
    </div>
  ) : null

  const SubmitBtn = ({ full = false }) => !peutReserver ? <ActivateProspectBtn /> : (
    <button onClick={handleSubmit} disabled={submitting || !selectedTime}
      className={`${full ? 'w-full' : 'w-full'} py-4 rounded-[16px] font-bold text-white flex items-center justify-center gap-2 transition-all`}
      style={{ background: !selectedTime ? '#E5E7EB' : 'var(--c-brand)', boxShadow: selectedTime ? '0 4px 12px rgba(75,107,255,0.35)' : 'none' }}>
      {submitting
        ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        : <>
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          <span>Envoyer ma demande de visite</span>
        </>
      }
    </button>
  )

  return (
    <div className="min-h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 md:px-8 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:pt-6 pb-5 md:pb-5"
        style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button aria-label="Retour" onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-[11px] flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg">Proposer une visite</h1>
            <p className="text-white/60 text-xs mt-0.5">Choisissez le créneau qui vous convient</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] flex-shrink-0" style={{ background: 'rgba(75,107,255,0.25)', border: '1px solid rgba(75,107,255,0.5)' }}>
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white text-caption font-bold">{libelleFraisVisite(frais)}</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE / TABLETTE ── */}
      <div className="lg:hidden flex-1 overflow-y-auto pb-28 px-5 md:px-10 pt-5 md:pt-8 space-y-4 md:max-w-xl md:mx-auto md:w-full">
        <PropertyCard />
        <CalendarCard />
        <TimeCard />
        <PeopleCard />
        <SummaryCard />
        <ProspectNotice />
        <div role="alert" aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP : deux colonnes ── */}
      <div className="hidden lg:block flex-1">
        <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-[1fr_340px] gap-8 items-start">

          {/* Colonne gauche — formulaire */}
          <div className="space-y-4">
            <PropertyCard />
            <CalendarCard />
            <TimeCard />
            <PeopleCard />
          </div>

          {/* Colonne droite — récapitulatif sticky */}
          <div className="sticky top-6 space-y-4">
            <SummaryCard />
            <ProspectNotice />
            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>
            <SubmitBtn />
          </div>
        </div>
      </div>

      {/* ── Bouton fixe — mobile/tablette uniquement ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-divider px-5 py-3 safe-bottom">
        <SubmitBtn />
      </div>

      {/* ── Confirmation d'envoi : écran stable avec récapitulatif et choix de la suite ── */}
      <ModalSheet open={!!confirmation} onClose={() => navigate('/mes-visites', { replace: true })} label="Demande de visite envoyée" placement="center" panelClassName="w-full max-w-md" zIndex={70} backdropOpacity={0.55}>
        {confirmation && (
          <div className="bg-white dark:bg-[#1E1E2E] rounded-3xl p-6 text-center shadow-xl">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#166534' }}>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-lg text-text-dark mb-1">Demande de visite envoyée</h2>
            <p className="text-sm text-text-grey mb-4">Le responsable du bien doit confirmer ce créneau. Vous serez prévenu dès sa réponse.</p>
            <dl className="text-left text-sm rounded-2xl p-4 mb-5 space-y-2" style={{ background: 'rgba(65,96,242,0.07)' }}>
              <div className="flex justify-between gap-3"><dt className="text-text-grey">Bien</dt><dd className="font-semibold text-text-dark text-right">{bien ? bienTypeLabel(bien) : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-grey">Créneau demandé</dt><dd className="font-semibold text-text-dark text-right">{confirmation.dateLabel}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-text-grey">Frais de visite</dt><dd className="font-semibold text-text-dark text-right">{frais > 0 ? `${libelleFraisVisite(frais)}, à régler après confirmation` : 'Gratuite'}</dd></div>
            </dl>
            {chatError && <p role="alert" className="text-sm font-semibold mb-2 text-[color:var(--tx-red)]">{chatError}</p>}
            <button type="button" onClick={ouvrirConversation} disabled={openingChat}
              className="w-full py-3.5 rounded-xl font-bold text-white mb-2 disabled:opacity-60" style={{ background: 'var(--c-brand)' }}>
              {openingChat ? 'Ouverture…' : 'Écrire au responsable'}
            </button>
            <button type="button" onClick={() => navigate('/mes-visites', { replace: true })}
              className="w-full py-3.5 rounded-xl font-bold mb-1 border border-divider text-text-dark">
              Voir mes visites
            </button>
            <button type="button" onClick={() => navigate(`/biens/${bienId}`, { replace: true })} className="text-sm font-semibold text-text-grey py-2">
              Retour à l'annonce
            </button>
          </div>
        )}
      </ModalSheet>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const icons: Record<string, React.ReactElement> = {
    calendar: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    clock: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>,
    people: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }
  return (
    <div className="flex items-center gap-2">
      {icons[icon]}
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.54)' }}>{label}</span>
      <span className="flex-1" />
      <span className="text-[13px] font-semibold text-white">{value}</span>
    </div>
  )
}
