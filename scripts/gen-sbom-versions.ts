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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'sbomVersions.generated.ts')

// The curated list imports the generated file, and the generator imports the curated list.
// If a new export is added to the generated file, the old committed copy lacks it and the
// import below would fail before the generator could write the new one. Break that cycle by
// making sure every export the curated list needs exists (empty is fine) before importing it.
const EXPORTS = [
  'SBOM_PACKAGE_VERSIONS',
  'SBOM_PACKAGE_LICENSES',
  'SBOM_CRATE_LICENSES',
  'SBOM_LOCK_VERSIONS',
  'SBOM_CRATES',
  'SBOM_EMBEDDED_VERSIONS',
  'SBOM_BUILDS',
  'SBOM_BUNDLED_TRANSITIVE',
]
let existing = ''
try {
  existing = readFileSync(OUT, 'utf8')
} catch {
  /* first run */
}
const missing = EXPORTS.filter((e) => !existing.includes(`export const ${e}`))
if (missing.length) {
  writeFileSync(
    OUT,
    existing + missing.map((e) => `\nexport const ${e}: never = {} as never\n`).join('')
  )
}
const { SBOM_EXCLUDED, SBOM_GROUPS } = await import('../src/data/sbomComponents')

const {
  content: raw,
  problems,
  files,
} = derive(ROOT, {
  groups: SBOM_GROUPS,
  excluded: SBOM_EXCLUDED,
})
// The generated file is prettier-checked by `format:check`; emit it already formatted so
// regenerating never dirties the tree and the staleness comparison is byte-exact.
const content = await format(raw, { ...(await resolveConfig(OUT)), filepath: OUT })

// Other generated files (the CycloneDX SBOM), formatted the way `format:check` expects.
const formatted: Record<string, string> = {}
for (const [rel, text] of Object.entries(files))
  formatted[rel] = await format(text, {
    ...(await resolveConfig(join(ROOT, rel))),
    filepath: join(ROOT, rel),
  })

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
  for (const [rel, want] of Object.entries(formatted)) {
    let have = ''
    try {
      have = readFileSync(join(ROOT, rel), 'utf8')
    } catch {
      /* missing → stale */
    }
    if (have !== want) {
      console.error(`✗ ${rel} is stale — run \`npm run gen:sbom-versions\``)
      process.exit(1)
    }
  }
  console.log('✓ SBOM matches the shipped build')
  process.exit(0)
}

writeFileSync(OUT, content)
for (const [rel, text] of Object.entries(formatted)) writeFileSync(join(ROOT, rel), text)
console.log(`wrote ${OUT}`)
