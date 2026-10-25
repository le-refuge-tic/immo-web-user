import { describe, it, expect } from 'vitest'
import { validateBeninPhone, normaliseBeninPhone, toInternationalPhone } from '../phone'

describe('validateBeninPhone', () => {
  it('accepte 10 chiffres commençant par 01', () => expect(validateBeninPhone('0196123456')).toBe(true))
  it('accepte une saisie groupée', () => expect(validateBeninPhone('01 96 12 34 56')).toBe(true))
  it('accepte l\'indicatif 229', () => expect(validateBeninPhone('+229 0196123456')).toBe(true))
  it('refuse l\'ancien format 8 chiffres', () => expect(validateBeninPhone('96123456')).toBe(false))
  it('refuse 10 chiffres sans préfixe 01', () => expect(validateBeninPhone('0296123456')).toBe(false))
})

describe('normaliseBeninPhone', () => {
  it('préfixe +229', () => expect(normaliseBeninPhone('0196123456')).toBe('+2290196123456'))
  it('ne double pas le préfixe', () => expect(normaliseBeninPhone('2290196123456')).toBe('+2290196123456'))
})

describe('toInternationalPhone', () => {
  it('Bénin : saisie locale, groupée ou avec indicatif donnent le même numéro', () => {
    expect(toInternationalPhone('+229', '0196123456')).toBe('+2290196123456')
    expect(toInternationalPhone('+229', '01 96 12 34 56')).toBe('+2290196123456')
    expect(toInternationalPhone('+229', '2290196123456')).toBe('+2290196123456')
  })
  it('autre pays : indicatif + chiffres seulement', () => {
    expect(toInternationalPhone('+33', '6 12 34 56 78')).toBe('+33612345678')
  })
})
