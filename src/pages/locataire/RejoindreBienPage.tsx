import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { biensApi } from '../../api/biensApi'

const BLUE = '#2E86C1'

export default function RejoindreBienPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [error, setError] = useState('')

  const rejoindre = async () => {
    const c = code.trim().toUpperCase()
    if (c.length < 4) { setError('Entrez le code reçu de votre propriétaire.'); return }
    setError(''); setLoading(true)
    try {
      await biensApi.rejoindre(c)
      setSucces(true)
    } catch (e: any) {
      const status = e?.response?.status
      const msg = status === 409
        ? 'Une demande est déjà en cours pour ce bien.'
        : status === 404
          ? 'Code invalide ou expiré. Vérifiez avec votre propriétaire.'
          : e?.response?.data?.message || 'Une erreur est survenue.'
      setError(msg)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-shrink-0 px-5 pt-14 md:pt-6 pb-5 flex items-center gap-4" style={{ background: BLUE }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <p className="text-white font-bold text-lg">Rejoindre un bien</p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {succes ? (
          <div className="flex flex-col items-center text-center pt-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#22C55E1A' }}>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-bold text-text-dark text-xl mb-3">Demande envoyée !</p>
            <p className="text-text-grey text-sm leading-relaxed mb-8">L'admin va vérifier et activer votre suivi de loyers sous peu.</p>
            <button onClick={() => navigate(-1)} className="font-semibold text-sm" style={{ color: BLUE }}>← Retour</button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl mb-8" style={{ background: BLUE + '14', border: `1px solid ${BLUE}30` }}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <p className="text-sm text-text-grey leading-relaxed">Votre propriétaire vous a partagé un code d'invitation (ex : IMC-4X7K). Entrez-le ci-dessous pour signaler votre présence.</p>
            </div>

            <label className="text-xs font-bold text-text-dark uppercase tracking-wide mb-2 block">Code d'invitation</label>
            <input type="text" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="IMC-XXXXXX" maxLength={12}
              className="w-full border-2 rounded-xl px-4 py-4 text-2xl font-bold tracking-[0.2em] outline-none mb-2 text-text-dark"
              style={{ borderColor: code ? BLUE : 'rgba(0,0,0,0.12)' }} />
            {error && <p className="text-sm text-red-500 mt-1 mb-4">{error}</p>}

            <button onClick={rejoindre} disabled={loading || !code.trim()}
              className="w-full mt-6 py-4 rounded-xl text-white font-bold text-base disabled:opacity-50"
              style={{ background: BLUE }}>
              {loading ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
