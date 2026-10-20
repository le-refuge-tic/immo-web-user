import { useState } from 'react'
import Reveal from '../../../components/Reveal'
import type { Tokens } from './tokens'
import { withAlpha } from '../../../utils/color'

/** Arguments de vente de la plateforme (desktop uniquement). */
export default function ServicesSection({ tk }: { tk: Tokens }) {
  const [hoveredServiceIdx, setHoveredServiceIdx] = useState<number | null>(null)

  return (
    <div className="hidden md:block w-full px-8 lg:px-16 py-16">
      <Reveal animation="anim-fade-up" className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
          style={{ background: 'rgba(75,107,255,0.10)', color: 'var(--tx-blue)', border: '1px solid rgba(75,107,255,0.20)' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Pourquoi choisir REFUGE ?
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4" style={{ color: tk.textPrimary }}>
          L'immobilier au Bénin,<br />
          <span style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            sans mauvaises surprises.
          </span>
        </h2>
        <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: tk.textSecond }}>
          De la recherche à la signature, REFUGE centralise tout ce dont vous avez besoin pour trouver, visiter et louer en toute confiance.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Moteur de recherche', desc: 'Filtrez par ville, quartier, type de bien et budget. Trouvez votre logement en quelques secondes.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, color: 'var(--tx-blue)', bg: 'rgba(75,107,255,0.12)', tag: 'Recherche avancée' },
          { title: 'Visites en ligne',    desc: 'Réservez votre créneau en quelques clics. Confirmation en temps réel, rappel automatique.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 16l2 2 4-4" /></svg>, color: '#7B4BFF', bg: 'rgba(123,75,255,0.12)', tag: 'Agenda intelligent' },
          { title: 'Paiement sécurisé',  desc: 'Réglez via MTN MoMo ou FedaPay. Vos transactions sont chiffrées et tracées.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, color: '#00B087', bg: 'rgba(0,176,135,0.12)', tag: 'Mobile Money' },
          { title: 'Messagerie intégrée', desc: 'Discutez directement avec propriétaires et démarcheurs, sans intermédiaires.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', tag: 'Communication directe' },
          { title: 'Annonces modérées',  desc: 'Chaque annonce est examinée par notre équipe avant publication.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, color: 'var(--tx-blue)', bg: 'rgba(75,107,255,0.12)', tag: '100% fiable' },
          { title: 'Support réactif',    desc: "Une équipe disponible à chaque étape — de la recherche à l'emménagement.", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-2a4 4 0 014-4h10a4 4 0 014 4v2M3 18a2 2 0 002 2h1a1 1 0 001-1v-4a1 1 0 00-1-1H3v6zm18 0a2 2 0 01-2 2h-1a1 1 0 01-1-1v-4a1 1 0 011-1h3v6z" /></svg>, color: 'var(--tx-amber)', bg: 'rgba(255,152,0,0.12)', tag: 'Assistance 24h' },
        ].map((s, i) => (
          <Reveal key={s.title} animation="anim-fade-up" delay={i * 70}>
            <div
              className="service-card rounded-3xl p-6 h-full flex flex-col gap-4 cursor-default transition-all duration-200"
              style={{ outline: hoveredServiceIdx === i ? `1.5px solid ${withAlpha(s.color, '44')}` : 'none', transform: hoveredServiceIdx === i ? 'translateY(-6px)' : 'none' }}
              onMouseEnter={() => setHoveredServiceIdx(i)}
              onMouseLeave={() => setHoveredServiceIdx(null)}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <span className="text-micro font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {s.tag}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base mb-1.5" style={{ color: tk.textPrimary }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: tk.textSecond }}>{s.desc}</p>
              </div>
              <div className="mt-auto pt-3">
                <div className="h-0.5 w-8 rounded-full" style={{ background: s.color, opacity: 0.4 }} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
