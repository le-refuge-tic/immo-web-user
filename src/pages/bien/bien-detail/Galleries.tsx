interface GalleryProps {
  allUrls: string[]
  photoIdx: number
  setPhotoIdx: (updater: number | ((i: number) => number)) => void
  altText: string
}

// ─── Galerie mobile / tablette ─────────────────────────────────────────────
export function GalleryMobile({ allUrls, photoIdx, setPhotoIdx, altText, showOwnBack, onBack }: GalleryProps & {
  showOwnBack: boolean; onBack: () => void
}) {
  return (
    <div className="lg:hidden relative h-72 md:h-[420px]" style={{ background: 'rgba(0,0,0,0.04)' }}>
      {allUrls.length > 0 ? (
        <img loading="lazy" src={allUrls[photoIdx]} alt={altText || 'Photo du bien'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
          <svg className="w-20 h-20 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      )}
      {showOwnBack && (
        <button
          onClick={onBack}
          aria-label="Retour"
          className="absolute left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
          style={{ top: 'calc(72px + env(safe-area-inset-top, 0px) + 8px)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {allUrls.length > 1 && (
        <>
          <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} aria-label="Photo précédente" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} aria-label="Photo suivante" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
            {photoIdx + 1} / {allUrls.length}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Galerie desktop (image principale + vignettes) ────────────────────────
export function GalleryDesktop({ allUrls, photoIdx, setPhotoIdx, altText }: GalleryProps) {
  return (
    <>
    <div className="relative rounded-2xl overflow-hidden" style={{ height: 480, background: 'rgba(0,0,0,0.04)' }}>
      {allUrls.length > 0 ? (
        <img loading="lazy" src={allUrls[photoIdx]} alt={altText || 'Photo du bien'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
          <svg className="w-24 h-24 text-text-grey/30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      )}
      {allUrls.length > 1 && (
        <>
          <button onClick={() => setPhotoIdx(i => (i - 1 + allUrls.length) % allUrls.length)} aria-label="Photo précédente" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setPhotoIdx(i => (i + 1) % allUrls.length)} aria-label="Photo suivante" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
            {photoIdx + 1} / {allUrls.length}
          </div>
        </>
      )}
    </div>
    {allUrls.length > 1 && (
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {allUrls.map((url, i) => (
          <button aria-label={`Voir la photo ${i + 1}`} key={i} onClick={() => setPhotoIdx(i)}
            className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img loading="lazy" src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )}
    </>
  )
}
