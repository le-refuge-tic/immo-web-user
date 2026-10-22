import type { Amenites, AutreFrais } from '../../../types/amenites'
import type { Bien } from '../../../types/api'
import type { InfoRow } from '../../../utils/amenites'
import logoSbee from '../../../assets/logo-SBEE.png'
import logoSoneb from '../../../assets/logo-SONEB.webp'
import { Icon, type IconType } from './Icon'
import { fmtSlot, fcfa, INFO_ROW_META } from './helpers'

// ─── Contenu partagé (mobile & desktop) — sections empilées, sans onglets ────
export function DetailContent({ bien, isOwnBien, isLocation, composition, logementRows, terrainRows, voisinageLabels, visitesPlanifiees, visitesConfirmees }: {
  bien: Bien; isOwnBien: boolean; isLocation: boolean
  composition: { icon: IconType; label: string }[] | null
  logementRows: InfoRow[]; terrainRows: InfoRow[]; voisinageLabels: string[]
  visitesPlanifiees: { total: number; slots: { date: string; count: number }[] } | null
  visitesConfirmees: { count: number; visites: { id: number; date: string | null }[] } | null
}) {
  const am = bien.amenites as Amenites | null | undefined
  const hasFeatureChips = ((bien.details_maison?.superficie ?? 0) > 0) ||
    ((bien.details_terrain?.superficie ?? 0) > 0) || bien.details_appart?.entree_personnelle ||
    bien.details_maison?.cloture || bien.details_terrain?.cloture ||
    am?.parking || am?.cour || am?.boyerie || am?.sanitaire != null

  return (
    <div className="space-y-6">
      {/* Statut de modération — visible uniquement par le proprio */}
      {isOwnBien && bien.statut_moderation !== 'approuve' && (() => {
        const rejete = bien.statut_moderation === 'rejete'
        return (
          <div className="p-3.5 rounded-xl border" style={{
            background: rejete ? 'rgba(239,68,68,0.07)' : 'rgba(255,152,0,0.07)',
            borderColor: rejete ? 'rgba(239,68,68,0.25)' : 'rgba(255,152,0,0.25)',
          }}>
            <div className="flex items-center gap-2">
              <svg className="w-[18px] h-[18px] flex-shrink-0" style={{ color: rejete ? 'var(--c-danger)' : 'var(--c-amber-dark)' }}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {rejete
                  ? <><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></>
                  : <><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></>}
              </svg>
              <p className="text-sm font-bold" style={{ color: rejete ? 'var(--c-danger)' : 'var(--c-amber-dark)' }}>
                {rejete ? 'Annonce rejetée' : 'En attente de validation'}
              </p>
            </div>
            {rejete && bien.motif_refus && (
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--tx-red)' }}>{bien.motif_refus}</p>
            )}
            {!rejete && (
              <p className="text-xs mt-1.5 text-text-grey">Votre annonce est visible uniquement par vous jusqu'à validation par un administrateur.</p>
            )}
          </div>
        )
      })()}

      {/* Visites confirmées */}
      {isOwnBien
        ? (visitesConfirmees && visitesConfirmees.count > 0 && (
          <VisitesBanner
            title={`${visitesConfirmees.count} visite${visitesConfirmees.count > 1 ? 's' : ''} confirmée${visitesConfirmees.count > 1 ? 's' : ''} en attente`}
            lines={visitesConfirmees.visites.slice(0, 3).map(v => v.date ? fmtSlot(v.date) : '')}
          />
        ))
        : (visitesPlanifiees && visitesPlanifiees.total > 0 && (
          <VisitesBanner
            title={`${visitesPlanifiees.total} visite${visitesPlanifiees.total > 1 ? 's' : ''} confirmée${visitesPlanifiees.total > 1 ? 's' : ''} planifiée${visitesPlanifiees.total > 1 ? 's' : ''}`}
            lines={visitesPlanifiees.slots.slice(0, 3).map(s => fmtSlot(s.date))}
          />
        ))}

      {/* Feature chips */}
      {hasFeatureChips && (
        <div className="flex flex-wrap gap-2.5">

          {(bien.details_maison?.superficie ?? 0) > 0 && <FeatureChip icon="ruler" label={`${bien.details_maison?.superficie} m²`} />}
          {(bien.details_terrain?.superficie ?? 0) > 0 && <FeatureChip icon="ruler" label={`${bien.details_terrain?.superficie} m²`} />}
          {bien.details_appart?.entree_personnelle && <FeatureChip icon="door" label="Entrée privée" />}
          {(bien.details_maison?.cloture || bien.details_terrain?.cloture) && <FeatureChip icon="fence" label="Clôturé" />}
          {am?.parking && <FeatureChip icon="parking" label={am.parking_capacite ? `Parking ×${am.parking_capacite}` : 'Parking'} />}
          {am?.cour && <FeatureChip icon="yard" label="Cour" />}
          {am?.boyerie && <FeatureChip icon="person" label="Boyerie" />}
          {am?.sanitaire === true && <FeatureChip icon="bathtub" label="Sanitaire" />}
          {am?.sanitaire === false && <FeatureChip icon="people" label="Douche et WC extérieurs" />}
        </div>
      )}

      {/* Description */}
      {bien.description && (
        <div>
          <SectionTitle title="Description" />
          <p className="text-sm text-text-grey leading-relaxed">{bien.description}</p>
        </div>
      )}

      {/* Composition */}
      {composition && composition.length > 0 && (
        <div>
          <SectionTitle title="Composition" />
          <div className="flex flex-wrap gap-2.5">
            {composition.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-primary/25 shadow-sm">
                <Icon type={c.icon} className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-text-dark">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infos logement */}
      {logementRows.length > 0 && (
        <div>
          <SectionTitle title="Informations logement" />
          <InfoCard rows={logementRows} amenites={am} />
        </div>
      )}

      {/* Voisinage */}
      {voisinageLabels.length > 0 && (
        <div>
          <SectionTitle title="Voisinage & environnement" />
          <div className="flex flex-wrap gap-2">
            {voisinageLabels.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(46,134,193,0.08)', color: 'var(--c-steel)', border: '1px solid rgba(46,134,193,0.25)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Informations terrain */}
      {terrainRows.length > 0 && (
        <div>
          <SectionTitle title="Informations terrain" />
          <InfoCard rows={terrainRows} />
        </div>
      )}

      {/* Conditions à l'entrée (location uniquement) */}
      {isLocation && (
        <div>
          <SectionTitle title="Conditions à l'entrée" />
          <IntegrationCard bien={bien} isOwnBien={isOwnBien} />
        </div>
      )}
    </div>
  )
}

export function SectionTitle({ title }: { title: string }) {
  return <p className="font-bold text-text-dark text-[15px] mb-3">{title}</p>
}

function FeatureChip({ icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-grey" style={{ background: 'rgba(0,0,0,0.045)' }}>
      <Icon type={icon} className="w-[13px] h-[13px]" />
      {label}
    </span>
  )
}

function VisitesBanner({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="p-3.5 rounded-xl border" style={{ background: 'rgba(39,174,96,0.07)', borderColor: 'rgba(39,174,96,0.25)' }}>
      <div className="flex items-center gap-2">
        <svg className="w-[18px] h-[18px]" style={{ color: 'var(--c-green-flat)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <p className="text-sm font-bold" style={{ color: 'var(--c-green-flat)' }}>{title}</p>
      </div>
      {lines.filter(Boolean).length > 0 && (
        <div className="mt-2 space-y-1">
          {lines.filter(Boolean).map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" style={{ color: 'var(--c-green-flat)' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs text-text-dark">{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoCard({ rows, amenites }: { rows: InfoRow[]; amenites?: Amenites | null }) {
  const isSonebEau = (amenites?.eau ?? amenites?.compteur_eau) === 'soneb'
  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm divide-y divide-divider">
      {rows.map((r, i) => {
        const isElec = r.label === 'Électricité'
        const isEau = r.label === 'Eau'
        const meta = INFO_ROW_META[r.label] || { icon: 'document' as IconType, color: 'var(--c-grey)' }
        return (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              {isElec ? (
                <img loading="lazy" src={logoSbee} alt="SBEE" className="h-7 w-auto object-contain" />
              ) : isEau && isSonebEau ? (
                <img loading="lazy" src={logoSoneb} alt="SONEB" className="h-7 w-auto object-contain" />
              ) : (
                <span style={{ color: meta.color }}><Icon type={meta.icon} className="w-[22px] h-[22px]" /></span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-caption text-text-grey">{r.label}</p>
              <p className="text-[13px] font-semibold text-text-dark mt-0.5">{r.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IntegrationCard({ bien, isOwnBien }: { bien: Bien; isOwnBien: boolean }) {
  const a: Amenites = (bien.amenites as Amenites | null | undefined) || {}
  const avanceMois = a.avance_mois ?? 2
  const prepayeMois = a.loyer_prepaye_mois ?? 0
  const cautionEau = Number(a.caution_eau ?? 0)
  const cautionElec = Number(a.caution_elec ?? 0)
  const commission = Number(a.commission_agence ?? 0)
  const autresFrais: AutreFrais[] = Array.isArray(a.autres_frais) ? a.autres_frais : []
  const prix = Number(bien.prix)

  const montantAvance = avanceMois * prix
  const montantPrepaye = prepayeMois * prix
  const autresFraisTotal = autresFrais.reduce((s, f) => s + (Number(f.montant) || 0), 0)
  const total = (avanceMois + prepayeMois) * prix + cautionEau + cautionElec + autresFraisTotal + (!isOwnBien ? commission : 0)

  const rows: { icon: IconType; color: string; label: string; amount: number; note?: string }[] = []
  if (avanceMois > 0) rows.push({ icon: 'wallet', color: 'var(--c-purple-dark)', label: `Avance (${avanceMois} mois)`, amount: montantAvance })
  if (prepayeMois > 0) rows.push({ icon: 'calendargrid', color: 'var(--tx-green)', label: `Prépayé (${prepayeMois} mois)`, amount: montantPrepaye })
  if (cautionEau > 0) rows.push({ icon: 'waterdrop', color: 'var(--c-steel)', label: 'Caution eau', amount: cautionEau })
  if (cautionElec > 0) rows.push({ icon: 'bolt', color: '#FFCC00', label: 'Caution électricité', amount: cautionElec })
  for (const f of autresFrais) {
    const montant = Number(f.montant) || 0
    if (montant > 0) rows.push({ icon: 'document', color: '#8E44AD', label: f.label || 'Autre frais', amount: montant })
  }
  if (!isOwnBien && commission > 0) rows.push({ icon: 'tag', color: 'var(--c-steel)', label: 'Commission agence', amount: commission, note: "Frais d'agence inclus dans votre paiement" })

  return (
    <div className="rounded-2xl bg-white border border-divider shadow-sm overflow-hidden">
      <div className="divide-y divide-divider">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-shrink-0" style={{ color: r.color }}><Icon type={r.icon} className="w-[22px] h-[22px]" /></span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-text-dark">{r.label}</p>
              {r.note && <p className="text-caption text-success mt-0.5">{r.note}</p>}
            </div>
            <p className="text-[13px] font-bold text-text-dark flex-shrink-0">{fcfa(r.amount)}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-4" style={{ background: 'rgba(75,107,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-extrabold text-text-dark">Total à verser à l'entrée</p>
            <p className="text-caption text-text-grey">Paiement unique à l'entrée</p>
          </div>
          <p className="text-lg font-black text-primary">{fcfa(total)}</p>
        </div>
      </div>
    </div>
  )
}
