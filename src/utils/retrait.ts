import type { LimitesRetrait, OperateurRetrait } from '../types/wallet'
import type { RetraitProprio } from '../types/proprietaire'

/** Montant minimum d'une demande de retrait (FCFA) tant que le serveur n'a pas répondu (`GET /retraits/limites`). */
export const RETRAIT_MINIMUM = 500

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

/**
 * Message à afficher sous le champ « montant à retirer » dès la saisie (FE-B-015),
 * ou chaîne vide si le montant est valide ou le champ vide. Les limites viennent du
 * serveur (minimum et maximum par retrait) ; sans elles, le minimum par défaut s'applique.
 */
export function messageMontantRetrait(montant: string, solde: number, limites?: Partial<LimitesRetrait>): string {
  if (!montant.trim()) return ''
  const valeur = Number(montant)
  const min = limites?.min ?? RETRAIT_MINIMUM
  const max = limites?.max
  if (!Number.isFinite(valeur) || valeur <= 0) return 'Saisissez un montant en chiffres.'
  if (!Number.isInteger(valeur)) return 'Saisissez un montant entier, sans décimales.'
  if (valeur > solde) return `Ce montant dépasse votre solde disponible (${fcfa(solde)}).`
  if (valeur < min) return `Le minimum de retrait est de ${fcfa(min)}.`
  if (max !== undefined && Number.isFinite(max) && valeur > max) return `Le maximum par retrait est de ${fcfa(max)}.`
  return ''
}

// ─── Opérateurs ───────────────────────────────────────────────────────────────

export const OPERATEURS: ReadonlyArray<{ value: OperateurRetrait; label: string }> = [
  { value: 'mtn', label: 'MTN' },
  { value: 'moov', label: 'Moov' },
]

export function libelleOperateur(operateur: string | null | undefined): string {
  return OPERATEURS.find(o => o.value === operateur)?.label ?? ''
}

// ─── Statuts d'une demande de retrait ─────────────────────────────────────────

export type TonRetrait = 'attente' | 'succes' | 'echec'

const STATUTS: Record<string, { label: string; ton: TonRetrait }> = {
  en_attente: { label: 'En cours de traitement', ton: 'attente' },
  en_cours: { label: 'Virement en cours', ton: 'attente' },
  en_attente_fonds: { label: 'En attente de traitement', ton: 'attente' },
  approuve: { label: 'En cours de traitement', ton: 'attente' },
  envoye: { label: 'Envoyé', ton: 'succes' },
  echoue: { label: 'Échoué, remboursé', ton: 'echec' },
  rejete: { label: 'Refusé, remboursé', ton: 'echec' },
}

export function infoStatutRetrait(statut: string): { label: string; ton: TonRetrait } {
  return STATUTS[statut] ?? { label: statut, ton: 'attente' }
}

/** Tant que le virement n'a pas abouti ni échoué : l'écran se rafraîchit seul. */
export function estRetraitEnCours(statut: string): boolean {
  return infoStatutRetrait(statut).ton === 'attente'
}

/** Couleur du statut (variables CSS de l'application). */
export const COULEUR_TON: Record<TonRetrait, string> = {
  attente: 'var(--c-amber-dark)',
  succes: 'var(--c-success)',
  echec: 'var(--c-danger)',
}

/**
 * Ce qu'il faut dire à la personne juste après sa demande : le virement part tout de suite,
 * mais son issue arrive de l'opérateur quelques instants plus tard.
 */
export function messageApresDemande(retrait: Pick<RetraitProprio, 'statut' | 'message'> | undefined): { ok: boolean; texte: string } {
  const statut = retrait?.statut
  if (statut === 'echoue' || statut === 'rejete') {
    return { ok: false, texte: retrait?.message || 'Le virement a échoué. Le montant a été remis sur votre portefeuille.' }
  }
  if (statut === 'envoye') return { ok: true, texte: 'Virement envoyé.' }
  if (statut === 'en_attente_fonds') return { ok: true, texte: 'Demande enregistrée : elle sera traitée par notre équipe. Suivez son statut ci-dessous.' }
  return { ok: true, texte: 'Virement lancé. Vous serez notifié dès que l\'argent arrive sur votre numéro.' }
}

/** « le 12/11 à 14:30 » — fin de la suspension de 48 h après un changement de numéro ou d'opérateur. */
export function formaterFinSuspension(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return null
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/**
 * Pourquoi aucun retrait n'est possible pour l'instant (numéro manquant, suspension de 48 h après
 * un changement de NUMÉRO), ou `null`. L'opérateur n'en fait pas partie : il se choisit dans le formulaire. Le serveur refuse de toute façon ; ceci évite à la
 * personne de saisir un montant pour rien. Tant que l'information n'est pas chargée : `null`.
 */
export function raisonBlocageRetrait(info: { numero_retrait: string | null; retraits_suspendus_jusqu_a?: string | null } | null): string | null {
  if (!info) return null
  if (!info.numero_retrait) return 'Ajoutez un numéro Mobile Money de retrait pour pouvoir retirer.'
  const fin = formaterFinSuspension(info.retraits_suspendus_jusqu_a)
  if (fin) return `Par sécurité, les retraits sont suspendus jusqu'au ${fin} (changement récent de numéro).`
  return null
}
