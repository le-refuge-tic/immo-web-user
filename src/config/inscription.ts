/**
 * Inscription web réservée aux propriétaires (VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT).
 * « false » rouvre le choix du rôle ; toute autre valeur (ou absence) = restriction active.
 * Ne concerne que l'inscription : connexion et pages ne changent pas. Restriction d'interface
 * uniquement, l'API continue d'accepter les inscriptions de l'app mobile.
 */
export const INSCRIPTION_PROPRIETAIRES_UNIQUEMENT =
  String(import.meta.env.VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT ?? 'true').trim().toLowerCase() !== 'false'

export const TEXTE_APPLI_MOBILE = 'Pour chercher un logement, utilisez l’application mobile REFUGE.'
