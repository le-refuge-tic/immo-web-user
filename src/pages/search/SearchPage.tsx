import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import BienCard from '../../components/BienCard'

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

export default function SearchPage() {
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [transaction, setTransaction] = useState('')
  const [ville, setVille] = useState('')
  const [prixMin, setPrixMin] = useState('')
  const [prixMax, setPrixMax] = useState('')
  const [biens, setBiens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params: any = {}
      if (type) params.type = type
      if (transaction) params.transaction = transaction
      if (ville.trim()) params.ville = ville.trim()
      if (prixMin) params.prix_min = Number(prixMin)
      if (prixMax) params.prix_max = Number(prixMax)
      const data = await biensApi.list(params)
      setBiens(Array.isArray(data) ? data : data.data || [])
    } catch (_) {}
    setLoading(false)
  }

  return (
    <div className="min-h-full bg-app-bg">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text-dark">Recherche avancée</h1>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-text-grey mb-1.5">Type de transaction</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {TRANSACTIONS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTransaction(t.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold ${
                    transaction === t.key ? 'bg-primary text-white' : 'bg-surface-g text-text-grey'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-grey mb-1.5">Type de bien</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold ${
                    type === t.key ? 'bg-primary text-white' : 'bg-surface-g text-text-grey'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-grey mb-1.5">Ville / Quartier</p>
            <input
              value={ville}
              onChange={e => setVille(e.target.value)}
              placeholder="Ex: Cotonou, Akpakpa…"
              className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-grey mb-1.5">Prix min (FCFA)</p>
              <input
                type="number"
                value={prixMin}
                onChange={e => setPrixMin(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-grey mb-1.5">Prix max (FCFA)</p>
              <input
                type="number"
                value={prixMax}
                onChange={e => setPrixMax(e.target.value)}
                placeholder="∞"
                className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <button
            onClick={doSearch}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-btn flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(n => <div key={n} className="bg-white rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : searched && biens.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4 opacity-30">
              <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-grey text-sm">Aucun resultat pour ces criteres</p>
          </div>
        ) : biens.length > 0 ? (
          <>
            <p className="text-sm text-text-grey mb-3">{biens.length} resultat{biens.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-3">
              {biens.map(b => <BienCard key={b.id} bien={b} />)}
            </div>
          </>
        ) : !searched ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4 opacity-30">
              <svg className="w-16 h-16 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-text-grey text-sm">Definissez vos criteres et lancez la recherche</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
