/**
 * Informations légales de la plateforme REFUGE, reprises des documents officiels
 * signés par l'éditeur (dossier « Documents officiels » : mentions légales, CGU,
 * politique de confidentialité, politique cookies, récépissé de consentement).
 * Toute modification doit d'abord être faite dans ces documents.
 */

/** Dates de dernière mise à jour, telles qu'elles figurent sur chaque document officiel. */
export const MAJ = {
  mentions: '4 novembre 2026',
  cgu: '25 novembre 2026',
  confidentialite: '25 novembre 2026',
  cookies: '13 octobre 2026',
} as const

export const editeur = {
  nom: 'LE REFUGE TIC',
  formeJuridique: 'entreprise individuelle',
  rccm: 'RB/ABC/22 A 48057',
  ifu: '0202271165781',
  adresse:
    "Abomey-Calavi, Calavi Kpota, en face de l'église des Témoins de Jéhovah (côté opposé) ; locaux de ADL ÉNERGIE ET SERVICES (deuxième bureau à droite)",
  directeurPublication: 'POSSY BERRY QUENUM Sedjro Confort Bernard',
  email: 'contact@lerefugetic.com',
  telephones: ['+229 01 97 31 39 91', '+229 01 93 46 37 16'],
} as const

/** Responsable du traitement des données (politique de confidentialité, § 1). */
export const responsableTraitement = {
  nom: 'POSSY BERRY QUENUM Sedjro Confort Bernard',
  telephone: '+229 01 96 76 60 49',
  email: 'quenumconfort@gmail.com',
} as const

/** Numéro du récépissé délivré par l'APDP : `null` tant qu'il n'est pas attribué. */
export const RECEPISSE_APDP: string | null = null

export const cadreLegal = {
  loi: 'loi n° 2017-20 du 20 avril 2018 portant code du numérique en République du Bénin',
  apdp: {
    nom: 'Autorité de Protection des Données Personnelles (APDP)',
    siege: 'Rue 6.076 « Aïdjèdo, Immeuble El MARZOUK Joël », 01 BP 04837 Cotonou',
    telephone: '+229 21 32 57 88 / 69 55 00 00',
    email: 'contact@apdp.bj',
    site: 'https://www.apdp.bj',
  },
} as const

/** Hébergeurs (mentions légales, § 2). */
export const hebergeurs: { nom: string; service: string; pays: string }[] = [
  { nom: 'Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis · vercel.com)', service: 'Application web', pays: 'États-Unis' },
  { nom: 'Render', service: 'API', pays: 'Allemagne (Francfort)' },
  { nom: 'Supabase', service: 'Base de données', pays: 'Allemagne (Francfort)' },
  { nom: 'Cloudflare R2 (Cloudflare, Inc.)', service: "Sauvegardes et journaux d'activité", pays: "Europe de l'Ouest" },
  { nom: 'Axiom (Axiom, Inc.)', service: "Centralisation des journaux d'activité", pays: 'Union européenne' },
]

/** Destinataires et transferts (politique de confidentialité, § 6). */
export const destinataires: { nom: string; role: string; pays: string }[] = [
  { nom: 'Wirepick (WIREPICK SARL)', role: "Envoi des codes de vérification (OTP) par SMS ; seuls vos numéros de téléphone lui sont transmis, uniquement à cette fin", pays: 'Bénin (entité locale) ; Canada (siège)' },
  { nom: 'FedaPay (FEDAPAY SA)', role: 'Gestion des paiements (données de paiement) et versement des retraits (numéro Mobile Money de retrait, réseau et montant)', pays: 'Bénin' },
  { nom: 'Umami Cloud (Umami Software, Inc.)', role: 'Statistiques de fréquentation, uniquement si vous y consentez', pays: 'Union européenne' },
  { nom: 'Vercel Inc.', role: "Hébergement de l'application web", pays: 'États-Unis' },
  { nom: 'Render', role: 'Hébergement des API', pays: 'Allemagne (Francfort)' },
  { nom: 'Supabase', role: 'Base de données', pays: 'Allemagne (Francfort)' },
  { nom: 'Cloudflare R2 (Cloudflare, Inc.)', role: "Stockage des sauvegardes journalières de la base de données et des journaux d'activité chiffrés", pays: "Europe de l'Ouest" },
  { nom: 'Axiom (Axiom, Inc.)', role: "Centralisation des journaux d'activité, transmis de manière chiffrée (HTTPS ou TLS)", pays: 'Union européenne (Francfort)' },
  { nom: 'Firebase Cloud Messaging (Google)', role: "Notifications de l'application Android, si vous les avez acceptées : contenu de la notification et identifiant de votre appareil", pays: 'Union européenne (Belgique et Pays-Bas)' },
  { nom: 'OpenStreetMap Foundation', role: "Affichage de la carte d'un bien dans l'application Android : adresse IP et zone de la carte consultée", pays: 'Royaume-Uni' },
]
