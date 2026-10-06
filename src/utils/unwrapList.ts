import type { ListResponse } from '../types/api'

/** Normalise une réponse « tableau brut ou { data: [...] } » en tableau. */
export function unwrapList<T>(res: ListResponse<T> | null | undefined): T[] {
  if (Array.isArray(res)) return res
  return res?.data ?? []
}
