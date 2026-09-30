// SPDX-License-Identifier: GPL-3.0-only
/**
 * gen-sbom-versions — regenerate src/data/sbomVersions.generated.ts and audit
 * the curated SBOM (src/data/sbomComponents.ts) against what this build ships.
 * All the logic lives in scripts/sbom/derive.ts (unit-tested there); this is
 * only the command line.
 *
 *   tsx scripts/gen-sbom-versions.ts           # (re)generate; exit 1 on any problem
 *   tsx scripts/gen-sbom-versions.ts --check   # exit 1 if stale or any problem (CI / gate)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import { derive } from './sbom/derive'
import { SBOM_EXCLUDED, SBOM_GROUPS } from '../src/data/sbomComponents'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'sbomVersions.generated.ts')

const { content: raw, problems } = derive(ROOT, { groups: SBOM_GROUPS, excluded: SBOM_EXCLUDED })
// The generated file is prettier-checked by `format:check`; emit it already formatted so
// regenerating never dirties the tree and the staleness comparison is byte-exact.
const content = await format(raw, { ...(await resolveConfig(OUT)), filepath: OUT })

if (problems.length) {
  console.error(`✗ SBOM disagrees with what this build ships (${problems.length}):`)
  for (const p of problems) console.error(`   ${p}`)
  process.exit(1)
}

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(OUT, 'utf8')
  } catch {
    /* missing → stale */
  }
  if (current !== content) {
    console.error(`✗ ${OUT} is stale — run \`npm run gen:sbom-versions\``)
    process.exit(1)
  }
  console.log('✓ SBOM matches the shipped build')
  process.exit(0)
}

writeFileSync(OUT, content)
console.log(`wrote ${OUT}`)
