#!/usr/bin/env tsx
/**
 * scripts/audit-role-board-coverage.ts
 *
 * Asserts that every section in the coverage contract is reachable from EVERY
 * role's home page.
 *
 * WHY THIS EXISTS. The 2026-08-09 expansion took the home boards from three
 * use cases per role to six specifically so that each role's home page reaches
 * the whole site. That property was proved once, by hand, in a markdown table.
 * Nothing enforced it afterwards: a later edit could repoint the single link
 * that carried a section for a role and no gate would notice, because every
 * other check still passes — the CTA still resolves, the claim is still fresh,
 * the generated file still matches the CSV. The coverage would just quietly
 * stop being true.
 *
 * It also catches the opposite drift: a NEW section added to the app with no
 * home route at all. That is why `CONTRACT` is asserted against the router
 * below rather than trusted on its own.
 *
 * WHAT COUNTS AS REACHING A SECTION. Any board href — `cta_primary_href`,
 * `cta_secondary_href` or `grid_card_href` — whose path resolves to that
 * section. Learn is additionally satisfied by the track chips, which render as
 * real `/learn/<module>` links on every board.
 *
 * Reads the CSV, not the generated module, for the same reason
 * `audit-role-board-ctas.ts` does: the CSV is what a maintainer edits, so a
 * regression is caught where it is written.
 *
 * Run via: npm run audit:role-board-coverage
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { latestDatedCsv, ROLE_BOARD_CONTENT_RE } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const ROLES = ['executive', 'developer', 'architect', 'ops', 'researcher', 'curious'] as const
const HREF_SLOTS = new Set(['cta_primary_href', 'cta_secondary_href', 'grid_card_href'])

/**
 * The coverage contract: every section every role must be able to reach from
 * its home page, and the route prefix that counts as reaching it.
 *
 * Order matters — `matchSection` takes the LONGEST matching prefix, so
 * `/business/tools` wins over `/business` and `/playground/docker` would win
 * over `/playground`.
 */
const CONTRACT: { section: string; prefix: string }[] = [
  { section: 'Learn', prefix: '/learn' },
  { section: 'Explore', prefix: '/explore' },
  { section: 'Compliance', prefix: '/compliance' },
  { section: 'Migrate', prefix: '/migrate' },
  { section: 'Assess', prefix: '/assess' },
  { section: 'Report', prefix: '/report' },
  { section: 'Command Center', prefix: '/business' },
  { section: 'Business Tools', prefix: '/business/tools' },
  { section: 'Playground', prefix: '/playground' },
  { section: 'OpenSSL Studio', prefix: '/openssl' },
  // Same destination, second route. Without this, a link to the studio via
  // the playground registry counts as Playground and OpenSSL Studio reads as
  // uncovered — which is exactly what this gate reported on its first run.
  { section: 'OpenSSL Studio', prefix: '/playground/openssl-studio' },
  { section: 'Simulation', prefix: '/simulation' },
  { section: 'Algorithms', prefix: '/algorithms' },
  { section: 'Library', prefix: '/library' },
  { section: 'Community', prefix: '/leaders' },
  { section: 'Timeline', prefix: '/timeline' },
  { section: 'Threats', prefix: '/threats' },
  { section: 'Patents', prefix: '/patents' },
  { section: 'Revisions', prefix: '/revisions' },
]

/**
 * Sections deliberately outside the contract, each with the reason, so an
 * absence is a decision on the record rather than something nobody noticed.
 */
const EXEMPT: Record<string, string> = {
  '/playground/docker':
    'Developer Sandbox — probes VITE_SANDBOX_BASE_URL and renders "pqctoday-sandbox is not reachable" without a local Docker stack. Roughly 5% of visitors can reach it, so a home CTA would be a dead end behind a verified capability claim.',
  '/about': 'Meta page, in the rail and footer on every screen.',
  '/faq': 'Meta page, reachable from the header on every screen.',
  '/changelog': 'Meta page, footer.',
  '/terms': 'Meta page, footer.',
  '/editorial-independence': 'Meta page, footer.',
  '/sponsor': 'Meta page, footer.',
  '/embed': 'Embed shell, not a destination a home board should point at.',
}

/** Longest-prefix match, so /business/tools is not swallowed by /business. */
function matchSection(href: string): string | null {
  const path = href.split('?')[0].split('#')[0]
  let best: { section: string; prefix: string } | null = null
  for (const entry of CONTRACT) {
    if (path === entry.prefix || path.startsWith(entry.prefix + '/')) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry
    }
  }
  return best?.section ?? null
}

function main() {
  const csvPath = latestDatedCsv(join(ROOT, 'src/data'), ROLE_BOARD_CONTENT_RE)
  if (!csvPath) throw new Error('No src/data/role_board_content_*.csv found.')

  const rows = (
    Papa.parse<Record<string, string>>(readFileSync(csvPath, 'utf8'), {
      header: true,
      skipEmptyLines: true,
    }).data ?? []
  ).filter((r) => r && r.role_id && (r.status ?? 'active') === 'active')

  // role -> set of sections it reaches.
  const reached = new Map<string, Set<string>>(ROLES.map((r) => [r, new Set<string>()]))
  for (const r of rows) {
    if (!HREF_SLOTS.has(r.slot)) continue
    const section = matchSection((r.content ?? '').trim())
    if (section) reached.get(r.role_id)?.add(section)
  }
  // The track strip renders a real /learn/<module> link on every board, so
  // Learn is reached by every role by construction. Asserted, not assumed:
  // if the track chips ever stop being links this must fail, not pass quietly.
  const boardViewSrc = readFileSync(
    join(ROOT, 'src/components/PersonaJourney/PersonaBoardView.tsx'),
    'utf8'
  )
  const trackChipsAreLinks = /to=\{`\/learn\/\$\{moduleId\}`\}/.test(boardViewSrc)
  if (trackChipsAreLinks) for (const s of reached.values()) s.add('Learn')

  // Distinct sections, not CONTRACT rows — a section may declare more than one
  // route (OpenSSL Studio has two), and counting rows would overstate coverage.
  const SECTIONS = [...new Set(CONTRACT.map((c) => c.section))]

  const gaps: string[] = []
  for (const role of ROLES) {
    const have = reached.get(role)!
    for (const section of SECTIONS) {
      if (!have.has(section)) gaps.push(`${role} cannot reach ${section}`)
    }
  }

  // The other direction: a section in the app that the contract never mentions.
  const appSrc = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8')
  const topLevel = new Set<string>()
  for (const m of appSrc.matchAll(/path="(\/[^"*:]*)"/g)) {
    const [first] = m[1].split('/').filter(Boolean)
    if (first) topLevel.add('/' + first)
  }
  const known = new Set([...CONTRACT.map((c) => c.prefix), ...Object.keys(EXEMPT)])
  const unclassified = [...topLevel].filter((p) => !known.has(p)).sort()

  console.log(`Role-board coverage — ${csvPath.replace(ROOT + '/', '')}`)
  console.log(
    `Contract: ${SECTIONS.length} sections × ${ROLES.length} roles = ${SECTIONS.length * ROLES.length} cells`
  )
  if (!trackChipsAreLinks) {
    console.log('  note: track chips are no longer /learn links — Learn must be covered by an href')
  }

  if (unclassified.length > 0) {
    console.log(
      `\n⚠ ${unclassified.length} route(s) in App.tsx are neither in the contract nor exempt:`
    )
    for (const p of unclassified) console.log(`   ${p}`)
    console.log('   Add each to CONTRACT (every role must reach it) or to EXEMPT with a reason.')
  }

  if (gaps.length > 0) {
    console.log(`\n✗ ${gaps.length} coverage gap(s):`)
    for (const g of gaps) console.log(`   ${g}`)
    console.log(
      '\n  Every role must reach every section in the contract. Point a CTA or a grid card at it,\n' +
        '  or move the section to EXEMPT with the reason it does not belong on a home board.'
    )
    process.exit(1)
  }

  if (unclassified.length > 0) process.exit(1)

  console.log(`\n✓ All ${ROLES.length} roles reach all ${SECTIONS.length} sections.`)
}

main()
