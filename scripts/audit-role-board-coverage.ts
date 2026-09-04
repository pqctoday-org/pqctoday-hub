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

/**
 * Per-role coverage exemptions — a section a SPECIFIC role's home page is
 * deliberately not asked to reach, because the rail itself withholds that
 * route from that persona with its own written reason. `EXEMPT` above
 * removes a route from the contract for every role; this removes one
 * (role, section) cell only, so the other five roles still have to reach it.
 *
 * Added 2026-09-03. Before this existed, ops/suppliers and curious's
 * anyone/whattake boards linked `/patents` and `/business` to satisfy this
 * exact gate, contradicting `PERSONA_ABSENT_PATHS` in `personaConfig.ts` on
 * the same screen — the rail told the visitor the route "is not offered for
 * your role" while the board sent them there anyway. The 2026-08-09 build
 * report claimed this mechanism already existed ("the gate gained per-role
 * exemption support"); it had not shipped.
 *
 * Held to the same `EXCEPTION_MAX_AGE_DAYS` freshness window
 * `audit-role-board-literals.ts` uses for its own exceptions, so a reason
 * cannot silently become stale. Checked against `personaConfig.ts` at
 * runtime below (`assertExemptionReasonsAreLive`), not hand-verified once —
 * a reason that no longer matches a real `PERSONA_ABSENT_PATHS` entry fails
 * loudly rather than becoming a permanent, unverifiable escape hatch.
 */
const ROLE_EXEMPT: Record<
  string,
  Partial<Record<string, { reason: string; lastReviewed: string }>>
> = {
  ops: {
    Patents: {
      reason:
        'PERSONA_ABSENT_PATHS.ops[\'/patents\']: "Patent research is not an operations task. The licensing angle you need rides on the vendors in the migration catalog."',
      lastReviewed: '2026-09-03',
    },
  },
  curious: {
    Patents: {
      reason:
        'PERSONA_ABSENT_PATHS.curious[\'/patents\']: "Patent law is a specialist read, and none of it changes what post-quantum means for you."',
      lastReviewed: '2026-09-03',
    },
    'Command Center': {
      reason:
        "PERSONA_ABSENT_PATHS.curious['/business']: the Command Center is withheld from this persona's rail; the home boards point at /business/tools and /migrate's WhoHasMovedPanel instead.",
      lastReviewed: '2026-09-03',
    },
  },
}

const EXEMPTION_MAX_AGE_DAYS = 180

function assertExemptionsFresh(now: Date): string[] {
  const stale: string[] = []
  for (const [role, sections] of Object.entries(ROLE_EXEMPT)) {
    for (const [section, entry] of Object.entries(sections)) {
      if (!entry) continue
      const ageDays = Math.floor((now.getTime() - Date.parse(entry.lastReviewed)) / 86_400_000)
      if (!Number.isFinite(ageDays) || ageDays > EXEMPTION_MAX_AGE_DAYS) {
        stale.push(
          `${role} -> ${section}: exemption last reviewed ${entry.lastReviewed}, older than ${EXEMPTION_MAX_AGE_DAYS} days`
        )
      }
    }
  }
  return stale
}

/**
 * The rail decision an exemption cites must still be true. Reads
 * `personaConfig.ts` as text (this script runs under plain tsx, not Vite
 * SSR) and checks that `PERSONA_ABSENT_PATHS[role]` still names the route
 * the exemption is about — not that the wording is byte-identical, since
 * that would make every copy-edit on the rail's own reason fail this gate
 * too, but that the route is still listed as absent for that role at all.
 * A route that has been re-added to the rail must lose its exemption, not
 * keep one that no longer describes reality.
 */
function assertExemptionReasonsAreLive(): string[] {
  const src = readFileSync(join(ROOT, 'src/data/personaConfig.ts'), 'utf8')
  const stale: string[] = []
  const sectionToRoutePrefix: Record<string, string> = {
    Patents: '/patents',
    'Command Center': '/business',
  }
  const absentBlockRe = /PERSONA_ABSENT_PATHS[^=]*=\s*\{([\s\S]*?)\n\}/
  const absentBlock = absentBlockRe.exec(src)?.[1] ?? ''
  for (const [role, sections] of Object.entries(ROLE_EXEMPT)) {
    for (const section of Object.keys(sections)) {
      const prefix = sectionToRoutePrefix[section]
      if (!prefix) {
        stale.push(
          `${role} -> ${section}: no known route prefix for this section — fix sectionToRoutePrefix`
        )
        continue
      }
      const roleBlockRe = new RegExp(`${role}:\\s*\\{([\\s\\S]*?)\\n  \\},`)
      const roleBlock = roleBlockRe.exec(absentBlock)?.[1] ?? ''
      if (!roleBlock.includes(`'${prefix}'`)) {
        stale.push(
          `${role} -> ${section}: PERSONA_ABSENT_PATHS.${role} no longer lists '${prefix}' — the rail decision this exemption cites may have changed. Re-verify and update or remove the exemption.`
        )
      }
    }
  }
  return stale
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

  const now = new Date()

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
  const contradictions: string[] = []
  for (const role of ROLES) {
    const have = reached.get(role)!
    for (const section of SECTIONS) {
      const exemption = ROLE_EXEMPT[role]?.[section]
      if (have.has(section)) {
        if (exemption) {
          contradictions.push(
            `${role} -> ${section}: exempted ("${exemption.reason}") but a board link reaches it anyway — drop the link or remove the exemption`
          )
        }
        continue
      }
      if (!exemption) gaps.push(`${role} cannot reach ${section}`)
    }
  }
  const staleExemptions = [...assertExemptionsFresh(now), ...assertExemptionReasonsAreLive()]

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

  const exemptionCount = Object.values(ROLE_EXEMPT).reduce(
    (n, sections) => n + Object.keys(sections).length,
    0
  )
  if (exemptionCount > 0) {
    console.log(`\nRole exemptions on file (${exemptionCount}):`)
    for (const [role, sections] of Object.entries(ROLE_EXEMPT)) {
      for (const [section, entry] of Object.entries(sections)) {
        if (entry) console.log(`   ${role} -> ${section}: ${entry.reason}`)
      }
    }
  }

  if (contradictions.length > 0) {
    console.log(`\n✗ ${contradictions.length} exemption contradiction(s):`)
    for (const c of contradictions) console.log(`   ${c}`)
  }

  if (staleExemptions.length > 0) {
    console.log(`\n✗ ${staleExemptions.length} stale or unverifiable exemption(s):`)
    for (const s of staleExemptions) console.log(`   ${s}`)
  }

  if (gaps.length > 0) {
    console.log(`\n✗ ${gaps.length} coverage gap(s):`)
    for (const g of gaps) console.log(`   ${g}`)
    console.log(
      '\n  Every role must reach every section in the contract. Point a CTA or a grid card at it,\n' +
        '  or move the section to EXEMPT (every role) or ROLE_EXEMPT (one role, with a reason\n' +
        '  tied to a real PERSONA_ABSENT_PATHS entry) with the reason it does not belong on a home board.'
    )
  }

  if (
    gaps.length > 0 ||
    unclassified.length > 0 ||
    contradictions.length > 0 ||
    staleExemptions.length > 0
  ) {
    process.exit(1)
  }

  console.log(
    `\n✓ All ${ROLES.length} roles reach every section in the contract` +
      (exemptionCount > 0 ? `, ${exemptionCount} covered by a recorded per-role exemption.` : '.')
  )
}

main()
