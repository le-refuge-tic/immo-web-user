import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Placement = 'bottom' | 'center' | 'responsive' | 'right'

interface ModalSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  className?: string
  /** `bottom` : feuille en bas ; `center` : centré ; `responsive` : feuille sur mobile, centré dès md ; `right` : panneau latéral pleine hauteur. */
  placement?: Placement
  /** Classes de largeur du panneau (défaut : pleine largeur, max 32rem). */
  panelClassName?: string
  /** Opacité du fond (0 à 1). */
  backdropOpacity?: number
  /** `false` : ni clic sur le fond ni Échap ne ferment (ex. paiement en cours). */
  dismissible?: boolean
  zIndex?: number
}

const PLACEMENT_CLASS: Record<Placement, string> = {
  bottom: 'items-end justify-center',
  center: 'items-center justify-center p-4',
  responsive: 'items-end md:items-center justify-center md:p-4',
  right: 'items-stretch justify-end',
}

// Modales ouvertes, de la plus ancienne à la plus récente : seule la dernière réagit à Échap,
// et le défilement de la page n'est rendu qu'à la fermeture de la dernière.
const openStack: symbol[] = []

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Fenêtre modale accessible : le fond n'est jamais masqué aux lecteurs d'écran
 * (seul le dialogue porte `role`), le focus entre dans la fenêtre à l'ouverture,
 * reste piégé dedans et revient à l'élément d'origine à la fermeture (FE-C-005).
 */
export function ModalSheet({
  open,
  onClose,
  children,
  label,
  className = '',
  placement = 'bottom',
  panelClassName = 'w-full max-w-lg',
  backdropOpacity = 0.45,
  dismissible = true,
  zIndex = 50,
}: ModalSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Lus dans les écouteurs sans les inscrire en dépendance : un `onClose` inline
  // ne doit pas relancer l'effet (et voler le focus) à chaque rendu.
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  })

  useEffect(() => {
    if (!open) return

    const id = Symbol('modal')
    openStack.push(id)
    const isTop = () => openStack[openStack.length - 1] === id

    previousFocusRef.current = document.activeElement
    // Sans élément focalisable (écran d'attente), le dialogue lui-même reçoit le focus.
    const firstFocusable = overlayRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(firstFocusable ?? panelRef.current)?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (!isTop()) return
      if (e.key === 'Escape') {
        if (dismissibleRef.current) onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !overlayRef.current) return
      const nodes = overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes.length) {
        e.preventDefault()
        panelRef.current?.focus()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      const outside = !overlayRef.current.contains(active)
      if (outside || (e.shiftKey ? active === first : active === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      const index = openStack.indexOf(id)
      if (index >= 0) openStack.splice(index, 1)
      if (openStack.length === 0) document.body.style.overflow = ''
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
      }
    }
  }, [open])

  if (!open) return null

  const style: CSSProperties = { background: `rgba(0,0,0,${backdropOpacity})`, backdropFilter: 'blur(2px)', zIndex }

  return createPortal(
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- fermeture au clic sur le fond : le clavier dispose d'Échap (géré plus haut)
    <div
      ref={overlayRef}
      className={`fixed inset-0 flex ${PLACEMENT_CLASS[placement]} ${className}`}
      style={style}
      onClick={e => { if (dismissible && e.target === e.currentTarget) onClose() }}
    >
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- le panneau arrête seulement la propagation du clic vers le fond ; il reçoit le focus par programme */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`${panelClassName} outline-none`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
