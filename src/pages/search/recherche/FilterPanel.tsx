import {
  TRANSACTIONS, TYPES, SOUS_TYPES, BUDGET_PRESETS, BUDGET_PRESETS_NUIT, BUDGET_PRESETS_HEURE,
  EQUIPEMENTS_CLES, EQUIPEMENTS_CLES_SALLE, EVENEMENTS_CLES, CAPACITES_SALLE, CAPACITE_MAX_FILTRE,
} from './options'
import type { Tokens } from './tokens'
import { PIECES_MAX } from '../../../utils/searchFilters'

/* ══════════════════════════════════════════════════════════════
   FilterPanel
   ══════════════════════════════════════════════════════════════ */
type FilterPanelProps = {
  isDark: boolean; tk: Tokens
  transaction: string; setTransaction: (v: string) => void
  type: string; setType: (v: string) => void
  prixMin: string; setPrixMin: (v: string) => void
  prixMax: string; setPrixMax: (v: string) => void
  sousType: string; setSousType: (v: string) => void
  pieces: string; setPieces: (v: string) => void
  superficieMin: string; setSuperficieMin: (v: string) => void
  superficieMax: string; setSuperficieMax: (v: string) => void
  capaciteMin: string; setCapaciteMin: (v: string) => void
  equipements: string[]; setEquipements: (v: string[]) => void
  garage: boolean; setGarage: (v: boolean) => void
  evenement: string; setEvenement: (v: string) => void
  parking: boolean; setParking: (v: boolean) => void
}

export default function FilterPanel({
  isDark: _isDark, tk, transaction, setTransaction, type, setType, prixMin, setPrixMin, prixMax, setPrixMax,
  sousType, setSousType, pieces, setPieces,
  superficieMin, setSuperficieMin, superficieMax, setSuperficieMax,
  capaciteMin, setCapaciteMin, equipements, setEquipements, garage, setGarage,
  evenement, setEvenement, parking, setParking,
}: FilterPanelProps) {
  const showSuperficie = false // E8 : superficie masquée des critères (code conservé)
  // Guesthouse : pas de sous-type ni de pièces (critères d'appartement) ; capacité, équipements et garage à la place
  const isGuesthouse = type === 'guesthouse'
  // Salle de fêtes : idem, avec événement, capacité en personnes, parking et budget à l'heure
  const isSalleFete = type === 'salle_fete'
  const critereDedie = isGuesthouse || isSalleFete
  const presets = isSalleFete ? BUDGET_PRESETS_HEURE : isGuesthouse ? BUDGET_PRESETS_NUIT : BUDGET_PRESETS
  const basculerEquipement = (code: string) =>
    setEquipements(equipements.includes(code) ? equipements.filter(c => c !== code) : [...equipements, code])

  return (
    <div className="space-y-4">

      {/* Transaction */}
      <div>
        <p id="filtre-transaction" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Transaction
        </p>
        <div role="group" aria-labelledby="filtre-transaction" className="flex gap-1.5">
          {TRANSACTIONS.map(t => (
            <button key={t.key} onClick={() => setTransaction(t.key)} aria-pressed={transaction === t.key}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={transaction === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <p id="filtre-type" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Type de bien
        </p>
        <div role="group" aria-labelledby="filtre-type" className="flex flex-wrap gap-1.5">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} aria-pressed={type === t.key}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={type === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isGuesthouse && (
        <>
          <div>
            <p id="filtre-capacite" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
              Voyageurs (minimum)
            </p>
            <div role="group" aria-labelledby="filtre-capacite">
              <Stepper value={capaciteMin} onChange={setCapaciteMin} max={CAPACITE_MAX_FILTRE} tk={tk} moins="Un voyageur de moins" plus="Un voyageur de plus" />
            </div>
          </div>
          <div>
            <p id="filtre-equipements" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
              Équipements
            </p>
            <div role="group" aria-labelledby="filtre-equipements" className="flex flex-wrap gap-1.5">
              {EQUIPEMENTS_CLES.map(e => (
                <button key={e.code} type="button" onClick={() => basculerEquipement(e.code)} aria-pressed={equipements.includes(e.code)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={equipements.includes(e.code) ? tk.pillActive : tk.pillIdle}>
                  {e.label}
                </button>
              ))}
              <button type="button" onClick={() => setGarage(!garage)} aria-pressed={garage}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={garage ? tk.pillActive : tk.pillIdle}>
                Garage
              </button>
            </div>
          </div>
        </>
      )}

      {isSalleFete && (
        <>
          <div>
            <p id="filtre-evenement" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
              Événement
            </p>
            <div role="group" aria-labelledby="filtre-evenement" className="flex flex-wrap gap-1.5">
              {EVENEMENTS_CLES.map(e => (
                <button key={e.code} type="button" onClick={() => setEvenement(evenement === e.code ? '' : e.code)} aria-pressed={evenement === e.code}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={evenement === e.code ? tk.pillActive : tk.pillIdle}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p id="filtre-capacite-salle" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
              Personnes (minimum)
            </p>
            <div role="group" aria-labelledby="filtre-capacite-salle" className="flex flex-wrap gap-1.5">
              {CAPACITES_SALLE.map(n => (
                <button key={n} type="button" onClick={() => setCapaciteMin(capaciteMin === String(n) ? '' : String(n))} aria-pressed={capaciteMin === String(n)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={capaciteMin === String(n) ? tk.pillActive : tk.pillIdle}>
                  {n}+
                </button>
              ))}
            </div>
          </div>
          <div>
            <p id="filtre-equipements-salle" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
              Équipements
            </p>
            <div role="group" aria-labelledby="filtre-equipements-salle" className="flex flex-wrap gap-1.5">
              {EQUIPEMENTS_CLES_SALLE.map(e => (
                <button key={e.code} type="button" onClick={() => basculerEquipement(e.code)} aria-pressed={equipements.includes(e.code)}
                  className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={equipements.includes(e.code) ? tk.pillActive : tk.pillIdle}>
                  {e.label}
                </button>
              ))}
              <button type="button" onClick={() => setParking(!parking)} aria-pressed={parking}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={parking ? tk.pillActive : tk.pillIdle}>
                Parking
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sous-type */}
      {!critereDedie && <div>
        <p id="filtre-sous-type" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Sous-type
        </p>
        <div role="group" aria-labelledby="filtre-sous-type" className="flex flex-wrap gap-1.5">
          {SOUS_TYPES.map(t => (
            <button key={t.key} onClick={() => setSousType(sousType === t.key ? '' : t.key)} aria-pressed={sousType === t.key}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={sousType === t.key ? tk.pillActive : tk.pillIdle}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>}

      {/* Pièces */}
      {!critereDedie && <div>
        <p id="filtre-pieces" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          Nombre de pièces
        </p>
        <div role="group" aria-labelledby="filtre-pieces">
          <Stepper value={pieces} onChange={setPieces} max={PIECES_MAX} tk={tk} />
          <p className="text-micro mt-1" style={{ color: tk.labelClr }}>Chambres + salons</p>
        </div>
      </div>}

      {/* Superficie */}
      {showSuperficie && (
        <div>
          <p id="filtre-superficie" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
            Superficie (m²)
          </p>
          <div role="group" aria-labelledby="filtre-superficie" className="grid grid-cols-2 gap-2">
            {[
              { label: 'Min', value: superficieMin, set: setSuperficieMin, ph: '0' },
              { label: 'Max', value: superficieMax, set: setSuperficieMax, ph: '∞' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-micro mb-1 font-medium" style={{ color: tk.labelClr }}>{f.label}</p>
                <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                  style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.ph} min={0}
                    className="flex-1 bg-transparent outline-none text-sm min-w-0"
                    style={{ color: tk.textClr }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      <div>
        <p id="filtre-budget" className="block text-caption font-bold uppercase tracking-wider mb-2" style={{ color: tk.labelClr }}>
          {isSalleFete ? 'Prix par heure (FCFA)' : isGuesthouse ? 'Prix par nuit (FCFA)' : 'Budget (FCFA)'}
        </p>
        <div role="group" aria-labelledby="filtre-budget" className="flex flex-wrap gap-1.5 pb-1 mb-3">
          {presets.map(p => {
            const active = prixMax === String(p.max)
            return (
              <button key={p.max}
                onClick={() => { setPrixMin(''); setPrixMax(active ? '' : String(p.max)) }}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active ? {
                  background: 'rgba(255,107,53,0.14)',
                  border: '1px solid rgba(255,107,53,0.40)',
                  color: 'var(--c-accent)',
                } : tk.pillIdle}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Min', value: prixMin, set: setPrixMin, ph: '0' },
            { label: 'Max', value: prixMax, set: setPrixMax, ph: '∞' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-micro mb-1 font-medium" style={{ color: tk.labelClr }}>{f.label}</p>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
                <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} min={0}
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                  style={{ color: tk.textClr }} />
                <span className="text-micro flex-shrink-0 font-medium" style={{ color: tk.labelClr }}>FCFA</span>
              </div>
            </div>
          ))}
        </div>
        {(prixMin || prixMax) && (
          <p className="text-xs mt-2" style={{ color: tk.labelClr }}>
            {prixMin && prixMax
              ? `De ${Number(prixMin).toLocaleString('fr-FR')} à ${Number(prixMax).toLocaleString('fr-FR')} FCFA`
              : prixMin
              ? `À partir de ${Number(prixMin).toLocaleString('fr-FR')} FCFA`
              : `Jusqu'à ${Number(prixMax).toLocaleString('fr-FR')} FCFA`}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Stepper ── */
/** Compteur (pièces, voyageurs…) : vide (« — ») = indifférent, le dernier cran affiche « max+ ». */
function Stepper({ value, onChange, max, tk, moins = 'Une pièce de moins', plus = 'Une pièce de plus' }: {
  value: string; onChange: (v: string) => void; max: number; tk: Tokens; moins?: string; plus?: string
}) {
  const n = Math.min(Number(value) || 0, max)
  return (
    <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl"
      style={{ background: tk.fieldBg, border: `1px solid ${tk.fieldBdr}` }}>
      <button type="button" aria-label={moins} disabled={n === 0}
        onClick={() => onChange(n > 1 ? String(n - 1) : '')}
        className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold disabled:opacity-40"
        style={{ background: tk.pillIdle.background as string, color: tk.textClr }}>
        −
      </button>
      <span className="text-sm font-semibold min-w-[1.5rem] text-center" style={{ color: tk.textClr }} aria-live="polite">
        {n === 0 ? '—' : n >= max ? `${max}+` : n}
      </span>
      <button type="button" aria-label={plus} disabled={n >= max}
        onClick={() => onChange(String(n + 1))}
        className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold disabled:opacity-40"
        style={{ background: 'rgba(75,107,255,0.14)', color: 'var(--tx-blue)' }}>
        +
      </button>
    </div>
  )
}
