#!/usr/bin/env tsx
/**
 * scripts/audit-role-board-ctas.ts
 *
 * CI gate over the role-home boards' call-to-action buttons.
 *
 * WHY THIS EXISTS. On 2026-08-02 an audit of all twelve role-board CTAs found
 * three that were wrong, and nothing in the build had caught any of them:
 *
 *   - IT Ops "Size my fleet" pointed at /playground/hsm — the PKCS#11 engine
 *     workbench, which sizes nothing — while every other element of that hero
 *     described the HSM Capacity Calculator at a different route.
 *   - IT Ops "Import my cert inventory" promised a capability that exists
 *     nowhere in the product. The route resolved, so it was not a dead link in
 *     the routing sense; it was a dead promise.
 *   - Executive "See a finished example" pointed at bare /report, whose empty
 *     state offered the worked example to the curious persona ONLY, so an
 *     executive following it landed on "No Report Yet".
 *
 * Only the first is the kind of defect a link checker finds. The other two are
 * a mismatch between what a button SAYS and what its destination DOES, which no
 * automated check can judge. So this gate does the two things a machine can:
 *
 *   1. Every CTA href on a role board must be registered in the CTA CSV, and
 *      must resolve to a real route or playground tool id.
 *   2. Every registered CTA carries a written `capability_claim` and a
 *      `verified_on` date. When that date ages past the freshness window, the
 *      gate fails — which forces a human to re-read the claim against the live
 *      destination rather than letting it rot silently.
 *
 * The gate cannot tell you a claim is honest. It can stop you forgetting to
 * check.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary
 *
 * Run via:
 *   npm run audit:role-board-ctas
 *   npm run audit:role-board-ctas -- --json
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { latestDatedCsv, ROLE_BOARD_CTAS_RE, ROLE_BOARD_CONTENT_RE } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

/** How long a `verified_on` stamp is trusted before the gate demands a re-check. */
export const VERIFICATION_MAX_AGE_DAYS = 180

export interface CtaRegistryRow {
  href: string
  resolves_to: string
  capability_claim: string
  verified_on: string
  verified_by: string
  status: string
  deprecated_at?: string
  deprecated_reason?: string
  notes?: string
}

export interface CtaFinding {
  code:
    | 'UNREGISTERED'
    | 'UNRESOLVED_ROUTE'
    | 'MISSING_CLAIM'
    | 'STALE_VERIFICATION'
    | 'ORPHAN_REGISTRY_ROW'
  href: string
  detail: string
}

/** Latest dated `role_board_ctas_*.csv` under src/data. */
export function latestCtaCsv(dataDir = join(ROOT, 'src/data')): string | null {
  if (!existsSync(dataDir)) return null
  return latestDatedCsv(dataDir, ROLE_BOARD_CTAS_RE)
}

/** Latest dated `role_board_content_*.csv` under src/data. */
export function latestContentCsv(dataDir = join(ROOT, 'src/data')): string | null {
  if (!existsSync(dataDir)) return null
  return latestDatedCsv(dataDir, ROLE_BOARD_CONTENT_RE)
}

export function parseCtaRegistry(csvText: string): CtaRegistryRow[] {
  const parsed = Papa.parse<CtaRegistryRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return (parsed.data ?? []).filter((r) => r && r.href)
}

/**
 * Every content slot that carries an outbound href, and is therefore subject to
 * the full proof gate — registration, route resolution, a capability claim, and
 * a verification no older than `VERIFICATION_MAX_AGE_DAYS`.
 *
 * `grid_card_href` joined on 2026-08-09. It is optional per card, but an
 * optional link is not an unverified one: a grid card is rendered on the same
 * board, at the same level of trust, as the two CTAs above it. Leaving it out
 * of this list would have shipped roughly a hundred links with no proof gate
 * behind them — a bigger unverified surface than the CTAs this gate was
 * written to protect.
 */
const HREF_SLOTS = new Set(['cta_primary_href', 'cta_secondary_href', 'grid_card_href'])

/**
 * The set of hrefs a role board can point at, read from the role-board content
 * CSV's own href-bearing rows (see `HREF_SLOTS`).
 *
 * WHY THE CSV, NOT personaConfig.ts. This function used to regex-scrape
 * `ctaPrimaryHref: '…'` out of `src/data/personaConfig.ts`. The 2026-08-02
 * CSV migration moved those literals into
 * `src/data/generated/roleBoardContent.generated.ts`, leaving personaConfig.ts
 * with only a `ctaPrimaryHref: string` TYPE declaration — so the scrape started
 * returning ZERO hrefs. The gate reported "0 CTAs, 11 registered", flagged all
 * eleven registry rows as orphans (advice which, followed, would have deleted
 * the entire capability-claim registry), and still exited 0, because
 * ORPHAN_REGISTRY_ROW is not a blocking code. Every real check — route
 * resolution, MISSING_CLAIM, STALE_VERIFICATION, UNREGISTERED — was dead for
 * that whole window.
 *
 * Reading the CSV rather than the generated file is deliberate: the CSV is the
 * source of truth maintainers edit, and the generated file is one more derived
 * artifact that can drift from it (a drift the generator's own gate now
 * covers separately). Pointing the gate at the source means a bad href is
 * caught at the point it is written.
 *
 * Still a text-level read rather than an import: the generated module pulls in
 * the whole data layer (library CSVs, algorithm registry, KMIP fixtures),
 * which is far more than a lint gate should load, and several of those imports
 * assume a browser.
 *
 * Deprecated rows are skipped — a CTA that is no longer served should not keep
 * demanding a fresh capability claim.
 */
export function extractBoardHrefs(contentCsvText: string): string[] {
  const rows = Papa.parse<Record<string, string>>(contentCsvText, {
    header: true,
    skipEmptyLines: true,
  }).data
  const hrefs = new Set<string>()
  for (const row of rows) {
    if (!row || !row.role_id) continue
    if ((row.status ?? 'active') !== 'active') continue
    if (!HREF_SLOTS.has(row.slot)) continue
    const href = (row.content ?? '').trim()
    if (href) hrefs.add(href)
  }
  return [...hrefs]
}

/**
 * Route path SEGMENTS declared anywhere in App.tsx.
 *
 * Deliberately not a structural parse. Two earlier attempts failed: a flat scan
 * resolved `/playground/cacp` to `/cacp` (it is declared as a nested
 * `<Route path="cacp" />`), and a bracket-matching scan broke because
 * `<Route ... element={<ErrorBoundary>` truncates any `[^>]*` attribute capture
 * at the WRONG `>`, corrupting the nesting stack and reporting even `/assess`
 * as unresolved.
 *
 * So this collects segments and `resolvesToRealRoute` checks containment. That
 * is weaker than proving a path resolves — it would accept a segment pair that
 * exists separately but is never nested together — and it is stated plainly
 * here rather than implied to be more. What it reliably catches is the failure
 * mode that actually occurs: a CTA pointing at a segment that exists nowhere,
 * i.e. a typo or a route that was renamed or deleted.
 *
 * True end-to-end resolution is proven by the e2e suite, which navigates real
 * URLs against the production build.
 */
export function extractAppRoutes(appSrc: string): Set<string> {
  const segments = new Set<string>()
  for (const m of appSrc.matchAll(/path="([^"]+)"/g)) {
    for (const seg of m[1].split('/')) {
      if (!seg || seg.startsWith(':') || seg === '*') continue
      segments.add(seg)
    }
  }
  return segments
}

/**
 * Business tool ids, which resolve through BusinessToolRoute's `:toolId`
 * (`/tools/:toolId`).
 *
 * ADDED 2026-08-02. The gate previously knew only about playground tools, so
 * every `/tools/<id>` destination would have been reported UNRESOLVED_ROUTE —
 * the 'tools' segment exists in App.tsx but the id segment does not. The role
 * boards now lean on business tools as heavily as on playground workshops, so
 * the gate has to be able to see both.
 */
export const BUSINESS_TOOL_PREFIX = '/business/tools/'

/**
 * Business tool hrefs must carry their real nesting.
 *
 * REGRESSION GUARD (2026-08-02). `resolvesToRealRoute` checks SEGMENT
 * CONTAINMENT, and says so in its own doc comment: it would accept a segment
 * pair that exists separately but is never nested together. That is exactly
 * what happened — 14 board CTAs were written as `/tools/<id>`, every segment
 * resolved ('tools' is declared, the id is a real business tool), the gate
 * passed, and every one of them fell through to the catch-all route and
 * rendered the HOME BOARD instead of the tool. Nothing errored; the visitor
 * just silently got the wrong page. Business tools live under
 * `/business/tools/:toolId`, so the prefix is checked explicitly rather than
 * inferred from segments.
 */
export function businessToolHrefIsWellFormed(href: string, businessToolIds: Set<string>): boolean {
  const path = href.split('?')[0]
  const id = path.split('/').filter(Boolean).pop() ?? ''
  if (!businessToolIds.has(id)) return true // not a business tool href
  return path.startsWith(BUSINESS_TOOL_PREFIX)
}

export function extractBusinessToolIds(registrySrc: string): Set<string> {
  const ids = new Set<string>()
  for (const m of registrySrc.matchAll(/^\s*id:\s*'([a-z0-9-]+)',$/gm)) ids.add(m[1])
  return ids
}

/** Playground tool ids, which resolve through PlaygroundToolRoute's `:toolId`. */
export function extractPlaygroundToolIds(registrySrc: string): Set<string> {
  const ids = new Set<string>()
  for (const m of registrySrc.matchAll(/^\s*id:\s*'([a-z0-9-]+)',$/gm)) ids.add(m[1])
  return ids
}

/**
 * Learn module ids, which resolve through App.tsx's `path="learn/*"` wildcard
 * route (LearnRouter's own `:moduleId` matching, not a static React Router
 * segment — `extractAppRoutes` only keeps the literal `learn` segment from a
 * `path="learn/*"` declaration, same as it drops any other `:param`/`*`).
 *
 * Added 2026-09-03, the first time a role board linked `/learn/<moduleId>`
 * from a CTA or grid-card slot (previously only the track chips did, and
 * those are outside `HREF_SLOTS`). Reads the manifest directory names
 * directly — the same convention `MODULE_IDS` in
 * `PKILearning/manifest/contentVersion.ts` derives via `import.meta.glob`,
 * which this plain-tsx script cannot use (see that file's own registry.ts
 * for why: a Vite-only build-time macro).
 */
export function extractLearnModuleIds(modulesDir: string): Set<string> {
  const ids = new Set<string>()
  if (!existsSync(modulesDir)) return ids
  for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
    const manifestPath = join(modulesDir, entry.name, 'manifest.ts')
    if (!entry.isDirectory() || !existsSync(manifestPath)) continue
    // The id field, not the directory name — they diverge at least once
    // (modules/Quiz/manifest.ts declares id: 'quiz').
    const m = /^\s*id:\s*'([a-z0-9-]+)',?$/m.exec(readFileSync(manifestPath, 'utf8'))
    if (m) ids.add(m[1])
  }
  return ids
}

/**
 * Whether every segment of an href corresponds to something the app declares —
 * a route segment or a playground tool id. See `extractAppRoutes` for why this
 * is containment rather than true resolution.
 *
 * Query strings and fragments are stripped first: `/migrate?tab=roadmaps`
 * resolves iff `/migrate` does. Whether the `tab` parameter is actually honoured
 * is a behaviour claim, and lives in `capability_claim` for a human to verify.
 */
export function resolvesToRealRoute(
  href: string,
  routeSegments: Set<string>,
  toolIds: Set<string>
): boolean {
  const path = href.split('?')[0].split('#')[0]
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return true // '/' — the landing route
  return segments.every((seg) => routeSegments.has(seg) || toolIds.has(seg))
}

export function daysSince(iso: string, now: Date): number | null {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return Math.floor((now.getTime() - t) / 86_400_000)
}

export function auditCtas(
  boardHrefs: string[],
  registry: CtaRegistryRow[],
  routeSegments: Set<string>,
  toolIds: Set<string>,
  now: Date
): CtaFinding[] {
  const findings: CtaFinding[] = []
  const active = registry.filter((r) => (r.status ?? 'active') !== 'deprecated')
  const byHref = new Map(active.map((r) => [r.href, r]))

  for (const href of boardHrefs) {
    const row = byHref.get(href)
    if (!row) {
      findings.push({
        code: 'UNREGISTERED',
        href,
        detail:
          'Rendered as a role-board CTA but absent from the CTA registry. Add a row stating, in plain words, what this destination actually does.',
      })
      continue
    }
    if (!resolvesToRealRoute(href, routeSegments, toolIds)) {
      findings.push({
        code: 'UNRESOLVED_ROUTE',
        href,
        detail: `Does not resolve to any route in App.tsx or any playground tool id (expected ${row.resolves_to}).`,
      })
    }
    if (!row.capability_claim?.trim()) {
      findings.push({
        code: 'MISSING_CLAIM',
        href,
        detail: 'Registered with no capability_claim — nothing records what this CTA may promise.',
      })
    }
    const age = daysSince(row.verified_on, now)
    if (age === null) {
      findings.push({
        code: 'STALE_VERIFICATION',
        href,
        detail: `verified_on is not a readable date ("${row.verified_on}").`,
      })
    } else if (age > VERIFICATION_MAX_AGE_DAYS) {
      findings.push({
        code: 'STALE_VERIFICATION',
        href,
        detail: `Last verified ${age} days ago (limit ${VERIFICATION_MAX_AGE_DAYS}). Re-read the claim against the live destination, then update verified_on.`,
      })
    }
  }

  // A registry row for an href no board renders any more is not fatal, but it
  // is reported: it usually means a CTA was changed and its claim left behind.
  const rendered = new Set(boardHrefs)
  for (const row of active) {
    if (!rendered.has(row.href)) {
      findings.push({
        code: 'ORPHAN_REGISTRY_ROW',
        href: row.href,
        detail: 'Registered but no role board points at it. Deprecate the row or remove it.',
      })
    }
  }
  return findings
}

// ── CLI ────────────────────────────────────────────────────────────────────
function main() {
  const json = process.argv.includes('--json')
  const csvPath = latestCtaCsv()
  if (!csvPath) {
    console.error('✗ No src/data/role_board_ctas_YYYYMMDD.csv found.')
    process.exit(1)
  }
  const registry = parseCtaRegistry(readFileSync(csvPath, 'utf8'))
  const contentCsvPath = latestContentCsv()
  if (!contentCsvPath) {
    console.error('✗ No src/data/role_board_content_YYYYMMDD.csv found.')
    process.exit(1)
  }
  const boardHrefs = extractBoardHrefs(readFileSync(contentCsvPath, 'utf8'))
  // A gate that finds no CTAs at all is not a passing gate — it is a broken
  // one. This is exactly how the personaConfig.ts scrape failed silently after
  // the CSV migration (see extractBoardHrefs), so fail loudly instead.
  if (boardHrefs.length === 0) {
    console.error(
      `✗ No CTA hrefs found in ${contentCsvPath.replace(ROOT + '/', '')}.\n` +
        `  Expected rows with slot=${[...HREF_SLOTS].join(' / ')}.\n` +
        `  Refusing to report a pass over zero CTAs.`
    )
    process.exit(1)
  }
  const routeSegments = extractAppRoutes(readFileSync(join(ROOT, 'src/App.tsx'), 'utf8'))
  // Both tool registries — the boards resolve into /playground/:toolId and
  // /tools/:toolId alike.
  const toolIds = new Set([
    ...extractPlaygroundToolIds(
      readFileSync(join(ROOT, 'src/components/Playground/workshopRegistry.tsx'), 'utf8')
    ),
    ...extractBusinessToolIds(
      readFileSync(join(ROOT, 'src/components/BusinessCenter/businessToolsRegistry.tsx'), 'utf8')
    ),
    ...extractLearnModuleIds(join(ROOT, 'src/components/PKILearning/modules')),
  ])

  const businessToolIds = extractBusinessToolIds(
    readFileSync(join(ROOT, 'src/components/BusinessCenter/businessToolsRegistry.tsx'), 'utf8')
  )
  const malformed = boardHrefs.filter((h) => !businessToolHrefIsWellFormed(h, businessToolIds))
  if (malformed.length > 0) {
    console.error(
      `✗ ${malformed.length} business-tool href(s) missing the ${BUSINESS_TOOL_PREFIX} prefix:\n` +
        malformed.map((h) => `   ${h}`).join('\n') +
        `\n  These resolve segment-wise but fall through to the catch-all route and render the home board.`
    )
    process.exit(1)
  }

  const findings = auditCtas(boardHrefs, registry, routeSegments, toolIds, new Date())
  const blocking = findings.filter((f) => f.code !== 'ORPHAN_REGISTRY_ROW')

  if (json) {
    console.log(
      JSON.stringify(
        { csv: csvPath, ctas: boardHrefs.length, registry: registry.length, findings },
        null,
        2
      )
    )
  } else {
    console.log(`Role-board CTA audit — ${boardHrefs.length} CTAs, ${registry.length} registered`)
    console.log(`Registry: ${csvPath}\n`)
    if (findings.length === 0) {
      console.log('✓ Every role-board CTA is registered, resolves, and carries a fresh claim.')
    } else {
      for (const f of findings) {
        const mark = f.code === 'ORPHAN_REGISTRY_ROW' ? '⚠' : '✗'
        console.log(`${mark} ${f.code.padEnd(22)} ${f.href}\n    ${f.detail}`)
      }
    }
  }
  process.exit(blocking.length > 0 ? 1 : 0)
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  main()
}
