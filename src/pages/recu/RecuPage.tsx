import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paiementApi } from '../../api/paiementApi'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import { bienTypeLabel } from '../../utils/bienType'
import { generateRecuPdf, type RecuSection } from '../../utils/recuPdf'

// Couleurs d'accent selon le type de reçu (identiques à l'app mobile).
const VISITE = { dark: '#1A6B3C', light: '#27AE60' } // vert
const LOYER = { dark: '#1A3A6B', light: '#2E86C1' } // bleu
const DEPOT = { dark: '#5B2A8C', light: '#7B4BFF' } // violet

function fmtDate(raw: string | undefined | null) {
  if (!raw) return '--'
  const d = new Date(raw)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} à ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDateCourte(raw: string | undefined | null) {
  if (!raw) return '--'
  const d = new Date(raw)
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
}

function moisLabel(raw: string | undefined | null) {
  if (!raw) return '--'
  const d = new Date(raw.length === 7 ? raw + '-01' : raw)
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return `${mois[d.getMonth()]} ${d.getFullYear()}`
}

function operateurLabel(methode: string | undefined | null) {
  switch (methode) {
    case 'flooz': return 'Moov Flooz'
    case 'celtiis': return 'Celtiis Cash'
    case 'fedapay': return 'FedaPay'
    default: return 'MTN Mobile Money'
  }
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString('fr-FR')
}

function IconRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-text-grey flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-[13px] text-text-grey flex-shrink-0" style={{ width: 100 }}>{label}</span>
      <span className="text-[13px] font-semibold text-right flex-1" style={{ color: valueColor || '#1D1D1F' }}>{value}</span>
    </div>
  )
}

const IcHome = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const IcCal = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IcPin = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const IcPerson = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
const IcAgent = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IcTag = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-7.586 7.586a1 1 0 01-1.414 0l-6.414-6.414A1 1 0 014 11.586V6a3 3 0 013-3z" /></svg>
const IcPhone = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
const IcCheck = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IcOp = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2" /><path strokeLinecap="round" d="M11 18h2" /></svg>

export default function RecuPage() {
  const { type, refId } = useParams<{ type: string; refId: string }>()
  const navigate = useNavigate()
  const [recu, setRecu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!refId) return
    setLoading(true)
    setError('')
    const call = type === 'integration' ? paiementApi.recuIntegration(refId)
      : type === 'loyer' ? paiementApi.recuLoyer(refId)
      : type === 'depot' ? paiementApi.recuDepot(refId)
      : paiementApi.recuVisite(refId)
    call
      .then(setRecu)
      .catch(e => setError(e?.response?.data?.message || 'Reçu introuvable'))
      .finally(() => setLoading(false))
  }, [type, refId])

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !recu) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-text-dark font-semibold">{error || 'Reçu introuvable'}</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold text-sm">Retour</button>
    </div>
  )

  const isIntegration = type === 'integration'
  const isLoyer = type === 'loyer'
  const isDepot = type === 'depot'
  const theme = isDepot ? DEPOT : isLoyer ? LOYER : VISITE
  const titre = isDepot ? 'REÇU DE RECHARGEMENT' : isIntegration ? "REÇU D'INTÉGRATION" : isLoyer ? 'REÇU DE LOYER' : 'REÇU DE VISITE'
  const titreCourt = isDepot ? 'Reçu de rechargement' : isIntegration ? "Reçu d'intégration" : isLoyer ? 'Reçu de loyer' : 'Reçu de visite'

  const bien = isIntegration || isLoyer ? recu.bien : recu.visite?.bien
  const typeLabel = bien ? bienTypeLabel(bien) : ''
  const adresse = bien?.localisation?.adresse
  const ville = bien?.localisation?.ville
  const client = recu.locataire || recu.client
  const gestionnaire = recu.gestionnaire
  const gestionnaireRoleLabel = gestionnaire?.role === 'demarcheur' ? 'Agent immobilier' : 'Propriétaire'
  const dateVisite = recu.visite?.date_confirmee || recu.visite?.date_souhaitee
  const moisLoyerLabel = recu.loyer?.mois ? moisLabel(recu.loyer.mois) : null
  const operateur = operateurLabel(recu.methode_paiement)
  const nomComplet = (p: any) => `${p?.prenom || ''} ${p?.nom || ''}`.trim()

  const telecharger = async () => {
    setGenerating(true)
    try {
      const sections: RecuSection[] = []

      // Détails (visite ou loyer)
      if (isLoyer) {
        const lignes = [
          { label: 'Période', value: moisLoyerLabel || '--' },
          ...(recu.loyer?.date_echeance ? [{ label: "Date d'échéance", value: fmtDateCourte(recu.loyer.date_echeance) }] : []),
        ]
        sections.push({ titre: 'DÉTAILS DU LOYER', lignes })
        if (bien) {
          sections.push({
            titre: 'BIEN IMMOBILIER',
            lignes: [
              { label: 'Type', value: typeLabel },
              ...(adresse ? [{ label: 'Adresse', value: String(adresse) }] : []),
              ...(ville ? [{ label: 'Ville', value: String(ville) }] : []),
            ],
          })
        }
      } else if (isDepot) {
        sections.push({
          titre: 'DÉTAILS DU RECHARGEMENT',
          lignes: [{ label: 'Wallet crédité', value: recu.depot?.wallet_label || 'Wallet' }],
        })
      } else if (!isIntegration) {
        const lignes = [
          ...(typeLabel ? [{ label: 'Type de bien', value: typeLabel }] : []),
          ...(dateVisite ? [{ label: 'Date de visite', value: fmtDateCourte(dateVisite) }] : []),
        ]
        sections.push({ titre: 'DÉTAILS DE LA VISITE', lignes })
      } else if (bien) {
        sections.push({
          titre: 'BIEN IMMOBILIER',
          lignes: [
            { label: 'Type', value: typeLabel },
            ...(adresse ? [{ label: 'Adresse', value: String(adresse) }] : []),
            ...(ville ? [{ label: 'Ville', value: String(ville) }] : []),
          ],
        })
      }

      // Parties
      sections.push({
        titre: 'PARTIES',
        lignes: [
          ...(client ? [{ label: isLoyer ? 'Locataire' : 'Client', value: nomComplet(client) }] : []),
          ...(gestionnaire ? [{ label: isLoyer ? 'Gestionnaire' : gestionnaireRoleLabel, value: nomComplet(gestionnaire) }] : []),
        ],
      })

      // Informations de paiement
      const paiement = [
        { label: 'Référence', value: String(recu.reference).toUpperCase() },
        { label: 'Date', value: fmtDate(recu.date_paiement) },
        { label: 'Opérateur', value: operateur },
        ...(recu.telephone_paiement ? [{ label: 'Numéro', value: String(recu.telephone_paiement) }] : []),
      ]
      // Détail intégration (avance, cautions…)
      if (isIntegration && recu.details) {
        const d = recu.details
        if (d.avance > 0) paiement.push({ label: 'Avance', value: `${fmt(d.avance)} FCFA` })
        if (d.prepaye > 0) paiement.push({ label: 'Loyer prépayé', value: `${fmt(d.prepaye)} FCFA` })
        if (d.caution_eau > 0) paiement.push({ label: 'Caution eau', value: `${fmt(d.caution_eau)} FCFA` })
        if (d.caution_elec > 0) paiement.push({ label: 'Caution élec.', value: `${fmt(d.caution_elec)} FCFA` })
      }
      sections.push({ titre: 'INFORMATIONS DE PAIEMENT', lignes: paiement })

      const ref8 = String(recu.reference || refId || '').slice(0, 8)
      await generateRecuPdf({
        variante: isDepot ? 'depot' : isLoyer ? 'loyer' : 'visite',
        titre: isDepot ? 'REÇU DE RECHARGEMENT' : isIntegration ? "REÇU D'INTÉGRATION" : undefined,
        sousTitre: isDepot ? `Rechargement ${recu.depot?.wallet_label || 'wallet'}` : isLoyer ? (moisLoyerLabel || '') : isIntegration ? "Frais d'intégration" : 'Frais de visite',
        montantLabel: isDepot ? 'Montant rechargé' : isLoyer ? 'Montant payé' : 'Montant total payé',
        montant: `${fmt(recu.montant)} FCFA`,
        paiementLigne: `${isLoyer ? '' : 'via '}${operateur} · ${fmtDate(recu.date_paiement)}`,
        sections,
        filename: `refuge_${isDepot ? 'rechargement' : isLoyer ? 'loyer' : isIntegration ? 'integration' : 'recu'}_${ref8}.pdf`,
      })
    } catch (e) {
      setError('Impossible de générer le PDF. Réessayez.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-dvh py-8 px-4" style={{ background: '#F4F6FA' }}>
      <div className="max-w-md mx-auto">

        {/* Barre d'actions */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl">
            <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="font-bold text-text-dark text-sm">{titreCourt}</p>
          <div className="w-9" />
        </div>

        {/* En-tête REFUGE — dégradé + logo + cachet PAYÉ */}
        <div
          className="rounded-[20px] p-5 mb-4"
          style={{ background: `linear-gradient(135deg, ${theme.dark}, ${theme.light})`, boxShadow: `0 6px 16px ${theme.dark}4D` }}
        >
          <div className="flex items-center justify-between mb-5">
            <img src={logoUrl} alt="REFUGE" className="h-9 object-contain" />
            <span className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold tracking-wide border border-white/40" style={{ background: 'rgba(255,255,255,0.2)' }}>
              {titre}
            </span>
          </div>

          <div className="relative">
            <div className="rounded-2xl py-4.5 px-4 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-white/70 text-xs">{isLoyer ? 'Montant payé' : 'Montant total payé'}</p>
              <p className="text-white font-black text-[28px] leading-tight mt-1.5">{fmt(recu.montant)} FCFA</p>
              <p className="text-white/60 text-[11px] mt-1">{isLoyer ? '' : 'via '}{operateur} · {fmtDate(recu.date_paiement)}</p>
            </div>
            {/* Cachet PAYÉ */}
            <div
              className="absolute flex items-center justify-center rounded-full border-2 border-white"
              style={{ width: 56, height: 56, right: 8, top: -6, transform: 'rotate(-20deg)' }}
            >
              <span className="text-white text-[11px] font-black tracking-wide">PAYÉ</span>
            </div>
          </div>
        </div>

        {/* Carte détails */}
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          {!isIntegration && !isLoyer && !isDepot && (
            <div className="px-5 pt-4.5 pb-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Détails de la visite</p>
              {typeLabel && <IconRow icon={<IcHome />} label="Type de bien" value={typeLabel} />}
              {dateVisite && <IconRow icon={<IcCal />} label="Date de visite" value={fmtDateCourte(dateVisite)} />}
            </div>
          )}
          {isDepot && (
            <div className="px-5 pt-4.5 pb-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Détails du rechargement</p>
              <IconRow icon={<IcHome />} label="Wallet crédité" value={recu.depot?.wallet_label || 'Wallet'} />
            </div>
          )}
          {isLoyer && (
            <div className="px-5 pt-4.5 pb-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Détails du loyer</p>
              {moisLoyerLabel && <IconRow icon={<IcCal />} label="Période" value={moisLoyerLabel} />}
              {recu.loyer?.date_echeance && <IconRow icon={<IcCal />} label="Échéance" value={fmtDateCourte(recu.loyer.date_echeance)} />}
            </div>
          )}
          {isLoyer && bien && (
            <>
              <div className="h-px bg-divider mx-5" />
              <div className="px-5 pt-4.5 pb-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Bien immobilier</p>
                {typeLabel && <IconRow icon={<IcHome />} label="Type" value={typeLabel} />}
                {adresse && <IconRow icon={<IcPin />} label="Adresse" value={String(adresse)} />}
                {ville && <IconRow icon={<IcPin />} label="Ville" value={String(ville)} />}
              </div>
            </>
          )}
          <div className="h-px bg-divider mx-5" />

          <div className="px-5 pt-4.5 pb-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Parties</p>
            {client && <IconRow icon={<IcPerson />} label={isLoyer ? 'Locataire' : 'Client'} value={nomComplet(client)} />}
            {gestionnaire && (
              <IconRow
                icon={gestionnaire.role === 'demarcheur' ? <IcAgent /> : <IcPerson />}
                label={isLoyer ? 'Gestionnaire' : gestionnaireRoleLabel}
                value={nomComplet(gestionnaire)}
              />
            )}
          </div>
          <div className="h-px bg-divider mx-5" />

          <div className="px-5 pt-4.5 pb-4.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Informations de paiement</p>
            <IconRow icon={<IcTag />} label="Référence" value={String(recu.reference).toUpperCase()} />
            <IconRow icon={<IcCal />} label="Date" value={fmtDate(recu.date_paiement)} />
            <IconRow icon={<IcOp />} label="Opérateur" value={operateur} />
            {recu.telephone_paiement && <IconRow icon={<IcPhone />} label="Numéro" value={recu.telephone_paiement} />}
            <IconRow icon={<IcCheck />} label="Statut" value="Confirmé" valueColor={theme.light} />
          </div>

          {isIntegration && recu.details && (
            <>
              <div className="h-px bg-divider mx-5" />
              <div className="px-5 pt-4.5 pb-4.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Détail du paiement</p>
                {recu.details.avance > 0 && <IconRow icon={<IcHome />} label="Avance" value={`${fmt(recu.details.avance)} FCFA`} />}
                {recu.details.prepaye > 0 && <IconRow icon={<IcHome />} label="Loyer prépayé" value={`${fmt(recu.details.prepaye)} FCFA`} valueColor={theme.light} />}
                {recu.details.caution_eau > 0 && <IconRow icon={<IcHome />} label="Caution eau" value={`${fmt(recu.details.caution_eau)} FCFA`} />}
                {recu.details.caution_elec > 0 && <IconRow icon={<IcHome />} label="Caution élec." value={`${fmt(recu.details.caution_elec)} FCFA`} />}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-text-grey mt-5 px-4 leading-relaxed">
          Ce reçu est généré automatiquement par REFUGE — Plateforme immobilière.<br />Conservez-le comme preuve de paiement.
        </p>

        {/* Bouton téléchargement PDF */}
        <button
          onClick={telecharger}
          disabled={generating}
          className="w-full h-[52px] rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
          style={{ background: theme.dark, boxShadow: `0 4px 14px ${theme.dark}4D` }}
        >
          {generating ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
          )}
          {generating ? 'Génération…' : 'Télécharger le reçu PDF'}
        </button>
      </div>
    </div>
  )
}
