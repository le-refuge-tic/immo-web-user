import { describe, expect, it } from 'vitest'
import { clavierOuvert, masquerBarreNavigation } from '../barreNavigation'

describe('lot 9 : barre de navigation du bas', () => {
  it('masquée pendant la publication et l’édition plein écran', () => {
    expect(masquerBarreNavigation('/nouveau-bien')).toBe(true)
    expect(masquerBarreNavigation('/nouveau-bien/guesthouse')).toBe(true)
    expect(masquerBarreNavigation('/nouveau-bien/salle-fete')).toBe(true)
    expect(masquerBarreNavigation('/proprietaire/biens/12/modifier')).toBe(true)
    expect(masquerBarreNavigation('/')).toBe(false)
    expect(masquerBarreNavigation('/proprietaire/biens/12')).toBe(false)
    expect(masquerBarreNavigation('/nouveau-bienveillant')).toBe(false)
  })

  it('clavier ouvert : champ de saisie actif et zone visible nettement réduite', () => {
    expect(clavierOuvert({ hauteurVisible: 400, hauteurFenetre: 844, saisieActive: true })).toBe(true)
    expect(clavierOuvert({ hauteurVisible: 400, hauteurFenetre: 844, saisieActive: false })).toBe(false)
    // Barre d'adresse qui se replie : faible variation, pas un clavier.
    expect(clavierOuvert({ hauteurVisible: 780, hauteurFenetre: 844, saisieActive: true })).toBe(false)
  })
})
