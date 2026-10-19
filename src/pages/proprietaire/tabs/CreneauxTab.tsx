import { useState, useEffect } from 'react'
import { biensApi } from '../../../api/biensApi'
import { visitesApi } from '../../../api/visitesApi'
import { IcClock, IcPlus, IcTrash, BLUE, bienLabel } from './shared'
import type { Tab } from './shared'
import type { Bien } from '../../../types/api'

// ─── Tab: Créneaux (disponibilités de visite du propriétaire) ────────────────
export function CreneauxTab() {
  const [creneaux, setCreneaux] = useState<any[]>([])
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bien_id: '', date: '', heure: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [c, b] = await Promise.allSettled([visitesApi.mesCreneaux(), biensApi.mesBiens()])
      if (c.status === 'fulfilled') setCreneaux(Array.isArray(c.value) ? c.value : c.value.data || [])
      else setError('Impossible de charger les créneaux : ce service est momentanément indisponible.')
      if (b.status === 'fulfilled') {
        const list = Array.isArray(b.value) ? b.value : b.value.data || []
        setBiens(list.filter((x: any) => x.statut_moderation === 'approuve' || x.en_gestion))
      }
    } catch (_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.date || !form.heure || !form.bien_id) return
    setSaving(true)
    try {
      await visitesApi.creerCreneau({ bien_id: Number(form.bien_id), debut: `${form.date}T${form.heure}:00`, duree_minutes: 60 })
      setShowForm(false); setForm({ bien_id: '', date: '', heure: '' }); load()
    } catch (_) {
      setError("Le créneau n'a pas pu être créé : ce service est momentanément indisponible.")
    }
    setSaving(false)
  }

  const del = async (id: number) => {
    try { await visitesApi.supprimerCreneau(id); load() } catch (_) { setError("Le créneau n'a pas pu être supprimé. Réessayez plus tard.") }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--p-deep)' }}>
      <div className="flex-shrink-0 px-5 md:px-8 xl:px-10 pt-4 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: 'var(--p-muted)' }}>Disponibilités</p>
          <h2 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--p-text)' }}>
            Créneaux
            {!loading && <span className="ml-2 text-[15px] font-bold" style={{ color: BLUE }}>{creneaux.length}</span>}
          </h2>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: BLUE }}>
          <IcPlus /> Ajouter
        </button>
      </div>

      {error && (
        <p role="alert" className="flex-shrink-0 mx-5 md:mx-8 xl:mx-10 mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,59,48,0.12)', color: '#FF6B60', border: '1px solid rgba(255,59,48,0.3)' }}>{error}</p>
      )}
      {showForm && (
        <div className="flex-shrink-0 mx-5 md:mx-8 xl:mx-10 mb-4 p-4 rounded-2xl space-y-2.5"
          style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
          <select value={form.bien_id} onChange={e => setForm({ ...form, bien_id: e.target.value })}
            aria-label="Choisir un bien"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }}>
            <option value="">Choisir un bien</option>
            {biens.map(b => <option key={b.id} value={b.id}>{bienLabel(b)} — {b.localisation?.ville}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }} />
            <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none border" style={{ background: 'var(--p-deep)', color: 'var(--p-text)', borderColor: 'var(--p-border)' }} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--p-border)', color: 'var(--p-muted)' }}>Annuler</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: BLUE }}>
              {saving ? 'Enregistrement…' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 md:px-8 xl:px-10 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(n => <div key={n} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }} />)}
          </div>
        ) : creneaux.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: BLUE + '12', border: `1.5px solid ${BLUE}25` }}>
              <IcClock />
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--p-text)' }}>Aucun créneau</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--p-muted)' }}>
              Créez des créneaux de disponibilité pour que les visiteurs puissent réserver une visite directement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creneaux.map((c, i) => (
              <div key={c.id || i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: BLUE + '15', color: BLUE }}>
                  <IcClock />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--p-text)' }}>
                    {c.debut ? new Date(c.debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--p-muted)' }}>
                    {c.debut ? new Date(c.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}{c.duree_minutes ? ` · ${c.duree_minutes} min` : ''}
                    {c.reserve ? ' · Réservé' : ' · Disponible'}
                  </p>
                </div>
                {!c.reserve && (
                  <button onClick={() => del(c.id)} className="text-danger p-1 flex-shrink-0"><IcTrash /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

