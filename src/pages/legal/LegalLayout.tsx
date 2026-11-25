import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { editeur, RECEPISSE_APDP } from '../../data/legal'
import { usePageTitle } from '../../utils/usePageTitle'

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-text-dark">{title}</h2>
      {children}
    </section>
  )
}

/** Tableau à deux colonnes ou plus, défilant horizontalement sur mobile. */
export function LegalTable({ entetes, lignes }: { entetes?: string[]; lignes: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-divider">
      <table className="w-full text-sm border-collapse">
        {entetes && <thead>
          <tr>{entetes.map(e => <th key={e} scope="col" className="text-left font-semibold text-text-dark bg-surface-g px-3 py-2 border-b border-divider">{e}</th>)}</tr>
        </thead>}
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} className="align-top">
              {l.map((c, j) => <td key={j} className="px-3 py-2 border-t border-divider first:font-medium first:text-text-dark">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Numéro du récépissé APDP, ou mention d'attente tant qu'il n'est pas attribué. */
export function RecepisseApdp() {
  return RECEPISSE_APDP
    ? <strong>Récépissé APDP n° {RECEPISSE_APDP}</strong>
    : <>Récépissé APDP : <strong>numéro en cours d’attribution</strong> par l’APDP à l’issue des formalités préalables.</>
}

/** Adresse email de contact, sélectionnable d'un clic. */
export const EmailContact = () => <a href={`mailto:${editeur.email}`}>{editeur.email}</a>

const AUTRES_DOCUMENTS = [
  { to: '/cgu', label: 'Conditions générales d’utilisation' },
  { to: '/confidentialite', label: 'Politique de confidentialité' },
  { to: '/cookies', label: 'Politique cookies' },
  { to: '/mentions-legales', label: 'Mentions légales' },
]

/** Gabarit commun des pages légales : titre, date de mise à jour, texte lisible (≈ 70 caractères par ligne). */
export default function LegalLayout({ title, description, miseAJour, children }: { title: string; description: string; miseAJour: string; children: ReactNode }) {
  usePageTitle(title, description)
  const navigate = useNavigate()
  return (
    <div className="min-h-full">
      <article className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 pb-28 md:pb-16">
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary dark:text-brand-soft mb-4">
          ← Retour
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark">{title}</h1>
        <p className="text-sm text-text-grey mt-2">Plateforme REFUGE, éditée par {editeur.nom} · Dernière mise à jour : {miseAJour}</p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-text-grey [&_strong]:text-text-dark [&_a]:text-primary dark:[&_a]:text-brand-soft [&_a]:font-semibold [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_h3]:font-semibold [&_h3]:text-text-dark">
          {children}
        </div>
        <nav aria-label="Autres documents légaux" className="mt-12 pt-6 border-t border-divider">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {AUTRES_DOCUMENTS.map(d => (
              <li key={d.to}><Link to={d.to} className="font-semibold text-primary dark:text-brand-soft hover:underline">{d.label}</Link></li>
            ))}
          </ul>
        </nav>
      </article>
    </div>
  )
}
