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
  const files = readdirSync(dataDir)
    .filter((f) => /^role_board_ctas_\d{8}\.csv$/.test(f))
    .sort()
  return files.length ? join(dataDir, files[files.length - 1]) : null
}

export function parseCtaRegistry(csvText: string): CtaRegistryRow[] {
  const parsed = Papa.parse<CtaRegistryRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return (parsed.data ?? []).filter((r) => r && r.href)
}

/**
 * The set of hrefs a role board can point at, extracted from personaConfig's
 * source rather than by importing it — the module pulls in the whole data layer
 * (library CSVs, algorithm registry, KMIP fixtures), which is far more than a
 * lint gate should load, and several of those imports assume a browser.
 */
export function extractBoardHrefs(personaConfigSrc: string): string[] {
  const hrefs = new Set<string>()
  for (const m of personaConfigSrc.matchAll(/ctaPrimaryHref:\s*'([^']+)'/g)) hrefs.add(m[1])
  for (const m of personaConfigSrc.matchAll(/ctaSecondaryHref:\s*'([^']+)'/g)) hrefs.add(m[1])
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

/** Playground tool ids, which resolve through PlaygroundToolRoute's `:toolId`. */
export function extractPlaygroundToolIds(registrySrc: string): Set<string> {
  const ids = new Set<string>()
  for (const m of registrySrc.matchAll(/^\s*id:\s*'([a-z0-9-]+)',$/gm)) ids.add(m[1])
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
  const boardHrefs = extractBoardHrefs(
    readFileSync(join(ROOT, 'src/data/personaConfig.ts'), 'utf8')
  )
  const routeSegments = extractAppRoutes(readFileSync(join(ROOT, 'src/App.tsx'), 'utf8'))
  const toolIds = extractPlaygroundToolIds(
    readFileSync(join(ROOT, 'src/components/Playground/workshopRegistry.tsx'), 'utf8')
  )

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
