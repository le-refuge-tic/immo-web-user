import { describe, it, expect } from 'vitest'
import { applyOtpInput } from '../otpInput'

const vide = Array(6).fill('')

describe('applyOtpInput', () => {
  it('une frappe remplit la case et avance', () => {
    const r = applyOtpInput(vide, 0, '4', 6)
    expect(r.digits[0]).toBe('4')
    expect(r.focusIndex).toBe(1)
    expect(r.code).toBeNull()
  })

  it('un code collé se répartit sur toutes les cases et est complet', () => {
    const r = applyOtpInput(vide, 0, '123456', 6)
    expect(r.digits.join('')).toBe('123456')
    expect(r.code).toBe('123456')
    expect(r.focusIndex).toBe(5)
  })

  it('ignore les séparateurs d\'un code collé (« 123 456 »)', () => {
    expect(applyOtpInput(vide, 0, '123 456', 6).code).toBe('123456')
  })

  it('un collage depuis une case du milieu est tronqué à la longueur', () => {
    const r = applyOtpInput(vide, 4, '123456', 6)
    expect(r.digits.join('')).toBe('    12'.replace(/ /g, ''))
    expect(r.code).toBeNull()
  })

  it('effacer une case la vide', () => {
    const r = applyOtpInput(['1', '2', '', '', '', ''], 1, '', 6)
    expect(r.digits.slice(0, 2)).toEqual(['1', ''])
    expect(r.focusIndex).toBe(1)
  })

  it('deux chiffres dans une case remplie : le dernier gagne', () => {
    const r = applyOtpInput(['1', '', '', '', '', ''], 0, '17', 6)
    expect(r.digits[0]).toBe('7')
  })
})
