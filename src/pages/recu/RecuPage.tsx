import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paiementApi } from '../../api/paiementApi'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import { genererPdfRecu } from './recuPdf'
import {
  fmtMontant, fmtDateComplete, fmtDateCourte, fmtMoisLoyer, fmtTelephone,
  labelTypeBien, labelRoleGestionnaire, labelBienLoyer, labelOperateur, nomComplet,
} from './recuFormat'

// ── Thèmes (miroir mobile) ───────────────────────────────────────────────────
const GREEN = '#1A6B3C'
const GREEN2 = '#27AE60'
const BLUE = '#0F3460'
const BLUE2 = '#2E86C1'

// ── Icônes ───────────────────────────────────────────────────────────────────
const IcHome = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
const IcCal = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IcPerson = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
const IcAgent = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IcTag = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-7.586 7.586a1 1 0 01-1.414 0l-6.414-6.414A1 1 0 014 11.586V6a3 3 0 013-3z" /></svg>
const IcPhone = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
const IcCheck = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

function IconRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="text-text-grey flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-[13px] text-text-grey flex-shrink-0" style={{ width: 100 }}>{label}</span>
      <span className="text-[13px] font-semibold text-right flex-1" style={{ color: valueColor || '#1D1D1F' }}>{value}</span>
    </div>
  )
}

/** Bloc « valeur centrée » (reçu de loyer, cartes centrées). */
function CenterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center py-2">
      <p className="text-[11px] text-text-grey">{label}</p>
      <p className="text-[14px] font-bold text-text-dark mt-0.5">{value}</p>
    </div>
  )
}

export default function RecuPage() {
  const { type, refId } = useParams<{ type: string; refId: string }>()
  const navigate = useNavigate()
  const [recu, setRecu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const charger = useCallback(() => {
    if (!refId) return
    setLoading(true); setError('')
    const call = type === 'integration' ? paiementApi.recuIntegration(refId)
      : type === 'loyer' ? paiementApi.recuLoyer(refId)
      : paiementApi.recuVisite(refId)
    call
      .then(setRecu)
      .catch(e => setError(e?.response?.data?.message || 'Reçu introuvable'))
      .finally(() => setLoading(false))
  }, [type, refId])

  useEffect(() => { charger() }, [charger])

  const telecharger = async () => {
    if (!recu) return
    setDownloading(true)
    try { await genererPdfRecu(type, recu) }
    catch { setError('Impossible de générer le PDF. Réessayez.') }
    finally { setDownloading(false) }
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !recu) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-text-dark font-semibold">{error || 'Reçu introuvable'}</p>
      <div className="flex gap-3">
        <button onClick={charger} className="px-5 py-2 rounded-xl font-semibold text-white text-sm" style={{ background: GREEN }}>Réessayer</button>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold text-sm">Retour</button>
      </div>
    </div>
  )

  if (type === 'integration') return <RecuIntegration recu={recu} navigate={navigate} onDownload={telecharger} downloading={downloading} />
  if (type === 'loyer') return <RecuLoyer recu={recu} navigate={navigate} onDownload={telecharger} downloading={downloading} />
  return <RecuVisite recu={recu} navigate={navigate} onDownload={telecharger} downloading={downloading} />
}

// ── Barre d'actions commune ──────────────────────────────────────────────────
function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onBack} className="glass-btn w-9 h-9 flex items-center justify-center rounded-xl">
        <svg className="w-5 h-5 text-text-dark" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <p className="font-bold text-text-dark text-sm">{title}</p>
      <div className="w-9" />
    </div>
  )
}

function DownloadBtn({ color, onClick, downloading, label = 'Télécharger le reçu PDF' }: { color: string; onClick: () => void; downloading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={downloading}
      className="w-full h-[52px] rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
      style={{ background: color, boxShadow: `0 4px 14px ${color}4D` }}>
      {downloading
        ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Génération…</>
        : <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg> {label}</>}
    </button>
  )
}

const FOOTER = (
  <p className="text-center text-[11px] text-text-grey mt-5 px-4 leading-relaxed">
    Ce reçu est généré automatiquement par REFUGE — Plateforme immobilière.<br />Conservez-le comme preuve de paiement.
  </p>
)

// ── 1) Reçu de VISITE (vert) ─────────────────────────────────────────────────
function RecuVisite({ recu, navigate, onDownload, downloading }: any) {
  const bien = recu.visite?.bien
  const dateVisite = recu.visite?.date_confirmee ?? recu.visite?.date_contre_proposee ?? recu.visite?.date_souhaitee
  const gest = recu.gestionnaire
  return (
    <div className="min-h-dvh py-8 px-4" style={{ background: '#F4F6FA' }}>
      <div className="max-w-md mx-auto">
        <TopBar title="Reçu de visite" onBack={() => navigate(-1)} />
        <div className="rounded-[20px] p-5 mb-4" style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`, boxShadow: `0 6px 16px ${GREEN}4D` }}>
          <div className="flex items-center justify-between mb-5">
            <img src={logoUrl} alt="REFUGE" className="h-9 object-contain" />
            <span className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold tracking-wide border border-white/40" style={{ background: 'rgba(255,255,255,0.2)' }}>REÇU DE VISITE</span>
          </div>
          <div className="relative">
            <div className="rounded-2xl py-4 px-4 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-white/70 text-xs">Montant payé</p>
              <p className="text-white font-black text-[28px] leading-tight mt-1.5">{fmtMontant(recu.montant)}</p>
              <p className="text-white/60 text-[11px] mt-1">{fmtDateComplete(recu.date_paiement)}</p>
            </div>
            <div className="absolute flex items-center justify-center rounded-full border-[2.5px] border-white" style={{ width: 56, height: 56, right: 8, top: -6, transform: 'rotate(-0.35rad)' }}>
              <span className="text-white text-[11px] font-black tracking-wide">PAYÉ</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          <div className="px-5 pt-4 pb-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Visite</p>
            <IconRow icon={<IcHome />} label="Bien" value={labelTypeBien(bien?.type)} />
            <IconRow icon={<IcCal />} label="Date" value={fmtDateCourte(dateVisite)} />
          </div>
          <div className="h-px bg-divider mx-5" />
          <div className="px-5 pt-4 pb-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Parties</p>
            <IconRow icon={<IcPerson />} label="Client" value={nomComplet(recu.client)} />
            {gest && <IconRow icon={gest.role === 'demarcheur' ? <IcAgent /> : <IcPerson />} label={labelRoleGestionnaire(gest.role)} value={nomComplet(gest)} />}
          </div>
          <div className="h-px bg-divider mx-5" />
          <div className="px-5 pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Paiement</p>
            <IconRow icon={<IcTag />} label="Référence" value={`${String(recu.reference).slice(0, 12).toUpperCase()}…`} />
            {recu.telephone_paiement && <IconRow icon={<IcPhone />} label="MoMo" value={fmtTelephone(recu.telephone_paiement)} />}
            <IconRow icon={<IcCheck />} label="Statut" value="Confirmé" valueColor={GREEN2} />
          </div>
        </div>
        {FOOTER}
        <DownloadBtn color={GREEN} onClick={onDownload} downloading={downloading} />
      </div>
    </div>
  )
}

// ── 2) Reçu de LOYER (bleu) ──────────────────────────────────────────────────
function RecuLoyer({ recu, navigate, onDownload, downloading }: any) {
  const bien = recu.bien
  const loc = bien?.localisation
  const hasParties = recu.locataire || recu.gestionnaire
  return (
    <div className="min-h-dvh py-8 px-4" style={{ background: '#F4F6FA' }}>
      <div className="max-w-md mx-auto">
        <TopBar title="Reçu de loyer" onBack={() => navigate(-1)} />
        <div className="rounded-[20px] p-5 mb-4 relative" style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE2})`, boxShadow: `0 6px 16px ${BLUE}4D` }}>
          <p className="text-white/70 text-xs">Loyer payé</p>
          <p className="text-white font-black text-[26px] leading-tight mt-1">{fmtMontant(recu.montant)}</p>
          <p className="text-white/70 text-[13px] mt-1">{fmtMoisLoyer(recu.loyer?.mois)}</p>
          <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-white text-[11px] font-bold" style={{ background: GREEN2 }}>
            <IcCheck /> PAYÉ
          </span>
        </div>
        <div className="bg-white rounded-[20px] px-5 py-3 mb-4" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          <CenterRow label="Référence" value={String(recu.reference).toUpperCase()} />
          <CenterRow label="Date de paiement" value={fmtDateComplete(recu.date_paiement)} />
          <CenterRow label="Opérateur" value={labelOperateur(recu.methode_paiement)} />
          {recu.telephone_paiement && <CenterRow label="Numéro" value={fmtTelephone(recu.telephone_paiement)} />}
          {recu.loyer?.date_echeance && <CenterRow label="Échéance" value={fmtDateCourte(recu.loyer.date_echeance)} />}
        </div>
        <div className="bg-white rounded-[20px] px-5 py-3 mb-4" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          <CenterRow label="Type de logement" value={labelBienLoyer(bien?.sous_type, bien?.type, bien?.nb_chambres)} />
          {loc?.adresse && <CenterRow label="Adresse" value={String(loc.adresse)} />}
          {loc?.ville && <CenterRow label="Ville" value={String(loc.ville)} />}
        </div>
        {hasParties && (
          <div className="bg-white rounded-[20px] px-5 py-3 mb-4" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
            {recu.locataire && <CenterRow label="Locataire" value={nomComplet(recu.locataire)} />}
            {recu.gestionnaire && <CenterRow label="Gestionnaire" value={nomComplet(recu.gestionnaire)} />}
          </div>
        )}
        {FOOTER}
        <DownloadBtn color={BLUE2} onClick={onDownload} downloading={downloading} />
      </div>
    </div>
  )
}

// ── 3) Reçu d'INTÉGRATION (écran succès) ─────────────────────────────────────
function RecuIntegration({ recu, navigate, onDownload, downloading }: any) {
  const d = recu.details ?? {}
  const contrat = recu.contrat
  const prepayeMois = Number(contrat?.loyer_prepaye_mois) || 0
  const rows: { label: string; value: number; green?: boolean }[] = [
    { label: 'Avance de loyer', value: Number(d.avance) || 0 },
    { label: 'Loyer prépayé', value: Number(d.prepaye) || 0, green: true },
    { label: 'Caution eau', value: Number(d.caution_eau) || 0 },
    { label: 'Caution électricité', value: Number(d.caution_elec) || 0 },
  ].filter(r => r.value > 0)
  const total = Number(d.total) || Number(recu.montant) || 0

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#F4F6FA' }}>
      <div className="px-5 pt-12 pb-8 text-center" style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-white font-bold text-xl">Intégration réussie !</p>
        <p className="text-white font-black text-[28px] mt-2">{fmtMontant(recu.montant)}</p>
        <p className="text-white/80 text-sm mt-1">payé le {fmtDateCourte(recu.date_paiement)}</p>
      </div>

      <div className="flex-1 px-4 py-5 max-w-md mx-auto w-full space-y-4">
        <div className="bg-white rounded-[18px] px-5 py-3" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          <IconRow icon={<IcTag />} label="Référence" value={String(recu.reference).toUpperCase()} />
          <IconRow icon={<IcPhone />} label="Méthode" value="MTN Mobile Money" />
          {recu.telephone_paiement && <IconRow icon={<IcPhone />} label="Numéro" value={fmtTelephone(recu.telephone_paiement)} />}
        </div>

        <div className="bg-white rounded-[18px] px-5 py-4" style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-grey mb-2.5">Détail du paiement</p>
          {rows.map(r => (
            <IconRow key={r.label} icon={<IcHome />} label={r.label} value={fmtMontant(r.value)} valueColor={r.green ? GREEN2 : undefined} />
          ))}
          <div className="h-px bg-divider my-2.5" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-text-dark">Total</span>
            <span className="text-[16px] font-black text-primary">{fmtMontant(total)}</span>
          </div>
        </div>

        {prepayeMois > 0 && (
          <div className="rounded-[18px] px-5 py-4 flex items-start gap-3" style={{ background: '#E8F5EE', border: '1px solid #27AE6033' }}>
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-[14px] font-bold" style={{ color: GREEN }}>{prepayeMois} mois sans payer le loyer</p>
              <p className="text-xs text-text-grey mt-0.5">
                Vous ne payez aucun loyer pendant {prepayeMois} mois. Votre premier loyer sera dû le {fmtDateCourte(contrat?.date_premier_loyer)}.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-divider px-4 py-3 safe-bottom">
        <div className="max-w-md mx-auto flex gap-3">
          <button onClick={onDownload} disabled={downloading}
            className="flex-1 h-[50px] rounded-2xl font-bold flex items-center justify-center gap-2 border-2 disabled:opacity-70"
            style={{ borderColor: GREEN, color: GREEN }}>
            {downloading
              ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${GREEN}66`, borderTopColor: GREEN }} />
              : <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg> Télécharger</>}
          </button>
          <button onClick={() => navigate(contrat?.id ? `/gestion-via-app/${contrat.id}` : '/gestion-via-app')}
            className="flex-1 h-[50px] rounded-2xl font-bold text-white" style={{ background: 'var(--color-primary, #4B6BFF)' }}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  )
}
