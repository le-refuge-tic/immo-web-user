import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { useToast } from '../../../context/useToast'
import { useConfirm } from '../../../shared/dialogues/useConfirm'
import { useGestionEnvois } from '../../../shared/uploads/useGestionEnvois'
import { totauxGuesthouse, totauxSalle } from '../../../shared/biens/calculsTarifs'
import { sousTypeParCle } from '../../../shared/biens/referentielTypes'
import * as G from '../../../shared/biens/formulaires/guesthouse'
import * as S from '../../../shared/biens/formulaires/salleFete'
import { sectionsRecapGuesthouse } from '../../../shared/biens/formulaires/recapGuesthouse'
import { sectionsRecapSalle } from '../../../shared/biens/formulaires/recapSalle'
import { referentielsBiens, type GroupeEquipements, type TypeEvenement } from '../../../api/referentielsBiens'
import { apiMessage } from '../../../utils/apiMessage'
import { usePageTitle } from '../../../utils/usePageTitle'
import { EtapeIdentite, EtapeLocalisation, EtapeMedias, Recapitulatif } from './EtapesCommunes'
import { EtapeReglesGuesthouse, EtapeTarifGuesthouse } from './EtapesGuesthouse'
import { EtapeReglesSalle, EtapeTarifSalle } from './EtapesSalle'
import { TotauxGuesthouseBloc, TotauxSalleBloc } from './champs'

export type FamilleDediee = 'guesthouse' | 'salle_fete'
type Form = G.GuesthouseForm | S.SalleFeteForm

const CLES_BROUILLON: Record<FamilleDediee, string> = {
  guesthouse: 'rg_nouvelle_guesthouse',
  salle_fete: 'rg_nouvelle_salle_fete',
}
const TEXTES: Record<FamilleDediee, { titre: string; libelleNom: string; placeholderNom: string; placeholderDescription: string; conseil: string; envoyer: string }> = {
  guesthouse: {
    titre: 'Nouvelle guesthouse', libelleNom: 'Nom de la guesthouse', placeholderNom: 'Ex. Villa Les Palmiers',
    placeholderDescription: 'Ambiance, points forts, proximité (plage, marché, aéroport…)',
    conseil: 'Façade, chambres, salon, cuisine, salle de bain, garage.', envoyer: 'Publier la guesthouse',
  },
  salle_fete: {
    titre: 'Nouvelle salle de fêtes', libelleNom: 'Nom de la salle', placeholderNom: 'Ex. Salle Les Cocotiers',
    placeholderDescription: 'Ambiance, points forts, accès, proximité (hôtels, marché, grands axes…)',
    conseil: 'Salle vide, salle aménagée, scène, extérieur, parking, sanitaires.', envoyer: 'Publier la salle',
  },
}

function lireBrouillon<T>(cle: string): { form: T; etape: number } | null {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null') } catch { return null }
}

/**
 * Lot 4 — le propriétaire publie une guesthouse ou une salle de fêtes avec les mêmes étapes,
 * les mêmes champs et les mêmes règles que le commercial (src/shared/biens/formulaires).
 * Seuls changent : le bloc « Propriétaire » (son compte, en lecture seule) et les frais de
 * visite (fixés par l'administration).
 */
export default function NouveauBienDediePage({ famille }: { famille: FamilleDediee }) {
  const textes = TEXTES[famille]
  usePageTitle(textes.titre)
  const navigate = useNavigate()
  const toast = useToast()
  const { confirmer, choisir } = useConfirm()
  const { demarrer } = useGestionEnvois()
  const { user } = useAuth()
  const cle = CLES_BROUILLON[famille]
  const ETAPES = famille === 'guesthouse' ? G.ETAPES : S.ETAPES
  const photosMin = sousTypeParCle(famille)?.photos_min ?? G.PHOTOS_MIN

  // Le propriétaire de l'annonce est toujours le compte connecté.
  const proprio = useMemo(() => ({
    proprioPrenom: user?.prenom ?? '', proprioNom: user?.nom ?? '',
    proprioTelephone: user?.telephone ?? '', proprioEmail: user?.email ?? '',
  }), [user])

  const [etat, setEtat] = useState<{ form: Form; etape: number }>(() => {
    const vide: Form = famille === 'guesthouse' ? G.formulaireVide() : S.formulaireVide()
    const b = lireBrouillon<Form>(cle)
    return { form: { ...vide, ...(b?.form ?? {}) } as Form, etape: Math.min(b?.etape ?? 0, ETAPES.length - 1) }
  })
  const form = { ...etat.form, ...proprio } as Form
  const etape = etat.etape
  const maj = (patch: Partial<Form>) => setEtat(e => ({ ...e, form: { ...e.form, ...patch } as Form }))
  const [photos, setPhotos] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [fraisVisite, setFraisVisite] = useState(G.FRAIS_VISITE_DEFAUT)
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null)
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null)
  const [erreurRef, setErreurRef] = useState('')
  const [essai, setEssai] = useState(0)

  // Brouillon des champs (les fichiers restent en mémoire).
  useEffect(() => {
    try { localStorage.setItem(cle, JSON.stringify(etat)) } catch { /* stockage plein ou désactivé */ }
  }, [cle, etat])

  useEffect(() => {
    let actif = true
    referentielsBiens.fraisVisite()
      .then(r => { const m = Number(r?.montant); if (actif && Number.isFinite(m) && m >= 0) setFraisVisite(m) })
      .catch(() => { /* repli : tarif par défaut */ })
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

  const libellesEquipements = useMemo(() => Object.fromEntries((groupes ?? []).flatMap(g => g.equipements.map(e => [e.code, e.libelle]))), [groupes])
  const libellesEvenements = useMemo(() => Object.fromEntries((evenements ?? []).map(e => [e.code, e.libelle])), [evenements])

  const manquesDe = (i: number) => (famille === 'guesthouse'
    ? G.manquesEtape(i, form as G.GuesthouseForm, photos.length)
    : S.manquesEtape(i, form as S.SalleFeteForm, photos.length))
  const manques = manquesDe(etape)
  const derniere = etape === ETAPES.length - 1
  const allerA = (n: number) => { setEtat(e => ({ ...e, etape: n })); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const totaux = famille === 'guesthouse'
    ? (() => { const f = form as G.GuesthouseForm; return <TotauxGuesthouseBloc t={totauxGuesthouse({ prixNuitee: f.prixNuitee, nuiteesMin: f.nuiteesMin, caution: f.caution, fraisMenage: f.fraisMenage, prixSemaine: f.prixSemaine, prixMois: f.prixMois })} /> })()
    : (() => { const f = form as S.SalleFeteForm; return <TotauxSalleBloc t={totauxSalle({ prix: f.prix, dureeHeures: f.dureeHeures, heuresMin: f.heuresMin, caution: f.caution, fraisMenage: f.fraisMenage, forfaitJournee: f.forfaitJournee, forfaitWeekend: f.forfaitWeekend })} /> })()

  const effacerBrouillon = () => { try { localStorage.removeItem(cle) } catch { /* rien */ } }

  const envoyer = async () => {
    setEnCours(true)
    try {
      const payload = famille === 'guesthouse'
        ? G.construirePayload(form as G.GuesthouseForm, fraisVisite)
        : S.construirePayload(form as S.SalleFeteForm, fraisVisite)
      const bien = await referentielsBiens.creer(payload)
      effacerBrouillon()
      demarrer({ bienId: bien.id, libelle: form.nom.trim() || textes.titre, lien: `/proprietaire/biens/${bien.id}`, photos, video })
      navigate('/proprietaire', { state: { tab: 'biens' } })
    } catch (err) {
      setEnCours(false)
      toast(apiMessage(err) ?? 'L’enregistrement a échoué. Vos informations sont conservées : réessayez.', 'error')
    }
  }

  const annuler = async () => {
    const choix = await choisir<'garder' | 'supprimer' | 'continuer'>({
      titre: 'Quitter le formulaire ?',
      message: 'Votre brouillon est conservé sur cet appareil (sauf les photos et la vidéo).',
      actions: [
        { valeur: 'continuer', libelle: 'Continuer la saisie', ton: 'neutre' },
        { valeur: 'supprimer', libelle: 'Supprimer le brouillon', ton: 'danger' },
        { valeur: 'garder', libelle: 'Garder le brouillon', ton: 'primaire' },
      ],
    })
    if (choix === 'supprimer') effacerBrouillon()
    if (choix === 'garder' || choix === 'supprimer') navigate('/proprietaire', { state: { tab: 'biens' } })
  }

  const changerDeType = async () => {
    const ok = await confirmer({ titre: 'Changer de type de bien ?', message: 'Votre saisie reste en brouillon sur cet appareil.', confirmer: 'Changer de type' })
    if (ok) navigate('/nouveau-bien')
  }

  const suivant = () => {
    if (manques.length || enCours) return
    if (derniere) void envoyer()
    else allerA(etape + 1)
  }

  const recap = (
    <Recapitulatif
      sections={famille === 'guesthouse'
        ? sectionsRecapGuesthouse(form as G.GuesthouseForm, libellesEquipements)
        : sectionsRecapSalle(form as S.SalleFeteForm, libellesEquipements, libellesEvenements)}
      totaux={totaux}
      manques={ETAPES.slice(0, -1).map((libelle, i) => ({ etape: i, libelle, champs: manquesDe(i) }))}
      allerA={allerA}
    />
  )

  return (
    <div className="min-h-full bg-[var(--p-deep)] pb-4">
      <header className="sticky top-0 z-20 border-b border-[var(--p-border)] bg-[var(--p-surface)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-[var(--p-text)]">{textes.titre}</h1>
            <p className="text-xs text-[var(--p-muted)]">{ETAPES[etape]}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-[var(--p-accent-text)]">{etape + 1}/{ETAPES.length}</span>
        </div>
        <div className="mx-auto mt-2 h-1 max-w-3xl rounded bg-[var(--p-border)]">
          <div className="h-full rounded bg-primary transition-all" style={{ width: `${((etape + 1) / ETAPES.length) * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        {etape === 0 && <EtapeIdentite form={form} maj={maj} libelleNom={textes.libelleNom} placeholderNom={textes.placeholderNom} placeholderDescription={textes.placeholderDescription} />}
        {etape === 1 && <EtapeLocalisation form={form} maj={maj} />}
        {etape === 2 && (famille === 'guesthouse'
          ? <EtapeTarifGuesthouse form={form as G.GuesthouseForm} maj={maj} totaux={totaux} />
          : <EtapeTarifSalle form={form as S.SalleFeteForm} maj={maj} totaux={totaux} />)}
        {etape === 3 && (famille === 'guesthouse'
          ? <EtapeReglesGuesthouse form={form as G.GuesthouseForm} maj={maj} groupes={groupes} erreur={erreurRef} reessayer={() => setEssai(n => n + 1)} />
          : <EtapeReglesSalle form={form as S.SalleFeteForm} maj={maj} evenements={evenements} erreurEvenements={erreurRef} groupes={groupes} erreurEquipements={erreurRef} reessayer={() => setEssai(n => n + 1)} />)}
        {etape === 4 && (
          <EtapeMedias photos={photos} setPhotos={setPhotos} video={video} setVideo={setVideo}
            min={photosMin} max={G.PHOTOS_MAX} conseil={textes.conseil} signaler={m => toast(m, 'error')} recap={recap} />
        )}
      </main>

      <div className="sticky bottom-0 z-20 mt-4 border-t border-[var(--p-border)] bg-[var(--p-surface)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          {manques.length > 0 && <p aria-live="polite" className="mb-2 text-xs text-[var(--tx-red)]">Il manque : {manques.join(' · ')}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={enCours} onClick={() => void annuler()} className="rounded-xl border border-[var(--p-border)] px-4 py-2.5 text-sm font-semibold text-[var(--p-muted)]">Annuler</button>
            <button type="button" disabled={enCours} onClick={() => (etape > 0 ? allerA(etape - 1) : void changerDeType())}
              className="rounded-xl border border-[var(--p-border)] px-4 py-2.5 text-sm font-semibold text-[var(--p-text)]">{etape > 0 ? 'Précédent' : 'Changer de type'}</button>
            <button type="button" onClick={suivant} aria-disabled={manques.length > 0 || enCours}
              className={`min-w-[140px] flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white ${manques.length || enCours ? 'cursor-not-allowed opacity-50' : ''}`}>
              {derniere ? (enCours ? 'Envoi…' : textes.envoyer) : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
