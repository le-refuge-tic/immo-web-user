import { useState, useEffect } from 'react'
import { userApi } from '../../api/userApi'

type Props = { user: any; onClose: () => void }

const IcUpload = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>

function DocUploader({ label, existingUrl, onUpload }: { label: string; existingUrl?: string | null; onUpload: (f: File) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!file) return
    setUploading(true)
    try { await onUpload(file); setDone(true); setFile(null) } catch (_) {}
    setUploading(false)
  }

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--p-deep)', border: '1px solid var(--p-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{label}</p>
        {(existingUrl || done) && (
          <span className="text-caption font-bold px-2 py-0.5 rounded-full" style={{ background: '#16A34A18', color: '#16A34A' }}>Envoyé</span>
        )}
      </div>
      <label className="block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors" style={{ borderColor: 'var(--p-border)' }}>
        <div className="flex flex-col items-center gap-1" style={{ color: 'var(--p-muted)' }}>
          <IcUpload />
          <p className="text-xs">{file ? file.name : 'Cliquer pour choisir un fichier'}</p>
        </div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      </label>
      {file && (
        <button onClick={submit} disabled={uploading}
          className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: '#4B6BFF' }}>
          {uploading ? 'Envoi…' : 'Envoyer'}
        </button>
      )}
    </div>
  )
}

function StatutBanner({ icon, color, titre, message }: { icon: string; color: string; titre: string; message: string }) {
  return (
    <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: `${color}18`, border: `1px solid ${color}4D` }}>
      <span className="text-lg leading-none">{icon}</span>
      <div>
        <p className="text-sm font-bold" style={{ color }}>{titre}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--p-text)' }}>{message}</p>
      </div>
    </div>
  )
}

function DocLectureSeule({ label }: { label: string }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--p-deep)', border: '1px solid var(--p-border)' }}>
      <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#16A34A18', color: '#16A34A' }}>✓</span>
      <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{label}</p>
    </div>
  )
}

export default function VerificationCipModal({ user, onClose }: Props) {
  const statut: string = user?.statut_verification_documents || 'non_soumis'
  const motif: string | undefined = user?.motif_rejet_documents
  // Lecture seule tant que la demande est en attente ou déjà validée : seul un
  // rejet (ou l'absence de toute soumission) permet de (re)soumettre (C1).
  const lectureSeule = statut === 'en_attente' || statut === 'valide'

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Vérification d'identité"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--p-card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0" style={{ borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
          <h2 className="font-bold" style={{ color: 'var(--p-text)' }}>Vérification d'identité</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--p-deep)', color: 'var(--p-muted)' }}>✕</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--p-muted)' }}>
            Une pièce d'identité vérifiée renforce la confiance des locataires et démarcheurs qui interagissent avec vos annonces. Envoyez votre CIP (Carte d'Identité Personnelle) ou votre IFU.
          </p>

          {statut === 'rejete' && (
            <StatutBanner icon="✕" color="#DC2626" titre="Documents rejetés"
              message={motif ? `Motif : ${motif}` : 'Vos documents ont été rejetés. Merci de soumettre de nouveaux documents.'} />
          )}

          {lectureSeule && (
            <StatutBanner
              icon={statut === 'valide' ? '✓' : '⏳'}
              color={statut === 'valide' ? '#16A34A' : '#F59E0B'}
              titre={statut === 'valide' ? 'Documents validés' : 'Vérification en cours'}
              message={statut === 'valide'
                ? "Votre identité a été vérifiée par notre équipe."
                : "Vos documents ont été envoyés et sont en cours d'examen par notre équipe."}
            />
          )}

          {lectureSeule ? (
            <>
              {user?.cip_url && <DocLectureSeule label="CIP (Carte d'Identité Personnelle)" />}
              {user?.ifu_url && <DocLectureSeule label="IFU (Identifiant Fiscal Unique)" />}
            </>
          ) : (
            <>
              <DocUploader label="CIP (Carte d'Identité Personnelle)" existingUrl={user?.cip_url} onUpload={f => userApi.uploadCip(f)} />
              <DocUploader label="IFU (Identifiant Fiscal Unique)" existingUrl={user?.ifu_url} onUpload={f => userApi.uploadIfu(f)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
