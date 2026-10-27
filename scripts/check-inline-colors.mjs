#!/usr/bin/env node
/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Cliquet anti-couleurs en dur (FE-B-017) : compte les couleurs hexadécimales écrites
// dans le code (.tsx) et échoue si leur nombre dépasse la base enregistrée.
// Le nombre ne doit que baisser : utiliser un jeton (var(--tx-*), classes Tailwind du thème).
// Ne comptent pas : les commentaires ; les illustrations (fichiers listés dans
// couleurs-en-dur.mjs, lignes marquées « couleur-libre : <raison> »), affichées à part.
// Usage : node scripts/check-inline-colors.mjs           (vérifie)
//         node scripts/check-inline-colors.mjs --update  (abaisse la base après nettoyage)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { compterCouleurs } from './couleurs-en-dur.mjs'

const SRC = join(process.cwd(), 'src')
const BASELINE = join(process.cwd(), 'scripts', 'inline-colors-baseline.json')

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : walk(path)
    return path.endsWith('.tsx') ? [path] : []
  })
}

let count = 0
let libres = 0
for (const file of walk(SRC)) {
  const r = compterCouleurs(readFileSync(file, 'utf8'), relative(SRC, file))
  count += r.enDur
  libres += r.libres
}

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify({ max: count }, null, 2) + '\n')
  console.log(`Base enregistrée : ${count} couleurs en dur (${libres} d'illustration, non comptées).`)
  process.exit(0)
}

const { max } = JSON.parse(readFileSync(BASELINE, 'utf8'))
if (count > max) {
  console.error(`Couleurs en dur : ${count} (base ${max}). Utilisez un jeton de couleur au lieu d'un code hexadécimal.`)
  process.exit(1)
}
console.log(`Couleurs en dur : ${count} (base ${max})${count < max ? ' — pensez à lancer --update pour abaisser la base.' : '.'} Illustrations : ${libres}.`)
