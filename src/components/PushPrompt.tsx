import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { pushSupported, subscribeToPush } from '../lib/push'

const DISMISS_KEY = 'rg_push_dismissed'

export default function PushPrompt() {
  const { isLoggedIn } = useAuth()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !pushSupported()) return

    if (Notification.permission === 'granted') {
      // Déjà autorisé — on (ré)abonne silencieusement sans rien montrer.
      subscribeToPush().catch(() => {})
      return
    }
    if (Notification.permission === 'default' && localStorage.getItem(DISMISS_KEY) !== 'true') {
      setShow(true)
    }
  }, [isLoggedIn])

  const activate = async () => {
    setBusy(true)
    const ok = await subscribeToPush().catch(() => false)
    setBusy(false)
    if (ok || Notification.permission !== 'default') setShow(false)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed left-4 right-4 md:left-auto md:right-6 md:w-96 bottom-24 md:bottom-6 z-[70] rounded-2xl p-4 flex items-start gap-3 anim-scale-in"
      style={{
        background: 'rgba(26,26,46,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(75,107,255,0.2)' }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#7B9CFF" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">Activer les notifications</p>
        <p className="text-white/60 text-xs mt-0.5 mb-3">Soyez prévenu des demandes de visite, confirmations et messages, même app fermée.</p>
        <div className="flex gap-2">
          <button onClick={activate} disabled={busy}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            {busy ? 'Activation…' : 'Activer'}
          </button>
          <button onClick={dismiss} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white/60">
            Plus tard
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-white/40 flex-shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
