#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-tla-eager-imports.ts — fails the build when a chunk reads another chunk's export before that
 * chunk has finished starting up, which leaves it undefined in production (or "not a function") while
 * dev and vitest, which do not use the top-level-await plugin, work.
 *
 * The rules, the two production failures behind them and the known limits are in
 * scripts/lib/tlaEagerImports.ts; the unit tests are next to it.
 *
 * IF THIS FAILS: do not silence it. Either read the binding when it is used (inside a function, a
 * React `useMemo` factory) instead of at module scope, or stop the source chunk from being wrapped:
 * a chunk is wrapped when it contains a dynamic `import()`, so a module with one that several chunks
 * import statically ends up in a shared chunk that gets wrapped. Load that module lazily
 * (`React.lazy`) so it has a chunk of its own, as ProductMaintainers does.
 *
 * Runs at the end of `npm run build`, after `gate:precache`, so it checks the real artifact.
 *
 * Exit codes:
 *   0 — no read of a not-yet-ready export found, and the check had something to examine
 *   1 — at least one finding, or nothing to examine (the HSM engine chunk or every wrapped chunk missing)
 *   2 — could not read the build output
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { analyzeBuild, SOFTHSM_CHUNK } from '../lib/tlaEagerImports'

const DIST = path.resolve(process.cwd(), 'dist')
const ASSETS = path.join(DIST, 'assets')
const INDEX = path.join(DIST, 'index.html')

if (!existsSync(ASSETS) || !existsSync(INDEX)) {
  console.error(`\n✖ no ${existsSync(ASSETS) ? INDEX : ASSETS} — run \`npm run build\` first\n`)
  process.exit(2)
}

const sources = new Map<string, string>()
for (const file of readdirSync(ASSETS).filter((f) => f.endsWith('.js'))) {
  sources.set(file, readFileSync(path.join(ASSETS, file), 'utf8'))
}
const analysis = analyzeBuild(sources, readFileSync(INDEX, 'utf8'))

console.log('\n── TLA eager-import check ─────────────────────────────────────')
console.log(
  `  scanned ${analysis.chunks} chunk(s) under dist/assets/; ` +
    `${analysis.lateWrapped.length} wrapped chunk(s) are loaded after start-up`
)

// A check that finds nothing to check looks exactly like a clean build, so these fail the build.
let vacuous = false
if (analysis.alwaysLate.found.length === 0) {
  vacuous = true
  console.error(
    `\n✖ no built chunk matched ${SOFTHSM_CHUNK}: the HSM engine chunk, the one this check exists\n` +
      '  for, was renamed or split. Update SOFTHSM_CHUNK in scripts/lib/tlaEagerImports.ts.\n'
  )
} else if (analysis.alwaysLate.wrapped.length === 0) {
  console.warn(
    `\n⚠ ${analysis.alwaysLate.found.join(', ')} is not wrapped by the top-level-await plugin this run, so\n` +
      '  nothing can read it too early; worth noticing if the plugin or its settings changed.\n'
  )
}
if (analysis.lateWrapped.length === 0) {
  vacuous = true
  console.error(
    '\n✖ no wrapped chunk is loaded after start-up this run, so this check examined nothing.\n' +
      '  If the plugin still wraps chunks, the wrapper detection in scripts/lib/tlaEagerImports.ts\n' +
      '  needs updating; if it no longer does, retire this check on purpose.\n'
  )
}

// Values the bundler copied into a namespace object while they were not ready yet.
if (analysis.notes.length > 0) {
  console.warn(
    `\n⚠ ${analysis.notes.length} late binding(s) are copied into a bundler namespace object, so the copy may be ` +
      'undefined if that object is\n  read before the source chunk has finished (not a failure; see the limits in ' +
      'scripts/lib/tlaEagerImports.ts):'
  )
  for (const n of analysis.notes) {
    console.warn(`  • ${n.file}:${n.line}: \`${n.importedName}\` from ${n.source}`)
  }
}

if (analysis.findings.length === 0) {
  if (vacuous) process.exit(1)
  console.log('\n✔ no chunk reads an export of a still-starting chunk while it starts up\n')
  process.exit(0)
}

console.error(`\n✖ ${analysis.findings.length} READ(S) OF AN EXPORT THAT IS NOT READY YET\n`)
for (const f of analysis.findings) {
  console.error(
    `  • ${f.file}:${f.line}: \`${f.localName}\` (imported as \`${f.importedName}\` from ${f.source}) is ` +
      `read as the chunk starts up, but ${f.source} is wrapped by the top-level-await plugin and has not ` +
      'run yet, and this chunk does not wait for it.'
  )
}
console.error(
  '\n  In production the binding is undefined (or not a function) at that moment, although dev and\n' +
    '  vitest never see it, and the page that needs this chunk never finishes loading. Fix: read it\n' +
    '  inside a function that runs later, or keep the dynamic import() out of any module that several\n' +
    "  chunks import statically (load it with React.lazy). See this script's header comment.\n"
)
process.exit(1)
