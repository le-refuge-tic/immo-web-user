import { describe, it, expect } from 'vitest'
import { libelleAnnulation } from '../helpers'

describe('libelleAnnulation', () => {
  const annulee = (annule_par: 'client' | 'gestionnaire' | 'admin', annule_par_id = 42) =>
    ({ status: 'declined', annule_par, annule_par_id })

  it('vue de celui qui a annulé : « Annulé par vous »', () => {
    expect(libelleAnnulation(annulee('client'), 42)).toBe('Annulé par vous')
  })

  it('vue de l’autre partie : qui a annulé', () => {
    expect(libelleAnnulation(annulee('client'), 7)).toBe('Annulé par le client')
    expect(libelleAnnulation(annulee('gestionnaire'), 7)).toBe('Annulé par l’annonceur')
    expect(libelleAnnulation(annulee('admin'), 7)).toBe('Annulé par l’équipe Refuge')
  })

  it('un vrai refus garde le libellé « Refusé » (null)', () => {
    expect(libelleAnnulation({ status: 'declined' }, 7)).toBeNull()
    expect(libelleAnnulation({ status: 'accepted', annule_par: 'client' }, 7)).toBeNull()
  })
})
