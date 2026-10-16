#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * scripts/ci/check-licences.ts — the licence labels in this tree match COPYRIGHT.md.
 *
 * WHY (2026-10-16): the site's own code is AGPL-3.0-only, while third-party files
 * keep their own licence. A label that drifts (an own file copied in with another
 * SPDX line, a new code file with none, package.json naming another licence) is
 * caught here, on every push and in CI, before it ships.
 *
 * Rules, for tracked files:
 *   1. An own code file with an SPDX line says AGPL-3.0-only (files that also
 *      carry CC BY 4.0 passages: AGPL-3.0-only AND CC-BY-4.0).
 *   2. An own code file without an SPDX line fails, unless it is frozen in the
 *      baseline (scripts/ci/licence-header-baseline.json), which only shrinks.
 *   3. package.json says AGPL-3.0-only.
 * Third-party paths (THIRD_PARTY), the embed SDK being retired (src/embed/, keeps
 * its GPL-3.0-only and MIT labels) and the engine files locked in
 * public/wasm/engines.lock.json are never checked.
 *
 * Output names the rule and the file, never file contents.
 *
 * Usage:
 *   tsx scripts/ci/check-licences.ts                   # check
 *   tsx scripts/ci/check-licences.ts --write-baseline  # freeze today's headerless files
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const THIRD_PARTY: readonly string[] = [
  'public/wasm/',
  'public/kmip-corpus/',
  'public/threats/',
  'public/licenses/',
  'public/pyodide/',
  'public/dist/',
  'public/monaco/',
  'public/flags/',
  'src/data/acvp/',
  'src/data/licenses/texts/',
  'src/vendor/softhsm-wasm/wasm/',
  'pqc-references/',
  'scripts/entropy-90b/ldbl128/glibc-compat/math_private.h',
  'public/coi-serviceworker.js',
  'src/embed/',
]
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs|py|sh)$/
const SPDX = /SPDX-License-Identifier:\s*([A-Za-z0-9.+-]+(?:\s+(?:AND|OR|WITH)\s+[A-Za-z0-9.+-]+)*)/
const OK = new Set(['AGPL-3.0-only', 'AGPL-3.0-only AND CC-BY-4.0'])
const BASELINE = 'scripts/ci/licence-header-baseline.json'

export interface Problem {
  rule: string
  file: string
}

export function isThirdParty(path: string, locked: ReadonlySet<string>): boolean {
  return (
    locked.has(path) || THIRD_PARTY.some((p) => (p.endsWith('/') ? path.startsWith(p) : path === p))
  )
}

/** Returns the problems and the own code files that have no SPDX line. */
export function scan(
  files: readonly string[],
  read: (p: string) => string | undefined,
  locked: ReadonlySet<string>
): { problems: Problem[]; headerless: string[] } {
  const problems: Problem[] = []
  const headerless: string[] = []
  for (const p of files) {
    if (!CODE.test(p) || isThirdParty(p, locked)) continue
    const head = read(p)
    if (head === undefined) continue
    const m = SPDX.exec(head)
    if (!m) headerless.push(p)
    else if (!OK.has(m[1])) problems.push({ rule: 'own file not labelled AGPL-3.0-only', file: p })
  }
  return { problems, headerless }
}

function main(argv: string[]): number {
  const root = process.cwd()
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString()
    .split('\0')
    .filter(Boolean)
  const lockPath = join(root, 'public/wasm/engines.lock.json')
  const locked = new Set<string>()
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as {
      bundles: Record<string, { files: Record<string, unknown> }>
    }
    for (const b of Object.values(lock.bundles)) for (const f of Object.keys(b.files)) locked.add(f)
  }
  const read = (p: string): string | undefined => {
    try {
      return readFileSync(join(root, p)).subarray(0, 8192).toString('utf8')
    } catch {
      return undefined
    }
  }
  const { problems, headerless } = scan(files, read, locked)
  if (argv.includes('--write-baseline')) {
    writeFileSync(join(root, BASELINE), JSON.stringify(headerless.sort(), null, 2) + '\n')
    console.log(`licences: baseline written (${headerless.length} own files without a header)`)
    return 0
  }
  const base = new Set<string>(
    existsSync(join(root, BASELINE))
      ? (JSON.parse(readFileSync(join(root, BASELINE), 'utf8')) as string[])
      : []
  )
  for (const p of headerless)
    if (!base.has(p)) problems.push({ rule: 'new own code file without an SPDX header', file: p })
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { license?: string }
  if (pkg.license !== 'AGPL-3.0-only')
    problems.push({ rule: 'package.json licence is not AGPL-3.0-only', file: 'package.json' })
  const stale = [...base].filter((p) => !headerless.includes(p))
  if (stale.length)
    console.log(`licences: ${stale.length} baseline entries no longer needed; run --write-baseline`)
  if (problems.length) {
    console.log(`licences: ${problems.length} problem(s)`)
    for (const p of problems) console.log(`  ${p.file}: ${p.rule}`)
    return 1
  }
  console.log(`licences: OK (${headerless.length} baselined files without a header)`)
  return 0
}

if (process.argv[1] && /check-licences\.ts$/.test(process.argv[1]))
  process.exit(main(process.argv.slice(2)))
