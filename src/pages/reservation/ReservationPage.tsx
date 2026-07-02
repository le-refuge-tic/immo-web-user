import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { visitesApi } from '../../api/visitesApi'

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TYPE_LABELS: Record<string, string> = {
  maison: 'Maison',
  appart_vide: 'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse: 'Guesthouse',
  terrain: 'Terrain',
}

const IMG_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace('/api/v1', '')

function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${IMG_BASE}${url}`
}

export default function ReservationPage() {
  const { bienId } = useParams<{ bienId: string }>()
  const navigate = useNavigate()
  const timeInputRef = useRef<HTMLInputElement>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [bien, setBien] = useState<any>(null)
  const [loadingBien, setLoadingBien] = useState(true)
  const [displayMonth, setDisplayMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(tomorrow)
  const [selectedTime, setSelectedTime] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
  const firstWeekday = (() => {
    const d = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay()
    return d === 0 ? 6 : d - 1
  })()

  const prevMonth = () => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))
  const nextMonth = () => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))

  const dateTimeLabel = () => {
    const d = selectedDate
    const label = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
    if (!selectedTime) return label
    return `${label} à ${selectedTime.replace(':', 'h')}`
  }

  const handleSubmit = async () => {
    if (!selectedTime) { setError('Choisissez une heure pour la visite'); return }
    setError('')
    setSubmitting(true)
    try {
      const [h, m] = selectedTime.split(':').map(Number)
      const dt = new Date(selectedDate)
      dt.setHours(h, m, 0, 0)
      await visitesApi.reserverVisite(Number(bienId), dt.toISOString())
      navigate('/mes-visites', { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la réservation')
    }
    setSubmitting(false)
  }

  const cover = bien?.photos?.[0]?.url
    ? resolveUrl(bien.photos[0].url)
    : bien?.photo_couverture
      ? resolveUrl(bien.photo_couverture)
      : null

  const frais = Number(bien?.frais_visite || 0)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#F4F6FA' }}>
      {/* Header dark gradient */}
      <div
        className="flex-shrink-0 px-5 pb-6"
        style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-[11px]"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white font-bold text-lg">Proposer une visite</p>
            <p className="text-white/60 text-xs mt-0.5">Choisissez une date et une heure</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28 px-5 pt-5 space-y-4">
        {/* Mini property card */}
        {!loadingBien && bien && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-card flex gap-3 p-3">
            {cover ? (
              <img src={cover} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0 py-0.5">
              <p className="font-bold text-text-dark text-sm truncate">
                {TYPE_LABELS[bien.type] || bien.type || 'Bien'}
              </p>
              <p className="text-xs text-text-grey mt-0.5 truncate">
                {bien.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}
                {bien.localisation?.ville || ''}
              </p>
              <p className="text-sm font-bold text-primary mt-1">
                {Number(bien.prix).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            {frais > 0 && (
              <div className="flex flex-col items-end justify-center flex-shrink-0">
                <p className="text-[10px] text-text-grey">Frais visite</p>
                <p className="text-xs font-bold text-secondary">{frais.toLocaleString('fr-FR')} F</p>
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-sm font-bold text-text-dark mb-4">Choisir une date</p>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-g"
            >
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-base font-bold text-text-dark">
              {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </p>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-g"
            >
              <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <p key={d} className="text-[11px] font-semibold text-text-grey text-center">{d}</p>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
              date.setHours(0, 0, 0, 0)
              const past = isPast(date)
              const todayDay = isToday(date)
              const sel = isSelected(date)
              const available = !past

              return (
                <button
                  key={day}
                  onClick={() => available && setSelectedDate(date)}
                  disabled={past}
                  className="aspect-square flex flex-col items-center justify-center rounded-[10px] transition-all relative"
                  style={{
                    background: sel ? '#4B6BFF' : todayDay && !sel ? 'rgba(75,107,255,0.08)' : 'transparent',
                    border: todayDay && !sel ? '1.5px solid rgba(75,107,255,0.4)' : 'none',
                    opacity: past ? 0.3 : 1,
                  }}
                >
                  <span
                    className="text-[13px] font-semibold leading-none"
                    style={{
                      color: sel ? '#fff' : past ? '#ccc' : '#1A1A2E',
                      fontWeight: sel || todayDay ? 700 : 500,
                    }}
                  >
                    {day}
                  </span>
                  {available && !sel && (
                    <span
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ background: 'rgba(34,197,94,0.7)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time picker */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text-dark">Heure souhaitée</p>
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(75,107,255,0.08)', color: '#4B6BFF' }}
            >
              {(() => {
                const d = selectedDate
                const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
                return `${days[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
              })()}
            </span>
          </div>

          <button
            onClick={() => timeInputRef.current?.showPicker?.() || timeInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-4 rounded-[14px] border transition-all"
            style={{
              background: selectedTime ? 'rgba(75,107,255,0.06)' : '#fff',
              borderColor: selectedTime ? '#4B6BFF' : '#E5E7EB',
              borderWidth: selectedTime ? 1.5 : 1,
              boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="w-11 h-11 flex items-center justify-center rounded-[12px] flex-shrink-0"
              style={{ background: selectedTime ? 'rgba(75,107,255,0.15)' : '#F4F6FA' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={selectedTime ? '#4B6BFF' : '#9CA3AF'} strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p
                className="text-base"
                style={{
                  color: selectedTime ? '#1A1A2E' : '#9CA3AF',
                  fontWeight: selectedTime ? 700 : 400,
                }}
              >
                {selectedTime ? selectedTime.replace(':', 'h') : 'Choisir une heure'}
              </p>
              {!selectedTime && (
                <p className="text-xs text-text-grey mt-0.5">Appuyez pour ouvrir le sélecteur</p>
              )}
            </div>
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24" fill="none"
              stroke={selectedTime ? '#22C55E' : '#9CA3AF'}
              strokeWidth={2}
            >
              {selectedTime
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              }
            </svg>
          </button>

          <input
            ref={timeInputRef}
            type="time"
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="sr-only"
          />

          {selectedTime && (
            <div
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[10px]"
              style={{ background: 'rgba(34,197,94,0.08)' }}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>
                Créneau proposé : {dateTimeLabel()}
              </p>
            </div>
          )}
        </div>

        {/* People counter */}
        <div
          className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-3"
        >
          <div
            className="w-11 h-11 flex items-center justify-center rounded-[12px] flex-shrink-0"
            style={{ background: 'rgba(75,107,255,0.1)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#4B6BFF" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-dark">Nombre de personnes</p>
            <p className="text-xs text-text-grey mt-0.5">Combien viendront visiter</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTravelers(t => Math.max(1, t - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-[9px] transition-all"
              style={{ background: travelers > 1 ? 'rgba(75,107,255,0.1)' : '#F4F6FA' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={travelers > 1 ? '#4B6BFF' : '#9CA3AF'} strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-lg font-bold text-text-dark w-5 text-center">{travelers}</span>
            <button
              onClick={() => setTravelers(t => t + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-[9px]"
              style={{ background: '#4B6BFF' }}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div
          className="rounded-[18px] p-[18px]"
          style={{
            background: 'linear-gradient(135deg, #1A1A2E 0%, #0F3460 100%)',
            boxShadow: '0 6px 16px rgba(15,52,96,0.3)',
          }}
        >
          <p className="text-white/70 text-[13px] font-semibold mb-3">Récapitulatif</p>
          <SummaryRow icon="calendar" label="Date" value={`${selectedDate.getDate()} ${MONTH_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`} />
          <div className="h-2.5" />
          <SummaryRow icon="clock" label="Heure souhaitée" value={selectedTime ? selectedTime.replace(':', 'h') : 'Non sélectionnée'} />
          <div className="h-2.5" />
          <SummaryRow icon="people" label="Personnes" value={`${travelers} personne${travelers > 1 ? 's' : ''}`} />
          {frais > 0 && (
            <>
              <div className="my-3.5 border-t border-white/20" />
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px]"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.54)' }}>
                  Les frais de visite seront prélevés à la confirmation
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-divider px-5 py-3 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedTime}
          className="w-full py-4 rounded-[16px] font-bold text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: !selectedTime ? '#E5E7EB' : '#4B6BFF',
            boxShadow: selectedTime ? '0 4px 12px rgba(75,107,255,0.35)' : 'none',
          }}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Envoyer ma demande de visite</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const icons: Record<string, React.ReactElement> = {
    calendar: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    clock: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
    people: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.54)" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
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
