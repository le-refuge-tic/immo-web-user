import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import logoUrl from '../../../assets/REFUGE-ICON.webp'
import { HERO_IMG } from './constants'
import { PersonIcon } from './icons'
import type { HomeSearch } from './useHomeSearch'

/** En-tête mobile : logo, accès profil, barre de recherche et lien de publication. */
export default function MobileHeader({ search, goToSearch }: Pick<HomeSearch, 'search' | 'goToSearch'>) {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.prenom || user?.nom || 'vous'
  const initials  = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="md:hidden relative px-4 pb-10 rounded-b-3xl" style={{ background: '#0a0a0a', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}>
      <img loading="lazy" src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 rounded-b-3xl" />
      <div className="absolute inset-0 rounded-b-3xl" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65))' }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <img loading="lazy" src={logoUrl} alt="REFUGE" className="object-contain drop-shadow-lg flex-shrink-0" style={{ width: 64, height: 'auto' }} />
            <div>
              <p className="text-white font-extrabold text-[17px] tracking-tight leading-none" style={{ color: '#00AEEF' }}>REFUGE</p>
              <h1 className="text-white/60 text-caption mt-0.5 font-normal">
                {isLoggedIn ? `Bonjour, ${firstName}` : 'Trouvez votre bien'}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/profil' : '/login')}
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))', boxShadow: '0 4px 12px rgba(75,107,255,0.4)' }}
          >
            {isLoggedIn && user?.photo_profil ? (
              <img loading="lazy" src={user.photo_profil} className="w-10 h-10 object-cover" alt="" />
            ) : isLoggedIn ? (
              <span className="text-white font-bold text-sm">{initials}</span>
            ) : (
              <PersonIcon />
            )}
          </button>
        </div>
        {/* Barre recherche mobile */}
        <button
          onClick={goToSearch}
          className="w-full rounded-xl flex items-center px-4 py-3.5 gap-3 text-left"
          style={{
            background: 'rgba(255,255,255,0.16)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 min-w-0 text-sm text-white/60 truncate">
            {search.trim() || 'Ville, quartier, type de bien…'}
          </span>
        </button>
        <button onClick={() => navigate(isLoggedIn ? '/nouveau-bien' : '/register')}
          className="mt-3 text-xs font-semibold text-white/80 underline underline-offset-4 decoration-white/40">
          Vous êtes propriétaire ? Publier mon bien gratuitement
        </button>
      </div>
    </div>
  )
}
