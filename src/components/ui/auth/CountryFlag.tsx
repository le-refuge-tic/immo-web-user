// Drapeaux SVG inline — rendu identique sur toutes plateformes (Windows inclus),
// contrairement aux emojis drapeaux qui dégradent en lettres sous Windows.

interface Props {
  code: string
  className?: string
}

const FLAG_W = 20
const FLAG_H = 14

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={FLAG_W}
      height={FLAG_H}
      viewBox="0 0 20 14"
      className="auth-phone-flag-svg"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {children}
      <rect x="0.25" y="0.25" width="19.5" height="13.5" rx="1.5" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
    </svg>
  )
}

// Bénin : bande verticale verte + deux bandes horizontales (jaune / rouge)
function FlagBJ() {
  return (
    <Frame>
      <rect width="20" height="14" rx="1.5" fill="#FCD116" />
      <rect y="7" width="20" height="7" fill="#E8112D" />
      <rect width="8" height="14" fill="#008751" />
    </Frame>
  )
}

// Togo : 5 bandes (vert/jaune) + carré rouge avec étoile blanche
function FlagTG() {
  return (
    <Frame>
      <rect width="20" height="14" rx="1.5" fill="#FFCE00" />
      <rect y="0" width="20" height="2.8" fill="#006A4E" />
      <rect y="5.6" width="20" height="2.8" fill="#006A4E" />
      <rect y="11.2" width="20" height="2.8" fill="#006A4E" />
      <rect width="8" height="8" fill="#D21034" />
      <path d="M4 1.8l0.62 1.9h2l-1.62 1.18 0.62 1.9L4 5.6 2.38 6.78l0.62-1.9L1.38 3.7h2z" fill="#fff" />
    </Frame>
  )
}

// Côte d'Ivoire : orange / blanc / vert (vertical)
function FlagCI() {
  return (
    <Frame>
      <rect width="20" height="14" rx="1.5" fill="#fff" />
      <rect width="6.67" height="14" fill="#F77F00" />
      <rect x="13.33" width="6.67" height="14" fill="#009E60" />
    </Frame>
  )
}

// Sénégal : vert / jaune / rouge (vertical) + étoile verte centrale
function FlagSN() {
  return (
    <Frame>
      <rect width="20" height="14" rx="1.5" fill="#FDEF42" />
      <rect width="6.67" height="14" fill="#00853F" />
      <rect x="13.33" width="6.67" height="14" fill="#E31B23" />
      <path d="M10 4.4l0.7 2.15h2.26l-1.83 1.33 0.7 2.15L10 8.9 8.17 10.23l0.7-2.15L7.04 6.55h2.26z" fill="#00853F" />
    </Frame>
  )
}

// France : bleu / blanc / rouge (vertical)
function FlagFR() {
  return (
    <Frame>
      <rect width="20" height="14" rx="1.5" fill="#fff" />
      <rect width="6.67" height="14" fill="#002395" />
      <rect x="13.33" width="6.67" height="14" fill="#ED2939" />
    </Frame>
  )
}

const FLAGS: Record<string, () => React.ReactElement> = {
  '+229': FlagBJ,
  '+228': FlagTG,
  '+225': FlagCI,
  '+221': FlagSN,
  '+33': FlagFR,
}

export function CountryFlag({ code }: Props) {
  const Flag = FLAGS[code] ?? FlagBJ
  return <Flag />
}
