import coordsData from './quartiers_coordonnees.json'

type QCoords = { nom: string; nom_normalise: string; arrondissement: string; lat: number; lng: number }

const COORDS = coordsData as QCoords[]
const BY_NORM = new Map(COORDS.map(c => [c.nom_normalise, c]))

/** Normalise un nom de quartier : minuscules, sans accents, sans tirets. Miroir du mobile. */
export function normalizeQuartier(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/ +/g, ' ')
    .trim()
}

function findCoords(quartierName: string): QCoords | null {
  const norm = normalizeQuartier(quartierName)
  if (!norm) return null

  const exact = BY_NORM.get(norm)
  if (exact) return exact

  for (const c of COORDS) {
    if (c.nom_normalise.startsWith(norm) || norm.startsWith(c.nom_normalise)) return c
  }

  // Le jeu de coordonnées ne couvre qu'Abomey-Calavi : un quartier de Cotonou
  // (ex: "Sègbeya-Nord") n'y figure jamais, mais un simple mot générique
  // partagé ("nord", "centre"…) suffisait à faire "matcher" un quartier
  // d'Abomey-Calavi sans rapport — d'où l'exigence d'une majorité de mots
  // en commun plutôt qu'un seul, pour ne pas afficher une fausse distance.
  const queryWords = new Set(norm.split(' ').filter(w => w.length >= 3))
  if (queryWords.size === 0) return null
  let best: QCoords | null = null
  let bestScore = 0
  for (const c of COORDS) {
    const words = new Set(c.nom_normalise.split(' '))
    let overlap = 0
    queryWords.forEach(w => { if (words.has(w)) overlap++ })
    if (overlap > bestScore) { bestScore = overlap; best = c }
  }
  return bestScore > 0 && bestScore / queryWords.size > 0.5 ? best : null
}

/** Coordonnées (lat, lng) du centroïde d'un quartier, ou null si introuvable (data Abomey-Calavi uniquement). */
export function getQuartierCoords(quartierName: string): { lat: number; lng: number } | null {
  const c = findCoords(quartierName)
  return c ? { lat: c.lat, lng: c.lng } : null
}

const RAD = (deg: number) => (deg * Math.PI) / 180

/** Distance haversine en km entre deux points GPS. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371
  const dLat = RAD(lat2 - lat1)
  const dLng = RAD(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(RAD(lat1)) * Math.cos(RAD(lat2)) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Distance en km entre deux noms de quartier, ou null si l'un des deux est introuvable. */
export function distanceEntreQuartiers(a: string, b: string): number | null {
  const ca = getQuartierCoords(a)
  const cb = getQuartierCoords(b)
  if (!ca || !cb) return null
  return haversineKm(ca.lat, ca.lng, cb.lat, cb.lng)
}
