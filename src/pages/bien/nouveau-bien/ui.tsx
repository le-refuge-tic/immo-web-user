import type { ReactNode } from 'react'
import { BLUE } from './options'
import { withAlpha } from '../../../utils/color'
// ─── UI components — dark-themed ──────────────────────────────────────────

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${className ?? ''}`}
      style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', padding: '1rem' }}>
      {children}
    </div>
  )
}

export function Section({ title, required }: { title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-caption font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--p-muted)' }}>{title}</p>
      {required && (
        <span className="text-micro font-bold px-1.5 py-0.5 rounded"
          style={{ color: BLUE, background: withAlpha(BLUE, '20') }}>Obligatoire</span>
      )}
    </div>
  )
}

export function ChoiceList({ options, value, onChange, disabledValues, onDeselect }: {
  options: { value: string; label: string; sub?: string }[]
  value: string | null
  onChange: (v: string) => void
  disabledValues?: string[]
  onDeselect?: () => void
}) {
  return (
    <div className="space-y-2">
      {options.map(o => {
        const isDisabled = disabledValues?.includes(o.value) ?? false
        const isActive = value === o.value
        return (
          <button key={o.value} type="button" disabled={isDisabled}
            onClick={() => (isActive && onDeselect) ? onDeselect() : onChange(o.value)}
            className="w-full flex items-start justify-between gap-2 px-4 py-3 rounded-xl border-2 text-left transition-all"
            style={{
              borderColor: isActive ? BLUE : 'var(--p-border)',
              background: isActive ? withAlpha(BLUE, '18') : 'var(--p-deep)',
              opacity: isDisabled ? 0.4 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}>
            <span>
              <span className="block text-sm font-semibold"
                style={{ color: isActive ? BLUE : 'var(--p-text)' }}>{o.label}</span>
              {o.sub && <span className="block text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>{o.sub}</span>}
            </span>
            {isActive && !isDisabled && <span className="font-bold shrink-0" style={{ color: BLUE }}>✓</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-4 py-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all"
      style={{
        borderColor: active ? BLUE : 'var(--p-border)',
        background: active ? withAlpha(BLUE, '18') : 'transparent',
        color: active ? BLUE : 'var(--p-muted)',
      }}>
      {label}
    </button>
  )
}

export function Counter({ label, value, onChange, min = 0 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold border disabled:opacity-40 transition-colors"
          style={{ background: 'var(--p-deep)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}>−</button>
        <span className="w-6 text-center font-bold" style={{ color: 'var(--p-text)' }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors"
          style={{ background: withAlpha(BLUE, '20'), color: BLUE }}>+</button>
      </div>
    </div>
  )
}

export function NumberPicker({ presets, unit, value, isCustom, onPick, onCustomStart, customText, onCustomText }: {
  presets: number[]; unit: (n: number) => string; value: number; isCustom: boolean
  onPick: (n: number) => void; onCustomStart: () => void; customText: string; onCustomText: (t: string) => void
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map(n => (
          <Chip key={n} label={unit(n)} active={!isCustom && value === n} onClick={() => onPick(n)} />
        ))}
        <Chip label="Saisir" active={isCustom} onClick={onCustomStart} />
      </div>
      {isCustom && (
        <input type="number" value={customText} onChange={e => onCustomText(e.target.value)} placeholder="Nombre"
          className="mt-2.5 w-full rounded-xl px-4 py-2.5 text-sm outline-none border"
          style={{ background: 'var(--p-deep)', borderColor: BLUE, color: 'var(--p-text)' }} />
      )}
    </div>
  )
}

export function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '0'}
        className="w-full rounded-xl pl-4 pr-16 py-3 text-sm outline-none border transition-colors"
        style={{ background: 'var(--p-deep)', borderColor: 'var(--p-border)', color: 'var(--p-text)' }}
        onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold"
        style={{ color: 'var(--p-muted)' }}>FCFA</span>
    </div>
  )
}


// ─── RecapSection helper ────────────────────────────────────────────────────
export function RecapSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--p-border)' }}>
      <p className="text-xs font-bold mb-2" style={{ color: BLUE }}>{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0">
          <span className="font-bold text-xs shrink-0" style={{ color: BLUE }}>•</span>
          <span className="text-sm leading-snug" style={{ color: 'var(--p-text)' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────
