import { useState } from 'react'
import { ModalSheet } from '../../../components/ui/ModalSheet'
import { chatApi } from '../../../api/chatApi'
import { XIcon } from './icons'
import type { ChatColors } from './helpers'
import type { ChatMessage } from '../../../types/chat-ui'

interface ComplaintModalProps {
  msg: ChatMessage
  convId: number
  colors: ChatColors
  onClose: () => void
  onError: (e: unknown) => void
}

/* Modal plainte (monté uniquement quand un message supprimé est ouvert : l'état repart à zéro à chaque ouverture) */
export function ComplaintModal({ msg, convId, colors, onClose, onError }: ComplaintModalProps) {
  const { tp, tm, menuBg, menuBdr, inpFieldBg, inpFieldBdr, iconBtn } = colors
  const [complainText, setComplainText] = useState('')
  const [complainSending, setComplainSending] = useState(false)
  const [complainSent, setComplainSent] = useState(false)
  return (
    <ModalSheet open onClose={onClose} label="Message supprimé" placement="responsive" className="p-4" panelClassName="w-full max-w-sm" backdropOpacity={0.55}>
      <div className="rounded-3xl p-5 w-full anim-scale-in"
        style={{ background: menuBg, border: `1px solid ${menuBdr}`, boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div><p className="font-bold text-[15px]" style={{ color: tp }}>Message supprimé</p>
            <p className="text-[12px] mt-0.5" style={{ color: tm }}>Supprimé par un administrateur.</p></div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" style={{ color: tm, background: iconBtn }}><XIcon /></button>
        </div>
        {complainSent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="font-bold text-[14px] mb-1" style={{ color: tp }}>Plainte envoyée</p>
            <p className="text-[12px]" style={{ color: tm }}>Notre équipe examinera votre signalement.</p>
            <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer" style={{ background: '#4160F2' }}>Fermer</button>
          </div>
        ) : (
          <>
            <textarea value={complainText} onChange={e => setComplainText(e.target.value)}
              placeholder="Expliquez pourquoi cette suppression est injustifiée…" rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none mb-3"
              style={{ background: inpFieldBg, border: `1px solid ${inpFieldBdr}`, color: tp }} />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: `1px solid ${menuBdr}`, color: tp }}>Annuler</button>
              <button disabled={!complainText.trim() || complainSending} onClick={async () => {
                if (!complainText.trim()) return; setComplainSending(true)
                try { await chatApi.creerPlainte({ message_id: msg.id, conversation_id: convId, contenu: complainText.trim() }); setComplainSent(true) }
                catch (err) { onError(err) }
                setComplainSending(false)
              }} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center cursor-pointer" style={{ background: '#4160F2' }}>
                {complainSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalSheet>
  )
}
