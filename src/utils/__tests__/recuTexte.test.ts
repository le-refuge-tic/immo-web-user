import { describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { texteCompatiblePdf } from '../recuTexte'

/** pdf-lib refuse d'écrire un caractère hors WinAnsi : on le vérifie avec la vraie police. */
async function ecrire(texte: string) {
  const doc = await PDFDocument.create()
  const page = doc.addPage()
  const police = await doc.embedFont(StandardFonts.Helvetica)
  page.drawText(texte, { x: 10, y: 10, size: 9, font: police })
  return police.widthOfTextAtSize(texte, 9)
}

describe('texteCompatiblePdf', () => {
  it('remplace l’espace fine insécable des milliers (cause du PDF impossible à générer)', async () => {
    const brut = `Offre · prix normal ${(1000).toLocaleString('fr-FR')} FCFA`
    await expect(ecrire(brut)).rejects.toThrow(/WinAnsi/)
    expect(texteCompatiblePdf(brut)).toBe('Offre · prix normal 1 000 FCFA')
    await expect(ecrire(texteCompatiblePdf(brut))).resolves.toBeGreaterThan(0)
  })

  it('traite les montants de plusieurs milliers', async () => {
    const montant = `${(1_250_000).toLocaleString('fr-FR')} FCFA`
    expect(texteCompatiblePdf(montant)).toBe('1 250 000 FCFA')
    await expect(ecrire(texteCompatiblePdf(montant))).resolves.toBeGreaterThan(0)
  })

  it('garde les accents, l’euro, les guillemets et les tirets que WinAnsi sait écrire', async () => {
    const texte = 'REÇU D’INTÉGRATION — « Créneau » œuvre € • 50 % à 22h56'
    expect(texteCompatiblePdf(texte)).toBe(texte)
    await expect(ecrire(texte)).resolves.toBeGreaterThan(0)
  })

  it('remplace par « ? » un caractère que WinAnsi ne sait pas écrire, sans casser le document', async () => {
    expect(texteCompatiblePdf('Awa 🏠 Test')).toBe('Awa ?? Test')
    expect(texteCompatiblePdf('Ёлена')).toBe('?????')
    await expect(ecrire(texteCompatiblePdf('Awa 🏠 Ёлена'))).resolves.toBeGreaterThan(0)
  })

  it('ne touche pas un texte déjà compatible', () => {
    expect(texteCompatiblePdf('500 FCFA via MTN Mobile Money')).toBe('500 FCFA via MTN Mobile Money')
    expect(texteCompatiblePdf('')).toBe('')
  })
})
