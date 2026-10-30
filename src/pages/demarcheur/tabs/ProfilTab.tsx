import AppearanceSetting from '../../../components/AppearanceSetting'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { userApi } from '../../../api/userApi'
import EditProfileModal from '../../profile/EditProfileModal'
import ChangePasswordModal from '../../profile/ChangePasswordModal'
import { PURPLE, DARK_PURPLE } from '../shared'
import { IcShield, IcUpload, IcChevron } from '../icons'
import type { ProfilDemarcheur } from '../../../types/demarcheur'
import { apiMessage } from '../../../utils/apiMessage'
import StatutVerificationDocuments from '../../../components/StatutVerificationDocuments'
import { useStatutDocuments } from '../../../hooks/useStatutDocuments'

export default function ProfilTab({ user, onOpenDelegations }: { user: ProfilDemarcheur | null | undefined; onOpenDelegations: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [cipFile, setCipFile] = useState<File | null>(null)
  const [ifuFile, setIfuFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  // Un document envoyé repasse la demande « en attente » côté serveur : on l'affiche tout de suite.
  const [statutDocs, marquerEnvoye] = useStatutDocuments(user?.statut_verification_documents)
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()
  const score = user?.score_credibilite ?? 100

  const uploadCip = async () => {
    if (!cipFile) return
    setUploading(true)
    setUploadError('')
    try { await userApi.uploadCip(cipFile); setCipFile(null); marquerEnvoye() } catch (e: unknown) {
      // Le fichier reste sélectionné et le bouton « Envoyer » redevient actif.
      setUploadError(apiMessage(e) || "L'envoi du document a échoué. Réessayez.")
    }
    setUploading(false)
  }
  const uploadIfu = async () => {
    if (!ifuFile) return
    setUploading(true)
    setUploadError('')
    try { await userApi.uploadIfu(ifuFile); setIfuFile(null); marquerEnvoye() } catch (e: unknown) {
      setUploadError(apiMessage(e) || "L'envoi du document a échoué. Réessayez.")
    }
    setUploading(false)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="p-5 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold"
          style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>{initials}</div>
        <p className="font-bold text-text-dark text-lg">{user?.prenom} {user?.nom}</p>
        <p className="text-sm text-text-grey">{user?.email || user?.telephone}</p>
      </div>

      {/* Score card */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${DARK_PURPLE}, ${PURPLE})` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-xl text-white text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)' }}>Mon profil</span>
            <span className="text-white/70"><IcShield /></span>
          </div>
          <p className="text-white/70 text-xs mb-1">Score de crédibilité</p>
          <p className="text-white text-2xl font-bold mb-1">{score} / 100</p>
          <p className="text-white/60 text-caption mb-2">Note de fiabilité sur 100. Elle baisse de 10 points à chaque annulation tardive d'une visite.</p>
          <div className="h-1.5 rounded-full bg-white/20 mb-4"><div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} /></div>
          <div className="flex">
            <div className="flex-1"><p className="text-white/60 text-micro">Biens</p><p className="text-white font-bold text-sm">{user?.nb_biens ?? 0}</p></div>
            <div className="w-px bg-white/20 mx-3" />
            <div className="flex-1"><p className="text-white/60 text-micro">Étoiles</p><p className="text-white font-bold text-sm">{user?.nb_etoiles ?? 0}</p></div>
          </div>
        </div>
      </div>

      {/* Vérification docs */}
      <div className="px-4 mb-4">
        <p className="font-bold text-text-dark mb-3">Vérification d'identité</p>
        {uploadError && <p role="alert" className="text-sm font-semibold mb-3" style={{ color: 'var(--c-danger)' }}>{uploadError}</p>}
        <div className="space-y-3">
          <StatutVerificationDocuments statut={statutDocs} motif={statutDocs === 'rejete' ? user?.motif_rejet_documents : null} />
          {[
            { label: 'CIP (Carte d\'identité professionnelle)', file: cipFile, setFile: setCipFile, onUpload: uploadCip },
            { label: 'IFU (Identifiant Fiscal Unique)', file: ifuFile, setFile: setIfuFile, onUpload: uploadIfu },
          ].map(doc => (
            <div key={doc.label} className="card-soft rounded-xl p-4">
              <p className="text-sm font-semibold text-text-dark mb-3">{doc.label}</p>
              {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- faux positif : le libellé entoure le champ fichier et lui est lié par htmlFor */}
              <label htmlFor={`doc-${doc.label.slice(0, 3).toLowerCase()}`} className="block border-2 border-dashed border-divider rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-text-grey"><IcUpload /></span>
                  <p className="text-xs text-text-grey">{doc.file ? doc.file.name : 'Cliquer pour choisir un fichier'}</p>
                </div>
                <input id={`doc-${doc.label.slice(0, 3).toLowerCase()}`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => doc.setFile(e.target.files?.[0] || null)} />
              </label>
              {doc.file && (
                <button onClick={doc.onUpload} disabled={uploading}
                  className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: PURPLE }}>
                  {uploading ? 'Envoi…' : 'Envoyer'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        <button onClick={() => setEditOpen(true)} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-dark">Modifier le profil</span>
          <IcChevron />
        </button>
        <button onClick={() => setPasswordOpen(true)} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-dark">Changer le mot de passe</span>
          <IcChevron />
        </button>
        <button onClick={onOpenDelegations} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-dark">Délégations reçues</span>
          <IcChevron />
        </button>
        <button onClick={() => navigate('/mes-roles')} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-dark">Gérer mes rôles</span>
          <IcChevron />
        </button>
        <button onClick={() => navigate('/portefeuille')} className="w-full card-soft rounded-xl px-4 py-3.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-dark">Historique des transactions</span>
          <IcChevron />
        </button>
        <div className="w-full card-soft rounded-xl"><AppearanceSetting /></div>
        <button onClick={() => { logout(); navigate('/login') }} className="w-full mt-2 py-3.5 rounded-xl text-danger font-bold text-sm border border-danger/20 bg-danger/5">
          Déconnexion
        </button>
      </div>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
