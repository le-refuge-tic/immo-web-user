import { CompteStaffRefuse } from './compteStaff'

/**
 * Message d'erreur à montrer à l'utilisateur à partir d'une erreur Axios.
 * Renvoie `undefined` quand rien d'utile n'est disponible : l'appelant garde
 * alors son message de repli (`apiMessage(err) || 'Message de repli'`).
 *
 * Les messages techniques de l'API (listes de validation, anglais, codes Nest)
 * ne sont jamais affichés tels quels.
 */
const TECHNIQUE = /\b(must|should|is not|cannot|exception|unauthorized|forbidden|not found|bad request|internal server error|too many requests)\b/i

type ErreurHttp = {
  response?: { status?: number; data?: { message?: unknown }; headers?: Record<string, string | undefined> }
  request?: unknown
}

function delaiAttente(headers?: Record<string, string | undefined>): string {
  const brut = headers?.['retry-after'] ?? headers?.['retry-after-default']
  const s = Number(brut)
  if (!Number.isFinite(s) || s <= 0) return 'dans une minute'
  return s < 60 ? `dans ${Math.ceil(s)} secondes` : `dans ${Math.ceil(s / 60)} minute${s >= 120 ? 's' : ''}`
}

export function apiMessage(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined
  if (err instanceof CompteStaffRefuse) return err.message
  const { response, request } = err as ErreurHttp
  if (!response) {
    return request ? 'Connexion impossible. Vérifiez votre connexion Internet et réessayez.' : undefined
  }
  const status = response.status ?? 0
  if (status === 429) return `Trop de tentatives. Réessayez ${delaiAttente(response.headers)}.`
  if (status === 413) return 'Fichier trop volumineux. Choisissez une image plus légère.'
  if (status >= 500) return 'Le service est momentanément indisponible. Réessayez dans quelques instants.'
  // class-validator renvoie `message` en tableau : on garde les phrases lisibles, une par ligne
  const lisibles = messagesServeur(response.data?.message).filter(m => !TECHNIQUE.test(m))
  return lisibles.length ? lisibles.join(' ') : undefined
}

/** `message` du serveur sous forme de liste de textes non vides (chaîne ou tableau). */
function messagesServeur(msg: unknown): string[] {
  const liste = Array.isArray(msg) ? msg : [msg]
  return liste.filter((m): m is string => typeof m === 'string' && m.trim() !== '').map(m => m.trim())
}

/**
 * Message brut du serveur pour une erreur 4xx (y compris les messages de validation en anglais),
 * à utiliser en dernier recours à la place d'un message de repli opaque. Renvoie `undefined`
 * pour les pannes (réseau, 5xx) et quand le serveur ne dit rien.
 */
export function apiMessageDetail(err: unknown): string | undefined {
  const { response } = (err ?? {}) as ErreurHttp
  const status = response?.status ?? 0
  if (status < 400 || status >= 500) return undefined
  const msgs = messagesServeur(response?.data?.message)
  return msgs.length ? msgs.join(' ; ') : undefined
}
