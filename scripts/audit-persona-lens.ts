#!/usr/bin/env tsx
/**
 * scripts/audit-persona-lens.ts
 *
 * CI gate over the hub's persona-adaptation layer.
 *
 * WHY THIS EXISTS. The 2026-08 B+ remediation review found 179 of 288
 * (surface × persona) cells below grade, and traced a large share of them to
 * one structural problem rather than to individual pages: the hub reshapes
 * itself around a declared role, and nothing recorded WHICH surfaces do that.
 * Two consequences followed.
 *
 *   - A page whose role support quietly broke looked exactly like a page that
 *     never had any. Nobody could tell without reading the component.
 *   - Correct decisions to withhold a route from a role (ops without Patents,
 *     curious without the Command Center) lived only in code comments, so on
 *     screen they read as bugs — the review's single most repeated finding.
 *
 * `src/data/personaLensRegistry.ts` is the record. This is the gate over it.
 *
 * FOUR CHECKS
 *
 *   1. COVERAGE — every route declared in App.tsx has a registry entry.
 *      A new page cannot ship without someone stating how it treats roles,
 *      even if the answer is "identically, on purpose".
 *
 *   2. CONFIG KEYS RESOLVE — every `configKeys` entry names a real export of
 *      personaConfig.ts (or the entry's declared `configModule`). This catches
 *      the rename-drift where a lens is documented against a key that no longer
 *      exists, which is how a registry becomes fiction.
 *
 *   3. ABSENCES ARE VISIBLE — for every persona × route the rail declines to
 *      offer (PERSONA_ABSENT_PATHS), and for every `deliberately-none` entry,
 *      an `onScreenNotice` must name a file that exists. This is the
 *      machine-checkable form of "a deliberate absence must be visible where it
 *      takes effect".
 *
 *   4. ONE DOOR — no role-board CTA and no journey milestone may target a
 *      rail-hidden route except through its declared `canonicalDoor`. This is
 *      the check that would have caught the /openssl two-front-doors
 *      contradiction the August routing work left behind.
 *
 * The gate cannot tell you a lens is GOOD. It can stop a lens from being
 * undeclared, misdeclared, invisible, or contradicted by a link.
 *
 * Modes:
 *   (default) human-readable report, exit 1 on any failure
 *   --json    machine-readable summary
 *
 * Run via:  npm run audit:persona-lens
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { latestDatedCsv, ROLE_BOARD_CONTENT_RE } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

interface Failure {
  check: string
  detail: string
}

const failures: Failure[] = []
const notes: string[] = []

function fail(check: string, detail: string) {
  failures.push({ check, detail })
}

// ── Load the registry without importing TS at runtime ────────────────────────
// The registry is a plain object literal, so a targeted parse is more robust
// here than adding a bundler step to a CI script.

const registrySrc = readFileSync(join(ROOT, 'src/data/personaLensRegistry.ts'), 'utf8')

interface ParsedEntry {
  route: string
  lens: string
  configKeys: string[]
  configModule?: string
  onScreenNotice?: string
  canonicalDoor?: string
}

function parseRegistry(src: string): ParsedEntry[] {
  const body = src.slice(src.indexOf('PERSONA_LENS_REGISTRY'))
  const entries: ParsedEntry[] = []
  // Each entry starts with a quoted route key followed by '{'.
  const entryRe = /'(\/[^']*)':\s*\{/g
  let m: RegExpExecArray | null
  while ((m = entryRe.exec(body)) !== null) {
    const route = m[1]
    // Take the text up to the matching close brace by brace counting.
    let depth = 1
    let i = entryRe.lastIndex
    while (i < body.length && depth > 0) {
      if (body[i] === '{') depth++
      else if (body[i] === '}') depth--
      i++
    }
    const chunk = body.slice(entryRe.lastIndex, i - 1)
    const lens = /lens:\s*'([^']+)'/.exec(chunk)?.[1] ?? ''
    const keysBlock = /configKeys:\s*\[([^\]]*)\]/.exec(chunk)?.[1] ?? ''
    const configKeys = [...keysBlock.matchAll(/'([^']+)'/g)].map((k) => k[1])
    entries.push({
      route,
      lens,
      configKeys,
      configModule: /configModule:\s*'([^']+)'/.exec(chunk)?.[1],
      onScreenNotice: /onScreenNotice:\s*'([^']+)'/.exec(chunk)?.[1],
      canonicalDoor: /canonicalDoor:\s*'([^']+)'/.exec(chunk)?.[1],
    })
  }
  return entries
}

const registry = parseRegistry(registrySrc)
if (registry.length === 0) {
  fail('registry', 'Parsed zero entries from personaLensRegistry.ts — the gate is not running.')
}

// ── Check 1: coverage over App.tsx's routes ──────────────────────────────────

/**
 * Child routes that render INSIDE another surface's lens, and the parent whose
 * registry entry covers them. /playground/hsm is the Playground's surface, not
 * a separate one, so demanding its own entry would mean five entries describing
 * one lens.
 *
 * Declared explicitly rather than inferred from JSX nesting. An earlier version
 * tried to strip parent bodies with a regex; `element={<ErrorBoundary>` contains
 * a '>', so the opening-tag pattern terminated early, and the whole coverage
 * check silently degraded to five routes. A short list that a human updates when
 * they add a child route is worth more than a clever parse that fails quietly.
 */
const CHILD_ROUTES: Record<string, string> = {
  '/interactive': '/playground',
  '/hsm': '/playground',
  '/cacp': '/playground',
  '/docker': '/playground',
  '/tools': '/business',
  '/workbench': '/migrate',
}

const appSrc = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8')
const appRoutes = new Set<string>(['/'])
for (const m of appSrc.matchAll(/path="([^"]+)"/g)) {
  const raw = m[1]
  // A ':toolId' segment has no lens of its own; '*' is a redirect target.
  if (raw.startsWith(':') || raw === '*' || raw.includes(':')) continue
  const path = (raw.startsWith('/') ? raw : `/${raw}`).replace(/\/\*$/, '')
  if (path in CHILD_ROUTES) continue
  // Multi-segment paths ('migrate/workbench') are children by construction.
  if (path.split('/').filter(Boolean).length > 1) continue
  appRoutes.add(path)
}

const registryRoutes = new Set(registry.map((e) => e.route))
for (const route of appRoutes) {
  if (!registryRoutes.has(route)) {
    fail(
      'coverage',
      `Route ${route} is declared in App.tsx but has no personaLensRegistry entry. ` +
        `State how it treats roles — 'deliberately-none' with an onScreenNotice is a valid answer.`
    )
  }
}
notes.push(`${appRoutes.size} routes in App.tsx · ${registry.length} registry entries`)

// ── Check 2: configKeys resolve to real exports ──────────────────────────────

const moduleExportCache = new Map<string, Set<string>>()

function exportsOf(relPath: string): Set<string> {
  const cached = moduleExportCache.get(relPath)
  if (cached) return cached
  const abs = join(ROOT, relPath)
  const names = new Set<string>()
  if (!existsSync(abs)) {
    fail('config-keys', `configModule ${relPath} does not exist.`)
    moduleExportCache.set(relPath, names)
    return names
  }
  const src = readFileSync(abs, 'utf8')
  for (const m of src.matchAll(
    /^export\s+(?:const|function|type|interface|class)\s+([A-Za-z0-9_$]+)/gm
  )) {
    names.add(m[1])
  }
  moduleExportCache.set(relPath, names)
  return names
}

for (const entry of registry) {
  const modulePath = entry.configModule ?? 'src/data/personaConfig.ts'
  if (entry.configKeys.length === 0) continue
  const available = exportsOf(modulePath)
  for (const key of entry.configKeys) {
    if (!available.has(key)) {
      fail(
        'config-keys',
        `${entry.route}: configKey '${key}' is not exported by ${modulePath}. ` +
          `A registry that names a symbol nobody exports is documentation of something that no longer happens.`
      )
    }
  }
}

// ── Check 3: absences are visible on screen ──────────────────────────────────

const personaConfigSrc = readFileSync(join(ROOT, 'src/data/personaConfig.ts'), 'utf8')
// Anchored on `export const`, not on the bare identifier: the identifier also
// appears inside neighbouring doc comments, and matching one of those makes the
// "block" some unrelated declaration — which is how NAV_PATH_LABELS (a label
// map that legitimately contains every route string) got scanned as if it were
// a set of links.
const absentBlock =
  /export const PERSONA_ABSENT_PATHS[\s\S]*?\n\}\n/.exec(personaConfigSrc)?.[0] ?? ''
const absentRoutes = new Set([...absentBlock.matchAll(/'(\/[a-z0-9/-]+)':\s*\{/g)].map((m) => m[1]))

for (const route of absentRoutes) {
  const entry = registry.find((e) => e.route === route)
  if (!entry) {
    fail(
      'visible-absence',
      `${route} is withheld from at least one persona (PERSONA_ABSENT_PATHS) but has no registry entry.`
    )
    continue
  }
  if (!entry.onScreenNotice) {
    fail(
      'visible-absence',
      `${route} is withheld from at least one persona but its registry entry declares no ` +
        `onScreenNotice. A withheld route with no on-screen statement is indistinguishable from a bug.`
    )
  }
}

for (const entry of registry) {
  if (entry.lens === 'deliberately-none' && !entry.onScreenNotice) {
    fail(
      'visible-absence',
      `${entry.route} declares lens 'deliberately-none' without an onScreenNotice. ` +
        `"This page is the same for everyone" is a decision, and it has to be readable on the page.`
    )
  }
  if (entry.onScreenNotice && !existsSync(join(ROOT, entry.onScreenNotice))) {
    fail(
      'visible-absence',
      `${entry.route}: onScreenNotice '${entry.onScreenNotice}' does not exist.`
    )
  }
}
notes.push(`${absentRoutes.size} routes withheld from at least one persona`)

// ── Check 4: one door per rail-hidden route ──────────────────────────────────

const railHidden = [
  ...(/RAIL_HIDDEN_PATHS: string\[\] = \[([^\]]*)\]/.exec(personaConfigSrc)?.[1] ?? '').matchAll(
    /'([^']+)'/g
  ),
].map((m) => m[1])

const doors = new Map<string, string>()
for (const entry of registry) {
  if (entry.canonicalDoor) doors.set(entry.route, entry.canonicalDoor)
}

for (const hidden of railHidden) {
  if (!doors.has(hidden)) {
    fail(
      'one-door',
      `${hidden} is rail-hidden but declares no canonicalDoor. A route with no rail row and no ` +
        `named front door is reachable only by URL or ⌘K, which the review flagged as a defect.`
    )
  }
}

/** Every href-ish string that points at a rail-hidden route, with its source. */
const offenders: string[] = []

/** Strip comments before scanning. A doc comment that MENTIONS the bare route
 *  in order to explain why nothing links to it is the opposite of a violation,
 *  and flagging it would train people to delete the explanation. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*/g, '$1')
}

function scanForBareDoors(label: string, rawText: string) {
  const text = stripComments(rawText)
  for (const hidden of railHidden) {
    const door = doors.get(hidden)
    // Match the bare route as a complete path segment: '/openssl' but not
    // '/openssl-studio' and not '/playground/openssl-studio'.
    const re = new RegExp(`(?<![\\w/-])${hidden}(?![\\w-])`, 'g')
    for (const m of text.matchAll(re)) {
      const before = text.slice(Math.max(0, m.index! - 40), m.index!)
      if (door && before.includes(door.slice(0, door.lastIndexOf('/')))) continue
      offenders.push(`${label}: bare ${hidden} — use ${door ?? '(no door declared)'}`)
    }
  }
}

// Journey milestones + report CTAs live in personaConfig.
// NAV_PATH_LABELS is deliberately NOT scanned: it is the route → label map, so
// it must contain every route string including the rail-hidden ones. Scanning
// it would flag the one place the bare route is supposed to appear.
for (const name of ['PERSONA_MILESTONES', 'PERSONA_REPORT_CTAS', 'PERSONA_RECOMMENDED_PATHS']) {
  const block =
    new RegExp(`export const ${name}[\\s\\S]*?\\n\\}\\n`).exec(personaConfigSrc)?.[0] ?? ''
  if (!block) {
    fail('one-door', `Could not locate ${name} in personaConfig.ts — the scan is not running.`)
    continue
  }
  scanForBareDoors(name, block)
}

// Role boards live in a dated CSV.
// latestDatedCsv already returns an absolute path.
const boardPath = latestDatedCsv(join(ROOT, 'src/data'), ROLE_BOARD_CONTENT_RE)
if (boardPath) {
  const boardCsvName = boardPath.slice(boardPath.lastIndexOf('/') + 1)
  const parsed = Papa.parse<Record<string, string>>(readFileSync(boardPath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  })
  for (const row of parsed.data) {
    const content = row.content ?? ''
    if (!content) continue
    scanForBareDoors(`${boardCsvName} (${row.role_id}/${row.slot})`, content)
  }
  notes.push(`role boards scanned: ${boardCsvName}`)
} else {
  fail('one-door', 'No role_board_content CSV found to scan.')
}

for (const offender of offenders) {
  fail('one-door', offender)
}

// ── Report ───────────────────────────────────────────────────────────────────

const json = process.argv.includes('--json')

if (json) {
  process.stdout.write(
    `${JSON.stringify({ ok: failures.length === 0, failures, notes }, null, 2)}\n`
  )
} else {
  process.stdout.write('\npersona-lens audit\n')
  for (const note of notes) process.stdout.write(`  · ${note}\n`)
  if (failures.length === 0) {
    process.stdout.write('\n  PASS — every routed surface declares its lens, every declared\n')
    process.stdout.write('  key resolves, every withheld route says so on screen, and no link\n')
    process.stdout.write('  bypasses a canonical door.\n\n')
  } else {
    process.stdout.write(`\n  FAIL — ${failures.length} problem(s):\n\n`)
    for (const f of failures) {
      process.stdout.write(`  [${f.check}] ${f.detail}\n\n`)
    }
  }
}

process.exit(failures.length === 0 ? 0 : 1)
