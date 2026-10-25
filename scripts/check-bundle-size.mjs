#!/usr/bin/env node
/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Budget de taille du chargement initial (FE-D-001) : somme gzip du JS et du CSS
// référencés par dist/index.html (script d'entrée, modulepreload, feuille de style).
// Les pages chargées à la demande (React.lazy, import()) ne comptent pas.
// Usage : npm run build && node scripts/check-bundle-size.mjs   (sortie 1 si dépassement)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST = join(process.cwd(), 'dist')
const BUDGET_JS_GZIP = 200 * 1024 // mesuré à ~182 Ko le 2026-10-13 : marge de ~10 %
const BUDGET_CSS_GZIP = 24 * 1024 // mesuré à ~16 Ko
/** Ne doivent jamais faire partie du chargement initial : chargés au clic. */
const LOURDS_A_LA_DEMANDE = [/recuPdf/, /pdf-lib/, /sentry/i, /web-vitals/]

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map(m => m[1])
const gzipSize = path => gzipSync(readFileSync(join(DIST, path))).length

let js = 0
let css = 0
for (const ref of refs) {
  const size = gzipSize(ref)
  if (ref.endsWith('.js')) js += size
  else css += size
}

const erreurs = []
const ko = n => `${(n / 1024).toFixed(1)} Ko`
console.log(`Chargement initial : JS ${ko(js)} (budget ${ko(BUDGET_JS_GZIP)}), CSS ${ko(css)} (budget ${ko(BUDGET_CSS_GZIP)}) — gzip`)
if (js > BUDGET_JS_GZIP) erreurs.push(`JS initial trop lourd : ${ko(js)} > ${ko(BUDGET_JS_GZIP)}`)
if (css > BUDGET_CSS_GZIP) erreurs.push(`CSS initial trop lourd : ${ko(css)} > ${ko(BUDGET_CSS_GZIP)}`)
for (const ref of refs) {
  if (LOURDS_A_LA_DEMANDE.some(re => re.test(ref))) erreurs.push(`${ref} ne doit pas être chargé avec la page`)
}

if (erreurs.length) {
  erreurs.forEach(e => console.error(`✗ ${e}`))
  process.exit(1)
}
console.log('✓ budget respecté')
