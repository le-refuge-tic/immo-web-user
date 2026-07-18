import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'
import { VOISINAGE_OPTIONS, EQUIPEMENTS_OPTIONS } from '../../data/beninLocations'
import QuartierPicker from '../../components/QuartierPicker'
import { trouverQuartierExact } from '../../data/quartiers'

const TYPES = [
  { key: 'maison', label: 'Maison / Villa' },
  { key: 'appart_vide', label: 'Appartement vide' },
  { key: 'appart_meuble', label: 'Appartement meublé' },
  { key: 'guesthouse', label: 'Guesthouse' },
  { key: 'terrain', label: 'Terrain' },
]

const STEPS = [
  'Type & Transaction',
  'Localisation',
  'Détails',
  'Aménités',
  'Prix',
  'Photos',
]

export default function NouveauBienPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // Step 1
  const [type, setType] = useState('maison')
  const [transaction, setTransaction] = useState('location')

  // Step 2
  const [ville, setVille] = useState('')
  const [quartier, setQuartier] = useState('')
  const [arrondissement, setArrondissement] = useState('')
  const [quartierInconnu, setQuartierInconnu] = useState(false)
  // Pas de champ dédié dans le formulaire : l'adresse retombe sur quartier/ville,
  // les coordonnées par défaut pointent le centre de Cotonou.
  const adresse = ''
  const latitude = '6.3654'
  const longitude = '2.4183'

  // Step 3
  const [description, setDescription] = useState('')
  const [superficie, setSuperficie] = useState('')
  const [cloture, setCloture] = useState(false)
  const [entreePersonnelle, setEntreePersonnelle] = useState(false)
  const [pieces, setPieces] = useState([{ nom: 'Chambre', surface: '' }])

  // Step 4
  const [amenites, setAmenites] = useState({
    cour: false, arriere_cour: false, parking: false,
    boyerie: false, boutique: false, armoires_chambre: false,
  })
  const [equipements, setEquipements] = useState<string[]>([])
  const [voisinage, setVoisinage] = useState<string[]>([])
  const [compteurEau, setCompteurEau] = useState('non_precise')
  const [compteurElec, setCompteurElec] = useState('non_precise')

  // Step 5
  const [prix, setPrix] = useState('')
  const [fraisVisite, setFraisVisite] = useState('')

  const addPiece = () => setPieces(p => [...p, { nom: '', surface: '' }])
  const removePiece = (i: number) => setPieces(p => p.filter((_, idx) => idx !== i))
  const updatePiece = (i: number, field: string, val: string) =>
    setPieces(p => p.map((piece, idx) => idx === i ? { ...piece, [field]: val } : piece))

  const toggleEquip = (e: string) =>
    setEquipements(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])

  const toggleVois = (v: string) =>
    setVoisinage(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const handleCreate = async () => {
    setSubmitting(true)
    setError('')
    try {
      const body: any = {
        type,
        transaction,
        prix: Number(prix),
        frais_visite: Number(fraisVisite) || 0,
        description: description || undefined,
        localisation: {
          adresse: adresse || quartier || ville,
          ville: ville || quartier,
          quartier: quartier || undefined,
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        amenites: {
          ...amenites,
          compteur_eau: compteurEau,
          compteur_elec: compteurElec,
          equipements,
          voisinage,
        },
        pieces: pieces.filter(p => p.nom).map(p => ({
          nom: p.nom,
          surface: Number(p.surface) || 0,
        })),
      }

      if (type === 'maison' && superficie) {
        body.details_maison = { superficie: Number(superficie), cloture }
      } else if (type === 'terrain' && superficie) {
        body.details_terrain = { superficie: Number(superficie), cloture }
      } else if (['appart_vide', 'appart_meuble', 'guesthouse'].includes(type)) {
        body.details_appart = { entree_personnelle: entreePersonnelle }
      }

      const data = await biensApi.create(body)
      const bien = data.data || data.bien || data
      setCreatedId(bien.id)

      // Upload photos
      if (photos.length > 0 && bien.id) {
        for (let i = 0; i < photos.length; i++) {
          try {
            await biensApi.uploadPhoto(bien.id, photos[i])
            setUploadProgress(Math.round(((i + 1) / photos.length) * 100))
          } catch (_) {}
        }
      }

      setStep(6) // success
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création')
    }
    setSubmitting(false)
  }

  if (step === 6) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-dark mb-2">Bien publie !</h2>
        <p className="text-text-grey text-sm mb-6">Votre annonce est en cours de modération</p>
        <button onClick={() => navigate(createdId ? `/biens/${createdId}` : '/')}
          className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-btn">
          Voir mon annonce
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col md:max-w-2xl md:mx-auto">
      {/* Header */}
      <div className="bg-white px-4 pt-12 md:pt-6 pb-4 border-b border-divider">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-g">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-text-dark">Publier un bien</h1>
            <p className="text-xs text-text-grey">{STEPS[step]} ({step + 1}/{STEPS.length})</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-surface-g rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Step 0: Type & Transaction */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="font-bold text-text-dark mb-3">Type de bien</p>
              <div className="space-y-2">
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => setType(t.key)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left text-sm font-semibold transition-all ${
                      type === t.key ? 'border-primary bg-primary-l text-primary' : 'border-divider text-text-dark bg-white'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-text-dark mb-3">Transaction</p>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'location', label: 'A louer' }, { key: 'vente', label: 'A vendre' }].map(t => (
                  <button key={t.key} onClick={() => setTransaction(t.key)}
                    className={`p-3.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      transaction === t.key ? 'border-primary bg-primary-l text-primary' : 'border-divider text-text-dark bg-white'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Localisation */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Quartier</label>
              <QuartierPicker
                value={quartier}
                onChange={v => { setQuartier(v); setQuartierInconnu(false) }}
                onSelect={q => { setVille(q.ville); setArrondissement(q.arrondissement); setQuartierInconnu(false) }}
                onBlur={() => {
                  if (!quartier.trim()) { setQuartierInconnu(false); return }
                  const trouve = trouverQuartierExact(quartier)
                  if (trouve) { setVille(trouve.ville); setArrondissement(trouve.arrondissement); setQuartierInconnu(false) }
                  else { setVille(''); setArrondissement(''); setQuartierInconnu(true) }
                }}
                placeholder="Ex: Cadjèhoun, Godomey…"
              />
              {quartierInconnu && (
                <p className="text-[11px] mt-1.5 pl-1" style={{ color: '#D97706' }}>
                  Ce quartier n'est pas reconnu, mais vous pouvez continuer.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Arrondissement</label>
              <input value={arrondissement} readOnly disabled placeholder="Se remplit avec le quartier"
                className="w-full bg-surface-g border border-divider rounded-xl px-4 py-3 text-sm outline-none text-text-grey" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Ville</label>
              <input value={ville} readOnly disabled placeholder="Se remplit avec le quartier"
                className="w-full bg-surface-g border border-divider rounded-xl px-4 py-3 text-sm outline-none text-text-grey" />
            </div>
          </div>
        )}

        {/* Step 2: Détails */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-dark mb-1.5 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez le bien…" rows={4}
                className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none" />
            </div>

            {(type === 'maison' || type === 'terrain') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-text-dark mb-1.5 block">Superficie (m²)</label>
                  <input type="number" value={superficie} onChange={e => setSuperficie(e.target.value)}
                    className="w-full bg-white border border-divider rounded-xl px-4 py-3 text-sm outline-none focus:border-primary" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={cloture} onChange={e => setCloture(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <span className="text-sm font-semibold text-text-dark">Clôturé</span>
                </label>
              </>
            )}

            {['appart_vide', 'appart_meuble', 'guesthouse'].includes(type) && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={entreePersonnelle} onChange={e => setEntreePersonnelle(e.target.checked)} className="w-5 h-5 accent-primary" />
                <span className="text-sm font-semibold text-text-dark">Entrée personnelle</span>
              </label>
            )}

            {type !== 'terrain' && (
              <div>
                <p className="text-xs font-semibold text-text-dark mb-2">Pièces</p>
                <div className="space-y-2">
                  {pieces.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={p.nom} onChange={e => updatePiece(i, 'nom', e.target.value)}
                        placeholder="Nom (Chambre, Salon…)"
                        className="flex-1 bg-white border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
                      <input type="number" value={p.surface} onChange={e => updatePiece(i, 'surface', e.target.value)}
                        placeholder="m²"
                        className="w-20 bg-white border border-divider rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" />
                      <button onClick={() => removePiece(i)} className="w-7 h-7 flex items-center justify-center text-danger">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addPiece}
                  className="mt-2 text-primary text-sm font-semibold flex items-center gap-1">
                  + Ajouter une pièce
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Aménités */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-text-dark mb-3">Caractéristiques</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(amenites).map(([key, val]) => (
                  <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer ${
                    val ? 'border-primary bg-primary-l' : 'border-divider bg-white'
                  }`}>
                    <input type="checkbox" checked={val}
                      onChange={e => setAmenites(a => ({ ...a, [key]: e.target.checked }))}
                      className="accent-primary" />
                    <span className="text-xs font-semibold text-text-dark">
                      {key === 'cour' ? 'Cour' :
                       key === 'arriere_cour' ? 'Arrière-cour' :
                       key === 'parking' ? 'Parking' :
                       key === 'boyerie' ? 'Boyerie' :
                       key === 'boutique' ? 'Boutique' : 'Armoires chambre'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-text-dark mb-1">Eau</p>
              <div className="flex gap-2">
                {[{ key: 'non_precise', label: 'Non précisé' }, { key: 'soneb', label: 'SONEB' }, { key: 'forage', label: 'Forage' }].map(o => (
                  <button key={o.key} onClick={() => setCompteurEau(o.key)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                      compteurEau === o.key ? 'border-primary bg-primary-l text-primary' : 'border-divider text-text-grey bg-white'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-text-dark mb-1">Électricité</p>
              <div className="flex gap-2">
                {[{ key: 'non_precise', label: 'Non précisé' }, { key: 'personnel', label: 'Personnel' }, { key: 'decompte', label: 'Décompté' }].map(o => (
                  <button key={o.key} onClick={() => setCompteurElec(o.key)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                      compteurElec === o.key ? 'border-primary bg-primary-l text-primary' : 'border-divider text-text-grey bg-white'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-text-dark mb-2">Équipements</p>
              <div className="flex flex-wrap gap-2">
                {EQUIPEMENTS_OPTIONS.map(e => (
                  <button key={e} onClick={() => toggleEquip(e)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      equipements.includes(e) ? 'border-primary bg-primary text-white' : 'border-divider bg-white text-text-grey'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-text-dark mb-2">Voisinage</p>
              <div className="flex flex-wrap gap-2">
                {VOISINAGE_OPTIONS.map(v => (
                  <button key={v} onClick={() => toggleVois(v)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      voisinage.includes(v) ? 'border-secondary bg-secondary text-white' : 'border-divider bg-white text-text-grey'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Prix */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-text-dark mb-2 block">
                Prix {transaction === 'location' ? '(FCFA/mois)' : '(FCFA)'} *
              </label>
              <input type="number" value={prix} onChange={e => setPrix(e.target.value)} required
                placeholder="Ex: 150000"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3.5 text-base outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-bold text-text-dark mb-2 block">Frais de visite (FCFA)</label>
              <input type="number" value={fraisVisite} onChange={e => setFraisVisite(e.target.value)}
                placeholder="Ex: 2000 (laisser vide = gratuit)"
                className="w-full bg-white border border-divider rounded-xl px-4 py-3.5 text-base outline-none focus:border-primary" />
              <p className="text-xs text-text-grey mt-1">Montant payé par le prospect pour la visite</p>
            </div>
          </div>
        )}

        {/* Step 5: Photos */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-text-dark">Photos du bien</p>
            <p className="text-xs text-text-grey">Ajoutez des photos pour attirer plus de visiteurs</p>

            <label className="block border-2 border-dashed border-divider rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <div className="flex justify-center mb-2">
                <svg className="w-10 h-10 text-text-grey" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-dark">Choisir des photos</p>
              <p className="text-xs text-text-grey mt-1">JPG, PNG (max 10 photos)</p>
              <input type="file" multiple accept="image/*" className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, 10)
                  setPhotos(files)
                }} />
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((f, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full text-white flex items-center justify-center">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {submitting && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs text-text-grey mb-1">
                  <span>Upload photos…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-surface-g rounded-full">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-divider px-4 py-3 safe-bottom">
        {step < 5 ? (
          <button
            onClick={() => {
              if (step === 1 && !quartier) { setError('Indiquez le quartier'); return }
              if (step === 4 && !prix) { setError('Saisissez un prix'); return }
              setError('')
              setStep(s => s + 1)
            }}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn"
          >
            Continuer →
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-btn disabled:opacity-60"
          >
            {submitting ? 'Publication…' : 'Publier le bien'}
          </button>
        )}
      </div>
    </div>
  )
}
