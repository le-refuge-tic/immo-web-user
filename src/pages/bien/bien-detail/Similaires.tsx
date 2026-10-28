import type { Bien, Photo } from '../../../types/api'
import { resolveUrl } from './helpers'
import { SectionTitle } from './DetailSections'
import { suffixeUnite } from '../../../utils/prix'

interface SimilairesProps {
  similaires: Bien[]
  onOpen: (bienId: number) => void
}

// ─── Biens à proximité — liste verticale (panneau desktop) ─────────────────
export function SimilairesDesktop({ similaires, onOpen }: SimilairesProps) {
  return (
    <div className="mt-5">
      <p className="font-bold text-text-dark text-sm mb-3">Biens à proximité</p>
      <div className="space-y-2.5">
        {similaires.map(b => {
          const cover = b.photos?.find((p: Photo) => p.is_cover) || b.photos?.[0]
          return (
            <button key={b.id} onClick={() => onOpen(b.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl glass-card text-left hover:-translate-y-0.5 transition-transform">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(0,0,0,0.04)' }}>
                {cover ? <img loading="lazy" src={resolveUrl(cover.thumbnail_url || cover.url)} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-dark truncate">{Number(b.prix).toLocaleString('fr-FR')} FCFA{suffixeUnite(b)}</p>
                <p className="text-xs text-text-grey truncate">{b.localisation?.quartier ? `${b.localisation.quartier}, ` : ''}{b.localisation?.ville}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Biens à proximité — défilement horizontal (mobile) ────────────────────
export function SimilairesMobile({ similaires, onOpen }: SimilairesProps) {
  return (
      <div>
        <SectionTitle title="Biens à proximité" />
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {similaires.map(b => {
            const cover = b.photos?.find((p: Photo) => p.is_cover) || b.photos?.[0]
            return (
              <button key={b.id} onClick={() => onOpen(b.id)}
                className="flex-shrink-0 w-40 text-left rounded-xl overflow-hidden card-soft">
                <div className="w-40 h-28" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  {cover ? <img loading="lazy" src={resolveUrl(cover.thumbnail_url || cover.url)} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-bold text-text-dark truncate">{Number(b.prix).toLocaleString('fr-FR')} FCFA{suffixeUnite(b)}</p>
                  <p className="text-xs text-text-grey truncate">{b.localisation?.quartier ? `${b.localisation.quartier}, ` : ''}{b.localisation?.ville}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
  )
}
