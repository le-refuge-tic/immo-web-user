import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/useToast'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { signalerBrouillonsModifies, useVersionBrouillons } from '../../../shared/brouillons/useSynchroBrouillons'
import { clearMediaDraft } from '../../../utils/mediaDraft'
import {
  LIBELLES_FORMULAIRE, cleStockageBrouillon, listerBrouillonsProprietaire, supprimerBrouillonProprietaire,
  type ResumeBrouillonProprietaire,
} from './magasinsProprietaire'

/** Nombre d'étapes de chaque formulaire (affichage « Étape 2/5 »). */
const NB_ETAPES = 5

const dateCourte = (ms: number) =>
  ms ? new Date(ms).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue'

/**
 * Lot 6 — brouillons de publication du propriétaire, tous formulaires confondus, retrouvés
 * sur tout appareil (sauf les photos, gardées sur celui où elles ont été choisies).
 */
export default function BrouillonsProprietaire() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { confirmer } = useConfirm()
  const version = useVersionBrouillons()
  const uid = user?.id
  const brouillons = useMemo(
    () => (uid == null ? [] : listerBrouillonsProprietaire(uid)),
    // version : relire après une saisie, une suppression ou une synchronisation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, version],
  )
  if (uid == null || brouillons.length === 0) return null

  const supprimer = async (b: ResumeBrouillonProprietaire) => {
    const ok = await confirmer({
      titre: 'Supprimer ce brouillon ?',
      message: `« ${b.libelle} » sera supprimé de tous vos appareils.`,
      confirmer: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    supprimerBrouillonProprietaire(b.formulaire, uid)
    if (b.formulaire === 'bien') void clearMediaDraft(cleStockageBrouillon('bien', uid)).catch(() => {})
    signalerBrouillonsModifies()
    toast('Brouillon supprimé.', 'success')
  }

  return (
    <section aria-labelledby="brouillons-titre" className="px-5 md:px-8 xl:px-10 pt-6">
      <h2 id="brouillons-titre" className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--p-muted)' }}>
        Brouillons ({brouillons.length})
      </h2>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {brouillons.map(b => (
          <li key={b.formulaire} className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
            <p className="truncate text-sm font-bold" style={{ color: 'var(--p-text)' }}>{b.libelle}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--p-muted)' }}>
              {LIBELLES_FORMULAIRE[b.formulaire]} · Étape {Math.min(b.etape + 1, NB_ETAPES)}/{NB_ETAPES} · {dateCourte(b.majLe)}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => navigate(b.lien)}
                className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white">Reprendre</button>
              <button type="button" onClick={() => void supprimer(b)} aria-label={`Supprimer le brouillon ${b.libelle}`}
                className="rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: 'var(--tx-red)', border: '1px solid var(--p-border)' }}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
