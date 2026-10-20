// ─── Icônes — formes simples construites à partir de primitives SVG,
// fidèles aux icônes Material utilisées par l'écran mobile équivalent
// (bed_rounded, chair_rounded, kitchen_rounded, bathtub_rounded, wc_rounded,
// garage_rounded, deck_rounded, work_rounded, door_front_door_rounded…). ────
export type IconType =
  | 'bed' | 'sofa' | 'kitchen' | 'bathtub' | 'toilet' | 'garage' | 'deck' | 'briefcase' | 'door' | 'room'
  | 'ruler' | 'fence' | 'parking' | 'yard' | 'person' | 'people'
  | 'countertop' | 'plant' | 'shower' | 'paintroller' | 'car' | 'slidingdoor'
  | 'wallet' | 'calendargrid' | 'waterdrop' | 'bolt' | 'document' | 'tag' | 'clockrepeat'
  | 'gridon' | 'verified' | 'construction' | 'turnright' | 'map' | 'homework'


export function Icon({ type, className }: { type: IconType; className?: string }) {
  const cls = className || 'w-4 h-4'
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: cls }
  switch (type) {
    case 'bed':
      return <svg {...common}><rect x="3" y="11" width="18" height="7" rx="1.5" /><path d="M3 18v2M21 18v2" /><rect x="4" y="8" width="6" height="4" rx="1" /></svg>
    case 'sofa':
      return <svg {...common}><path d="M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4" /><rect x="3" y="12" width="18" height="6" rx="1.5" /><path d="M6 18v2M18 18v2" /></svg>
    case 'kitchen':
      return <svg {...common}><rect x="5" y="10" width="14" height="9" rx="1.5" /><path d="M3 11h2M19 11h2" /><path d="M9 10V7a3 3 0 016 0v3" /></svg>
    case 'bathtub':
      return <svg {...common}><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3z" /><path d="M4 12V9a2 2 0 012-2h1" /><path d="M4 19v2M20 19v2" /></svg>
    case 'toilet':
      return <svg {...common}><rect x="8" y="3" width="8" height="5" rx="1.5" /><path d="M7 8h10l-1 5a4 4 0 01-4 4h0a4 4 0 01-4-4l-1-5z" /><path d="M8 17l-1 4M16 17l1 4" /></svg>
    case 'garage':
      return <svg {...common}><path d="M3 16l1.5-5A2 2 0 016.4 9.5h11.2a2 2 0 011.9 1.5L21 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7.5" cy="20" r="1.3" fill="currentColor" /><circle cx="16.5" cy="20" r="1.3" fill="currentColor" /></svg>
    case 'deck':
      return <svg {...common}><path d="M12 3c4 0 7 2.5 7 6H5c0-3.5 3-6 7-6z" /><path d="M12 9v10M9 21h6" /></svg>
    case 'briefcase':
      return <svg {...common}><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" /><path d="M3 13h18" /></svg>
    case 'door':
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="14.5" cy="12" r="1" fill="currentColor" /></svg>
    case 'ruler':
      return <svg {...common}><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
    case 'fence':
      return <svg {...common}><path d="M4 21V9l4-3 4 3v12M4 13h8M12 21V9l4-3 4 3v12M12 13h8" /></svg>
    case 'parking':
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M10 16V8h3a3 3 0 010 6h-3" /></svg>
    case 'yard':
      return <svg {...common}><path d="M12 3c-3 0-5 2-5 5 0 2 1 3 2 4h6c1-1 2-2 2-4 0-3-2-5-5-5z" /><path d="M12 12v9" /></svg>
    case 'person':
      return <svg {...common}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    case 'people':
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0" /><circle cx="16" cy="9" r="2.5" /><path d="M13 20a5 5 0 019 0" /></svg>
    case 'countertop':
      return <svg {...common}><rect x="3" y="9" width="18" height="3" rx="1" /><rect x="5" y="12" width="14" height="8" rx="1" /><path d="M9 16v4M15 16v4" /></svg>
    case 'plant':
      return <svg {...common}><path d="M12 21v-8" /><path d="M12 13c0-3.2-2.2-5.5-5.5-5.5C6.5 10.7 8.8 13 12 13z" /><path d="M12 13c0-3.2 2.2-5.5 5.5-5.5C17.5 10.7 15.2 13 12 13z" /></svg>
    case 'shower':
      return <svg {...common}><path d="M7 4.5A5 5 0 0117 4.5" /><path d="M4 9h16" /><path d="M8 13v2M12 13v3M16 13v2" /></svg>
    case 'paintroller':
      return <svg {...common}><rect x="4" y="4" width="12" height="6" rx="1.5" /><path d="M9 10v4h3v6" /></svg>
    case 'car':
      return <svg {...common}><path d="M3 16l1.5-5A2 2 0 016.4 9.5h11.2a2 2 0 011.9 1.5L21 16" /><rect x="3" y="16" width="18" height="4" rx="1" /><circle cx="7.5" cy="20" r="1.3" fill="currentColor" /><circle cx="16.5" cy="20" r="1.3" fill="currentColor" /></svg>
    case 'slidingdoor':
      return <svg {...common}><rect x="3" y="4" width="9" height="16" rx="1" /><rect x="12" y="4" width="9" height="16" rx="1" /><path d="M8 12h.01M16 12h.01" /></svg>
    case 'wallet':
      return <svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1.1" fill="currentColor" /></svg>
    case 'calendargrid':
      return <svg {...common}><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M9 5v15M15 5v15" /></svg>
    case 'waterdrop':
      return <svg {...common}><path d="M12 21c-4 0-7-3-7-6.5C5 10 12 3 12 3s7 7 7 11.5c0 3.5-3 6.5-7 6.5z" /></svg>
    case 'bolt':
      return <svg {...common}><path d="M13 2L4.5 12.5H11L10 22l9.5-11.5H13L13 2z" /></svg>
    case 'document':
      return <svg {...common}><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 16h6" /></svg>
    case 'tag':
      return <svg {...common}><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.169.659 1.591l9.581 9.581c.699.699 1.83.699 2.528 0l7.409-7.409a1.79 1.79 0 000-2.528l-9.581-9.581A2.25 2.25 0 009.568 3z" /><circle cx="6.75" cy="6.75" r="1" fill="currentColor" /></svg>
    case 'clockrepeat':
      return <svg {...common}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path d="M12 6v6l4 2" /></svg>
    case 'gridon':
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
    case 'verified':
      return <svg {...common}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    case 'construction':
      return <svg {...common}><path d="M12 3l9 16H3L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>
    case 'turnright':
      return <svg {...common}><path d="M4 6h11a4 4 0 014 4v3" /><path d="M15 9l4-4-4-4" transform="translate(0 4)" /></svg>
    case 'map':
      return <svg {...common}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
    case 'homework':
      return <svg {...common}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
    case 'room':
    default:
      return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="1" /><circle cx="14.5" cy="12" r="1" fill="currentColor" /></svg>
  }
}
