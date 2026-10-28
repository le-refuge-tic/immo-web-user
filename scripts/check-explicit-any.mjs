#!/usr/bin/env node
/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Cliquet anti-`any` explicite (FE-A-003) : compte les types `any` écrits dans le code source
// (.ts et .tsx, hors tests) et échoue si leur nombre dépasse la base enregistrée.
// Le nombre ne doit que baisser : typer avec les types de src/types/ ou `unknown` puis un contrôle.
// Usage : node scripts/check-explicit-any.mjs           (vérifie)
//         node scripts/check-explicit-any.mjs --update  (abaisse la base après nettoyage)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')
const BASELINE = join(process.cwd(), 'scripts', 'explicit-any-baseline.json')
// `: any`, `<any>`, `as any`, `any[]`, `any,` dans un type générique, `| any`, `=> any`
const ANY = /(?::\s*any\b|<any\b|\bas any\b|\bany\[\]|,\s*any\b>|\|\s*any\b|=>\s*any\b)/g

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : walk(path)
    return /\.(ts|tsx)$/.test(path) && !path.endsWith('.d.ts') ? [path] : []
  })
}

const count = walk(SRC).reduce((sum, file) => sum + (readFileSync(file, 'utf8').match(ANY)?.length ?? 0), 0)

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify({ max: count }, null, 2) + '\n')
  console.log(`Base enregistrée : ${count} types any.`)
  process.exit(0)
}

const { max } = JSON.parse(readFileSync(BASELINE, 'utf8'))
if (count > max) {
  console.error(`Types any : ${count} (base ${max}). Utilisez un type de src/types/ ou unknown.`)
  process.exit(1)
}
console.log(`Types any : ${count} (base ${max})${count < max ? ' — pensez à lancer --update pour abaisser la base.' : '.'}`)
