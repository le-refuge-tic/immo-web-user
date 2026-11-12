import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ContexteToast, type TonToast } from './useToast'

interface Toast { id: number; message: string; ton: TonToast }

const DUREE_MS = 5000
const CLASSES: Record<TonToast, string> = {
  success: 'border-l-4 border-l-[var(--tx-green)]',
  error: 'border-l-4 border-l-[var(--tx-red)]',
  info: 'border-l-4 border-l-[var(--tx-blue)]',
}

/**
 * Toasts de session (règle du projet : toute alerte métier produit une notification).
 * Placés au-dessus de la BottomNav grâce à --bottom-nav-h.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const suivant = useRef(0)

  const fermer = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])
  const afficher = useCallback((message: string, ton: TonToast = 'success') => {
    suivant.current += 1
    const id = suivant.current
    setToasts(prev => [...prev.slice(-2), { id, message, ton }])
    setTimeout(() => fermer(id), DUREE_MS)
  }, [fermer])

  return (
    <ContexteToast.Provider value={afficher}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-0 z-[1100] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(var(--bottom-nav-h, 0px) + 16px)' }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.ton === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-[var(--p-card)] text-[var(--p-text)] px-4 py-3 text-sm shadow-xl ${CLASSES[t.ton]}`}
          >
            <span className="flex-1 leading-snug">{t.message}</span>
            <button type="button" aria-label="Fermer" onClick={() => fermer(t.id)} className="text-[var(--p-muted)] hover:text-[var(--p-text)] text-lg leading-none">×</button>
          </div>
        ))}
      </div>
    </ContexteToast.Provider>
  )
}
