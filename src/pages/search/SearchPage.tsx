import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import BienCard from '../../components/BienCard'

const TYPES = [
  { key: '', label: 'Tous les types' },
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
    } catch (_) { setBiens([]) }
    setLoading(false)
  }

  useEffect(() => { doSearch() }, [])

  const resetFilters = () => {
    setType(''); setTransaction(''); setVille(''); setPrixMin(''); setPrixMax('')
  }

  const hasFilters = type || transaction || ville.trim() || prixMin || prixMax

  return (
    <div className="min-h-dvh bg-app-bg">

      {/* ── MOBILE header ── */}
      <div className="md:hidden bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text-dark">Recherche</h1>
        </div>
        <MobileFilters
          type={type} setType={setType}
          transaction={transaction} setTransaction={setTransaction}
          ville={ville} setVille={setVille}
          prixMin={prixMin} setPrixMin={setPrixMin}
          prixMax={prixMax} setPrixMax={setPrixMax}
          onSearch={doSearch}
        />
      </div>

      {/* ── DESKTOP layout ── */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-dark">Recherche avancée</h1>
          <p className="text-text-grey text-sm mt-1">Trouvez le bien qui correspond à vos critères</p>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-6 items-start">

          {/* Sidebar filtres */}
          <div className="bg-white rounded-2xl p-6 shadow-card sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text-dark">Filtres</h2>
              {hasFilters && (
                <button onClick={() => { resetFilters(); doSearch() }} className="text-xs text-primary font-semibold hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">Transaction</p>
                <div className="space-y-1.5">
                  {TRANSACTIONS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTransaction(t.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${transaction === t.key ? 'bg-primary/10 text-primary' : 'text-text-grey hover:bg-surface-g'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${transaction === t.key ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {transaction === t.key && <div className="w-full h-full rounded-full bg-white scale-50" />}
                      </div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-divider" />

              <div>
                <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">Type de bien</p>
                <div className="space-y-1.5">
                  {TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setType(t.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${type === t.key ? 'bg-primary/10 text-primary' : 'text-text-grey hover:bg-surface-g'}`}
                    >
                      <div className={`w-4 h-4 rounded flex-shrink-0 border-2 ${type === t.key ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                        {type === t.key && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-divider" />

              <div>
                <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">Ville / Quartier</p>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-grey" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSearch()}
                    placeholder="Ex: Cotonou, Akpakpa…"
                    className="w-full bg-surface-g rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="h-px bg-divider" />

              <div>
                <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-2.5">Fourchette de prix (FCFA)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={prixMin}
                    onChange={e => setPrixMin(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="flex items-center text-text-grey text-sm">–</span>
                  <input
                    type="number"
                    value={prixMax}
                    onChange={e => setPrixMax(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-surface-g rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                onClick={doSearch}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-btn flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </button>
            </div>
          </div>

          {/* Résultats */}
          <div>
            {loading ? (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(n => <div key={n} className="bg-white rounded-2xl h-64 animate-pulse" />)}
                </div>
              </>
            ) : searched && biens.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-surface-g rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-text-dark mb-2">Aucun résultat</h3>
                <p className="text-text-grey text-sm">Essayez d'élargir vos critères de recherche</p>
                {hasFilters && (
                  <button onClick={() => { resetFilters(); doSearch() }} className="mt-4 text-primary font-semibold text-sm hover:underline">
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : biens.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-text-grey">
                    <strong className="text-text-dark">{biens.length}</strong> résultat{biens.length > 1 ? 's' : ''}
                    {hasFilters && ' pour ces critères'}
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {biens.map(b => <BienCard key={b.id} bien={b} />)}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-surface-g rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-text-dark mb-2">Définissez vos critères</h3>
                <p className="text-text-grey text-sm">Utilisez les filtres à gauche pour trouver votre bien idéal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE results ── */}
      <div className="md:hidden px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(n => <div key={n} className="bg-white rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : searched && biens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-g rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-grey" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-text-dark font-semibold mb-1">Aucun résultat</p>
            <p className="text-text-grey text-sm">Modifiez vos critères</p>
          </div>
        ) : biens.length > 0 ? (
          <>
            <p className="text-sm text-text-grey mb-3"><strong className="text-text-dark">{biens.length}</strong> résultat{biens.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-3">
              {biens.map(b => <BienCard key={b.id} bien={b} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-grey text-sm">Définissez vos critères ci-dessus et lancez la recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}

type FiltersProps = {
  type: string; setType: (v: string) => void
  transaction: string; setTransaction: (v: string) => void
  ville: string; setVille: (v: string) => void
  prixMin: string; setPrixMin: (v: string) => void
  prixMax: string; setPrixMax: (v: string) => void
  onSearch: () => void
}

function MobileFilters({ type, setType, transaction, setTransaction, ville, setVille, prixMin, setPrixMin, prixMax, setPrixMax, onSearch }: FiltersProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-text-grey mb-2">Transaction</p>
        <div className="flex gap-2">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${transaction === t.key ? 'bg-primary text-white' : 'bg-surface-g text-text-grey'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-grey mb-2">Type de bien</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${type === t.key ? 'bg-primary text-white' : 'bg-surface-g text-text-grey'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-grey mb-2">Ville / Quartier</p>
        <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex: Cotonou, Akpakpa…"
          className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-grey mb-2">Prix min</p>
          <input type="number" value={prixMin} onChange={e => setPrixMin(e.target.value)} placeholder="0"
            className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-text-grey mb-2">Prix max</p>
          <input type="number" value={prixMax} onChange={e => setPrixMax(e.target.value)} placeholder="∞"
            className="w-full bg-surface-g rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
      </div>
      <button onClick={onSearch}
        className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-btn flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #4B6BFF 0%, #7B4BFF 100%)' }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Rechercher
      </button>
    </div>
  )
}
