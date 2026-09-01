import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { shareLinks, type ShareBien } from '../services/shareService'

/**
 * Fenêtre de partage fallback (bottom sheet mobile / modal desktop),
 * affichée uniquement quand le Web Share API natif n'est pas disponible.
 * Inspiré du partage web YouTube : Copier le lien + 2-3 réseaux.
 */
export default function ShareSheet({ bien, onClose }: { bien: ShareBien; onClose: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [copied, setCopied] = useState(false)
  const links = shareLinks(bien)

  const bg      = isDark ? '#161820' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.09)' : '#E5E7EB'
  const tp      = isDark ? '#E8E9F0' : '#111827'
  const ts      = isDark ? 'rgba(232,233,240,0.60)' : '#6B7280'
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F8'

  const copy = () => {
    navigator.clipboard?.writeText(links.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const networks = [
    {
      key: 'whatsapp', label: 'WhatsApp', href: links.whatsapp, bg: '#25D366',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    },
    {
      key: 'facebook', label: 'Facebook', href: links.facebook, bg: '#1877F2',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      key: 'x', label: 'X', href: links.x, bg: isDark ? '#FFFFFF' : '#000000', iconColor: isDark ? '#000' : '#fff',
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 anim-scale-in safe-bottom"
        style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[16px] font-bold" style={{ color: tp }}>Partager ce bien</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: fieldBg, color: ts }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Réseaux */}
        <div className="flex items-start justify-around gap-2 mb-5">
          {networks.map(n => (
            <a key={n.key} href={n.href} target="_blank" rel="noopener noreferrer" onClick={onClose}
              className="flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-105">
              <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: n.bg, color: (n as any).iconColor || '#fff' }}>
                {n.icon}
              </span>
              <span className="text-[11px] font-medium" style={{ color: ts }}>{n.label}</span>
            </a>
          ))}
        </div>

        {/* Copier le lien */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl" style={{ background: fieldBg, border: `1px solid ${border}` }}>
          <span className="flex-1 min-w-0 truncate text-[13px] px-2.5" style={{ color: ts }}>{links.url}</span>
          <button onClick={copy}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: copied ? '#22C55E' : 'linear-gradient(135deg,#4B6BFF,#7B4BFF)' }}>
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  )
}
