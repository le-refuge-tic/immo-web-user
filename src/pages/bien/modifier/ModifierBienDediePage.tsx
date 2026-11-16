import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { biensApi } from '../../../api/biensApi'
import { referentielsBiens, type GroupeEquipements, type TypeEvenement } from '../../../api/referentielsBiens'
import { useToast } from '../../../context/useToast'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { totauxGuesthouse, totauxSalle } from '../../../shared/biens/calculsTarifs'
import { sousTypeParCle } from '../../../shared/biens/referentielTypes'
import * as G from '../../../shared/biens/formulaires/guesthouse'
import * as S from '../../../shared/biens/formulaires/salleFete'
import { apiMessage } from '../../../utils/apiMessage'
import { usePageTitle } from '../../../utils/usePageTitle'
import type { Bien, Photo } from '../../../types/api'
import { EtapeIdentite, EtapeLocalisation } from '../dedie/EtapesCommunes'
import { EtapeReglesGuesthouse, EtapeTarifGuesthouse } from '../dedie/EtapesGuesthouse'
import { EtapeReglesSalle, EtapeTarifSalle } from '../dedie/EtapesSalle'
import { TotauxGuesthouseBloc, TotauxSalleBloc } from '../dedie/champs'
import PhotosBien from './PhotosBien'

type Famille = 'guesthouse' | 'salle_fete'
type Form = G.GuesthouseForm | S.SalleFeteForm

const TEXTES: Record<Famille, { titre: string; libelleNom: string; placeholderNom: string; placeholderDescription: string }> = {
  guesthouse: {
    titre: 'Modifier la guesthouse', libelleNom: 'Nom de la guesthouse', placeholderNom: 'Ex. Villa Les Palmiers',
    placeholderDescription: 'Ambiance, points forts, proximité (plage, marché, aéroport…)',
  },
  salle_fete: {
    titre: 'Modifier la salle de fêtes', libelleNom: 'Nom de la salle', placeholderNom: 'Ex. Salle Les Cocotiers',
    placeholderDescription: 'Ambiance, points forts, accès, proximité (hôtels, marché, grands axes…)',
  },
}

const versFormulaire = (famille: Famille, b: Bien): Form =>
  famille === 'guesthouse' ? G.depuisBien(b as unknown as Parameters<typeof G.depuisBien>[0]) : S.depuisBien(b as unknown as Parameters<typeof S.depuisBien>[0])
const corpsEdition = (famille: Famille, f: Form) =>
  famille === 'guesthouse' ? G.payloadEdition(f as G.GuesthouseForm) : S.payloadEdition(f as S.SalleFeteForm)

/**
 * Lot 5 — le propriétaire modifie sa guesthouse ou sa salle avec les étapes et les règles de la
 * création. Un bien publié reste en ligne tel quel : la modification part en validation.
 */
export default function ModifierBienDediePage() {
  const { id } = useParams()
  const bienId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const { confirmer } = useConfirm()
  const [bien, setBien] = useState<Bien | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [reference, setReference] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null)
  const [erreurRef, setErreurRef] = useState('')
  const [essai, setEssai] = useState(0)
  const famille: Famille | null = bien?.type === 'guesthouse' || bien?.type === 'salle_fete' ? bien.type : null
  usePageTitle(famille ? TEXTES[famille].titre : 'Modifier le bien')

  useEffect(() => {
    let actif = true
    biensApi.monBien(bienId)
      .then(r => {
        if (!actif) return
        const b = (r.data ?? r.bien ?? r) as Bien
        setBien(b)
        setPhotos(b.photos ?? [])
        if (b.type === 'guesthouse' || b.type === 'salle_fete') {
          const f = versFormulaire(b.type, b)
          setForm(f)
          setReference(JSON.stringify(corpsEdition(b.type, f)))
        }
      })
      .catch(err => { if (actif) setErreur(apiMessage(err) ?? 'Bien introuvable.') })
    return () => { actif = false }
  }, [bienId])

  useEffect(() => {
    if (!famille) return
    let actif = true
    referentielsBiens.equipements(famille)
      .then(g => { if (actif) { setGroupes(Array.isArray(g) ? g : []); setErreurRef('') } })
      .catch(err => { if (actif) setErreurRef(apiMessage(err) ?? 'Impossible de charger les équipements.') })
    if (famille === 'salle_fete') {
      referentielsBiens.evenements()
        .then(e => { if (actif) setEvenements(Array.isArray(e) ? e : []) })
        .catch(err => { if (actif) setErreurRef(apiMessage(err) ?? 'Impossible de charger les types d’événements.') })
    }
    return () => { actif = false }
  }, [famille, essai])

  const manques = useMemo(() => {
    if (!form || !famille) return []
    return [0, 1, 2, 3].flatMap(i => (famille === 'guesthouse'
      ? G.manquesEtape(i, form as G.GuesthouseForm, photos.length)
      : S.manquesEtape(i, form as S.SalleFeteForm, photos.length)))
  }, [form, famille, photos.length])

  const lienFiche = `/proprietaire/biens/${bienId}`
  if (erreur) return <p role="alert" className="p-6 text-sm text-[var(--tx-red)]">{erreur}</p>
  if (!bien) return <p className="p-6 text-sm text-[var(--p-muted)]">Chargement…</p>
  if (!famille || !form) return <p className="p-6 text-sm text-[var(--p-muted)]">Ce bien se modifie depuis sa fiche.</p>

  const textes = TEXTES[famille]
  const modifie = JSON.stringify(corpsEdition(famille, form)) !== reference
  const bloque = enCours || !modifie || manques.length > 0
  const maj = (patch: Partial<Form>) => setForm(f => (f ? ({ ...f, ...patch } as Form) : f))
  const photosMin = sousTypeParCle(famille)?.photos_min ?? G.PHOTOS_MIN
  const publie = bien.statut_moderation === 'approuve'

  const totaux = famille === 'guesthouse'
    ? (() => { const f = form as G.GuesthouseForm; return <TotauxGuesthouseBloc t={totauxGuesthouse({ prixNuitee: f.prixNuitee, nuiteesMin: f.nuiteesMin, caution: f.caution, fraisMenage: f.fraisMenage, prixSemaine: f.prixSemaine, prixMois: f.prixMois })} /> })()
    : (() => { const f = form as S.SalleFeteForm; return <TotauxSalleBloc t={totauxSalle({ prix: f.prix, dureeHeures: f.dureeHeures, heuresMin: f.heuresMin, caution: f.caution, fraisMenage: f.fraisMenage, forfaitJournee: f.forfaitJournee, forfaitWeekend: f.forfaitWeekend })} /> })()

  const enregistrer = async () => {
    if (bloque) return
    setEnCours(true)
    const corps = corpsEdition(famille, form)
    try {
      const r = await biensApi.update(bienId, corps)
      const lu = (r.data ?? r.bien ?? r) as Bien
      setReference(JSON.stringify(corps))
      if (lu.modification_en_attente) {
        setBien(b => (b ? { ...b, modification_en_attente: lu.modification_en_attente } : b))
        toast('Modification envoyée en validation : l’annonce actuelle reste en ligne jusqu’à la décision de l’administration.', 'info')
      } else {
        toast('Modifications enregistrées.', 'success')
      }
    } catch (err) {
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos changements sont conservés : réessayez.', 'error')
    } finally {
      setEnCours(false)
    }
  }

  const quitter = async () => {
    if (modifie && !(await confirmer({ titre: 'Quitter sans enregistrer ?', message: 'Vos changements seront perdus.', confirmer: 'Quitter sans enregistrer', danger: true }))) return
    navigate(lienFiche)
  }

  return (
    <div className="min-h-full bg-[var(--p-deep)] pb-4">
      <header className="sticky top-0 z-20 border-b border-[var(--p-border)] bg-[var(--p-surface)] px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <h1 className="truncate text-base font-bold text-[var(--p-text)]">{textes.titre}</h1>
          <p className="text-xs text-[var(--p-muted)]">Bien n° {bienId}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        {bien.modification_en_attente ? (
          <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-[var(--p-text)]">
            Une modification attend la validation de l’administration ; l’annonce actuelle reste en ligne. Un nouvel envoi remplace la modification en attente.
          </p>
        ) : publie && (
          <p role="note" className="rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] px-4 py-3 text-sm text-[var(--p-muted)]">
            Ce bien est publié : vos modifications seront vérifiées par l’administration avant d’être mises en ligne. L’annonce actuelle reste visible en attendant.
          </p>
        )}
        <EtapeIdentite form={form} maj={maj} libelleNom={textes.libelleNom} placeholderNom={textes.placeholderNom} placeholderDescription={textes.placeholderDescription} />
        <EtapeLocalisation form={form} maj={maj} />
        {famille === 'guesthouse'
          ? <>
              <EtapeTarifGuesthouse form={form as G.GuesthouseForm} maj={maj} totaux={totaux} />
              <EtapeReglesGuesthouse form={form as G.GuesthouseForm} maj={maj} groupes={groupes} erreur={erreurRef} reessayer={() => setEssai(n => n + 1)} />
            </>
          : <>
              <EtapeTarifSalle form={form as S.SalleFeteForm} maj={maj} totaux={totaux} />
              <EtapeReglesSalle form={form as S.SalleFeteForm} maj={maj} evenements={evenements} erreurEvenements={erreurRef} groupes={groupes} erreurEquipements={erreurRef} reessayer={() => setEssai(n => n + 1)} />
            </>}
        <PhotosBien bienId={bienId} photos={photos} setPhotos={setPhotos} min={photosMin} libelle={form.nom.trim() || textes.titre} lien={`/proprietaire/biens/${bienId}/modifier`} />
      </main>

      <div className="sticky bottom-0 z-20 mt-4 border-t border-[var(--p-border)] bg-[var(--p-surface)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          {manques.length > 0 && <p aria-live="polite" className="mb-2 text-xs text-[var(--tx-red)]">Il manque : {manques.join(' · ')}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={enCours} onClick={() => void quitter()} className="rounded-xl border border-[var(--p-border)] px-4 py-2.5 text-sm font-semibold text-[var(--p-text)]">Retour</button>
            <button type="button" onClick={() => void enregistrer()} aria-disabled={bloque}
              className={`flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white ${bloque ? 'cursor-not-allowed opacity-50' : ''}`}>
              {enCours ? 'Enregistrement…' : publie ? 'Envoyer en validation' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
