

import logoUrl from '../../assets/REFUGE-LOGO.webp'

import { BLUE } from './nouveau-bien/options'
import { useNouveauBienForm } from './nouveau-bien/useNouveauBienForm'
import { StepTypePrix } from './nouveau-bien/steps/StepTypePrix'
import { StepLocalisation } from './nouveau-bien/steps/StepLocalisation'
import { StepTerrain } from './nouveau-bien/steps/StepTerrain'
import { StepBoutique } from './nouveau-bien/steps/StepBoutique'
import { StepConfort } from './nouveau-bien/steps/StepConfort'
import { StepHonoraires } from './nouveau-bien/steps/StepHonoraires'
import { StepPhotos } from './nouveau-bien/steps/StepPhotos'
import { withAlpha } from '../../utils/color'
import { resumeMedias } from '../../hooks/useMediaDraft'

export default function NouveauBienPage() {
  const form = useNouveauBienForm()
  const {
    isScrolled,
    setIsScrolled,
    step,
    setStep,
    draftBannerDismissed,
    setDraftBannerDismissed,
    submitting,
    error,
    createdId,
    created,
    navigate,
    draft,
    medias,
    isTerrain,
    isBoutique,
    STEP_LABELS,
    goNext,
    navStyle,
  } = form

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="proprio-root proprio-light h-full flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--p-deep)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: withAlpha(BLUE, '20') }}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ color: BLUE }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--p-text)' }}>Bien soumis !</h2>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--p-muted)' }}>
          En attente de validation par l'administrateur. Vous serez notifié une fois approuvé.
        </p>
        <button onClick={() => navigate(createdId ? `/proprietaire/biens/${createdId}` : '/proprietaire')}
          className="px-8 py-4 rounded-xl font-bold"
          style={{ background: BLUE, color: 'white', boxShadow: `0 4px 24px ${withAlpha(BLUE, '44')}` }}>
          Voir mon annonce
        </button>
        <button onClick={() => navigate('/proprietaire', { state: { tab: 'biens' } })}
          className="mt-3 px-6 py-3 rounded-xl text-sm font-semibold"
          style={{ color: 'var(--p-muted)' }}>
          Retour à mes biens
        </button>
      </div>
    )
  }

  return (
    <div className="proprio-root proprio-light h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--p-deep)' }}>

      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-[padding] duration-300${isScrolled ? ' px-2' : ''}`}>
        <nav className="mx-auto pointer-events-auto backdrop-blur-xl transition-all duration-300" style={navStyle}>
          <div className="flex items-center gap-2.5 py-3">
            <img src={logoUrl} alt="REFUGE" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />

            <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)', color: 'var(--p-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {step > 0 ? 'Retour' : 'Annuler'}
            </button>

            <div className="flex-1 text-center min-w-0">
              <h1 className="text-[13px] font-bold truncate" style={{ color: 'var(--p-text)' }}>Nouveau bien</h1>
              <p className="text-micro uppercase tracking-[0.12em] truncate" style={{ color: 'var(--p-muted)' }}>
                {STEP_LABELS[step]}
              </p>
            </div>

            <div className="flex-shrink-0 px-2.5 py-1 rounded-full text-caption font-bold border"
              style={{ borderColor: withAlpha(BLUE, '40'), background: withAlpha(BLUE, '15'), color: 'var(--p-accent-text)' }}>
              {step + 1}/{STEP_LABELS.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] w-full" style={{ background: 'var(--p-border)' }}>
            <div className="h-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%`, background: BLUE }} />
          </div>
        </nav>
      </header>

      {/* ── Content + Footer ── */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="flex-1 overflow-y-auto px-4 py-5 md:max-w-2xl md:mx-auto md:w-full"
          onScroll={e => setIsScrolled(e.currentTarget.scrollTop > 40)}>

          <div id="nouveau-bien-error" role="alert" aria-live="assertive" aria-atomic="true">
            {error && (
              <div className="rounded-xl px-4 py-3 border mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                <p className="text-sm" style={{ color: 'var(--tx-red)' }}>{error}</p>
              </div>
            )}
          </div>

          {(draft.restored || medias.restored) && !draftBannerDismissed && (
            <div role="status" className="rounded-xl px-4 py-3 border mb-4 flex items-start justify-between gap-3"
              style={{ background: 'rgba(75,107,255,0.08)', borderColor: 'rgba(75,107,255,0.25)' }}>
              <p className="text-sm" style={{ color: 'var(--p-text)' }}>
                Votre saisie précédente a été retrouvée{medias.restored ? `, avec ${resumeMedias(medias.restored)}.` : '.'}
              </p>
              <div className="flex gap-3 flex-shrink-0">
                <button type="button" onClick={async () => { draft.clear(); await medias.clear(); window.location.reload() }} className="text-xs font-bold" style={{ color: 'var(--tx-red)' }}>
                  Tout effacer
                </button>
                <button type="button" onClick={() => setDraftBannerDismissed(true)} className="text-xs font-bold" style={{ color: BLUE }}>OK</button>
              </div>
            </div>
          )}

          {/* ═══ ÉTAPE 0 : TYPE & PRIX ═══ */}
          {step === 0 && <StepTypePrix form={form} />}

          {/* ═══ ÉTAPE 1 : LOCALISATION ═══ */}
          {step === 1 && <StepLocalisation form={form} />}

          {/* ═══ ÉTAPE 2 : TERRAIN ═══ */}
          {step === 2 && isTerrain && <StepTerrain form={form} />}

          {/* ═══ ÉTAPE 2 : BOUTIQUE ═══ */}
          {step === 2 && isBoutique && <StepBoutique form={form} />}

          {/* ═══ ÉTAPE 2 : RÉSIDENTIEL ═══ */}
          {step === 2 && !isTerrain && !isBoutique && <StepConfort form={form} />}

          {/* ═══ ÉTAPE 3 : HONORAIRES ═══ */}
          {step === 3 && <StepHonoraires form={form} />}

          {/* ═══ ÉTAPE 4 : RÉCAPITULATIF + PHOTOS + VIDÉO ═══ */}
          {step === 4 && <StepPhotos form={form} />}

          <div className="h-4" />
        </div>

        {/* ── Footer CTA ── */}
        <div className="shrink-0 px-4 py-2.5 border-t" style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)' }}>
          <button onClick={goNext} disabled={submitting}
            className="mx-auto block px-10 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: BLUE, color: 'white', boxShadow: `0 2px 16px ${withAlpha(BLUE, '38')}` }}>
            {submitting ? 'Publication…' : step < 4 ? 'Continuer →' : 'Publier le bien'}
          </button>
        </div>
      </div>
    </div>
  )
}
