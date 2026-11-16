import type { ReactNode } from 'react'
import { fcfa, type TotauxGuesthouse, type TotauxSalle } from '../../../shared/biens/calculsTarifs'

/** Libellé de champ ; « (facultatif) » ajouté si demandé. */
export function Libelle({ children, facultatif, htmlFor }: { children: ReactNode; facultatif?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--p-muted)]">
      {children}
      {facultatif && <span className="normal-case tracking-normal font-normal"> (facultatif)</span>}
    </label>
  )
}

const classeChamp = 'w-full rounded-xl border border-[var(--p-border)] bg-[var(--p-deep)] px-4 py-3 text-sm text-[var(--p-text)] outline-none focus:border-primary'

export function Texte({ id, value, onChange, placeholder, type = 'text', maxLength, lignes }: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number; lignes?: number
}) {
  return lignes
    ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} rows={lignes} className={classeChamp} />
    : <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={classeChamp} />
}

export function Heure({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  return <input id={id} type="time" value={value} onChange={e => onChange(e.target.value)} className={classeChamp} />
}

/** Nombre entier saisi en texte (personnes, m², tables…), avec son unité. */
export function Entier({ id, value, onChange, unite, placeholder }: { id?: string; value: string; onChange: (v: string) => void; unite: string; placeholder?: string }) {
  return (
    <div className="relative">
      <input id={id} inputMode="numeric" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))} className={`${classeChamp} pr-24`} />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--p-muted)]">{unite}</span>
    </div>
  )
}

/** Oui / Non ; un second clic retire le choix si `annulable` (champ facultatif). */
export function OuiNon({ value, onChange, oui = 'Oui', non = 'Non', annulable = false, libelle }: {
  value: boolean | null; onChange: (v: boolean | null) => void; oui?: string; non?: string; annulable?: boolean; libelle: string
}) {
  const bouton = (v: boolean, texte: string) => {
    const actif = value === v
    return (
      <button type="button" role="radio" aria-checked={actif}
        onClick={() => onChange(actif && annulable ? null : v)}
        className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${actif ? 'border-primary bg-primary/10 text-[var(--p-accent-text)]' : 'border-[var(--p-border)] text-[var(--p-muted)]'}`}>
        {texte}
      </button>
    )
  }
  return <div role="radiogroup" aria-label={libelle} className="flex gap-2">{bouton(true, oui)}{bouton(false, non)}</div>
}

/** Choix unique facultatif : un second clic retire le choix (« non précisé »). */
export function ChoixFacultatif<V extends string>({ options, value, onChange, libelle }: {
  options: { value: V; label: string; aide?: string }[]; value: V | null; onChange: (v: V | null) => void; libelle: string
}) {
  return (
    <div role="radiogroup" aria-label={libelle} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map(o => {
        const actif = value === o.value
        return (
          <button key={o.value} type="button" role="radio" aria-checked={actif} onClick={() => onChange(actif ? null : o.value)}
            className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${actif ? 'border-primary bg-primary/10' : 'border-[var(--p-border)]'}`}>
            <span className={`block text-sm font-bold ${actif ? 'text-[var(--p-accent-text)]' : 'text-[var(--p-text)]'}`}>{o.label}</span>
            {o.aide && <span className="mt-0.5 block text-[11px] text-[var(--p-muted)]">{o.aide}</span>}
          </button>
        )
      })}
    </div>
  )
}

type Ligne = { libelle: string; valeur: string; fort?: boolean; aide?: string }

function Lignes({ lignes }: { lignes: Ligne[] }) {
  return (
    <section aria-label="Totaux" className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
      <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--p-accent-text)]">Totaux</h3>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
        {lignes.map(l => (
          <div key={l.libelle} className="contents">
            <dt className={l.fort ? 'border-t border-[var(--p-border)] pt-1.5 font-extrabold text-[var(--p-text)]' : 'text-[var(--p-muted)]'}>
              {l.libelle}{l.aide && <span className="block text-[11px] font-normal">{l.aide}</span>}
            </dt>
            <dd className={`text-right tabular-nums ${l.fort ? 'border-t border-[var(--p-border)] pt-1.5 font-extrabold text-[var(--p-accent-text)]' : 'font-semibold text-[var(--p-text)]'}`}>{l.valeur}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const nonPrecise = (n: number | null) => (n === null ? 'non précisé' : fcfa(n))
const reduction = (pct: number) => (pct > 0 ? `soit ${pct} % de réduction` : pct < 0 ? `soit ${-pct} % plus cher qu’à la nuit` : 'sans réduction')

/** Totaux d'une guesthouse (même calcul que le commercial : src/shared/biens/calculsTarifs). */
export function TotauxGuesthouseBloc({ t }: { t: TotauxGuesthouse | null }) {
  if (!t) return <p className="text-xs text-[var(--p-muted)]">Saisissez le prix par nuit pour voir les totaux.</p>
  const nuits = `${t.nuiteesMin} nuit${t.nuiteesMin > 1 ? 's' : ''}`
  const lignes: Ligne[] = [
    { libelle: 'Prix par nuit', valeur: fcfa(t.prixNuit) },
    { libelle: `Séjour minimum (${nuits})`, valeur: fcfa(t.sejourMinimum) },
    { libelle: 'Frais de ménage', valeur: nonPrecise(t.fraisMenage) },
    { libelle: 'Caution', valeur: nonPrecise(t.caution) },
    { libelle: `Total à l’arrivée (${nuits})`, valeur: fcfa(t.totalArrivee), fort: true, aide: 'séjour minimum + ménage + caution' },
  ]
  if (t.semaine) lignes.push({ libelle: 'Tarif semaine', valeur: fcfa(t.semaine.prix), aide: reduction(t.semaine.reductionPct) })
  if (t.mois) lignes.push({ libelle: 'Tarif mois', valeur: fcfa(t.mois.prix), aide: reduction(t.mois.reductionPct) })
  return <Lignes lignes={lignes} />
}

/** Totaux d'une salle de fêtes. */
export function TotauxSalleBloc({ t }: { t: TotauxSalle | null }) {
  if (!t) return <p className="text-xs text-[var(--p-muted)]">Saisissez le prix pour voir les totaux.</p>
  const lignes: Ligne[] = [
    { libelle: `Prix affiché (${t.dureeHeures} h)`, valeur: fcfa(t.prix) },
    { libelle: 'Prix à l’heure', valeur: fcfa(t.prixHeure) },
    { libelle: `Durée minimum (${t.heuresMin} h)`, valeur: fcfa(t.coutDureeMinimum) },
    { libelle: 'Caution', valeur: nonPrecise(t.caution) },
    { libelle: 'Frais de ménage', valeur: nonPrecise(t.fraisMenage) },
    { libelle: 'Total minimum à verser', valeur: fcfa(t.totalMinimum), fort: true, aide: 'durée minimum + caution + ménage' },
  ]
  if (t.forfaitJournee) lignes.push({ libelle: 'Forfait journée', valeur: fcfa(t.forfaitJournee) })
  if (t.forfaitWeekend) lignes.push({ libelle: 'Forfait week-end', valeur: fcfa(t.forfaitWeekend) })
  return <Lignes lignes={lignes} />
}
