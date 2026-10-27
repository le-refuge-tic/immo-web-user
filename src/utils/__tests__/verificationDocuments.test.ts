import { describe, expect, it } from 'vitest'
import { etatVerification } from '../verificationDocuments'

describe('etatVerification', () => {
  it('rien d’envoyé : pas de message', () => {
    expect(etatVerification('non_soumis')).toBeNull()
    expect(etatVerification(undefined)).toBeNull()
  })
  it('en attente, validé', () => {
    expect(etatVerification('en_attente')?.ton).toBe('attente')
    expect(etatVerification('valide')).toEqual({ ton: 'ok', titre: 'Identité vérifiée' })
  })
  it('refusé : avec ou sans motif', () => {
    expect(etatVerification('rejete', 'photo floue')?.detail).toBe('Motif : photo floue. Envoyez un nouveau document lisible.')
    expect(etatVerification('rejete', null)?.detail).toBe('Envoyez un nouveau document lisible.')
  })
})
