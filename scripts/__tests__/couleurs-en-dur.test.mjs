import { describe, expect, it } from 'vitest'
import { compterCouleurs, sansCommentaires } from '../couleurs-en-dur.mjs'

describe('compterCouleurs (FE-B-017)', () => {
  it('compte les couleurs du code', () => {
    expect(compterCouleurs("const a = { color: '#1A1A2E', background: '#FFF' }", 'pages/X.tsx')).toEqual({ enDur: 2, libres: 0 })
  })

  it('ignore les commentaires (ligne, bloc, JSX) mais pas les URL', () => {
    const texte = [
      "// ancien : #0077B6",
      "/* palette #112233",
      "   #445566 */",
      "{/* bordure #778899 */}",
      "const u = 'https://exemple.bj/#abc'",
      "const c = '#ABCDEF' // fond #123456",
    ].join('\n')
    expect(compterCouleurs(texte, 'pages/X.tsx')).toEqual({ enDur: 2, libres: 0 })
  })

  it('compte à part les lignes marquées « couleur-libre : … » (même ligne ou ligne précédente)', () => {
    const texte = [
      "// couleur-libre : couleur officielle de Facebook",
      "{ bg: '#1877F2' },",
      "{ bg: '#25D366' }, // couleur-libre : WhatsApp",
      "{ bg: '#000000' },",
    ].join('\n')
    expect(compterCouleurs(texte, 'components/ShareSheet.tsx')).toEqual({ enDur: 1, libres: 2 })
  })

  it('compte à part tout un fichier d’illustration', () => {
    expect(compterCouleurs("fill: '#FF5252', rim: '#D32F2F'", 'components\\FaceRating.tsx')).toEqual({ enDur: 0, libres: 2 })
  })

  it('garde les retours à la ligne en retirant un commentaire de bloc', () => {
    expect(sansCommentaires('a\n/* x\ny */\nb').split('\n')).toHaveLength(4)
  })
})
