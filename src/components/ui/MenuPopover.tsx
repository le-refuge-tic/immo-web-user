import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])'

interface MenuPopoverProps {
  /** Nom accessible du menu (ex. « Options de la conversation »). */
  label: string
  onClose: () => void
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Menu contextuel accessible (FE-C-005) : le focus entre sur la première entrée,
 * les flèches, Début et Fin naviguent, Échap et Tab ferment, et le focus revient
 * au bouton d'origine à la fermeture, sauf si une action l'a déjà déplacé ailleurs
 * (ex. le champ de saisie après « Répondre »).
 */
export function MenuPopover({ label, onClose, children, className = '', style }: MenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const menu = menuRef.current
    const previous = document.activeElement
    menu?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus()
    return () => {
      const active = document.activeElement
      const focusIsLost = !active || active === document.body || !!menu?.contains(active)
      if (focusIsLost && previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key === 'Tab') {
      onClose()
      return
    }
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])
    if (!items.length) return
    const current = items.indexOf(document.activeElement as HTMLElement)
    let next: number
    switch (e.key) {
      case 'ArrowDown': next = (current + 1) % items.length; break
      case 'ArrowUp': next = (current - 1 + items.length) % items.length; break
      case 'Home': next = 0; break
      case 'End': next = items.length - 1; break
      default: return
    }
    e.preventDefault()
    items[next].focus()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={label}
      className={className}
      style={style}
      onKeyDown={handleKeyDown}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

interface MenuItemProps {
  label: string
  onClick: () => void
  danger?: boolean
  /** Couleur du texte hors action destructive. */
  color: string
  /** Reprend le focus à l'affichage (ex. entrée qui remplace une confirmation annulée). */
  autoFocus?: boolean
}

/** Entrée de `MenuPopover` ; le fond au survol et au focus vient de `--menu-hover` posé sur le menu. */
export function MenuItem({ label, onClick, danger = false, color, autoFocus }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      autoFocus={autoFocus}
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-[13.5px] font-medium transition-colors cursor-pointer rounded-lg mx-1 outline-none hover:bg-[var(--menu-hover)] focus-visible:bg-[var(--menu-hover)] focus-visible:ring-2 focus-visible:ring-[#4160F2]"
      style={{ color: danger ? '#DC2626' : color, width: 'calc(100% - 8px)' }}
    >
      {label}
    </button>
  )
}
