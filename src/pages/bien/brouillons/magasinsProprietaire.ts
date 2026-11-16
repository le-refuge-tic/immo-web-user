import type { EntreeBrouillon } from '../../../shared/brouillons/planSynchro'
import type { MagasinBrouillons } from '../../../shared/brouillons/synchroniser'
import { sousTypeParCle } from '../../../shared/biens/referentielTypes'

/**
 * Lot 6 — les trois brouillons du propriétaire (un par formulaire), adaptés au format de
 * synchronisation. Clés préfixées `rg_draft_` : effacées à la déconnexion (appareil partagé),
 * puis récupérées du serveur à la connexion suivante.
 */
export type FormulaireBrouillon = 'bien' | 'guesthouse' | 'salle_fete'

/** État de synchronisation (effacé avec les brouillons à la déconnexion). */
export const CLE_ETAT_SYNCHRO = 'rg_draft_synchro'

export const cleStockageBrouillon = (formulaire: FormulaireBrouillon, uid: number | string) =>
  formulaire === 'bien' ? `rg_draft_nouveau_bien_${uid}` : `rg_draft_${formulaire}_${uid}`

const FAMILLE: Record<FormulaireBrouillon, string> = {
  bien: 'proprietaire_bien',
  guesthouse: 'proprietaire_guesthouse',
  salle_fete: 'proprietaire_salle_fete',
}
/** Une seule saisie par formulaire : la même clé sur tous les appareils. */
const CLE: Record<FormulaireBrouillon, string> = {
  bien: 'proprietaire-bien',
  guesthouse: 'proprietaire-guesthouse',
  salle_fete: 'proprietaire-salle-fete',
}
export const LIENS_BROUILLON: Record<FormulaireBrouillon, string> = {
  bien: '/nouveau-bien',
  guesthouse: '/nouveau-bien/guesthouse',
  salle_fete: '/nouveau-bien/salle-fete',
}
export const LIBELLES_FORMULAIRE: Record<FormulaireBrouillon, string> = {
  bien: 'Bien',
  guesthouse: 'Guesthouse',
  salle_fete: 'Salle de fêtes',
}

/** Format du brouillon guesthouse / salle (NouveauBienDediePage). */
export interface BrouillonDedie<T = Record<string, unknown>> { form: T; etape: number; majLe?: number }
/** Format FormDraft du formulaire classique. */
interface BrouillonClassique { v: number; savedAt: number; fields: Record<string, unknown> }

function lireJson<T>(cle: string): T | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null') as T | null } catch { return null }
}
function ecrireJson(cle: string, v: unknown): void {
  try { localStorage.setItem(cle, JSON.stringify(v)) } catch { /* stockage plein ou interdit */ }
}
function retirerCle(cle: string): void {
  try { localStorage.removeItem(cle) } catch { /* stockage interdit */ }
}

function libelleClassique(fields: Record<string, unknown>): string {
  const type = typeof fields.typeBien === 'string' ? sousTypeParCle(fields.typeBien)?.libelle : undefined
  const quartier = typeof fields.quartier === 'string' ? fields.quartier.trim() : ''
  return [type ?? 'Bien', quartier].filter(Boolean).join(' · ')
}

function lireEntree(formulaire: FormulaireBrouillon, uid: number): EntreeBrouillon | null {
  const cle = cleStockageBrouillon(formulaire, uid)
  if (formulaire === 'bien') {
    const b = lireJson<BrouillonClassique>(cle)
    if (!b?.fields || typeof b.savedAt !== 'number') return null
    const etape = typeof b.fields.step === 'number' ? b.fields.step : 0
    return { cle: CLE.bien, famille: FAMILLE.bien, libelle: libelleClassique(b.fields), etape, majLe: b.savedAt, donnees: b.fields }
  }
  const b = lireJson<BrouillonDedie>(cle)
  if (!b?.form || typeof b.form !== 'object') return null
  const nom = typeof b.form.nom === 'string' ? b.form.nom.trim() : ''
  return {
    cle: CLE[formulaire], famille: FAMILLE[formulaire], libelle: nom || LIBELLES_FORMULAIRE[formulaire],
    etape: Number(b.etape) || 0, majLe: Number(b.majLe) || 0, donnees: b.form,
  }
}

function magasin(formulaire: FormulaireBrouillon, uid: number): MagasinBrouillons {
  const cle = cleStockageBrouillon(formulaire, uid)
  return {
    familles: [FAMILLE[formulaire]],
    lire: () => { const e = lireEntree(formulaire, uid); return e ? [e] : [] },
    ecrire: e => ecrireJson(cle, formulaire === 'bien'
      ? { v: 1, savedAt: e.majLe, fields: e.donnees } satisfies BrouillonClassique
      : { form: e.donnees, etape: e.etape, majLe: e.majLe } satisfies BrouillonDedie),
    retirer: () => retirerCle(cle),
    vider: () => retirerCle(cle),
  }
}

export const magasinsProprietaire = (uid: number): MagasinBrouillons[] =>
  (['bien', 'guesthouse', 'salle_fete'] as const).map(f => magasin(f, uid))

export interface ResumeBrouillonProprietaire {
  formulaire: FormulaireBrouillon
  libelle: string
  etape: number
  majLe: number
  lien: string
}

/** Brouillons de cet appareil (à jour du serveur après synchronisation), du plus récent au plus ancien. */
export function listerBrouillonsProprietaire(uid: number): ResumeBrouillonProprietaire[] {
  return (['bien', 'guesthouse', 'salle_fete'] as const)
    .flatMap(f => { const e = lireEntree(f, uid); return e ? [{ formulaire: f, libelle: e.libelle, etape: e.etape, majLe: e.majLe, lien: LIENS_BROUILLON[f] }] : [] })
    .sort((a, b) => b.majLe - a.majLe)
}

export const supprimerBrouillonProprietaire = (formulaire: FormulaireBrouillon, uid: number) =>
  retirerCle(cleStockageBrouillon(formulaire, uid))
