import { useState } from 'react'
import { biensApi } from '../../api/biensApi'
import QuartierPicker from '../../components/QuartierPicker'
import { trouverQuartierExact } from '../../data/quartiers'

type Props = { onClose: () => void; onCreated: (bien: any) => void }

const TYPES_BIEN = [
  { key: 'entree_coucher', label: 'Entrée-Coucher' },
  { key: 'chambre_salon', label: 'Chambre-Salon' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'villa', label: 'Villa' },
  { key: 'maison', label: 'Maison' },
  { key: 'terrain', label: 'Terrain / Parcelle' },
  { key: 'boutique', label: 'Boutique' },
]

const PEUT_ETRE_MEUBLE = new Set(['appartement', 'villa', 'maison'])

export default function AjouterBienGestionModal({ onClose, onCreated }: Props) {
  const [typeBien, setTypeBien] = useState('chambre_salon')
  const [meuble, setMeuble] = useState(false)
  const [loyer, setLoyer] = useState('')
  const [quartier, setQuartier] = useState('')
  const [ville, setVille] = useState('')
  const [adresse, setAdresse] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const peutEtreMeuble = PEUT_ETRE_MEUBLE.has(typeBien)
  const estMeuble = peutEtreMeuble && meuble

  const typeBackend = typeBien === 'terrain' ? 'terrain'
    : (typeBien === 'villa' || typeBien === 'maison' || typeBien === 'boutique') ? 'maison'
    : estMeuble ? 'appart_meuble' : 'appart_vide'

  const sousType = typeBien === 'appartement' ? (estMeuble ? 'appart_meuble' : 'appartement') : typeBien

  const submit = async () => {
    if (!loyer.trim() || Number(loyer) <= 0) { setError('Le loyer mensuel est obligatoire'); return }
    if (!ville.trim()) { setError('La ville est obligatoire'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        type: typeBackend,
        transaction: 'location',
        prix: Number(loyer),
        description: description.trim() || undefined,
        localisation: {
          adresse: adresse.trim() || quartier || ville,
          ville: ville.trim(),
          quartier: quartier.trim() || undefined,
          latitude: 6.3654,
          longitude: 2.4183,
        },
        amenites: { sous_type: sousType },
      }
      const created = await biensApi.createEnGestion(body)
      const saved = created.data || created.bien || created
      setSuccess(true)
      setTimeout(() => onCreated(saved), 900)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'ajout du bien")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider sticky top-0 bg-white">
          <h2 className="font-bold text-text-dark">Ajouter un bien en gestion</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-g text-text-grey">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
            <p className="text-primary text-xs leading-relaxed">
              Ce bien sera visible uniquement dans votre espace, sans annonce publique. Partagez le code d'invitation généré à votre locataire pour lier son compte et activer le suivi des loyers.
            </p>
          </div>

          {success && (
            <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-2.5">
              <p className="text-success text-sm font-semibold">Bien ajouté avec succès</p>
            </div>
          )}
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Type de bien</label>
            <div className="flex flex-wrap gap-2">
              {TYPES_BIEN.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeBien(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${typeBien === t.key ? 'text-white border-primary' : 'text-text-dark border-divider hover:border-primary'}`}
                  style={typeBien === t.key ? { background: '#4B6BFF' } : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {peutEtreMeuble && (
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setMeuble(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${!meuble ? 'text-primary border-primary bg-primary/10' : 'text-text-grey border-divider'}`}>
                  Vide
                </button>
                <button type="button" onClick={() => setMeuble(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${meuble ? 'text-primary border-primary bg-primary/10' : 'text-text-grey border-divider'}`}>
                  Meublé
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Loyer mensuel (FCFA)</label>
            <input type="number" value={loyer} onChange={e => setLoyer(e.target.value)} placeholder="Ex : 50000"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <p className="text-xs font-bold text-text-grey uppercase tracking-wide pt-1">Localisation</p>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Quartier</label>
            <QuartierPicker
              value={quartier}
              onChange={setQuartier}
              onSelect={q => setVille(q.ville)}
              onBlur={() => {
                if (!quartier.trim()) return
                const trouve = trouverQuartierExact(quartier)
                if (trouve) setVille(trouve.ville)
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Ville</label>
            <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex : Cotonou"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Adresse précise (optionnel)</label>
            <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Derrière le CEG, 200m du goudron…"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-dark mb-1.5 block">Description (optionnel)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Détails supplémentaires…"
              className="w-full bg-white border border-divider rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" />
          </div>
        </div>

        <div className="p-5 pt-0">
          <button onClick={submit} disabled={saving || success}
            className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            {success ? 'Ajouté ✓' : saving ? 'Ajout en cours…' : 'Ajouter le bien'}
          </button>
        </div>
      </div>
    </div>
  )
}
