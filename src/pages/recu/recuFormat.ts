/**
 * Fonctions de formatage des reçus de paiement — réimplémentation à l'identique
 * du mobile REFUGE (Flutter) pour garantir des libellés/valeurs strictement
 * cohérents entre les deux apps (même backend, même contrat de données).
 *
 * Partagé entre l'écran (RecuPage) et le générateur PDF (recuPdf).
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const MOIS_CAP = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** Montant : séparateur de milliers par espace, arrondi entier, suffixe " FCFA". */
export function fmtMontant(n: number | string | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  return `${v.toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`
}

/** Date complète : "JJ/MM/AAAA à HHhMM". */
export function fmtDateComplete(raw: string | Date | null | undefined): string {
  if (!raw) return '--'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '--'
  const p = (x: number) => String(x).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} à ${p(d.getHours())}h${p(d.getMinutes())}`
}

/** Date courte : "JJ mois_en_lettres AAAA" (ex: "14 avril 2026"). */
export function fmtDateCourte(raw: string | Date | null | undefined): string {
  if (!raw) return '--'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return '--'
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

/** Mois d'un loyer : "{Mois en toutes lettres} {année}" (ex: "Février 2026"). */
export function fmtMoisLoyer(raw: string | Date | null | undefined): string {
  if (!raw) return '--'
  // Le backend renvoie une date ISO ; on ne garde que mois/année.
  const s = typeof raw === 'string' ? raw : raw.toISOString()
  const d = new Date(s.length <= 7 ? `${s}-01` : s)
  if (isNaN(d.getTime())) return '--'
  return `${MOIS_CAP[d.getMonth()]} ${d.getFullYear()}`
}

/** Téléphone : ne garder que les chiffres, grouper par paires (ex: "01 23 45 67 89"). */
export function fmtTelephone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  return digits.match(/.{1,2}/g)?.join(' ') ?? digits
}

/** Référence tronquée sans planter si < N caractères. */
export function refCourte(ref: string | null | undefined, n = 8): string {
  const s = String(ref ?? '')
  return s.length > n ? s.slice(0, n) : s
}

/** Libellé du type de bien (reçu de visite/intégration) — d'après `type`. */
const TYPE_LABELS: Record<string, string> = {
  appart_vide:  'Appartement',
  appart_meuble: 'Appartement meublé',
  maison:       'Maison',
  terrain:      'Terrain',
  guesthouse:   'Guesthouse',
  bureau:       'Bureau',
  commerce:     'Local commercial',
}
export function labelTypeBien(type: string | null | undefined): string {
  return TYPE_LABELS[type ?? ''] ?? 'Bien'
}

/** Rôle du gestionnaire → libellé (reçu de visite). */
export function labelRoleGestionnaire(role: string | null | undefined): string {
  if (role === 'demarcheur') return 'Agent Immobilier'
  if (role === 'proprietaire') return 'Propriétaire'
  return 'Gestionnaire'
}

/**
 * Libellé du bien pour le reçu de loyer : priorité au `sous_type`, sinon `type`.
 * Réplique exacte des règles mobile (voir spec §3).
 */
export function labelBienLoyer(
  sousType: string | null | undefined,
  type: string | null | undefined,
  nbChambres: number | null | undefined,
): string {
  const n = Number(nbChambres) || 0
  switch (sousType) {
    case 'chambre_salon':      return n > 1 ? `${n} Chambres-Salon` : 'Chambre-Salon'
    case 'entree_coucher':     return 'Entrée-Coucher'
    case 'appartement':        return type === 'appart_meuble' ? 'Appartement meublé' : 'Appartement'
    case 'villa':              return 'Villa'
    case 'maison_individuelle': return 'Maison'
    case 'villa_maison':       return 'Villa / Maison'
    case 'boutique':           return 'Boutique / Local'
    case 'terrain':            return 'Terrain'
  }
  switch (type) {
    case 'maison':        return 'Villa / Maison'
    case 'appart_vide':   return 'Appartement'
    case 'appart_meuble': return 'Appartement meublé'
    case 'guesthouse':    return 'Guesthouse'
    case 'terrain':       return 'Terrain'
  }
  return 'Logement'
}

/** Opérateur de paiement → libellé lisible. */
export function labelOperateur(methode: string | null | undefined): string {
  switch (methode) {
    case 'flooz':   return 'Moov Flooz'
    case 'celtiis': return 'Celtiis Cash'
    case 'fedapay': return 'FedaPay'
    default:        return 'MTN Mobile Money'
  }
}

/** Nom complet "prenom nom" nettoyé. */
export function nomComplet(p: { prenom?: string | null; nom?: string | null } | null | undefined): string {
  if (!p) return '--'
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '--'
}
