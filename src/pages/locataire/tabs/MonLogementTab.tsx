import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openPaymentUrl } from '../../../utils/paymentUrl'
import { loyersApi } from '../../../api/loyersApi'
import { paiementApi } from '../../../api/paiementApi'
import { walletApi } from '../../../api/walletApi'
import { chatApi } from '../../../api/chatApi'
import { bienTypeLabel } from '../../../utils/bienType'
import { formatMois } from '../../../utils/dateFormat'
import { validateBeninPhone, PHONE_FORMAT_HINT, PHONE_PLACEHOLDER, BENIN_PHONE_LENGTH } from '../../../utils/phone'
import { apiMessage } from '../../../utils/apiMessage'
import { issueStatutLoyer, referenceLoyer } from '../../../utils/loyerPaiement'
import { usePaymentPolling } from '../../../hooks/usePaymentPolling'
import { GREEN, TEAL, OPERATEURS, GREEN_TX, TEAL_TX } from '../shared'
import { IcHome, IcCheck, IcPin } from '../icons'
import OperateurChips from '../OperateurChips'
import GestionnaireCard from './GestionnaireCard'
import type { Loyer, ModePaiementLoyer, MonLogement } from '../../../types/locataire'
import { withAlpha } from '../../../utils/color'
import ErrorState from '../../../components/ErrorState'
import RefreshFailedNotice from '../../../components/RefreshFailedNotice'

// ─── Mon Logement ─────────────────────────────────────────────────────────────
export default function MonLogementTab() {
  const navigate = useNavigate()
  const [data, setData]         = useState<MonLogement | null>(null)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<number[]>([])
  const [tel, setTel]           = useState('')
  const [operateur, setOperateur] = useState<ModePaiementLoyer>('momo')
  const [cotisationSolde, setCotisationSolde] = useState(0)
  const [paying, setPaying]     = useState(false)
  const [payState, setPayState] = useState<'idle'|'waiting'|'success'|'error'>('idle')
  const [payMsg, setPayMsg]     = useState('')
  const [payUrl, setPayUrl]     = useState('')
  const [payProgress, setPayProgress] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [loadError, setLoadError] = useState(false)
  const polling                 = usePaymentPolling()
  const initiationEnCoursRef    = useRef(false)

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [logement, wallet] = await Promise.all([
        loyersApi.monLogement(),
        // Solde de cotisation facultatif : sans lui, seul le paiement par cotisation est indisponible.
        walletApi.me('cotisation').catch(() => null),
      ])
      setData(logement)
      setCotisationSolde(Number(wallet?.balance || 0))
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const loyers: Loyer[] = data?.loyers_en_attente?.length ? data.loyers_en_attente : (data?.prochain_loyer ? [data.prochain_loyer] : [])
  const historique = data?.historique_loyers || []
  const contrat = data?.contrat
  const bien    = data?.bien
  const gestionnaire = data?.gestionnaire

  const toggleLoyer = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const totalSelected = loyers.filter(l => selected.includes(l.id)).reduce((s, l) => s + Number(l.montant), 0)
  const cotisationSuffisante = cotisationSolde >= totalSelected

  const ouvrirChatGestionnaire = async () => {
    if (!bien?.id) return
    setChatLoading(true)
    setChatError('')
    try {
      const conv = await chatApi.creerConversation(bien.id)
      navigate(`/conversations/${conv.id || conv.data?.id}`)
    } catch (e: unknown) {
      // Le bouton de discussion redevient actif : on peut simplement recliquer.
      setChatError(apiMessage(e) || "Impossible d'ouvrir la conversation. Réessayez.")
    }
    setChatLoading(false)
  }

  /** Attend la confirmation d'un paiement (polling) : `ok`, `echec` annoncé par le serveur, ou `delai` dépassé. */
  const attendreConfirmation = (refId: string, hasUrl: boolean): Promise<'ok' | 'echec' | 'delai'> =>
    new Promise(resolve => {
      polling.start({
        intervalMs: 3000,
        maxAttempts: hasUrl ? 100 : 20,
        check: async () => issueStatutLoyer((await paiementApi.statutLoyer(refId)).statut),
        onSuccess: () => resolve('ok'),
        onFailed: () => resolve('echec'),
        onTimeout: () => resolve('delai'),
      })
    })

  const payer = async () => {
    if (selected.length === 0) return
    if (operateur === 'cotisation') {
      if (!cotisationSuffisante) return
      setPaying(true); setPayState('waiting'); setPayMsg('')
      try {
        await paiementApi.payerLoyersAvecCotisation(selected)
        setPayState('success'); setSelected([]); load()
      } catch (e: unknown) {
        setPayState('error'); setPayMsg(apiMessage(e) || 'Erreur de paiement')
      }
      setPaying(false)
      return
    }

    if (operateur !== 'fedapay' && !validateBeninPhone(tel)) { setPayState('error'); setPayMsg(PHONE_FORMAT_HINT); return }
    if (initiationEnCoursRef.current) return
    initiationEnCoursRef.current = true
    let loyerCourant: number | null = null
    setPaying(true)
    setPayState('waiting')
    try {
      // Paie chaque loyer sélectionné l'un après l'autre (comme sur mobile) —
      // le backend ne prend qu'un loyer_id par paiement, pas de lot possible
      // en dehors du mode cotisation.
      for (let i = 0; i < selected.length; i++) {
        setPayProgress(selected.length > 1 ? `Paiement ${i + 1}/${selected.length}…` : '')
        loyerCourant = selected[i]
        const res = await paiementApi.initierLoyer({ loyer_id: loyerCourant, methode_paiement: operateur, telephone_paiement: tel })
        const hasUrl = !!res.url_paiement
        if (res.url_paiement) {
          // Lien refusé par la liste de domaines autorisés : on ne suit rien et on n'annonce pas d'onglet ouvert.
          if (!openPaymentUrl(res.url_paiement)) {
            setPayUrl('')
            setPayState('error'); setPayMsg('Le lien de paiement reçu est invalide. Vérifiez votre historique avant de réessayer.')
            setPayProgress(''); setPaying(false); initiationEnCoursRef.current = false
            load()
            return
          }
          setPayUrl(res.url_paiement)
        } else {
          setPayUrl('')
        }
        // Le backend renvoie `reference` : sans elle, aucun suivi ne peut partir.
        const refId = referenceLoyer(res)
        if (!refId) {
          setPayState('error'); setPayMsg('Référence de paiement manquante. Vérifiez votre historique avant de réessayer.')
          setPayProgress(''); setPaying(false); initiationEnCoursRef.current = false
          load()
          return
        }
        const issue = await attendreConfirmation(refId, hasUrl)
        if (issue !== 'ok') {
          // Délai dépassé : le paiement est peut-être encore en cours chez l'opérateur, ne pas inviter à relancer à l'aveugle.
          const suite = issue === 'delai'
            ? 'Le paiement est en attente de confirmation. Vérifiez votre historique avant de réessayer.'
            : (selected.length > 1 ? `Échec au paiement ${i + 1}/${selected.length}. Les précédents restent validés.` : 'Paiement échoué. Réessayez.')
          setPayState('error'); setPayMsg(suite)
          setPayProgress(''); setPaying(false); initiationEnCoursRef.current = false
          load()
          return
        }
      }
      setPayProgress('')
      setPayState('success'); setSelected([]); load()
    } catch (e: unknown) {
      setPayState('error'); setPayMsg(apiMessage(e) || 'Erreur de paiement')
    }
    setPaying(false)
    initiationEnCoursRef.current = false
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} /></div>

  if (loadError && !data) return (
    <div className="flex-1 flex items-center justify-center">
      <ErrorState title="Impossible de charger votre logement" onRetry={load} />
    </div>
  )

  if (!contrat) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: withAlpha(TEAL, '20') }}>
        <IcHome />
      </div>
      <p className="font-bold text-text-dark text-lg mb-2">Aucun logement actif</p>
      <p className="text-text-grey text-sm">Votre contrat de bail apparaîtra ici après intégration.</p>
    </div>
  )



  return (
    <div className="flex-1 overflow-y-auto pb-6 md:pb-12">
      {loadError && <RefreshFailedNotice onRetry={load} />}
      <div className="md:max-w-6xl md:mx-auto md:w-full md:px-8 md:pt-8 md:flex md:gap-6 md:items-start">
        <div className="md:flex-1 md:min-w-0">
          {/* Hero card */}
          <div className="mx-4 mt-5 md:mx-0 md:mt-0 rounded-3xl p-5 md:p-7 text-white" style={{ background: `linear-gradient(135deg, var(--c-emerald-dark), ${GREEN})`, boxShadow: `0 8px 24px ${withAlpha(GREEN, '50')}` }}>
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Mon logement</p>
            <p className="font-bold text-xl md:text-2xl mb-1">{bienTypeLabel(bien)}</p>
            <div className="flex items-center gap-1.5 mb-4 text-white/80 text-sm">
              <IcPin />
              <span>{bien?.localisation?.quartier ? `${bien.localisation.quartier}, ` : ''}{bien?.localisation?.ville}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 md:gap-3 md:max-w-xl">
              {[
                { label: 'Loyer/mois', value: `${Number(contrat.loyer_mensuel || 0).toLocaleString('fr-FR')}F` },
                { label: 'Échéance', value: contrat.prochain_paiement ? new Date(contrat.prochain_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—' },
                { label: 'Payés', value: `${data.mois_payes ?? 0}` },
                { label: 'Dûs', value: `${data.mois_dus ?? 0}`, warn: (data.mois_dus ?? 0) > 0 },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-2 py-2 md:py-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <p className="font-bold text-sm md:text-base leading-tight" style={{ color: s.warn ? '#FCD34D' : 'white' }}>{s.value}</p>
                  <p className="text-micro md:text-xs mt-0.5 text-white/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prépayé */}
          {Number(contrat.loyer_prepaye_mois || 0) > 0 && (
            <div className="mx-4 md:mx-0 mt-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: withAlpha(TEAL, '12'), border: `1px solid ${withAlpha(TEAL, '30')}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: withAlpha(TEAL, '20'), color: TEAL_TX }}><IcCheck /></div>
              <p className="text-sm font-semibold" style={{ color: TEAL_TX }}>
                {contrat.loyer_prepaye_mois} mois déjà prépayés à l'intégration — inclus avant votre première échéance.
              </p>
            </div>
          )}

          {/* Gestionnaire — mobile only, desktop copy lives in side column */}
          {gestionnaire && (
            <div className="mx-4 mt-4">
              <GestionnaireCard gestionnaire={gestionnaire} chatLoading={chatLoading} chatError={chatError} onOpenChat={ouvrirChatGestionnaire} />
            </div>
          )}

          {/* Loyers en attente */}
          {loyers.length > 0 && (
            <div className="mx-4 md:mx-0 mt-5">
              <p className="font-bold text-text-dark mb-3">Loyers en attente ({loyers.length})</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {loyers.map(l => (
                  <button key={l.id} onClick={() => toggleLoyer(l.id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left"
                    style={{ background: selected.includes(l.id) ? withAlpha(GREEN, '10') : 'rgba(255,255,255,0.8)', borderColor: selected.includes(l.id) ? GREEN : 'rgba(0,0,0,0.07)' }}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                      style={{ borderColor: selected.includes(l.id) ? GREEN : 'var(--c-gray-300)', background: selected.includes(l.id) ? GREEN : 'transparent' }}>
                      {selected.includes(l.id) && <span className="text-white"><IcCheck /></span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-text-dark text-sm">{formatMois(l.mois || l.date_echeance)}</p>
                        {l.statut === 'en_retard' && (
                          <span className="text-micro font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.125)', color: 'var(--tx-red)' }}>En retard</span>
                        )}
                      </div>
                      <p className="text-xs text-text-grey">Échéance : {new Date(l.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <p className="font-bold text-text-dark text-sm flex-shrink-0">{Number(l.montant).toLocaleString('fr-FR')} F</p>
                  </button>
                ))}
              </div>

              {/* Paiement MoMo */}
              {selected.length > 0 && (
                <div className="mt-4 rounded-2xl p-4 md:max-w-md" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {payState === 'success' ? (
                    <div role="status" className="flex items-center gap-2 justify-center py-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}><IcCheck /></div>
                      <p className="font-bold text-text-dark">Paiement confirmé !</p>
                    </div>
                  ) : payState === 'error' ? (
                    <div className="text-center">
                      <p role="alert" className="text-red-500 text-sm mb-3">{payMsg}</p>
                      <button onClick={() => setPayState('idle')} className="text-sm font-semibold text-primary">Réessayer</button>
                    </div>
                  ) : payState === 'waiting' ? (
                    <div role="status" className="flex flex-col items-center gap-2 py-2">
                      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN, borderTopColor: 'transparent' }} />
                      {payProgress && <p className="text-xs font-semibold" style={{ color: GREEN_TX }}>{payProgress}</p>}
                      {payUrl ? (
                        <>
                          <p className="text-sm text-text-grey text-center">Terminez le paiement dans l'onglet ouvert, puis revenez ici.</p>
                          <button onClick={() => openPaymentUrl(payUrl)}
                            className="mt-1 text-xs font-bold" style={{ color: GREEN_TX }}>
                            Rouvrir la page de paiement
                          </button>
                        </>
                      ) : operateur === 'cotisation' ? (
                        <p className="text-sm text-text-grey">Débit de votre cotisation…</p>
                      ) : (
                        <>
                          <p className="text-sm text-text-grey">Confirmation du paiement MoMo…</p>
                          <p className="text-xs text-text-grey">Validez la demande sur votre téléphone</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between mb-3">
                        <p className="text-sm text-text-grey">{selected.length} loyer{selected.length > 1 ? 's' : ''}</p>
                        <p className="font-bold text-text-dark">{totalSelected.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <OperateurChips value={operateur} onChange={setOperateur} cotisationSolde={cotisationSolde} />
                      {operateur === 'cotisation' ? (
                        !cotisationSuffisante && (
                          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--tx-red)' }}>
                            Solde cotisation insuffisant ({cotisationSolde.toLocaleString('fr-FR')} F disponibles).
                          </p>
                        )
                      ) : operateur !== 'fedapay' && (
                        <div className="flex items-center gap-2 bg-surface-g rounded-xl px-4 py-3 mb-3 border border-divider">
                          <span className="text-text-grey text-sm font-semibold">+229</span>
                          <div className="w-px h-4 bg-divider" />
                          <input type="tel" value={tel} onChange={e => setTel(e.target.value.replace(/\D/g, ''))}
                            placeholder={PHONE_PLACEHOLDER} maxLength={BENIN_PHONE_LENGTH} inputMode="tel" autoComplete="tel-national" aria-label="Numéro Mobile Money"
                            className="flex-1 min-w-0 bg-transparent text-sm outline-none text-text-dark" />
                        </div>
                      )}
                      <button onClick={payer}
                        disabled={paying || (operateur === 'cotisation' ? !cotisationSuffisante : (operateur !== 'fedapay' && !validateBeninPhone(tel)))}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, var(--c-emerald-dark), ${GREEN})` }}>
                        {operateur === 'cotisation' ? 'Payer avec ma cotisation' : `Payer via ${OPERATEURS.find(o => o.id === operateur)?.label}`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Historique */}
          {historique.length > 0 && (
            <div className="mx-4 md:mx-0 mt-5">
              <p className="font-bold text-text-dark mb-3">Historique des paiements</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {historique.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.125)' }}>
                      <span style={{ color: GREEN_TX }}><IcCheck /></span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-dark text-sm">{formatMois(h.mois || h.created_at)}</p>
                      <p className="text-xs text-text-grey">{new Date(h.created_at || h.date_paiement).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p className="font-bold text-sm flex-shrink-0" style={{ color: GREEN_TX }}>{Number(h.montant).toLocaleString('fr-FR')} F</p>
                    {h.transaction_id && (
                      <button onClick={() => navigate(`/recu/loyer/${h.transaction_id}`)} className="text-xs font-bold flex-shrink-0" style={{ color: TEAL_TX }}>Reçu</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loyers.length === 0 && historique.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-6 md:mx-0 md:rounded-3xl md:mt-5" style={{ background: 'transparent' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: withAlpha(GREEN, '20') }}>
                <span style={{ color: GREEN_TX }}><IcCheck /></span>
              </div>
              <p className="font-bold text-text-dark mb-1">Tout est à jour !</p>
              <p className="text-text-grey text-sm">Aucun loyer en attente.</p>
            </div>
          )}
        </div>

        {/* Side column — desktop only */}
        {gestionnaire && (
          <div className="hidden md:block md:w-80 md:flex-shrink-0 md:sticky md:top-8 md:space-y-4">
            <GestionnaireCard gestionnaire={gestionnaire} chatLoading={chatLoading} chatError={chatError} onOpenChat={ouvrirChatGestionnaire} desktop />
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold text-text-grey uppercase tracking-wider mb-3">Résumé</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-text-grey">Loyer mensuel</span><span className="font-bold text-text-dark">{Number(contrat.loyer_mensuel || 0).toLocaleString('fr-FR')} F</span></div>
                <div className="flex justify-between"><span className="text-text-grey">Loyers payés</span><span className="font-bold text-text-dark">{data.mois_payes ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-text-grey">Loyers dûs</span><span className="font-bold" style={{ color: (data.mois_dus ?? 0) > 0 ? 'var(--c-danger)' : GREEN_TX }}>{data.mois_dus ?? 0}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
