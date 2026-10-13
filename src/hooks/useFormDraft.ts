import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { FormDraft } from '../utils/formDraft'

const FLUSH_INTERVAL_MS = 1000

function browserStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    return localStorage
  } catch {
    // Stockage interdit (navigation privée stricte) : le brouillon est simplement désactivé.
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
}

/**
 * Brouillon d'un formulaire long (FE-B-002) : écrit dans le navigateur toutes
 * les secondes et à la fermeture de la page, restauré à la réouverture.
 * Appeler `draft.clear()` une fois le formulaire envoyé.
 */
export function useFormDraft(key: string): FormDraft {
  const [draft] = useState(() => new FormDraft(key, browserStorage()))

  useEffect(() => {
    const flush = () => draft.flush()
    const timer = setInterval(flush, FLUSH_INTERVAL_MS)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
      flush()
    }
  }, [draft])

  return draft
}

/** `useState` dont la valeur est conservée dans le brouillon sous `name`. */
export function useDraftState<T>(draft: FormDraft, name: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => draft.initialValue(name, fallback))
  useEffect(() => { draft.set(name, value) }, [draft, name, value])
  return [value, setValue]
}
