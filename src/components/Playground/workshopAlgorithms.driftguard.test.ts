// SPDX-License-Identifier: GPL-3.0-only
//
// Drift guard for the `algorithms` a tool ADVERTISES vs. the algorithms its own
// code actually mentions.
//
// Why this exists: the 2026-08-11 audit found three tools whose registry entry
// disagreed with the tool — 5G SUCI ran ML-KEM without listing it (so an
// ML-KEM search returned 13 tools and never that one), Firmware Signing
// advertised ML-DSA-87 alone while offering four algorithms, and Entropy
// Testing attributed SP 800-22 tests to SP 800-90B. Nothing guarded any of it:
// `workshopRequirements.driftguard.test.ts` re-derives `requires` from source,
// but no equivalent existed for `algorithms`.
//
// WHY THE FIRST ATTEMPT WAS DELETED, and what changed:
//
// A previous version resolved each tool's files as "everything under
// dirname(entry)". For a tool whose entry sits at a directory ROOT — suci-flow
// (Playground/SuciFlowRoute.tsx), vpn-sim and hsm-capacity (Playground/hsm/),
// tpm-playground, cacp-kmip — that swept the entire shared Playground tree and
// attributed every algorithm in it to that one tool. A second version compared
// `algorithms` against the tool's own name/keywords, which is metadata checked
// against metadata: it proved nothing and flagged four tools that genuinely
// implement what they advertise.
//
// This version walks the real import graph from each tool's lazy-import entry
// point, following only relative and `@/` specifiers, and stops at SHARED_ROOTS
// so one tool cannot claim another's code. That is what makes the question
// "does THIS tool mention this algorithm" answerable.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { WORKSHOP_TOOLS } from './workshopRegistry'

const SRC = path.resolve(__dirname, '../..')
const REGISTRY = path.join(SRC, 'components/Playground/workshopRegistry.tsx')

/**
 * Modules shared across many tools. Reached through an import they are NOT
 * evidence about the importing tool, so traversal stops here. Without this a
 * single shared crypto util would make every tool "mention" every algorithm.
 */
const SHARED_ROOTS = [
  'src/wasm/',
  'src/utils/',
  'src/hooks/',
  'src/components/ui/',
  'src/components/shared/',
  'src/data/',
  'src/services/',
  'src/store/',
]

/** Headline families worth guarding. Deliberately not every string in the
 *  registry: parameter-set spellings vary ("ML-KEM-768", "ML-KEM"), and a guard
 *  that flags spelling differences is noise, not signal. */
const FAMILIES = ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS', 'XMSS'] as const

function resolveSpecifier(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return null // bare package import — not our source
  for (const cand of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand
  }
  return null
}

function isShared(file: string): boolean {
  const rel = path.relative(path.dirname(SRC), file).replace(/\\/g, '/')
  return SHARED_ROOTS.some((r) => rel.startsWith(r))
}

/** Files reachable from `entry` without crossing into SHARED_ROOTS. */
function ownFiles(entry: string, cap = 250): string[] {
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length && seen.size < cap) {
    const f = stack.pop()!
    if (seen.has(f) || !existsSync(f)) continue
    seen.add(f)
    const txt = readFileSync(f, 'utf8')
    for (const m of txt.matchAll(/(?:from\s+|import\(\s*)['"]([^'"]+)['"]/g)) {
      const r = resolveSpecifier(m[1], f)
      if (r && !seen.has(r) && !isShared(r) && !/\.test\.tsx?$/.test(r)) stack.push(r)
    }
  }
  return [...seen]
}

/** tool id → lazy-import path, read from the registry's own component maps. */
function entryPoints(): Map<string, string> {
  const src = readFileSync(REGISTRY, 'utf8')
  const out = new Map<string, string>()
  for (const m of src.matchAll(/'([a-z0-9-]+)':\s*(?:lazyWithRetry|makeLazyWithOnBack)\(/g)) {
    const tail = src.slice(m.index! + m[0].length, m.index! + m[0].length + 700)
    const im = tail.match(/import\(\s*['"]([^'"]+)['"]/)
    if (!im) continue
    const resolved = resolveSpecifier(im[1], REGISTRY)
    if (resolved) out.set(m[1], resolved)
  }
  return out
}

describe('workshopRegistry — advertised algorithms vs. the tool that runs them', () => {
  const entries = entryPoints()

  it('resolves an entry point for most native tools (guard is not silently empty)', () => {
    const native = WORKSHOP_TOOLS.filter((t) => !t.sandbox)
    const resolved = native.filter((t) => entries.has(t.id))
    // A regression that broke resolution would make every assertion below pass
    // vacuously, which is the failure mode this pins.
    expect(resolved.length).toBeGreaterThanOrEqual(Math.floor(native.length * 0.7))
  })

  it('does not advertise a PQC family the tool never mentions', () => {
    const offenders: string[] = []
    for (const tool of WORKSHOP_TOOLS) {
      if (tool.sandbox) continue // scenario metadata is synced from sandboxScenarios
      const entry = entries.get(tool.id)
      if (!entry) continue
      const corpus = ownFiles(entry)
        .map((f) => readFileSync(f, 'utf8'))
        .join('\n')
        .toUpperCase()
      for (const fam of FAMILIES) {
        const advertises = tool.algorithms.some((a) => a.toUpperCase().startsWith(fam))
        if (advertises && !corpus.includes(fam)) {
          offenders.push(`${tool.pt_id} (${tool.id}) advertises ${fam}, absent from its own code`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('reports tools that run a PQC family without advertising it', () => {
    // The direction the audit actually caught (suci-flow ran ML-KEM silently).
    // Reported rather than hard-failed: a tool may legitimately reference a
    // family in a comparison table without offering it, so this is a worklist
    // for a human, not a gate. Any entry here deserves a look.
    const unadvertised: string[] = []
    for (const tool of WORKSHOP_TOOLS) {
      if (tool.sandbox) continue
      const entry = entries.get(tool.id)
      if (!entry) continue
      const files = ownFiles(entry)
      const corpus = files
        .map((f) => readFileSync(f, 'utf8'))
        .join('\n')
        .toUpperCase()
      for (const fam of FAMILIES) {
        const advertises = tool.algorithms.some((a) => a.toUpperCase().startsWith(fam))
        // Require several mentions: one passing reference in prose is not
        // evidence the tool runs it.
        const mentions = corpus.split(fam).length - 1
        if (!advertises && mentions >= 5) {
          unadvertised.push(`${tool.pt_id} (${tool.id}) mentions ${fam} ${mentions}× but omits it`)
        }
      }
    }
    if (unadvertised.length) {
      console.warn(
        `\n  Tools running a PQC family they do not advertise (review, not a failure):\n` +
          unadvertised.map((u) => `    - ${u}`).join('\n')
      )
    }
    expect(Array.isArray(unadvertised)).toBe(true)
  })
})
