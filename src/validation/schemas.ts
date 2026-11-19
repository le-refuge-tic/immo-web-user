/**
 * Lot 15 — schémas de validation des formulaires du site (propriétaires et public). Mêmes
 * règles que les DTO du backend ; inventaire complet dans docs/VALIDATION_FORMULAIRES.md.
 */
import { z } from 'zod'
import { estTelephoneBenin, MESSAGE_TELEPHONE } from '../shared/saisie/telephone'
import { zEmail, zMontant, zNombre, zNombreFacultatif, zNomReel, zTexteFacultatif } from '../shared/saisie/schemas'
import { nameError } from '../utils/nameRules'

const INDICATIF_BENIN = '+229'
/** Messages repris de l'écran existant (vérifiés par les tests e2e). */
const MESSAGE_CHAMPS_VIDES = 'Remplissez tous les champs'

const zNom = (libelle: string) =>
  z.string().superRefine((v, ctx) => {
    const m = nameError(libelle, v)
    if (m) ctx.addIssue({ code: z.ZodIssueCode.custom, message: m })
  }).transform(v => v.trim())

const emailFacultatif = () =>
  z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined
    const r = zEmail().safeParse(v)
    if (r.success) return r.data
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.error.issues[0].message })
    return z.NEVER
  })

/** Téléphone saisi avec un indicatif choisi : règle béninoise seulement pour +229. */
const telephoneSelonPays = (indicatif: string, requis: boolean) =>
  z.string().trim().superRefine((v, ctx) => {
    if (!v) {
      if (requis) ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGE_CHAMPS_VIDES })
      return
    }
    if (indicatif === INDICATIF_BENIN ? !estTelephoneBenin(v) : !/^\d{6,15}$/.test(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: indicatif === INDICATIF_BENIN ? MESSAGE_TELEPHONE : 'Numéro invalide.' })
    }
  })

/** Connexion par téléphone (`LoginDto` : mot de passe ≤ 128). */
export const schemaConnexion = (indicatif: string) => z.object({
  telephone: telephoneSelonPays(indicatif, true),
  password: z.string().min(1, MESSAGE_CHAMPS_VIDES).max(128, '128 caractères au maximum.'),
})

/**
 * Inscription (`RegisterDto` : nom et prénom 2 à 100, mot de passe 8 à 128, e-mail ≤ 255) ;
 * le service exige un téléphone ou un e-mail.
 */
export const schemaInscription = (indicatif: string) => z
  .object({
    nom: zNom('Nom'),
    prenom: zNom('Prénom'),
    telephone: telephoneSelonPays(indicatif, false),
    email: emailFacultatif(),
    password: z.string().min(8, 'Mot de passe trop court (8 caractères min.)').max(128, '128 caractères au maximum.'),
    confirmation: z.string(),
    conditions: z.literal(true, { errorMap: () => ({ message: "Veuillez accepter les conditions d'utilisation" }) }),
  })
  .superRefine((v, ctx) => {
    if (!v.telephone && !v.email) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['telephone'], message: 'Renseignez un téléphone ou un e-mail.' })
    if (v.password !== v.confirmation) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmation'], message: 'Les mots de passe ne correspondent pas' })
  })

/** Profil (`UpdateProfileDto` : nom réel, e-mail facultatif). */
export const schemaProfil = z.object({
  nom: zNomReel(),
  prenom: zNomReel(),
  email: emailFacultatif(),
})

/** Modification rapide d'un bien : prix requis, promo < prix et ≥ 100, frais ≥ 0. */
export const schemaModificationBien = z
  .object({
    prix: zMontant({ max: 999_999_999, libelle: 'Le prix' }),
    prixPromo: zNombreFacultatif({ min: 100, max: 999_999_999, libelle: 'Le prix promotionnel' }),
    fraisVisite: zNombreFacultatif({ min: 0, max: 999_999, libelle: 'Les frais de visite' }),
    description: zTexteFacultatif(5000),
  })
  .superRefine((v, ctx) => {
    if (v.prixPromo != null && v.prixPromo >= v.prix) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['prixPromo'], message: 'Le prix promotionnel doit être inférieur au prix normal.' })
    }
  })

/** Ajout d'un bien en gestion : loyer mensuel positif. */
export const schemaLoyerGestion = z.object({
  loyer: zMontant({ max: 999_999_999, libelle: 'Le loyer' }),
})

/** Paiement Mobile Money (visite, intégration, rechargement, loyer) : numéro béninois. */
export const schemaNumeroMobileMoney = z.object({
  telephone: z.string().refine(estTelephoneBenin, MESSAGE_TELEPHONE),
})

/** Rechargement d'un portefeuille : montant entre les bornes de l'opérateur. */
export const schemaRechargement = (min: number, max: number) => z.object({
  montant: zNombre({ min, max, libelle: 'Le montant' }),
  telephone: z.string().refine(estTelephoneBenin, MESSAGE_TELEPHONE),
})
