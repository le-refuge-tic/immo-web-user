import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rechercherQuartiers, type Quartier } from '../../../data/quartiers'
import { track } from '../../../lib/analytics'
import { isSousType } from './constants'

/** État de la recherche (champ ville/quartier, opération, type, budget) et navigation vers /search. */
export function useHomeSearch() {
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState(() => localStorage.getItem('rg_quartier') || localStorage.getItem('rg_ville') || '')
  const [showSuggest, setShowSuggest] = useState(false)
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')

  const suggestions: Quartier[] = search.trim().length >= 1 ? rechercherQuartiers(search) : []

  const minVal = prixMin ? Number(prixMin) : null
  const maxVal = prixMax ? Number(prixMax) : null

  const goToSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (transaction) params.set('transaction', transaction)
    if (type) { params.set(isSousType(type) ? 'sous_type' : 'type', type) }
    if (minVal != null) params.set('prix_min', String(minVal))
    if (maxVal != null) params.set('prix_max', String(maxVal))
    const qs = params.toString()
    track('recherche', { transaction: transaction || 'toutes', type: type || 'tous' })
    navigate(qs ? `/search?${qs}` : '/search')
  }

  return {
    transaction, setTransaction, type, setType, search, setSearch,
    showSuggest, setShowSuggest, prixMin, setPrixMin, prixMax, setPrixMax,
    suggestions, minVal, maxVal, goToSearch,
  }
}

export type HomeSearch = ReturnType<typeof useHomeSearch>
