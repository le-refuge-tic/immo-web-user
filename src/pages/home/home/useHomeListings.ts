import { useState, useEffect } from 'react'
import { biensApi } from '../../../api/biensApi'
import { favoritesApi } from '../../../api/favoritesApi'

/** Chargement des annonces (location + vente) et des favoris de l'utilisateur connecté. */
export function useHomeListings(isLoggedIn: boolean) {
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [favIds, setFavIds] = useState<Set<number>>(new Set())

  const loadBiens = async () => {
    setLoading(true); setLoadError(false)
    try {
      const [locData, venteData] = await Promise.all([
        biensApi.list({ transaction: 'location', limit: 100 }),
        biensApi.list({ transaction: 'vente',    limit: 100 }),
      ])
      const loc   = Array.isArray(locData)   ? locData   : locData.data   || []
      const vente = Array.isArray(venteData) ? venteData : venteData.data || []
      setBiens([...loc, ...vente])
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }

  const loadFavs = async () => {
    if (!isLoggedIn) return
    try {
      const data = await favoritesApi.list()
      const list = Array.isArray(data) ? data : data.data || []
      setFavIds(new Set(list.map((f: any) => f.bien_id || f.id)))
    } catch {}
  }

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- rechargement voulu uniquement à la connexion ou déconnexion ; les fonctions sont recréées à chaque rendu
  useEffect(() => { loadBiens(); loadFavs() }, [isLoggedIn])

  const handleFavToggle = (id: number, added: boolean) => {
    setFavIds(prev => {
      const next = new Set(prev)
      if (added) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return { biens, loading, loadError, favIds, loadBiens, handleFavToggle }
}
