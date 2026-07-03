import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../api/biensApi'
import BienCard from './BienCard'

const TYPES = [
  { key: '', label: 'Tous' },
  { key: 'maison', label: 'Maison' },
  { key: 'appart_vide', label: 'Appart. vide' },
  { key: 'appart_meuble', label: 'Appart. meublé' },
  { key: 'terrain', label: 'Terrain' },
  { key: 'guesthouse', label: 'Guesthouse' },
]

const TRANSACTIONS = [
  { key: '', label: 'Tous' },
  { key: 'location', label: 'À louer' },
  { key: 'vente', label: 'À vendre' },
]

type Props = {
  open: boolean
  onClose: () => void
  initialSearch?: string
}

export default function SearchModal({ open, onClose, initialSearch = '' }: Props) {
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [transaction, setTransaction] = useState('')
  const [ville, setVille] = useState(initialSearch)
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setVille(initialSearch)
      setTimeout(() => inputRef.current?.focus(), 100)
      if (initialSearch) doSearch(initialSearch)
    }
  }, [open, initialSearch])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const doSearch = async (overrideVille?: string) => {
    setLoading(true)
    setSearched(true)
    try {
      const params: any = {}
      if (type) params.type = type
      if (transaction) params.transaction = transaction
      const v = overrideVille ?? ville
      if (v.trim()) params.ville = v.trim()
      if (prixMin) params.prix_min = Number(prixMin)
      if (prixMax) params.prix_max = Number(prixMax)
      const data = await biensApi.list(params)
      setBiens(Array.isArray(data) ? data : data.data || [])
    } catch (_) { setBiens([]) }
    setLoading(false)
  }

  const reset = () => {
    setType(''); setTransaction(''); setVille(''); setPrixMin(''); setPrixMax('')
    setBiens([]); setSearched(false)
  }

  const handleClose = () => { reset(); onClose() }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal panel — full screen mobile, centered card desktop */}
      <div className="relative flex flex-col bg-white z-10 h-full md:h-auto md:max-h-[90vh] md:m-auto md:w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 px-4 md:px-6 pt-safe pt-4 pb-4 border-b border-divider">
          {/* Mobile drag handle */}
          <div className="md:hidden w-10 h-1 bg-divider rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={ville}
                onChange={e => setVille(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Ville, quartier, type de bien…"
                className="w-full bg-surface-g rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              {ville && (
                <button onClick={() => setVille('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-grey">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-g text-text-grey hover:text-text-dark flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters row */}
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-text-grey self-center flex-shrink-0">Transaction :</span>
              {TRANSACTIONS.map(t => (
                <button key={t.key} onClick={() => setTransaction(t.key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${transaction === t.key ? 'bg-primary text-white border-primary' : 'border-divider text-text-grey hover:border-primary/40'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-text-grey self-center flex-shrink-0">Type :</span>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${type === t.key ? 'bg-primary text-white border-primary' : 'border-divider text-text-grey hover:border-primary/40'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" value={prixMin} onChange={e => setPrixMin(e.target.value)} placeholder="Prix min (FCFA)"
                className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-xs outline-none" />
              <input type="number" value={prixMax} onChange={e => setPrixMax(e.target.value)} placeholder="Prix max (FCFA)"
                className="flex-1 bg-surface-g rounded-xl px-3 py-2.5 text-xs outline-none" />
              <button onClick={() => doSearch()}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-white text-xs shadow-btn hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}>
                Chercher
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(n => <div key={n} className="bg-surface-g rounded-2xl h-48 animate-pulse" />)}
            </div>
          ) : searched && biens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-surface-g rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-semibold text-text-dark mb-1">Aucun résultat</p>
              <p className="text-sm text-text-grey">Essayez d'autres critères</p>
            </div>
          ) : biens.length > 0 ? (
            <>
              <p className="text-sm text-text-grey mb-3">
                <strong className="text-text-dark">{biens.length}</strong> résultat{biens.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 gap-3 pb-4">
                {biens.map(b => (
                  <div key={b.id} onClick={() => { handleClose(); navigate(`/biens/${b.id}`) }} className="cursor-pointer">
                    <BienCard bien={b} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-surface-g rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-grey">Tapez une ville ou utilisez les filtres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
