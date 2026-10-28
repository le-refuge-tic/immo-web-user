import { useRef, useState, useEffect } from 'react'
import { biensApi } from '../../api/biensApi'
import QuartierPicker from '../../components/QuartierPicker'
import { trouverQuartierExact } from '../../data/quartiers'
import { apiMessage } from '../../utils/apiMessage'
import type { Bien, Localisation } from '../../types/api'
import type { BienPayload } from '../../api/biensApi'
import { ModalSheet } from '../../components/ui/ModalSheet'

type Props = { bien: Bien; onClose: () => void; onSaved: (bien: Bien) => void }

export default function EditBienModal({ bien, onClose, onSaved }: Props) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const loc: Localisation & { arrondissement?: string } = bien.localisation || {}
  const [prix, setPrix] = useState(String(bien.prix ?? ''))
  const [prixPromo, setPrixPromo] = useState(bien.prix_promo != null ? String(bien.prix_promo) : '')
  const [fraisVisite, setFraisVisite] = useState(String(bien.frais_visite ?? ''))
  const [description, setDescription] = useState(bien.description || '')
  const [quartier, setQuartier] = useState(loc.quartier || '')
  const [ville, setVille] = useState(loc.ville || '')
  const [arrondissement, setArrondissement] = useState(loc.arrondissement || '')
  const [adresse, setAdresse] = useState(loc.adresse || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const submit = async () => {
    if (!prix.trim()) {
      setError('Le prix est obligatoire')
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (prixPromo.trim() && Number(prixPromo) >= Number(prix)) {
      setError('Le prix promotionnel doit être inférieur au prix normal')
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    setError('')
    try {
      const body: BienPayload = {
        prix: Number(prix),
        prix_promo: prixPromo.trim() ? Number(prixPromo) : null,
        frais_visite: fraisVisite.trim() ? Number(fraisVisite) : 0,
        description: description.trim() || undefined,
        localisation: {
          ville: ville || undefined,
          quartier: quartier || undefined,
          adresse: adresse.trim() || undefined,
        },
      }
      const updated = await biensApi.update(bien.id, body)
      const saved = updated.data || updated.bien || updated
      setSuccess(true)
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => onSaved(saved), 900)
    } catch (err: unknown) {
      setError(apiMessage(err) || 'Erreur lors de la mise à jour')
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setSaving(false)
  }

  return (
    <ModalSheet open onClose={onClose} label="Modifier le bien" placement="center" panelClassName="w-full max-w-md" backdropOpacity={0.4}>
      <div
        ref={scrollRef}
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider sticky top-0 bg-white">
          <h2 className="font-bold text-text-dark">Modifier le bien</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-g text-text-grey">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {success && (
            <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-2.5">
              <p className="text-success text-sm font-semibold">Bien mis à jour avec succès</p>
            </div>
          )}
          <div role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide">Informations tarifaires</p>
          <div>
            <label htmlFor="edit-bien-prix" className="text-xs font-semibold text-text-dark mb-1.5 block">Prix (FCFA)</label>
            <input id="edit-bien-prix" type="number" value={prix} onChange={e => setPrix(e.target.value)}
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor="edit-bien-prix-promo" className="text-xs font-semibold text-text-dark mb-1.5 block">Prix promotionnel (FCFA)</label>
            <input id="edit-bien-prix-promo" type="number" value={prixPromo} onChange={e => setPrixPromo(e.target.value)} placeholder="Laisser vide pour aucune promo"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <p className="text-caption text-text-grey mt-1">Affiché en avant sur la fiche du bien, à la place du prix normal.</p>
          </div>
          <div>
            <label htmlFor="edit-bien-frais-visite" className="text-xs font-semibold text-text-dark mb-1.5 block">Frais de visite (FCFA)</label>
            <input id="edit-bien-frais-visite" type="number" value={fraisVisite} onChange={e => setFraisVisite(e.target.value)} placeholder="0 si gratuit"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide pt-2">Description</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Décrivez le bien…"
            className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" />

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide pt-2">Localisation</p>
          <div>
            <label htmlFor="edit-bien-quartier" className="text-xs font-semibold text-text-dark mb-1.5 block">Quartier</label>
            <QuartierPicker
              id="edit-bien-quartier"
              value={quartier}
              onChange={setQuartier}
              onSelect={q => { setVille(q.ville); setArrondissement(q.arrondissement) }}
              onBlur={() => {
                if (!quartier.trim()) return
                const trouve = trouverQuartierExact(quartier)
                if (trouve) { setVille(trouve.ville); setArrondissement(trouve.arrondissement) }
              }}
            />
          </div>
          <div>
            <label htmlFor="edit-bien-arrondissement" className="text-xs font-semibold text-text-dark mb-1.5 block">Arrondissement</label>
            <input id="edit-bien-arrondissement" value={arrondissement} readOnly disabled
              className="w-full bg-surface-g border border-divider rounded-xl px-4 py-2.5 text-sm outline-none text-text-grey" />
          </div>
          <div>
            <label htmlFor="edit-bien-ville" className="text-xs font-semibold text-text-dark mb-1.5 block">Ville</label>
            <input id="edit-bien-ville" value={ville} readOnly disabled
              className="w-full bg-surface-g border border-divider rounded-xl px-4 py-2.5 text-sm outline-none text-text-grey" />
          </div>
          <div>
            <label htmlFor="edit-bien-adresse" className="text-xs font-semibold text-text-dark mb-1.5 block">Adresse précise</label>
            <input id="edit-bien-adresse" value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Rue, numéro…"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="p-5 pt-0">
          <button onClick={submit} disabled={saving || success}
            className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,var(--c-brand),var(--c-violet))' }}>
            {success ? 'Enregistré ✓' : saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </ModalSheet>
  )
}
