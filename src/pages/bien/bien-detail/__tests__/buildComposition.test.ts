import { describe, expect, it } from 'vitest'
import { buildComposition } from '../helpers'
import type { Bien } from '../../../../types/api'

const avecPieces = (sous_type: string) =>
  ({ id: 1, type: 'maison', amenites: { sous_type }, pieces: [{ id: 1, nom: 'Chambre' }] }) as unknown as Bien

describe('buildComposition : locaux professionnels sans composition des pièces', () => {
  it.each(['boutique', 'bureau'])('%s : aucune composition, même avec des pièces enregistrées', sous => {
    expect(buildComposition(avecPieces(sous))).toBeNull()
  })

  it('une villa garde sa composition', () => {
    expect(buildComposition(avecPieces('villa'))).not.toBeNull()
  })
})
