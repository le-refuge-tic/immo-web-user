import { describe, it, expect } from 'vitest'
import { nameError, NAME_MAX_LENGTH } from '../nameRules'

describe('nameError', () => {
  it('accepte 2 à 100 caractères', () => {
    expect(nameError('Nom', 'Ko')).toBeNull()
    expect(nameError('Nom', 'a'.repeat(NAME_MAX_LENGTH))).toBeNull()
  })
  it('refuse un champ vide ou fait d\'espaces', () => {
    expect(nameError('Prénom', '')).toBe('Renseignez votre prénom.')
    expect(nameError('Prénom', '   ')).toBe('Renseignez votre prénom.')
  })
  it('refuse un seul caractère, espaces ignorés', () => {
    expect(nameError('Nom', ' K ')).toContain('au moins 2 caractères')
  })
  it('refuse plus de 100 caractères', () => {
    expect(nameError('Nom', 'a'.repeat(NAME_MAX_LENGTH + 1))).toContain('100')
  })
})
