/* ── Statut lecture ── */
export function MsgStatus({ status, isMe }: { status?: string; isMe: boolean }) {
  if (!isMe) return null
  const color = status === 'read' ? '#4160F2' : 'rgba(255,255,255,0.55)'
  if (status === 'sent') return (
    <svg width="11" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  return (
    <svg width="15" height="10" viewBox="0 0 30 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="24 6 11 17 6 12" />
      <polyline points="30 6 17 17 15 15" />
    </svg>
  )
}

/* ── Icônes ── */
export const BackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
export const DotsV = () => <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor"><circle cx="2" cy="2" r="1.8"/><circle cx="2" cy="9" r="1.8"/><circle cx="2" cy="16" r="1.8"/></svg>
export const SendIcon = () => <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
export const CalIcon = () => <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
export const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
export const PinFill = () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
export const ChevDown = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
