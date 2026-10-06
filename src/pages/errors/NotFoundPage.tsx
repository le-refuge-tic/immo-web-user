import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../utils/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Page introuvable')
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-[70dvh] pt-[72px] md:pt-0 flex flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(75,107,255,0.10)' }}>
        <svg className="w-10 h-10 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-text-dark">Cette page n'existe pas</h1>
      <p className="text-sm text-text-grey max-w-sm">
        L'adresse <span className="font-semibold break-all">{pathname}</span> est introuvable. Elle a peut-être été déplacée ou mal saisie.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <Link to="/search" className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold">Rechercher un bien</Link>
        <Link to="/" className="px-5 py-3 rounded-xl border border-divider text-text-dark text-sm font-semibold">Accueil</Link>
      </div>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold text-sm">Retour</button>
    </div>
  )
}
