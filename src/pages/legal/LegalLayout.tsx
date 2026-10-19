import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEGAL_DRAFT, LEGAL_LAST_UPDATED } from '../../data/legal'
import { usePageTitle } from '../../utils/usePageTitle'

/** Valeur légale non fournie : marqueur visible plutôt qu'une valeur inventée. */
export function ACompleter({ label }: { label: string }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[13px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
      [{label} — à compléter]
    </span>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-text-dark">{title}</h2>
      {children}
    </section>
  )
}

/** Gabarit commun des pages légales : titre, date de mise à jour, texte lisible (≈ 70 caractères par ligne). */
export default function LegalLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  usePageTitle(title, description)
  const navigate = useNavigate()
  return (
    <div className="min-h-full">
      <article className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-28 md:pb-16">
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary dark:text-[#9DB0FF] mb-4">
          ← Retour
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark">{title}</h1>
        <p className="text-sm text-text-grey mt-2">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
        {LEGAL_DRAFT && (
          <p role="note" className="mt-4 rounded-xl px-4 py-3 text-sm bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:border-amber-300/25">
            Projet en cours de validation par l’éditeur : ce texte peut encore évoluer.
          </p>
        )}
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-text-grey [&_strong]:text-text-dark [&_a]:text-primary dark:[&_a]:text-[#9DB0FF] [&_a]:font-semibold [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </div>
      </article>
    </div>
  )
}
