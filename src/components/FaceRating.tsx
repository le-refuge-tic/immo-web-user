type FaceCfg = { face: string; light: string; rim: string; feature: string; cheek?: string; label: string }

const CONFIG: Record<number, FaceCfg> = {
  1: { face: '#FF5252', light: '#FFA8A8', rim: '#D32F2F', feature: '#7F0000', label: 'Très\nmécontent' },
  2: { face: '#FF9800', light: '#FFC966', rim: '#E65100', feature: '#5D2800', label: 'Insatisfait' },
  3: { face: '#FFCA28', light: '#FFE699', rim: '#F9A825', feature: '#5C4000', label: 'Neutre' },
  4: { face: '#66BB6A', light: '#A5D6A7', rim: '#2E7D32', feature: '#1B3A1C', cheek: '#FF8A80', label: 'Satisfait' },
  5: { face: '#26C6DA', light: '#80DEEA', rim: '#00838F', feature: '#00363A', cheek: '#FF8A80', label: 'Ravi' },
}

// ── Traits par note — reprend les proportions du dessin natif (mobile) ──────
function FaceSvg({ rating, size }: { rating: number; size: number }) {
  const cfg = CONFIG[rating]
  const gid = `face-grad-${rating}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={cfg.light} />
          <stop offset="100%" stopColor={cfg.face} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${gid})`} />
      <circle cx="50" cy="50" r="44.5" fill="none" stroke={cfg.rim} strokeOpacity={0.55} strokeWidth={2.2} />
      <ellipse cx="38" cy="30" rx="10" ry="5" fill="#fff" opacity={0.28} transform="rotate(-18 38 30)" />

      {(rating === 4 || rating === 5) && cfg.cheek && (
        <>
          <ellipse cx="26" cy="54" rx="9.5" ry="5" fill={cfg.cheek} opacity={0.28} />
          <ellipse cx="74" cy="54" rx="9.5" ry="5" fill={cfg.cheek} opacity={0.28} />
        </>
      )}

      {/* Sourcils */}
      {rating === 5 && <path d="M25.6 34.4 Q36.2 28.8 46.8 34.4" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 5 && <path d="M53.2 34.4 Q63.8 28.8 74.4 34.4" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 4 && <path d="M25.6 32.5 Q36.2 28.8 46.8 32.5" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 4 && <path d="M53.2 32.5 Q63.8 28.8 74.4 32.5" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 3 && <path d="M25.6 30.7 Q36.2 28.8 46.8 30.7" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 3 && <path d="M53.2 30.7 Q63.8 28.8 74.4 30.7" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 2 && <path d="M25.6 22.4 Q36.2 28.8 46.8 39.0" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 2 && <path d="M53.2 39.0 Q63.8 28.8 74.4 22.4" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 1 && <path d="M25.6 16.9 Q36.2 28.8 46.8 44.5" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 1 && <path d="M53.2 44.5 Q63.8 28.8 74.4 16.9" stroke={cfg.feature} strokeOpacity={0.75} strokeWidth={3.2} fill="none" strokeLinecap="round" />}

      {/* Yeux */}
      {rating === 5 && <path d="M32 42 Q38 34 44 42" stroke={cfg.feature} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating === 5 && <path d="M56 42 Q62 34 68 42" stroke={cfg.feature} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
      {rating !== 5 && rating !== 1 && (
        <>
          <ellipse cx="38" cy="43" rx="4.2" ry="5.8" fill={cfg.feature} />
          <ellipse cx="62" cy="43" rx="4.2" ry="5.8" fill={cfg.feature} />
          <circle cx="36.6" cy="41" r="1.4" fill="#fff" opacity={0.55} />
          <circle cx="60.6" cy="41" r="1.4" fill="#fff" opacity={0.55} />
        </>
      )}
      {rating === 1 && (
        <>
          <ellipse cx="38" cy="43" rx="4.2" ry="5.4" fill={cfg.feature} transform="rotate(12 38 43)" />
          <ellipse cx="62" cy="43" rx="4.2" ry="5.4" fill={cfg.feature} transform="rotate(-12 62 43)" />
          <circle cx="36.9" cy="41.3" r="1.3" fill="#fff" opacity={0.5} />
          <circle cx="60.9" cy="41.3" r="1.3" fill="#fff" opacity={0.5} />
        </>
      )}

      {/* Bouche */}
      {rating === 5 && (
        <>
          <path d="M20 60 A30 20 0 0 0 80 60" fill={cfg.feature} />
          <path d="M26.5 60.3 Q50 74 73.5 60.3 A24 10 0 0 1 26.5 60.3" fill="#fff" />
        </>
      )}
      {rating === 4 && <path d="M31 55 Q50 76 69 55" stroke={cfg.feature} strokeWidth={3.6} fill="none" strokeLinecap="round" />}
      {rating === 3 && <path d="M34 64 Q50 65.5 66 64" stroke={cfg.feature} strokeWidth={3.6} fill="none" strokeLinecap="round" />}
      {rating === 2 && <path d="M31 67 Q50 52 69 67" stroke={cfg.feature} strokeWidth={3.6} fill="none" strokeLinecap="round" />}
      {rating === 1 && <path d="M31 72 Q50 43 69 72" stroke={cfg.feature} strokeWidth={3.6} fill="none" strokeLinecap="round" />}
    </svg>
  )
}

export default function FaceRating({ selected, onSelect, size = 56 }: { selected: number | null; onSelect: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-start justify-between gap-1">
      {[5, 4, 3, 2, 1].map(n => {
        const cfg = CONFIG[n]
        const isSel = selected === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className="flex flex-col items-center gap-1.5 transition-transform duration-200"
            style={{ transform: isSel ? 'scale(1.22)' : 'scale(1)' }}
          >
            <div
              className="rounded-full transition-opacity duration-200"
              style={{
                opacity: selected !== null && !isSel ? 0.45 : 1,
                filter: isSel ? `drop-shadow(0 0 10px ${cfg.face}90)` : 'none',
              }}
            >
              <FaceSvg rating={n} size={size} />
            </div>
            <span
              className="text-center leading-tight whitespace-pre-line transition-all duration-150"
              style={{
                fontSize: isSel ? 10.5 : 9.5,
                fontWeight: isSel ? 700 : 500,
                color: isSel ? cfg.face : '#9E9E9E',
                maxWidth: size,
              }}
            >
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
