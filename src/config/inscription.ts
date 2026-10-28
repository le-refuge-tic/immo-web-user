/**
 * Restriction de l'inscription web aux seuls propriétaires (VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT).
 * Par défaut, l'inscription est ouverte à tous (prospects compris) avec le choix du rôle ; seule la valeur
 * « true » active la restriction. Ne concerne que l'inscription : connexion et pages ne changent pas.
 * Restriction d'interface uniquement, l'API continue d'accepter les inscriptions de l'app mobile.
 */
export const INSCRIPTION_PROPRIETAIRES_UNIQUEMENT =
  String(import.meta.env.VITE_INSCRIPTION_PROPRIETAIRES_UNIQUEMENT ?? 'false').trim().toLowerCase() === 'true'

export const TEXTE_APPLI_MOBILE = 'Pour chercher un logement, utilisez l’application mobile REFUGE.'
