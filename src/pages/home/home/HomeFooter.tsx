import { useNavigate } from 'react-router-dom'
import logoUrl from '../../../assets/REFUGE-ICON.webp'
import { openConsentSettings } from '../../../lib/analytics'
import type { Tokens } from './tokens'

/** Pied de page desktop : présentation, liens de navigation et liens légaux. */
export default function HomeFooter({ isDark, tk }: { isDark: boolean; tk: Tokens }) {
  const navigate = useNavigate()

  return (
    <footer className="hidden md:block w-full px-8 lg:px-16 py-10"
      style={{
        background: isDark ? 'rgba(10,10,18,0.96)' : 'rgba(245,245,247,0.95)',
        backdropFilter: 'blur(48px) saturate(180%)',
        WebkitBackdropFilter: 'blur(48px) saturate(180%)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-10 flex-wrap">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#4160F2,#7B4BFF)', boxShadow: '0 4px 16px rgba(75,107,255,0.30)' }}>
              <img loading="lazy" src={logoUrl} alt="REFUGE" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight" style={{ color: 'var(--tx-blue)' }}>REFUGE</span>
              <p className="text-xs" style={{ color: tk.textMuted }}>Immobilier au Bénin</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: tk.textSecond }}>
            La plateforme de référence pour trouver, louer ou acheter un bien immobilier au Bénin.
          </p>
        </div>

        <div className="flex gap-10 md:gap-16 flex-wrap">
          {[
            { heading: 'Plateforme', links: [
              { label: 'Accueil', path: '/' },
              { label: 'Rechercher un bien', path: '/search' },
              { label: 'Mes favoris', path: '/favoris' },
              { label: 'Mes visites', path: '/mes-visites' },
            ]},
            // CGU à ajouter quand leur texte sera fourni par l'éditeur.
            { heading: 'Légal', links: [
              { label: 'Mentions légales', path: '/mentions-legales' },
              { label: 'Politique de confidentialité', path: '/confidentialite' },
              { label: 'Gérer les cookies', path: '#cookies' },
            ]},
          ].map(col => (
            <div key={col.heading}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: tk.textMuted }}>
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.path}>
                    <button onClick={() => (l.path === '#cookies' ? openConsentSettings() : navigate(l.path))}
                      className="text-sm transition-colors hover:text-brand"
                      style={{ color: tk.textSecond }}>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 flex items-center justify-between flex-wrap gap-4"
        style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
        <p className="text-xs" style={{ color: tk.textMuted }}>
          © {new Date().getFullYear()} REFUGE. Tous droits réservés. Bénin 🇧🇯
        </p>
      </div>
    </footer>
  )
}
