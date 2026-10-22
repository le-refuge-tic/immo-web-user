import { describe, expect, it } from 'vitest'
import { issueStatutLoyer, loyerRepare, referenceLoyer } from '../loyerPaiement'

describe('referenceLoyer', () => {
  it('lit `reference`, seul champ renvoyé par POST /paiements/loyer', () => {
    expect(referenceLoyer({ reference: 'LOY-1', montant: 50000, statut: 'en_attente' } as never)).toBe('LOY-1')
  })

  it('ne lit ni referenceId ni reference_id (absents du backend)', () => {
    expect(referenceLoyer({ referenceId: 'X', reference_id: 'Y' } as never)).toBeNull()
  })

  it('renvoie null pour une référence absente ou vide', () => {
    expect(referenceLoyer({})).toBeNull()
    expect(referenceLoyer({ reference: '  ' })).toBeNull()
    expect(referenceLoyer(undefined)).toBeNull()
  })
})

describe('issueStatutLoyer', () => {
  it('traduit les statuts du backend', () => {
    expect(issueStatutLoyer('reussi')).toBe('success')
    expect(issueStatutLoyer('echoue')).toBe('failed')
    expect(issueStatutLoyer('en_attente')).toBe('waiting')
    expect(issueStatutLoyer(undefined)).toBe('waiting')
  })
})

describe('loyerRepare', () => {
  it('lit `repare` (et non `reparee`)', () => {
    expect(loyerRepare({ repare: true, statut: 'reussi' })).toBe(true)
    expect(loyerRepare({ repare: false, statut: 'deja_paye' })).toBe(false)
    expect(loyerRepare({ reparee: true } as never)).toBe(false)
    expect(loyerRepare(undefined)).toBe(false)
  })
})
