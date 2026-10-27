/* Constantes et fonctions pures de la messagerie (formatage, libellés, couleurs du thème). */
import { avatarGradient } from '../../../theme/illustrations'
import type { ChatUser, CreneauMetadata } from '../../../types/chat-ui'

type Interlocuteur = Pick<ChatUser, 'prenom' | 'pseudonyme' | 'nom' | 'role'> | null | undefined

export const BIEN_TYPE_LABELS: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appt. meublé',
  guesthouse: 'Guesthouse', terrain: 'Terrain',
}
export const SOUS_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa', maison_individuelle: 'Maison indiv.', appartement: 'Appartement',
  chambre_salon: 'Chambre-Salon', entree_coucher: 'Entrée-Coucher', boutique: 'Boutique', terrain: 'Terrain',
}
/** Dégradé d'avatar : palette partagée (src/theme/illustrations.ts), mêmes teintes. */
export const avatarGrad = avatarGradient
export function initial(name: string) { return name?.[0]?.toUpperCase() || '?' }
export function timeLabel(s: string) { return new Date(s).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
export function sameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}
export function dateSep(s: string) {
  const d = new Date(s), now = new Date(), yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (sameDay(s, now.toISOString())) return "Aujourd'hui"
  if (sameDay(s, yest.toISOString())) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
export function fmtSlot(dt: Date) {
  const J = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.']
  const M = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
  return `${J[dt.getDay()]} ${dt.getDate()} ${M[dt.getMonth()]} à ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}
/**
 * Statut affiché d'une proposition de créneau : un créneau en attente dont
 * l'heure est passée est « expiré » sans attendre le job serveur.
 */
export function statutCreneau(meta: CreneauMetadata | null | undefined, maintenant: Date = new Date()): string {
  const status = meta?.status || 'pending'
  if (status !== 'pending' || !meta?.proposed_at) return status
  const t = new Date(meta.proposed_at).getTime()
  return !isNaN(t) && t <= maintenant.getTime() ? 'expired' : status
}
export function displayName(o: Interlocuteur) { return o?.prenom || o?.pseudonyme || o?.nom || 'Contact' }
export function roleLabel(o: Interlocuteur) {
  if (o?.role === 'demarcheur' || o?.role === 'commercial') return 'Démarcheur'
  if (o?.role === 'proprietaire') return 'Propriétaire'
  if (o?.role === 'locataire') return 'Locataire'
  if (o?.role === 'prospect') return 'Client'
  return ''
}

/** Couleurs du thème de la messagerie (light par défaut, dark optionnel). */
export interface ChatColors {
  tp: string; ts: string; tm: string
  chatBg: string; hdrBg: string; hdrBdr: string; inpBg: string; inpFieldBg: string; inpFieldBdr: string
  profileBg: string; profileBdr: string
  bubbleMeBg: string; bubbleOtherBg: string; bubbleOtherBdr: string
  menuBg: string; menuBdr: string; menuHov: string
  divider: string; pinBg: string; sepBg: string; iconBtn: string
}

export function getChatColors(isDark: boolean): ChatColors {
  return {
    // Text
    tp: isDark ? '#E8E9F0' : '#111827',          // primary — lisible 7:1+
    ts: isDark ? 'rgba(232,233,240,0.62)' : '#4B5563',  // secondary — 4.5:1+
    tm: isDark ? 'rgba(232,233,240,0.60)' : '#5F6672',  // muted
    // Surfaces
    chatBg: isDark ? '#0F1117' : '#EEF0F7',
    hdrBg: isDark ? '#161820' : 'rgb(255,255,255)',
    hdrBdr: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    inpBg: isDark ? '#161820' : 'rgb(255,255,255)',
    inpFieldBg: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F8',
    inpFieldBdr: isDark ? 'rgba(255,255,255,0.10)' : '#E5E7EB',
    profileBg: isDark ? '#161820' : 'rgb(255,255,255)',
    profileBdr: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    // Bubbles
    bubbleMeBg: isDark ? 'linear-gradient(135deg,#3B55D4,#5B30C4)' : 'linear-gradient(135deg,#4160F2,#7B4BFF)',
    bubbleOtherBg: isDark ? '#1E2130' : 'rgb(255,255,255)',
    bubbleOtherBdr: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    // Menus & overlays
    menuBg: isDark ? '#1E2130' : 'rgb(255,255,255)',
    menuBdr: isDark ? 'rgba(255,255,255,0.09)' : '#E5E7EB',
    menuHov: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
    // Misc
    divider: isDark ? 'rgba(255,255,255,0.06)' : '#F0F1F4',
    pinBg: isDark ? '#1E2130' : 'rgb(255,255,255)',
    sepBg: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    iconBtn: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F8',
  }
}
