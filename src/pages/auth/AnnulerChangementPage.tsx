import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { withColdStartRetry, isColdStartError } from '../../utils/coldStartRetry'
import { apiMessage } from '../../utils/apiMessage'
import { usePageTitle } from '../../utils/usePageTitle'

/**
 * Cible du lien « Annuler ce changement » envoyé par SMS à l'ancien numéro
 * après un changement de numéro (valable 7 jours). L'annulation n'a lieu que
 * sur clic : les aperçus de lien des messageries ouvrent l'URL sans
 * l'utilisateur. Le serveur rétablit l'ancien numéro, ferme les sessions et
 * révoque les appareils de confiance.
 */
export default function AnnulerChangementPage() {
  usePageTitle('Annuler un changement')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'confirm' | 'loading' | 'done' | 'error'>(token ? 'confirm' : 'error')
  const [error, setError] = useState(token ? '' : 'Ce lien est incomplet. Ouvrez le lien reçu par SMS tel quel.')

  const annuler = async () => {
    setState('loading'); setError('')
    try {
      await withColdStartRetry(() => authApi.cancelChange(token))
      setState('done')
    } catch (err: unknown) {
      setError(isColdStartError(err)
        ? 'Le serveur met du temps à répondre. Réessayez dans quelques secondes.'
        : apiMessage(err) || 'Ce lien a expiré ou a déjà été utilisé.')
      setState('error')
    }
  }

  return (
    <div className="min-h-[70dvh] pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:pt-0 flex flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
      {state === 'done' ? (
        <>
          <h1 className="text-xl font-bold text-text-dark">Changement annulé</h1>
          <p className="text-sm text-text-grey max-w-sm">
            Votre ancien numéro est rétabli et toutes les sessions ont été fermées. Par précaution, changez votre mot de passe en vous reconnectant.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link to="/mot-de-passe-oublie" className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold">Changer mon mot de passe</Link>
            <Link to="/login" className="px-5 py-3 rounded-xl border border-divider text-text-dark text-sm font-semibold">Se connecter</Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-text-dark">Annuler le changement de numéro</h1>
          <p className="text-sm text-text-grey max-w-sm">
            Un changement de numéro a été demandé sur votre compte. Si ce n'est pas vous, annulez-le : l'ancien numéro sera rétabli et toutes les sessions seront fermées.
          </p>
          {error && <p role="alert" className="text-sm font-semibold text-danger max-w-sm">{error}</p>}
          {token && (
            <button
              type="button" onClick={annuler} disabled={state === 'loading'}
              className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60"
            >
              {state === 'loading' ? 'Annulation…' : 'Annuler ce changement'}
            </button>
          )}
          <Link to="/" className="text-primary font-semibold text-sm">Ce changement vient de moi</Link>
        </>
      )}
    </div>
  )
}
