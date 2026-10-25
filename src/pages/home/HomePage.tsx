import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { usePageTitle } from '../../utils/usePageTitle'
import { useCarouselAutoplay } from '../../hooks/useCarouselAutoplay'
import { isSousType, matchLoc } from './home/constants'
import { useTokens } from './home/tokens'
import { useHomeSearch } from './home/useHomeSearch'
import { useHomeListings } from './home/useHomeListings'
import MobileHeader from './home/MobileHeader'
import DesktopHero from './home/DesktopHero'
import RecentCarousel from './home/RecentCarousel'
import ListingsSection from './home/ListingsSection'
import ServicesSection from './home/ServicesSection'
import LocationsMarquee from './home/LocationsMarquee'
import HomeFooter from './home/HomeFooter'

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tk = useTokens(isDark)
  usePageTitle('Accueil')

  const s = useHomeSearch()
  const { transaction, type, search, minVal, maxVal } = s
  const { biens, loading, loadError, favIds, loadBiens, handleFavToggle } = useHomeListings(isLoggedIn)

  const displayedBiens = biens
    .filter(b => !transaction || b.transaction === transaction)
    .filter(b => !type || (isSousType(type) ? b.amenites?.sous_type === type : b.type === type))
    .filter(b => !search.trim() || matchLoc(b, search.trim()))
    .filter(b => minVal == null || Number(b.prix) >= minVal)
    .filter(b => maxVal == null || Number(b.prix) <= maxVal)

  const UN_MOIS_MS = 30 * 24 * 60 * 60 * 1000
  const recentLocation = biens
    .filter(b => b.transaction === 'location' && b.created_at && (Date.now() - new Date(b.created_at).getTime()) <= UN_MOIS_MS)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6)

  const recentVente = biens
    .filter(b => b.transaction === 'vente')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6)

  const locCarousel = useCarouselAutoplay(recentLocation.length)
  const venteCarousel = useCarouselAutoplay(recentVente.length)

  const quartierCounts: Record<string, number> = {}
  for (const b of biens) {
    const q = b.localisation?.quartier?.trim()
    if (q) quartierCounts[q] = (quartierCounts[q] || 0) + 1
  }
  const quartiersActifs = Object.keys(quartierCounts).sort((a, b) => a.localeCompare(b, 'fr'))

  return (
    <div className="min-h-full overflow-x-hidden">

      {/* ══════════════ MOBILE HEADER ══════════════ */}
      <MobileHeader search={search} goToSearch={s.goToSearch} />

      {/* ══════════════ DESKTOP HERO ══════════════ */}
      <DesktopHero s={s} isDark={isDark} tk={tk} biens={biens} />

      {/* ══════════════ CARROUSELS DESKTOP ══════════════ */}

      {/* Location récente */}
      <RecentCarousel
        biens={recentLocation} carousel={locCarousel} favIds={favIds} onFavoriteToggle={handleFavToggle}
        isDark={isDark} tk={tk} topPaddingClass="pt-14"
        title="Biens récemment ajoutés pour location"
        description="Découvrez les derniers biens publiés sur REFUGE et réservez votre visite en quelques clics."
        titleColor="var(--tx-blue)" regionLabel="Biens récemment ajoutés pour location"
        pauseSubject="biens récemment ajoutés pour location"
        dotActive="var(--c-brand)" dotIdleDark="rgba(75,107,255,0.30)" dotIdleLight="rgba(75,107,255,0.20)"
      />

      {/* Vente récente */}
      <RecentCarousel
        biens={recentVente} carousel={venteCarousel} favIds={favIds} onFavoriteToggle={handleFavToggle}
        isDark={isDark} tk={tk} topPaddingClass="pt-10"
        title="Nos exclusivités en vente"
        description="Maisons, appartements, terrains à vendre au Bénin — découvrez les derniers biens publiés."
        titleColor="var(--c-accent)" regionLabel="Biens récemment ajoutés à la vente"
        pauseSubject="biens récemment ajoutés à la vente" pauseColor="var(--c-accent)"
        dotActive="var(--c-accent)" dotIdleDark="rgba(255,107,53,0.30)" dotIdleLight="rgba(255,107,53,0.20)"
      />

      {/* ══════════════ GRILLE ANNONCES ══════════════ */}
      <ListingsSection
        s={s} isDark={isDark} tk={tk} displayedBiens={displayedBiens}
        loading={loading} loadError={loadError} loadBiens={loadBiens}
        favIds={favIds} onFavoriteToggle={handleFavToggle}
      />

      {/* ══════════════ SERVICES ══════════════ */}
      <ServicesSection tk={tk} />

      {/* ══════════════ EMPLACEMENTS ══════════════ */}
      {quartiersActifs.length > 0 && (
        <LocationsMarquee quartiersActifs={quartiersActifs} quartierCounts={quartierCounts} isDark={isDark} tk={tk} />
      )}

      {/* ══════════════ FOOTER ══════════════ */}
      <HomeFooter isDark={isDark} tk={tk} />

    </div>
  )
}
