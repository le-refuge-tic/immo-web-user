/**
 * Génération PDF d'un reçu REFUGE — réplique fidèle du reçu de l'application
 * mobile (packages Flutter `pdf`/`printing`).
 *
 * Deux variantes, identiques en structure, seule la couleur d'accent change :
 *   • Reçu de visite  → vert  (#1A6B3C)
 *   • Reçu de loyer   → bleu  (#1A3A6B)
 *
 * Format A4, marges 48/40, police Helvetica (WinAnsi ⇒ accents FR OK), cachet
 * « PAYÉ », filigrane logo à 5 % et pied de page identiques au mobile.
 */
import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage, type PDFFont, type RGB } from 'pdf-lib'
import type { Degrees } from 'pdf-lib'
import logoUrl from '../assets/REFUGE-ICON.png'

// ── Couleurs (0–1) ─────────────────────────────────────────────────────────
const hex = (h: number) => rgb(((h >> 16) & 0xff) / 255, ((h >> 8) & 0xff) / 255, (h & 0xff) / 255)

const GREEN_DARK = hex(0x1a6b3c)
const GREEN_LIGHT = hex(0xe8f5ee)
const BLUE_DARK = hex(0x1a3a6b)
const BLUE_LIGHT = hex(0xe8f0fa)

const GREY_600 = hex(0x757575)
const GREY_500 = hex(0x9e9e9e)
const GREY_300 = hex(0xe0e0e0)
const GREY_200 = hex(0xeeeeee)
const BLACK = rgb(0.11, 0.11, 0.12)

// ── Types de données (mêmes clés que le back-end / RecuPage) ─────────────────
export interface RecuLigne {
  label: string
  value: string
}
export interface RecuSection {
  titre: string
  lignes: RecuLigne[]
}
export interface RecuPdfData {
  variante: 'visite' | 'loyer'
  /** Petit libellé sous « REÇU DE … » (« Frais de visite » ou « Septembre 2026 »). */
  sousTitre: string
  montantLabel: string
  montant: string
  /** Ligne sous le montant (« via MTN Mobile Money · 30/07/2026 à 22h56 »). */
  paiementLigne: string
  sections: RecuSection[]
  filename: string
}

const A4 = { w: 595.28, h: 841.89 }
const MX = 48 // marge horizontale
const MT = 40 // marge haute
const CONTENT_W = A4.w - MX * 2

/** Dessine du texte à une position absolue (origine PDF = bas-gauche). */
function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB) {
  page.drawText(text ?? '', { x, y, size, font, color })
}

export async function generateRecuPdf(data: RecuPdfData): Promise<void> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([A4.w, A4.h])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const dark = data.variante === 'visite' ? GREEN_DARK : BLUE_DARK
  const light = data.variante === 'visite' ? GREEN_LIGHT : BLUE_LIGHT
  const titre = data.variante === 'visite' ? 'REÇU DE VISITE' : 'REÇU DE LOYER'

  // ── Filigrane logo (5 %) ───────────────────────────────────────────────
  try {
    const bytes = await fetch(logoUrl).then(r => r.arrayBuffer())
    const logo = await doc.embedPng(bytes)
    const w = 300
    const h = (logo.height / logo.width) * w
    page.drawImage(logo, {
      x: (A4.w - w) / 2,
      y: A4.h - 200 - h,
      width: w,
      height: h,
      opacity: 0.05,
    })
  } catch {
    /* logo optionnel */
  }

  // Le PDF-lib place l'origine en bas ; on suit un curseur `y` décroissant.
  let y = A4.h - MT

  // ── En-tête ────────────────────────────────────────────────────────────
  drawText(page, 'REFUGE', MX, y - 18, 22, fontBold, dark)
  const titreW = fontBold.widthOfTextAtSize(titre, 13) + 12 * 1.5
  drawText(page, titre, A4.w - MX - titreW, y - 12, 13, fontBold, dark)
  drawText(page, data.sousTitre, A4.w - MX - font.widthOfTextAtSize(data.sousTitre, 9), y - 26, 9, font, GREY_600)
  y -= 30
  page.drawRectangle({ x: MX, y: y - 2, width: CONTENT_W, height: 2, color: dark })
  y -= 22

  // ── Bloc montant + cachet PAYÉ ───────────────────────────────────────────
  const boxH = 84
  page.drawRectangle({ x: MX, y: y - boxH, width: CONTENT_W, height: boxH, color: light })
  const cx = A4.w / 2
  drawText(page, data.montantLabel, cx - font.widthOfTextAtSize(data.montantLabel, 10) / 2, y - 22, 10, font, GREY_600)
  drawText(page, data.montant, cx - fontBold.widthOfTextAtSize(data.montant, 28) / 2, y - 52, 28, fontBold, dark)
  drawText(page, data.paiementLigne, cx - font.widthOfTextAtSize(data.paiementLigne, 9) / 2, y - 68, 9, font, GREY_600)

  // Cachet « PAYÉ » (cercle + texte incliné, comme le reçu mobile)
  const stampR = 29
  const stampCx = A4.w - MX - 20 - stampR
  const stampCy = y - 16 - stampR
  page.drawCircle({ x: stampCx, y: stampCy, size: stampR, borderColor: dark, borderWidth: 2.5 })
  const stampAngle = 20 // ~ -0.35 rad, sens anti-horaire
  const stampTxtW = fontBold.widthOfTextAtSize('PAYÉ', 13)
  drawRotatedText(page, 'PAYÉ', stampCx, stampCy, 13, fontBold, dark, stampAngle, stampTxtW)
  y -= boxH + 22

  // ── Sections ─────────────────────────────────────────────────────────────
  for (const section of data.sections) {
    drawText(page, section.titre, MX, y - 9, 9, fontBold, dark)
    y -= 13
    page.drawRectangle({ x: MX, y: y - 1, width: CONTENT_W, height: 1, color: GREY_200 })
    y -= 8
    for (const l of section.lignes) {
      drawText(page, l.label, MX, y - 10, 10, font, GREY_600)
      // valeur en gras, alignée après une colonne label de 130
      const valX = MX + 130
      drawWrapped(page, l.value, valX, y - 10, 10, fontBold, BLACK, A4.w - MX - valX)
      y -= 20
    }
    y -= 8
  }

  // ── Pied de page ───────────────────────────────────────────────────────
  const footY = MT + 26
  page.drawRectangle({ x: MX, y: footY + 16, width: CONTENT_W, height: 1, color: GREY_300 })
  const footer1 = 'Ce reçu est généré automatiquement par REFUGE — Plateforme immobilière.'
  const footer2 = 'Conservez-le comme preuve de paiement.'
  drawText(page, footer1, cx - font.widthOfTextAtSize(footer1, 8) / 2, footY, 8, font, GREY_500)
  drawText(page, footer2, cx - font.widthOfTextAtSize(footer2, 8) / 2, footY - 11, 8, font, GREY_500)

  // ── Téléchargement ───────────────────────────────────────────────────────
  const pdfBytes = await doc.save()
  // Copie dans un ArrayBuffer « propre » pour éviter les soucis de type Blob.
  const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = data.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Coupe la valeur si elle dépasse la largeur disponible (pas de retour à la ligne complexe). */
function drawWrapped(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  maxWidth: number,
) {
  let out = text ?? ''
  if (font.widthOfTextAtSize(out, size) > maxWidth) {
    while (out.length > 1 && font.widthOfTextAtSize(out + '…', size) > maxWidth) {
      out = out.slice(0, -1)
    }
    out = out.trimEnd() + '…'
  }
  page.drawText(out, { x, y, size, font, color })
}

/**
 * Dessine un texte incliné centré sur (cx, cy). pdf-lib fait pivoter autour de
 * l'origine (x, y) du texte, donc on repositionne l'origine pour que le centre
 * visuel du mot tombe sur (cx, cy) après rotation.
 */
function drawRotatedText(
  page: PDFPage,
  text: string,
  cx: number,
  cy: number,
  size: number,
  font: PDFFont,
  color: RGB,
  angleDeg: number,
  textWidth: number,
) {
  const rad = (angleDeg * Math.PI) / 180
  const half = textWidth / 2
  const vy = size * 0.35 // décalage vertical pour centrer sur la ligne de base
  const rot: Degrees = degrees(angleDeg)
  // Origine = centre - (demi-largeur pivotée)
  const x = cx - half * Math.cos(rad) + vy * Math.sin(rad)
  const y = cy - half * Math.sin(rad) - vy * Math.cos(rad)
  page.drawText(text, { x, y, size, font, color, rotate: rot })
}
