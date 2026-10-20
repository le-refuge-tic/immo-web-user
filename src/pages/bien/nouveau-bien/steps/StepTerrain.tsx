

import { BLUE, DOCUMENT_TERRAIN_OPTS, baseInputStyle } from '../options'
import { Card, Section, ChoiceList, Chip } from '../ui'
import type { NouveauBienForm } from '../useNouveauBienForm'

export function StepTerrain({ form }: { form: NouveauBienForm }) {
  const {
    titreTerrain,
    setTitreTerrain,
    titreFoncier,
    setTitreFoncier,
    superficieTerrain,
    setSuperficieTerrain,
    superficieUnite,
    setSuperficieUnite,
    documentTerrain,
    setDocumentTerrain,
    positionTerrain,
    setPositionTerrain,
    angleRue,
    setAngleRue,
    permissionConstruire,
    setPermissionConstruire,
    descriptionConstruction,
    setDescriptionConstruction,
    estLoti,
    setEstLoti,
    detailsSupplementaires,
    setDetailsSupplementaires,
  } = form
  return (
      <div className="space-y-4">
        <Card>
          <Section title="Nom du bien" required />
          <textarea value={titreTerrain} onChange={e => setTitreTerrain(e.target.value)} rows={2} maxLength={120}
            placeholder="Ex: Parcelle bâtie à vendre en angle de rue à Cotonou Saint Jean"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none border transition-colors"
            style={baseInputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
        </Card>

        <Card>
          <Section title="Superficie" required />
          <div className="flex gap-2.5">
            <input type="number" value={superficieTerrain} onChange={e => setSuperficieTerrain(e.target.value)}
              placeholder={superficieUnite === 'ha' ? 'Ex: 2.5' : 'Ex: 25000'}
              className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm outline-none border transition-colors"
              style={baseInputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
            <div className="flex rounded-xl border p-1 flex-shrink-0"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
              {(['m2', 'ha'] as const).map(u => (
                <button key={u} type="button"
                  onClick={() => {
                    if (u === superficieUnite) return
                    const n = parseFloat(superficieTerrain.replace(',', '.'))
                    if (!isNaN(n)) setSuperficieTerrain(String(u === 'ha' ? n / 10000 : Math.round(n * 10000)))
                    setSuperficieUnite(u)
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: superficieUnite === u ? BLUE : 'transparent',
                    color: superficieUnite === u ? 'white' : 'var(--p-muted)',
                  }}>
                  {u === 'm2' ? 'm²' : 'ha'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <Section title="Document" />
          <ChoiceList options={DOCUMENT_TERRAIN_OPTS} value={documentTerrain} onChange={setDocumentTerrain} onDeselect={() => setDocumentTerrain(null)} />
        </Card>

        <Card>
          <Section title="Position" />
          <ChoiceList options={[
            { value: 'bord_goudron', label: 'Au bord du goudron' },
            { value: 'ruelle', label: 'Dans la ruelle' },
            { value: 'autre', label: 'Autre' },
          ]} value={positionTerrain} onChange={setPositionTerrain} />
          <label className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer"
            style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>Parcelle en angle de rue</span>
            <input type="checkbox" checked={angleRue} onChange={e => setAngleRue(e.target.checked)} className="w-5 h-5 accent-blue-500" />
          </label>
        </Card>

        <Card>
          <Section title="Permission de construire ?" />
          <div className="grid grid-cols-2 gap-2.5">
            <Chip label="Oui" active={permissionConstruire} onClick={() => setPermissionConstruire(true)} />
            <Chip label="Non" active={!permissionConstruire} onClick={() => setPermissionConstruire(false)} />
          </div>
          {permissionConstruire && (
            <textarea value={descriptionConstruction} onChange={e => setDescriptionConstruction(e.target.value)} rows={3}
              placeholder="Ex: Rez de deux chambres un salon d'une fondation R+5, 05 boutiques"
              className="mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none transition-colors"
              style={baseInputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--p-border)')} />
          )}
        </Card>

        <Card>
          <Section title="Zone lotie ?" />
          <div className="grid grid-cols-3 gap-2.5">
            <Chip label="Lotie" active={estLoti === 'lotie'} onClick={() => setEstLoti('lotie')} />
            <Chip label="Non lotie" active={estLoti === 'non_lotie'} onClick={() => setEstLoti('non_lotie')} />
            <Chip label="Autre" active={estLoti === 'autre'} onClick={() => setEstLoti('autre')} />
          </div>
        </Card>

        <Card>
          <Section title="Titre foncier ?" />
          <div className="grid grid-cols-2 gap-2.5">
            <Chip label="Oui" active={titreFoncier === true} onClick={() => setTitreFoncier(true)} />
            <Chip label="Non" active={titreFoncier === false} onClick={() => setTitreFoncier(false)} />
          </div>
        </Card>

        <Card>
          <Section title="Détails supplémentaires" />
          <p className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>Ajoutez toute information utile non couverte ci-dessus.</p>
          <div className="space-y-2.5">
            {detailsSupplementaires.map((d, i) => (
              <div key={i} className="p-3 rounded-xl border space-y-2"
                style={{ borderColor: 'var(--p-border)', background: 'var(--p-deep)' }}>
                <div className="flex items-center gap-2">
                  <input value={d.label}
                    onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Ex: Distance de la route"
                    className="flex-1 text-sm font-semibold outline-none bg-transparent"
                    style={{ color: 'var(--p-text)' }} />
                  <button type="button" onClick={() => setDetailsSupplementaires(arr => arr.filter((_, idx) => idx !== i))} style={{ color: 'var(--tx-red)' }}>✕</button>
                </div>
                <input value={d.valeur}
                  onChange={e => setDetailsSupplementaires(arr => arr.map((x, idx) => idx === i ? { ...x, valeur: e.target.value } : x))}
                  placeholder="Ex: 50 mètres"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--p-card)', color: 'var(--p-text)' }} />
              </div>
            ))}
            <button type="button" onClick={() => setDetailsSupplementaires(arr => [...arr, { label: '', valeur: '' }])}
              className="w-full py-2.5 rounded-xl border text-xs font-bold"
              style={{ borderColor: BLUE + '40', color: BLUE }}>
              + Ajouter un détail
            </button>
          </div>
        </Card>
      </div>
  )
}
