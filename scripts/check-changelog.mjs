#!/usr/bin/env node
/* Script en ligne de commande : la sortie console est voulue. */
/* eslint-disable no-console */
// Journal des modifications (FE-F-007) : la version de package.json doit avoir sa section datée
// « ## [X.Y.Z] - AAAA-MM-JJ » et son lien de comparaison dans CHANGELOG.md, et la section
// « ## [Non publié] » doit exister pour recevoir les prochaines modifications.
// Usage : node scripts/check-changelog.mjs
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
const v = version.replace(/\./g, '\\.')

const erreurs = []
if (!/^## \[Non publié\]$/m.test(changelog)) erreurs.push('section « ## [Non publié] » absente')
if (!new RegExp(`^## \\[${v}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm').test(changelog)) {
  erreurs.push(`section « ## [${version}] - AAAA-MM-JJ » absente`)
}
if (!new RegExp(`^\\[${v}\\]: https://`, 'm').test(changelog)) erreurs.push(`lien « [${version}]: … » absent en bas du fichier`)

if (erreurs.length) {
  console.error(`CHANGELOG.md ne décrit pas la version ${version} de package.json :`)
  for (const e of erreurs) console.error(`  - ${e}`)
  console.error('Voir « Publier une version » dans le README.')
  process.exit(1)
}
console.log(`CHANGELOG.md : version ${version} décrite.`)
