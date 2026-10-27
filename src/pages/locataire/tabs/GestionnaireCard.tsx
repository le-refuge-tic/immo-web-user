import { TEAL, GREEN_TX, TEAL_TX } from '../shared'
import { IcChat, IcPhone } from '../icons'
import type { User } from '../../../types/api'
import { withAlpha } from '../../../utils/color'

export default function GestionnaireCard({ gestionnaire, chatLoading, onOpenChat, desktop, chatError }: { gestionnaire: User; chatLoading: boolean; onOpenChat: () => void; desktop?: boolean; chatError?: string }) {
  return (
    <div className={`${desktop ? '' : 'md:hidden'} rounded-2xl p-4 md:p-5 flex flex-wrap items-center gap-3`}
      style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: desktop ? '0 4px 24px rgba(0,0,0,0.06)' : undefined }}>
      <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, var(--c-brand), var(--c-violet))` }}>
        {(gestionnaire.prenom?.[0] || '') + (gestionnaire.nom?.[0] || '')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-dark text-sm">{gestionnaire.prenom} {gestionnaire.nom}</p>
        <p className="text-xs text-text-grey capitalize">{gestionnaire.role === 'demarcheur' ? 'Démarcheur' : 'Propriétaire'}</p>
      </div>
      <button onClick={onOpenChat} disabled={chatLoading}
        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 disabled:opacity-50" style={{ background: withAlpha(TEAL, '20'), color: TEAL_TX }}>
        <IcChat />
      </button>
      {gestionnaire.telephone && (
        <a href={`tel:${gestionnaire.telephone}`} className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ background: 'rgba(34,197,94,0.125)', color: GREEN_TX }}>
          <IcPhone />
        </a>
      )}
      {chatError && <p role="alert" className="w-full text-xs font-semibold" style={{ color: 'var(--c-danger)' }}>{chatError}</p>}
    </div>
  )
}
