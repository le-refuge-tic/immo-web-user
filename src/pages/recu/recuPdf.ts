/**
 * Génération des PDF de reçus (pdf-lib), structure/couleurs/texte alignés sur
 * le mobile REFUGE. Trois variantes :
 *  - visite  : thème vert, filigrane logo, cachet "PAYÉ" ovale incliné
 *  - loyer   : thème bleu, même structure que la visite
 *  - intégration : format simple (ni fond coloré, ni cachet, ni filigrane)
 */
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import type { PDFPage, PDFFont, RGB } from 'pdf-lib'
import logoUrl from '../../assets/REFUGE-LOGO.png'
import {
  fmtMontant, fmtDateComplete, fmtDateCourte, fmtMoisLoyer, fmtTelephone,
  refCourte, labelTypeBien, labelRoleGestionnaire, labelBienLoyer,
  labelOperateur, nomComplet,
} from './recuFormat'

// ── Palettes (miroir du mobile) ──────────────────────────────────────────────
const GREEN      = rgb(0x1a / 255, 0x6b / 255, 0x3c / 255) // #1A6B3C
const GREEN_BG   = rgb(0xe8 / 255, 0xf5 / 255, 0xee / 255) // #E8F5EE
const BLUE       = rgb(0x1a / 255, 0x3a / 255, 0x6b / 255) // #1A3A6B
const BLUE_BG    = rgb(0xe8 / 255, 0xf0 / 255, 0xfa / 255) // #E8F0FA
const GREY       = rgb(0.42, 0.45, 0.5)
const GREY_LIGHT = rgb(0.85, 0.87, 0.9)
const DARK       = rgb(0.11, 0.11, 0.12)
const WHITE      = rgb(1, 1, 1)

const A4 = { w: 595.28, h: 841.89 }
const MX = 48   // marge horizontale
const MY = 40   // marge verticale
const LABEL_W = 130

type Line = { label: string; value: string }
type Section = { title: string; lines: Line[] }

let cachedLogo: ArrayBuffer | null = null
async function loadLogo(): Promise<ArrayBuffer> {
  if (cachedLogo) return cachedLogo
  const res = await fetch(logoUrl)
  cachedLogo = await res.arrayBuffer()
  return cachedLogo
}

/** Déclenche le téléchargement d'un Uint8Array PDF dans le navigateur. */
function downloadPdf(bytes: Uint8Array, filename: string) {
  // Copie dans un ArrayBuffer « pur » pour satisfaire le typage BlobPart strict.
  const buf = new Uint8Array(bytes.length)
  buf.set(bytes)
  const blob = new Blob([buf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── PDF « riche » commun visite / loyer ──────────────────────────────────────
async function buildRichPdf(opts: {
  color: RGB
  colorBg: RGB
  titre: string
  sousTitre: string
  montant: number
  dateComplete: string
  operateur: string
  sections: Section[]
  filename: string
}) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([A4.w, A4.h])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const logo = await doc.embedPng(await loadLogo())

  // Filigrane logo (opacité 5%, ~300px de large, positionné left:100 top:200
  // exprimé depuis le HAUT → conversion en repère PDF bas-gauche).
  const wmW = 300
  const wmH = (logo.height / logo.width) * wmW
  page.drawImage(logo, { x: 100, y: A4.h - 200 - wmH, width: wmW, height: wmH, opacity: 0.05 })

  let y = A4.h - MY

  // En-tête : "REFUGE" à gauche, bloc titre à droite
  page.drawText('REFUGE', { x: MX, y: y - 18, size: 22, font: bold, color: opts.color })
  drawRightText(page, bold, opts.titre, 13, opts.color, A4.w - MX, y - 12, 1.5)
  drawRightText(page, font, opts.sousTitre, 9, GREY, A4.w - MX, y - 26, 0)
  y -= 40
  page.drawRectangle({ x: MX, y, width: A4.w - 2 * MX, height: 2, color: opts.color })
  y -= 24

  // Bloc montant : fond clair, coins arrondis
  const boxH = 78
  page.drawRectangle({ x: MX, y: y - boxH, width: A4.w - 2 * MX, height: boxH, color: opts.colorBg, borderWidth: 0 })
  const cx = A4.w / 2
  drawCenteredText(page, font, 'Montant total payé', 10, GREY, cx, y - 20)
  drawCenteredText(page, bold, fmtMontant(opts.montant), 28, opts.color, cx, y - 48)
  drawCenteredText(page, font, `via ${opts.operateur} · ${opts.dateComplete}`, 9, GREY, cx, y - 66)

  // Cachet "PAYÉ" ovale incliné, en haut à droite du bloc
  drawCachetPaye(page, bold, opts.color, A4.w - MX - 56, y - 6)
  y -= boxH + 30

  // Sections
  for (const sec of opts.sections) {
    if (!sec.lines.length) continue
    page.drawText(sec.title, { x: MX, y, size: 9, font: bold, color: opts.color })
    y -= 6
    page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.5, color: GREY_LIGHT })
    y -= 16
    for (const ln of sec.lines) {
      page.drawText(ln.label, { x: MX, y, size: 10, font, color: GREY })
      page.drawText(ln.value, { x: MX + LABEL_W, y, size: 10, font: bold, color: DARK })
      y -= 18
    }
    y -= 12
  }

  // Pied de page
  const footY = MY + 30
  page.drawLine({ start: { x: MX, y: footY + 14 }, end: { x: A4.w - MX, y: footY + 14 }, thickness: 0.5, color: GREY_LIGHT })
  drawCenteredText(page, font, 'Ce reçu est généré automatiquement par REFUGE — Plateforme immobilière.', 8, GREY, cx, footY)
  drawCenteredText(page, font, 'Conservez-le comme preuve de paiement.', 8, GREY, cx, footY - 11)

  downloadPdf(await doc.save(), opts.filename)
}

// ── Helpers de dessin ────────────────────────────────────────────────────────
function drawRightText(page: PDFPage, font: PDFFont, text: string, size: number, color: RGB, right: number, y: number, spacing: number) {
  const w = widthWithSpacing(font, text, size, spacing)
  drawWithSpacing(page, font, text, size, color, right - w, y, spacing)
}
function drawCenteredText(page: PDFPage, font: PDFFont, text: string, size: number, color: RGB, cx: number, y: number) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: cx - w / 2, y, size, font, color })
}
function widthWithSpacing(font: PDFFont, text: string, size: number, spacing: number) {
  return font.widthOfTextAtSize(text, size) + spacing * Math.max(0, text.length - 1)
}
function drawWithSpacing(page: PDFPage, font: PDFFont, text: string, size: number, color: RGB, x: number, y: number, spacing: number) {
  if (!spacing) { page.drawText(text, { x, y, size, font, color }); return }
  let cx = x
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color })
    cx += font.widthOfTextAtSize(ch, size) + spacing
  }
}
function drawCachetPaye(page: PDFPage, bold: PDFFont, color: RGB, x: number, y: number) {
  // Ovale (approx via ellipse) + texte "PAYÉ" incliné -20°
  page.drawEllipse({ x: x + 28, y: y - 20, xScale: 30, yScale: 20, borderColor: color, borderWidth: 2, color: WHITE, opacity: 0.9 })
  const txt = 'PAYÉ'
  const size = 11
  const w = bold.widthOfTextAtSize(txt, size)
  page.drawText(txt, { x: x + 28 - w / 2, y: y - 24, size, font: bold, color, rotate: degrees(-20) })
}

// ── Reçu de VISITE (vert) ────────────────────────────────────────────────────
export async function genererPdfVisite(recu: any) {
  const bien = recu?.visite?.bien
  const dateVisite = recu?.visite?.date_confirmee ?? recu?.visite?.date_contre_proposee ?? recu?.visite?.date_souhaitee
  const gest = recu?.gestionnaire
  const sections: Section[] = [
    { title: 'DÉTAILS DE LA VISITE', lines: [
      { label: 'Type de bien', value: labelTypeBien(bien?.type) },
      { label: 'Date de visite', value: fmtDateCourte(dateVisite) },
    ] },
    { title: 'PARTIES', lines: [
      { label: 'Client', value: nomComplet(recu?.client) },
      { label: labelRoleGestionnaire(gest?.role), value: nomComplet(gest) },
    ] },
    { title: 'INFORMATIONS DE PAIEMENT', lines: [
      { label: 'Référence', value: String(recu?.reference ?? '').toUpperCase() },
      { label: 'Date', value: fmtDateComplete(recu?.date_paiement) },
      { label: 'Numéro MoMo', value: fmtTelephone(recu?.telephone_paiement) },
      { label: 'Opérateur', value: labelOperateur(recu?.methode_paiement) },
    ] },
  ]
  await buildRichPdf({
    color: GREEN, colorBg: GREEN_BG,
    titre: 'REÇU DE VISITE', sousTitre: 'Frais de visite',
    montant: Number(recu?.montant), dateComplete: fmtDateComplete(recu?.date_paiement),
    operateur: labelOperateur(recu?.methode_paiement), sections,
    filename: `refuge_recu_${refCourte(recu?.reference)}.pdf`,
  })
}

// ── Reçu de LOYER (bleu) ─────────────────────────────────────────────────────
export async function genererPdfLoyer(recu: any) {
  const bien = recu?.bien
  const loc = recu?.localisation ?? bien?.localisation
  const sections: Section[] = [
    { title: 'DÉTAILS DU LOYER', lines: [
      { label: 'Période', value: fmtMoisLoyer(recu?.loyer?.mois) },
      { label: "Date d'échéance", value: fmtDateCourte(recu?.loyer?.date_echeance) },
    ] },
    { title: 'BIEN IMMOBILIER', lines: bien ? [
      { label: 'Type', value: labelBienLoyer(bien?.sous_type, bien?.type, bien?.nb_chambres) },
      ...(loc?.adresse ? [{ label: 'Adresse', value: String(loc.adresse) }] : []),
      ...(loc?.ville ? [{ label: 'Ville', value: String(loc.ville) }] : []),
    ] : [] },
    { title: 'PARTIES', lines: [
      { label: 'Locataire', value: nomComplet(recu?.locataire) },
      { label: 'Gestionnaire', value: nomComplet(recu?.gestionnaire) },
    ] },
    { title: 'INFORMATIONS DE PAIEMENT', lines: [
      { label: 'Référence', value: String(recu?.reference ?? '').toUpperCase() },
      { label: 'Date', value: fmtDateComplete(recu?.date_paiement) },
      { label: 'Opérateur', value: labelOperateur(recu?.methode_paiement) },
      { label: 'Numéro', value: fmtTelephone(recu?.telephone_paiement) },
    ] },
  ]
  await buildRichPdf({
    color: BLUE, colorBg: BLUE_BG,
    titre: 'REÇU DE LOYER', sousTitre: fmtMoisLoyer(recu?.loyer?.mois),
    montant: Number(recu?.montant), dateComplete: fmtDateComplete(recu?.date_paiement),
    operateur: labelOperateur(recu?.methode_paiement), sections,
    filename: `refuge_loyer_${refCourte(recu?.reference)}.pdf`,
  })
}

// ── Reçu d'INTÉGRATION (format simple) ───────────────────────────────────────
export async function genererPdfIntegration(recu: any) {
  const doc = await PDFDocument.create()
  const page = doc.addPage([A4.w, A4.h])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = A4.h - MY
  page.drawText("REÇU DE PAIEMENT D'INTÉGRATION", { x: MX, y: y - 18, size: 18, font: bold, color: DARK })
  y -= 34
  page.drawText(`Référence : ${String(recu?.reference ?? '')}`, { x: MX, y, size: 10, font, color: GREY })
  y -= 26
  page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.5, color: GREY_LIGHT })
  y -= 22

  const infoLines: Line[] = [
    { label: 'Client', value: nomComplet(recu?.client) },
    { label: 'Date', value: fmtDateComplete(recu?.date_paiement) },
    { label: 'Méthode', value: 'MTN Mobile Money' },
    { label: 'Téléphone', value: fmtTelephone(recu?.telephone_paiement) },
  ]
  for (const ln of infoLines) {
    page.drawText(ln.label, { x: MX, y, size: 10, font, color: GREY })
    page.drawText(ln.value, { x: MX + LABEL_W, y, size: 10, font: bold, color: DARK })
    y -= 18
  }
  y -= 10
  page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.5, color: GREY_LIGHT })
  y -= 20
  page.drawText('Détail', { x: MX, y, size: 13, font: bold, color: DARK })
  y -= 22

  const d = recu?.details ?? {}
  const detailLines: Line[] = []
  if (Number(d.avance) > 0)       detailLines.push({ label: 'Avance de loyer', value: fmtMontant(d.avance) })
  if (Number(d.prepaye) > 0)      detailLines.push({ label: 'Loyer prépayé', value: fmtMontant(d.prepaye) })
  if (Number(d.caution_eau) > 0)  detailLines.push({ label: 'Caution eau', value: fmtMontant(d.caution_eau) })
  if (Number(d.caution_elec) > 0) detailLines.push({ label: 'Caution électricité', value: fmtMontant(d.caution_elec) })
  for (const ln of detailLines) {
    page.drawText(ln.label, { x: MX, y, size: 10, font, color: GREY })
    page.drawText(ln.value, { x: MX + LABEL_W, y, size: 10, font: bold, color: DARK })
    y -= 18
  }
  y -= 6
  page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.5, color: GREY_LIGHT })
  y -= 20
  page.drawText('TOTAL PAYÉ', { x: MX, y, size: 11, font: bold, color: DARK })
  page.drawText(fmtMontant(d.total ?? recu?.montant), { x: MX + LABEL_W, y, size: 11, font: bold, color: DARK })

  downloadPdf(await doc.save(), `refuge_integration_${refCourte(recu?.reference)}.pdf`)
}

/** Dispatch selon le type de reçu. */
export async function genererPdfRecu(type: string | undefined, recu: any) {
  if (type === 'integration') return genererPdfIntegration(recu)
  if (type === 'loyer') return genererPdfLoyer(recu)
  return genererPdfVisite(recu)
}
