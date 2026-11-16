import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import logoUrl from '../../../assets/REFUGE-ICON.webp'
import { HERO_IMG } from './constants'
import { PersonIcon } from './icons'
import type { HomeSearch } from './useHomeSearch'
import type { Tokens } from './tokens'

/**
 * Lot 9 — en-tête de l'accueil sur téléphone et tablette (jusqu'à `lg`) : fond du thème (plus de
 * `#0a0a0a`), en-tête compact (logo, salutation, avatar — sur tablette la barre du haut les porte
 * déjà), image adoucie par un dégradé léger et barre de recherche arrondie qui flotte dessus.
 */
export default function MobileHeader({ search, goToSearch, tk, isDark }: Pick<HomeSearch, 'search' | 'goToSearch'> & { tk: Tokens; isDark: boolean }) {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.prenom || user?.nom || 'vous'
  const initials  = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <header className="lg:hidden px-4 md:px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
      <div className="md:hidden flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={logoUrl} alt="REFUGE" className="object-contain flex-shrink-0" style={{ width: 44, height: 'auto' }} />
          <div className="min-w-0">
            <p className="font-extrabold text-[17px] tracking-tight leading-none" style={{ color: 'var(--c-cyan)' }}>REFUGE</p>
            <h1 className="text-caption mt-1 font-medium truncate" style={{ color: tk.textSecond }}>
              {isLoggedIn ? `Bonjour, ${firstName}` : 'Trouvez votre bien'}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(isLoggedIn ? '/profil' : '/login')}
          aria-label={isLoggedIn ? 'Mon profil' : 'Se connecter'}
          className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))', boxShadow: '0 4px 14px rgba(75,107,255,0.28)' }}
        >
          {isLoggedIn && user?.photo_profil ? (
            <img src={user.photo_profil} className="w-10 h-10 object-cover" alt="" />
          ) : isLoggedIn ? (
            <span className="text-white font-bold text-sm">{initials}</span>
          ) : (
            <PersonIcon />
          )}
        </button>
      </div>

      {/* Image adoucie, recherche flottante à cheval sur son bord bas */}
      <div className="relative mb-9 md:mb-10">
        <div className="relative h-40 md:h-48 rounded-[20px] overflow-hidden" style={{ boxShadow: isDark ? 'none' : '0 10px 30px rgba(29,29,31,0.08)' }}>
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: isDark
            ? 'linear-gradient(to bottom, rgba(15,15,20,0.15), rgba(15,15,20,0.65))'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(20,24,40,0.45))' }} />
          <div className="absolute left-4 right-4 bottom-9 md:bottom-10">
            <p className="text-white font-bold text-lg md:text-xl leading-snug" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.25)' }}>
              Trouvez votre logement, en confiance.
            </p>
            <button type="button" onClick={() => navigate(isLoggedIn ? '/nouveau-bien' : '/register')}
              className="mt-1 block text-left text-xs font-semibold text-white/90 underline underline-offset-4 decoration-white/50">
              Vous êtes propriétaire ? Publier mon bien gratuitement
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={goToSearch}
          className="absolute left-3 right-3 -bottom-6 rounded-full flex items-center px-4 py-3.5 gap-3 text-left"
          style={{
            background: isDark ? 'rgba(30,30,42,0.96)' : 'rgba(255,255,255,0.97)',
            border: `1px solid ${tk.fieldBdr}`,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 10px 28px rgba(29,29,31,0.12)',
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--c-brand)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 min-w-0 text-sm truncate" style={{ color: search.trim() ? tk.textPrimary : tk.textMuted }}>
            {search.trim() || 'Ville, quartier, type de bien…'}
          </span>
        </button>
      </div>
    </header>
  )
}
