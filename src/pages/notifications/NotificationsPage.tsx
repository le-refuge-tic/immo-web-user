import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api/notificationsApi'
import { visitesApi } from '../../api/visitesApi'
import { chatApi } from '../../api/chatApi'
import { usePageTitle } from '../../utils/usePageTitle'
import { unwrapList } from '../../utils/unwrapList'
import { useApiQuery } from '../../hooks/useApiQuery'
import type { Notification } from '../../types/api'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

const VisiteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const AnnulationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const ConfirmationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const LoyerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const MessageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const SystemeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const BienApprouveIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const BienRejeteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SwapIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)
const PaiementIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

type TypeCfg = { icon: React.ReactNode; color: string; bg: string }
const TYPE_CONFIG: Record<string, TypeCfg> = {
  visite:       { icon: <VisiteIcon />,       color: '#3A5AEE', bg: 'rgba(75,107,255,0.08)' },
  annulation:   { icon: <AnnulationIcon />,   color: '#DC2626', bg: 'rgba(239,68,68,0.08)' },
  confirmation: { icon: <ConfirmationIcon />, color: '#15803D', bg: 'rgba(34,197,94,0.08)' },
  loyer:        { icon: <LoyerIcon />,        color: '#B45309', bg: 'rgba(245,158,11,0.08)' },
  message:      { icon: <MessageIcon />,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  systeme:      { icon: <SystemeIcon />,      color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
  bien_approuve: { icon: <BienApprouveIcon />, color: '#15803D', bg: 'rgba(34,197,94,0.08)' },
  bien_rejete:   { icon: <BienRejeteIcon />,   color: '#DC2626', bg: 'rgba(239,68,68,0.08)' },
  proposition:   { icon: <SwapIcon />,         color: '#B45309', bg: 'rgba(245,158,11,0.10)' },
  paiement:      { icon: <PaiementIcon />,     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
}

// Types réellement émis par l'API → style, aligné sur _styleForType du mobile.
const TYPE_ALIAS: Record<string, string> = {
  visite_demande: 'visite', rappel_visite: 'visite', visite_effectuee: 'confirmation',
  visite_confirmee: 'confirmation', visite_contre_proposee: 'proposition',
  visite_client_recontrepropose: 'proposition', visite_proposition_envoyee: 'proposition',
  visite_annulee: 'annulation', visite_echouee: 'annulation',
  paiement_visite: 'paiement', nouveau_message: 'message',
  bien_occupe: 'bien_rejete', bien_disponible: 'bien_approuve',
}

function getTypeConfig(type?: string): TypeCfg {
  const key = TYPE_ALIAS[type ?? ''] ?? type ?? ''
  return TYPE_CONFIG[key] || TYPE_CONFIG['systeme']
}

// Texte de repli quand l'alerte n'a pas de corps (repris de _buildBodyFromMeta côté mobile).
function bodyFromMeta(n: Notification): string {
  const meta = n.meta || {}
  const prenom: string | undefined = meta.client_prenom ?? meta.prenom
  const bienType: string | undefined = meta.bien_type ?? meta.type_bien
  const bienLoc: string | undefined = meta.bien_localisation ?? meta.quartier ?? meta.localisation
  const date: string | undefined = meta.date_visite
  const bienInfo = bienType && bienLoc ? `${bienType} à ${bienLoc}` : bienType ?? (bienLoc ? `bien à ${bienLoc}` : undefined)
  const qui = prenom ? `Le client ${prenom}` : 'Un client'
  const pour = bienInfo ? ` pour ${bienInfo}` : ''
  const le = date ? ` le ${date}` : ''
  switch (n.type) {
    case 'visite_demande':         return `${qui} a demandé une visite${pour}${le}.`
    case 'visite_confirmee':       return `Visite confirmée${pour}${le}.`
    case 'visite_annulee':         return `${qui} a annulé la visite${pour}.`
    case 'visite_contre_proposee': return `Nouveau créneau proposé${pour}${le}.`
    case 'paiement_visite':        return `${qui} a réglé les frais de visite${pour}.`
    case 'bien_approuve':          return 'Votre annonce a été approuvée et est maintenant visible.'
    case 'bien_rejete':            return meta.motif ? `Votre annonce a été rejetée. Motif : ${meta.motif}` : 'Votre annonce a été rejetée.'
    default:                       return bienInfo ?? ''
  }
}

const PAGE_SIZE = 10

const VISITE_TYPES = new Set([
  'visite_demande', 'visite_confirmee', 'visite_contre_proposee',
  'visite_client_recontrepropose', 'visite_proposition_envoyee',
  'visite_effectuee', 'visite_echouee', 'visite_annulee',
  'rappel_visite', 'paiement_visite',
])
const BIEN_TYPES = new Set(['bien_approuve', 'bien_rejete', 'bien_occupe', 'bien_disponible'])

// Étiquette d'action affichée sous la notification, comme sur mobile (_Notif.chipLabel).
function chipLabel(n: any): string | null {
  const meta = n.meta || {}
  if (BIEN_TYPES.has(n.type) && meta.bien_id) return 'Voir le bien'
  if (VISITE_TYPES.has(n.type)) return 'Voir la visite'
  if (meta.action === 'feedback') return 'Donner mon avis'
  if (n.type === 'nouveau_message') return 'Voir le message'
  return null
}

const ROLE_ROUTES: Record<string, string> = { proprietaire: '/proprietaire', demarcheur: '/demarcheur', locataire: '/mes-visites', prospect: '/mes-visites' }

const NO_NOTIFS: Notification[] = []

export default function NotificationsPage() {
  usePageTitle('Alertes')
  const { isLoggedIn, user, activeRole, setActiveRole } = useAuth()
  const navigate = useNavigate()
  // Chargement annulable, sans réponse périmée (FE-A-004) ; les mises à jour
  // locales (lu / tout lu) passent par setNotifsData.
  const { data: notifsData, setData: setNotifsData, loading } = useApiQuery(
    signal => notificationsApi.list(signal).then(unwrapList),
    [isLoggedIn],
    { enabled: isLoggedIn },
  )
  const notifs = notifsData ?? NO_NOTIFS
  const setNotifs = (update: (prev: Notification[]) => Notification[]) => setNotifsData(prev => update(prev ?? NO_NOTIFS))
  // Comme sur le mobile : toutes les « Nouvelles », puis les « Précédentes » par lots de 10.
  const [readLimit, setReadLimit] = useState(PAGE_SIZE)

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    } catch (_) {}
  }

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    } catch (_) {}
  }

  // Les échanges autour d'une visite (proposition/réponse de créneau) se
  // passent dans le chat — on retrouve donc la conversation liée à cette
  // visite (même bien + l'autre participant) pour y accéder en un clic,
  // plutôt que de renvoyer vers le tableau de bord général.
  const ouvrirConversationPourVisite = async (visiteId: number): Promise<boolean> => {
    if (!user) return false
    try {
      const [visitesData, convsData] = await Promise.all([visitesApi.mesVisites(), chatApi.conversations()])
      const visites = Array.isArray(visitesData) ? visitesData : visitesData.data || []
      const visite = visites.find((v: any) => v.id === visiteId)
      const bienId = visite?.bien?.id
      const otherId = visite?.client?.id === user.id ? visite?.gestionnaire?.id : visite?.client?.id
      if (!bienId || !otherId) return false
      const convs = Array.isArray(convsData) ? convsData : convsData.data || []
      const match = convs.find((c: any) => c.bien?.id === bienId && c.participants?.some((p: any) => p.id === otherId))
      if (!match) return false
      navigate(`/conversations/${match.id}`)
      return true
    } catch { return false }
  }

  const openNotif = async (n: any) => {
    if (!n.lu) markRead(n.id)
    const meta = n.meta || {}
    if (n.type === 'nouveau_message' && meta.conversation_id) {
      navigate(`/conversations/${meta.conversation_id}`)
      return
    }
    if (VISITE_TYPES.has(n.type) && meta.visite_id) {
      const opened = await ouvrirConversationPourVisite(meta.visite_id)
      if (opened) return
    }
    if (VISITE_TYPES.has(n.type)) {
      // Rôle concerné par CETTE notification. Le backend le fournit via
      // target_role ; à défaut (alertes créées avant le correctif) on
      // respecte le contexte de navigation courant (activeRole) plutôt
      // qu'un ordre de priorité arbitraire entre rôles.
      const targetRole: string = n.target_role || activeRole
      // Bascule silencieuse d'espace si nécessaire, puis navigation.
      if (targetRole && targetRole !== activeRole) setActiveRole(targetRole)
      navigate(ROLE_ROUTES[targetRole] || '/mes-visites')
    } else if (BIEN_TYPES.has(n.type) && meta.bien_id) {
      navigate(`/biens/${meta.bien_id}`)
    }
  }

  const unreadList = notifs.filter(n => !n.lu)
  const readList = notifs.filter(n => n.lu)
  const unread = unreadList.length
  const shownRead = readList.slice(0, readLimit)
  const hasMore = readList.length > readLimit

  const renderNotif = (n: Notification) => {
    const cfg = getTypeConfig(n.type)
    const chip = chipLabel(n)
    const title = n.titre || n.message
    const body = n.corps || bodyFromMeta(n)
    return (
      <li key={n.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => openNotif(n)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNotif(n) } }}
          aria-label={`${n.lu ? '' : 'Non lue : '}${title}`}
          className={`glass-card rounded-2xl p-3.5 md:p-4 flex items-start gap-3 md:gap-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4B6BFF] focus-visible:outline-offset-2 ${n.lu ? '' : 'ring-1 ring-primary/30'}`}
        >
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm leading-snug ${n.lu ? 'text-text-dark font-medium' : 'text-text-dark font-bold'}`}>{title}</p>
              <span className="text-caption text-text-grey whitespace-nowrap flex-shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
            </div>
            {body && body !== title && <p className="text-xs text-text-grey mt-1 line-clamp-2">{body}</p>}
            {chip && (
              <span className="inline-block mt-2 px-2.5 py-1 rounded-lg text-caption font-bold bg-primary/10 text-primary dark:text-[#9DB0FF]">
                {chip}
              </span>
            )}
          </div>
          {!n.lu && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" aria-hidden="true" />}
        </div>
      </li>
    )
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-micro font-bold uppercase tracking-wider text-text-grey px-1 pt-2 pb-1">{children}</h2>
  )

  if (!isLoggedIn) return (
    <div className="min-h-full flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(75,107,255,0.10)' }}>
        <svg className="w-12 h-12 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text-dark mb-2">Restez informé</h2>
      <p className="text-text-grey text-sm mb-8 max-w-xs">Connectez-vous pour recevoir vos alertes visites, confirmations et messages</p>
      <button onClick={() => navigate('/login')} className="px-8 py-3.5 rounded-xl font-bold text-white shadow-btn hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
        Se connecter
      </button>
    </div>
  )

  return (
    <div className="min-h-full">
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="pt-6 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-text-dark">Alertes</h1>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-primary text-white text-caption font-bold rounded-full" aria-label={`${unread} non lue${unread > 1 ? 's' : ''}`}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="text-sm text-primary dark:text-[#9DB0FF] font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
              Tout lire
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="skeleton rounded-2xl h-20" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(75,107,255,0.10)' }}>
              <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="font-bold text-text-dark mb-1">Aucune alerte</h2>
            <p className="text-text-grey text-sm max-w-xs">Vous serez notifié ici de vos visites, loyers et messages.</p>
          </div>
        ) : (
          <div className="pb-28 md:pb-8 space-y-2">
            {unreadList.length > 0 && (
              <section aria-label="Nouvelles alertes">
                <SectionLabel>Nouvelles</SectionLabel>
                <ul className="space-y-2">{unreadList.map(renderNotif)}</ul>
              </section>
            )}
            {shownRead.length > 0 && (
              <section aria-label="Alertes précédentes" className={unreadList.length > 0 ? 'pt-2' : ''}>
                <SectionLabel>Précédentes</SectionLabel>
                <ul className="space-y-2">{shownRead.map(renderNotif)}</ul>
              </section>
            )}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <button onClick={() => setReadLimit(l => l + PAGE_SIZE)} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary/10 text-primary dark:text-[#9DB0FF]">
                  Voir plus
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
