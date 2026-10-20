import HERO_IMG from '../../../assets/hero-interior.webp'
import slide2 from '../../../assets/onboarding-1.webp'
import slide3 from '../../../assets/onboarding-2.webp'
import slide4 from '../../../assets/onboarding-3.webp'
import slide5 from '../../../assets/onboarding-side.webp'

export { HERO_IMG }

export const HERO_SLIDES = [HERO_IMG, slide2, slide3, slide4, slide5]

function norm(s: string) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function matchLoc(bien: any, query: string) {
  if (!query) return true
  const q = norm(query)
  const fields = [
    bien.localisation?.ville,
    bien.localisation?.quartier,
    bien.localisation?.commune,
    bien.localisation?.adresse,
  ].filter(Boolean).map((f: string) => norm(f))
  return fields.some(f => f.includes(q))
}

type Category = { key: string; label: string; transaction: string; type: string }
export const CATEGORIES: Category[] = [
  { key: 'Tous',        label: 'Tous',        transaction: '',         type: '' },
  { key: 'location',    label: 'À louer',     transaction: 'location', type: '' },
  { key: 'vente',       label: 'À vendre',    transaction: 'vente',    type: '' },
  { key: 'maison',      label: 'Maison',      transaction: '',         type: 'maison' },
  { key: 'appartement', label: 'Appartement', transaction: '',         type: 'appart_vide' },
  { key: 'terrain',     label: 'Terrain',     transaction: '',         type: 'terrain' },
  { key: 'guesthouse',  label: 'Guesthouse',  transaction: '',         type: 'guesthouse' },
]

export const TRANSACTIONS = [
  { key: '',         label: 'Tous' },
  { key: 'location', label: 'À louer' },
  { key: 'vente',    label: 'À vendre' },
]

export const TYPES = [
  { key: '',              label: 'Tous les types' },
  { key: 'maison',        label: 'Maison' },
  { key: 'appart_vide',   label: 'Appart. vide' },
  { key: 'appart_meuble', label: 'Appart. meublé' },
  { key: 'chambre_salon', label: 'Chambre-Salon' },
  { key: 'terrain',       label: 'Terrain' },
  { key: 'guesthouse',    label: 'Guesthouse' },
]

export const isSousType = (t: string) => t === 'chambre_salon'

export const BUDGET_PRESETS = [
  { label: '< 50K',  max: 50_000 },
  { label: '< 150K', max: 150_000 },
  { label: '< 500K', max: 500_000 },
  { label: '< 1M',   max: 1_000_000 },
  { label: '< 5M',   max: 5_000_000 },
]
