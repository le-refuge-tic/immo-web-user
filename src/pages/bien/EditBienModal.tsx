import { useState } from 'react'
import { biensApi } from '../../api/biensApi'
import QuartierPicker from '../../components/QuartierPicker'
import { trouverQuartierExact } from '../../data/quartiers'

type Props = { bien: any; onClose: () => void; onSaved: (bien: any) => void }

export default function EditBienModal({ bien, onClose, onSaved }: Props) {
  const loc = bien.localisation || {}
  const [prix, setPrix] = useState(String(bien.prix ?? ''))
  const [fraisVisite, setFraisVisite] = useState(String(bien.frais_visite ?? ''))
  const [description, setDescription] = useState(bien.description || '')
  const [quartier, setQuartier] = useState(loc.quartier || '')
  const [ville, setVille] = useState(loc.ville || '')
  const [arrondissement, setArrondissement] = useState(loc.arrondissement || '')
  const [adresse, setAdresse] = useState(loc.adresse || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!prix.trim()) { setError('Le prix est obligatoire'); return }
    setSaving(true)
    setError('')
    try {
      const body: any = {
        prix: Number(prix),
        frais_visite: fraisVisite.trim() ? Number(fraisVisite) : 0,
        description: description.trim() || undefined,
        localisation: {
          ville: ville || undefined,
          arrondissement: arrondissement || undefined,
          quartier: quartier || undefined,
          adresse: adresse.trim() || undefined,
        },
      }
      const updated = await biensApi.update(bien.id, body)
      onSaved(updated.data || updated.bien || updated)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la mise à jour')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider sticky top-0 bg-white">
          <h2 className="font-bold text-text-dark">Modifier le bien</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-g text-text-grey">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide">Informations tarifaires</p>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Prix (FCFA)</label>
            <input type="number" value={prix} onChange={e => setPrix(e.target.value)}
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Frais de visite (FCFA)</label>
            <input type="number" value={fraisVisite} onChange={e => setFraisVisite(e.target.value)} placeholder="0 si gratuit"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide pt-2">Description</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Décrivez le bien…"
            className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" />

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide pt-2">Localisation</p>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Quartier</label>
            <QuartierPicker
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
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Arrondissement</label>
            <input value={arrondissement} readOnly disabled
              className="w-full bg-surface-g border border-divider rounded-xl px-4 py-2.5 text-sm outline-none text-text-grey" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Ville</label>
            <input value={ville} readOnly disabled
              className="w-full bg-surface-g border border-divider rounded-xl px-4 py-2.5 text-sm outline-none text-text-grey" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Adresse précise</label>
            <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Rue, numéro…"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="p-5 pt-0">
          <button onClick={submit} disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
