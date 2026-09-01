// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard — every tool's declared `requires` matches what its code actually
 * needs, re-derived from the component tree on every run.
 *
 * Why it works this way: a required field alone does not buy honesty. The
 * cheapest way to satisfy `requires: ToolRuntimeRequirement[]` is to write `[]`
 * and move on, which would leave the device badge confidently telling a visitor
 * that a SharedArrayBuffer-dependent lab "runs here". So instead of trusting the
 * declarations, this test walks each tool's transitive local imports and looks
 * for the real markers:
 *
 *   sab      — a `SharedArrayBuffer` reference
 *   threads  — an import of a pthread-built engine under wasm/{strongswan,openssh}
 *   chromium — ChromiumGateBanner / useChromiumGate / detectBrowser
 *
 * A first version of this scan matched /strongswan|openssh/ anywhere and lit up
 * 11 tools through data/pqcProtocolMatrix.ts, which merely lists those protocols
 * as data. Hence the import-shaped patterns: the marker has to be the tool
 * *using* the engine, not mentioning its name.
 *
 * NOT checked here: 'wide-viewport' and 'wasm-simd'. Neither is visible in an
 * import graph — the first needs a real browser at 390 px, which is WS0's job.
 * The guard therefore asserts the three derivable requirements exactly and
 * ignores the rest, rather than pretending to verify something it cannot see.
 *
 * `sab` is scanned LINE-by-line, not file-wide like `threads`/`chromium`:
 * G9/W4 gave pyRuntime.ts an OPTIONAL, feature-detected SharedArrayBuffer use
 * (a true-kill timeout when `crossOriginIsolated`, a no-op fallback
 * otherwise) that reaches `cacp-kmip`'s component tree. A file-wide match
 * would force `cacp-kmip` to declare `requires: ['sab']`, wrongly marking
 * its ENTIRE tool — key lifecycle ops, policy loading, none of which touch
 * SAB — as unusable on a device without SharedArrayBuffer. A line carrying
 * the literal marker `sab-optional` alongside its `SharedArrayBuffer`
 * reference is exempt; every other occurrence still counts, so a tool that
 * genuinely hard-requires SAB (a future one, or a mistake) is still caught.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { WORKSHOP_TOOLS, type ToolRuntimeRequirement } from './workshopRegistry'

const SRC = path.join(process.cwd(), 'src')
const REGISTRY = path.join(SRC, 'components/Playground/workshopRegistry.tsx')

/** Requirements this scan can actually see in source. */
const DERIVABLE: ToolRuntimeRequirement[] = ['sab', 'threads', 'chromium']

const SAB_RE = /\bSharedArrayBuffer\b/
const SAB_OPTIONAL_MARKER = 'sab-optional'

/** True if `text` uses SharedArrayBuffer on a line NOT carrying the
 *  `sab-optional` exemption marker on that SAME line — see the module
 *  header. Deliberately line-scoped, not whole-file: an annotated
 *  reference must not blind the scan to a different, unannotated one
 *  elsewhere in the same file (proven by this file's own sabotage test). */
function hasUnexemptedSab(text: string): boolean {
  return text.split('\n').some((line) => SAB_RE.test(line) && !line.includes(SAB_OPTIONAL_MARKER))
}

const MARKERS: { req: ToolRuntimeRequirement; re: RegExp }[] = [
  { req: 'chromium', re: /ChromiumGateBanner|useChromiumGate|detectBrowser/ },
  {
    req: 'threads',
    re: /(?:from\s+'|import\(')(?:@\/)?(?:[^']*\/)?wasm\/(?:strongswan|openssh)[^']*'/,
  },
]

function resolveModule(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return null
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (fs.existsSync(base + ext)) return base + ext
  }
  return fs.existsSync(base) && fs.statSync(base).isFile() ? base : null
}

/** Transitive local-import walk from one entry module. */
function derive(entry: string): Set<ToolRuntimeRequirement> {
  const seen = new Set<string>()
  const queue = [entry]
  const found = new Set<ToolRuntimeRequirement>()
  while (queue.length > 0 && seen.size < 400) {
    const file = queue.shift()
    if (!file || seen.has(file)) continue
    seen.add(file)
    let text: string
    try {
      text = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const { req, re } of MARKERS) if (re.test(text)) found.add(req)
    if (hasUnexemptedSab(text)) found.add('sab')
    const importRe = /from\s+'([^']+)'|import\('([^']+)'\)/g
    let m: RegExpExecArray | null
    while ((m = importRe.exec(text)) !== null) {
      const spec = m[1] ?? m[2]
      if (!spec || (!spec.startsWith('@/') && !spec.startsWith('.'))) continue
      const resolved = resolveModule(spec, file)
      if (resolved && !seen.has(resolved)) queue.push(resolved)
    }
  }
  // A pthread engine cannot work without SharedArrayBuffer.
  if (found.has('threads')) found.add('sab')
  return found
}

/** tool id → component module specifier, parsed out of TOOL_COMPONENTS. */
function toolComponentSpecs(): Map<string, string> {
  const registry = fs.readFileSync(REGISTRY, 'utf8')
  const map = new Map<string, string>()
  const lazy =
    /'([a-z0-9-]+)':\s*(?:lazyWithRetry|makeLazyWithOnBack)\([\s\S]{0,120}?import\('([^']+)'\)/g
  let m: RegExpExecArray | null
  while ((m = lazy.exec(registry)) !== null) map.set(m[1], m[2])
  const named = /'([a-z0-9-]+)':\s*LazySuciFlow/g
  while ((m = named.exec(registry)) !== null) {
    map.set(m[1], '@/components/Playground/SuciFlowRoute')
  }
  return map
}

const browserTools = WORKSHOP_TOOLS.filter((t) => !t.sandbox)
const specs = toolComponentSpecs()

describe('WorkshopTool.requires — declared values match the code', () => {
  it('resolves a component for every browser tool, so nothing is silently unchecked', () => {
    const unmapped = browserTools.filter((t) => !specs.has(t.id)).map((t) => t.id)
    expect(
      unmapped,
      `no TOOL_COMPONENTS entry found for: ${unmapped.join(', ')} — the scan below ` +
        `would skip them, so the guard would pass without checking anything`
    ).toEqual([])
  })

  it.each(browserTools.map((t) => [t.id, t] as const))(
    '%s declares exactly the requirements its component tree implies',
    (id, tool) => {
      const spec = specs.get(id)
      if (!spec) return // covered by the assertion above
      const entry = resolveModule(spec, REGISTRY)
      expect(entry, `could not resolve ${spec} for ${id}`).not.toBeNull()

      const derived = derive(entry!)
      const declared = new Set(tool.requires.filter((r) => DERIVABLE.includes(r)))

      const missing = [...derived].filter((r) => !declared.has(r))
      const spurious = [...declared].filter((r) => !derived.has(r))

      expect(
        missing,
        `${id} uses ${missing.join('/')} in its component tree but does not declare it — ` +
          `the device badge would tell a visitor this runs where it cannot`
      ).toEqual([])
      expect(
        spurious,
        `${id} declares ${spurious.join('/')} but nothing in its component tree needs it — ` +
          `an over-declaration hides a working tool from the phone grid`
      ).toEqual([])
    }
  )
})

describe('hasUnexemptedSab — the sab-optional annotation is line-scoped, not file-scoped', () => {
  it('a SharedArrayBuffer reference carrying the marker on the same line is exempt', () => {
    const text = `const x = new SharedArrayBuffer(1) // sab-optional: reason`
    expect(hasUnexemptedSab(text)).toBe(false)
  })

  it('a SharedArrayBuffer reference with no marker still counts', () => {
    const text = `const x = new SharedArrayBuffer(1)`
    expect(hasUnexemptedSab(text)).toBe(true)
  })

  it('an annotated reference does not exempt a DIFFERENT, unannotated reference in the same file', () => {
    const text = [
      `const a = typeof SharedArrayBuffer !== 'undefined' // sab-optional: ok`,
      `const b = new SharedArrayBuffer(1)`, // no marker — a real hard use, must still be caught
    ].join('\n')
    expect(hasUnexemptedSab(text)).toBe(true)
  })

  it('the marker alone, with no SharedArrayBuffer reference, adds nothing', () => {
    expect(hasUnexemptedSab(`// sab-optional: this comment mentions nothing real`)).toBe(false)
  })
})

describe('WorkshopTool.requires — invariants', () => {
  it('every sandbox scenario declares container, and only container', () => {
    const sandbox = WORKSHOP_TOOLS.filter((t) => t.sandbox)
    expect(sandbox.length).toBeGreaterThan(0)
    for (const tool of sandbox) {
      expect(tool.requires, `${tool.id}`).toEqual(['container'])
    }
  })

  it('no browser tool claims to need a container', () => {
    const wrong = browserTools.filter((t) => t.requires.includes('container')).map((t) => t.id)
    expect(wrong).toEqual([])
  })

  it('anything needing threads also needs sab', () => {
    for (const tool of WORKSHOP_TOOLS) {
      if (tool.requires.includes('threads')) {
        expect(tool.requires, `${tool.id} needs threads without sab`).toContain('sab')
      }
    }
  })

  it('declares no duplicate requirements', () => {
    for (const tool of WORKSHOP_TOOLS) {
      expect(new Set(tool.requires).size, `${tool.id} has duplicates`).toBe(tool.requires.length)
    }
  })

  it("records that 'wide-viewport' is still unmeasured, so the gap stays visible", () => {
    // This is not a bug — it is an honest record that no tool has been measured
    // at 390 px yet (WS0 owns that). When the first real measurement lands, this
    // test should be deleted, not weakened.
    const anyWideViewport = WORKSHOP_TOOLS.some((t) => t.requires.includes('wide-viewport'))
    expect(
      anyWideViewport,
      "a tool now declares 'wide-viewport' — real browser measurements have started, " +
        'so delete this test rather than relaxing it'
    ).toBe(false)
  })
})
