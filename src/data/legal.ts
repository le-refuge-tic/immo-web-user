/**
 * Informations légales de l'éditeur de la plateforme REFUGE.
 *
 * Identité reprise telle quelle du site vitrine (site-vitrine-le-refuge,
 * lib/content.ts, « données réelles fournies par le client »). Aucune valeur
 * inventée : ce qui n'est pas connu vaut `null` et s'affiche « à compléter ».
 */

/** Tant que les textes n'ont pas été validés par l'éditeur, un avertissement « projet » s'affiche. */
export const LEGAL_DRAFT = true

export const LEGAL_LAST_UPDATED = '9 octobre 2026'

export const editeur = {
  nom: 'LE REFUGE TIC',
  formeJuridique: 'Établissement (entreprise individuelle)',
  rccm: 'COTONOU N° RCCM RB/ABC/22 A 48057',
  ifu: '0202271165781',
  siege:
    "Abomey-Calavi, Calavi Kpota, en face de l'église des Témoins de Jéhovah (côté opposé) ; locaux de ADL ÉNERGIE ET SERVICES (deuxième bureau à droite), BP 001, Bénin",
  directeurPublication: 'Sedjro Confort Bernard POSSY BERRY QUENUM',
  email: 'contact@lerefugetic.com',
  telephones: ['+229 01 93 46 37 16', '+229 01 97 31 39 91'],
} as const

export const cadreLegal = {
  loi: 'Loi n° 2017-20 du 20 avril 2018 portant Code du numérique en République du Bénin',
  apdp: { nom: 'Autorité de Protection des Données Personnelles (APDP)', site: 'https://apdp.bj' },
} as const

/**
 * Prestataires techniques utilisés par la plateforme (relevés dans le code du
 * backend et des applications). `pays` à `null` quand la région n'est pas connue.
 */
export const prestataires: { nom: string; role: string; pays: string | null }[] = [
  { nom: 'Vercel Inc.', role: 'hébergement des sites web', pays: 'États-Unis' },
  { nom: 'Render', role: 'hébergement du serveur (API)', pays: null },
  { nom: 'Supabase', role: 'base de données et stockage des fichiers (photos, pièces justificatives)', pays: 'Union européenne' },
  { nom: 'Wirepick', role: 'envoi des SMS (codes de connexion et de réinitialisation)', pays: null },
  { nom: 'FedaPay, MTN Mobile Money, Moov Money (Flooz), Celtiis Cash', role: 'traitement des paiements', pays: null },
  { nom: 'Google Firebase', role: 'notifications sur l’application mobile', pays: 'États-Unis' },
  { nom: 'Services de notification des navigateurs (Google, Mozilla, Apple…)', role: 'notifications sur le site web, si vous les activez', pays: null },
  { nom: 'LocationIQ', role: 'conversion d’adresses en coordonnées pour situer les biens', pays: 'États-Unis' },
  { nom: 'Umami', role: 'mesure d’audience anonyme, uniquement si vous l’acceptez', pays: null },
]
