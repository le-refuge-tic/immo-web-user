import FaceRating from '../../../components/FaceRating'
import { ModalSheet } from '../../../components/ui/ModalSheet'
import { ISSUES_TAGS } from './constants'
import type { useAvisVisite } from './useAvisVisite'

// Modale plein écran de l'avis après visite.
export function FeedbackModal({ avis }: { avis: ReturnType<typeof useAvisVisite> }) {
  const {
    showFeedback, setShowFeedback, feedbackNote, setFeedbackNote, feedbackTags, setFeedbackTags,
    feedbackComment, setFeedbackComment, feedbackSaving, feedbackError, feedbackDone,
    needsTags, canSubmitFeedback, toggleFeedbackTag, handleSubmitFeedback,
  } = avis

  return (
    <ModalSheet open onClose={() => setShowFeedback(null)} label="Donner un avis" placement="bottom" panelClassName="w-full h-full" zIndex={60} backdropOpacity={0}>
    <div className="w-full h-full flex flex-col" style={{ background: '#F8F9FA' }}>
      {feedbackDone ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--c-page-green)' }}>
            <svg className="w-8 h-8" fill="none" stroke="var(--c-green)" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="font-bold text-text-dark mb-1">Merci pour votre avis !</p>
          <button onClick={() => setShowFeedback(null)} className="mt-3 text-sm font-semibold text-text-grey">Fermer</button>
        </div>
      ) : (
        <>
          {/* En-tête */}
          <div className="flex-shrink-0 flex items-center gap-4 px-4 pt-4 pb-3">
            <button aria-label="Fermer" onClick={() => setShowFeedback(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white flex-shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <svg className="w-5 h-5 text-text-grey" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="min-w-0">
              <p className="font-bold text-text-dark text-[15px]">Votre avis sur la visite</p>
              {showFeedback?.gestionnaire?.prenom && (
                <p className="text-xs text-text-grey truncate">Avec {showFeedback.gestionnaire.prenom}</p>
              )}
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-32 md:max-w-md md:mx-auto md:w-full">
            {feedbackError && <p className="text-danger text-sm mb-3">{feedbackError}</p>}

            <div className="bg-white rounded-2xl px-5 pt-6 pb-7 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p className="font-semibold text-text-dark text-[15px] text-center mb-7 leading-snug">
                Comment s'est passée votre visite ?
              </p>
              <FaceRating selected={feedbackNote} onSelect={n => { setFeedbackNote(n); if (n > 3) setFeedbackTags([]) }} />
            </div>

            {needsTags && (
              <div className="bg-white rounded-2xl p-5 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-[3px] h-[18px] rounded-full flex-shrink-0" style={{ background: 'var(--c-danger)' }} />
                  <p className="font-bold text-text-dark text-sm">Qu'est-ce qui n'a pas fonctionné ?</p>
                </div>
                <p className="text-xs text-text-grey mb-4">Sélectionnez tout ce qui s'applique (au moins un)</p>
                <div className="flex flex-wrap gap-2">
                  {ISSUES_TAGS.map(tag => {
                    const sel = feedbackTags.includes(tag)
                    return (
                      <button key={tag} onClick={() => toggleFeedbackTag(tag)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5"
                        style={sel
                          ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.6)', color: 'var(--tx-red)', fontWeight: 600 }
                          : { background: 'transparent', borderColor: 'rgba(0,0,0,0.15)', color: 'var(--c-grey)' }}>
                        {sel && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <p className="font-semibold text-text-dark text-[13.5px] mb-3">
                {needsTags ? 'Vous souhaitez ajouter quelque chose ?' : 'Laissez un commentaire (optionnel)'}
              </p>
              <textarea
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Partagez votre expérience en détail…"
                rows={4}
                maxLength={500}
                className="w-full rounded-2xl px-3.5 py-3.5 text-[13.5px] outline-none resize-none"
                style={{ background: '#F5F5F5' }}
              />
              <p className="text-caption text-text-grey text-right mt-1">{feedbackComment.length}/500</p>
            </div>
          </div>

          {/* Barre d'envoi fixe */}
          <div className="flex-shrink-0 bg-white px-5 pt-3 safe-bottom" style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.05)' }}>
            <div className="md:max-w-md md:mx-auto pb-3">
              <button
                onClick={handleSubmitFeedback}
                disabled={feedbackSaving || !canSubmitFeedback}
                className="w-full h-[52px] rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-opacity"
                style={{ background: 'var(--c-brand)', opacity: canSubmitFeedback ? 1 : 0.45 }}
              >
                {feedbackSaving ? <div className="w-[22px] h-[22px] border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Envoyer mon avis'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </ModalSheet>
  )
}
