#!/usr/bin/env tsx
/**
 * scripts/audit-role-board-content.ts
 *
 * Maintenance aid for the role-board CSV (`src/data/role_board_content_*.csv`)
 * — the `audit-role-board-content` skill's backing script. Unlike
 * `audit-role-board-ctas.ts`, this is NOT a pass/fail CI gate: it produces
 * material for an editorial review that only a human/Claude judgment call can
 * finish (tone, design-review language, whether copy still reads honestly).
 * See the skill for the reading half of that review.
 *
 * What this script does, deterministically:
 *   1. Flags every row whose `last_reviewed` is older than the freshness
 *      window (matches the CTA gate's 180-day threshold, for one consistent
 *      number across both role-board maintenance surfaces).
 *   2. Renders EVERY board option for every role against a running dev server
 *      and writes the visible text to `reports/role-board-audit-
 *      <date>/<role>-<variant>.txt` — the raw material for the tone/language
 *      pass. It used to render only each role's default option, so two thirds
 *      of the boards had no text in a report that looked complete.
 *   3. Cross-references every `cta_*_href` slot value against the CTA
 *      registry via the SAME parser `audit-role-board-ctas.ts` uses (not a
 *      reimplementation) and reports any href with no matching row —
 *      `audit-role-board-ctas.ts` itself is the authority on whether that
 *      href actually resolves and is still verified; this just flags rows
 *      this script's own CSV references that gate doesn't know about yet.
 *
 * What it does NOT do: judge whether copy is honest, catch design-review
 * language, or edit anything. That is the skill's job, reading this script's
 * output.
 *
 * Requires a running dev server (npm run dev, default port 5175) — does not
 * start one itself, matching how every ad hoc verification this session did
 * it, and keeping this script fast to re-run without a full build.
 *
 * Run via: npm run audit:role-board-content
 *          npm run audit:role-board-content -- --base-url http://localhost:5175
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import Papa from 'papaparse'
import { latestCtaCsv, parseCtaRegistry } from './audit-role-board-ctas'
import { latestDatedCsv, ROLE_BOARD_CONTENT_RE, ROLE_BOARD_VARIANTS_RE } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FRESHNESS_MAX_AGE_DAYS = 180
const ROLES = ['executive', 'developer', 'architect', 'ops', 'researcher', 'curious'] as const

interface ContentRow {
  role_id: string
  variant_id: string
  slot: string
  slot_index: string
  content: string
  status: string
  last_reviewed: string
}

/**
 * The live content CSV, via the SAME shared picker the generator and the CTA
 * gate use.
 *
 * This re-implemented the pick with a plain lexical `.sort()` over
 * `role_board_content_\d{8}\.csv`. The filenames are MMDDYYYY, so lexical order
 * is not date order: a `12312025` file sorts above `01012026` and the audit
 * would have reported on a superseded CSV while the app rendered the current
 * one — silently, with no error, because both files parse fine. Nothing had
 * crossed a year boundary yet, so it had never bitten.
 */
function latestContentCsv(): string {
  const path = latestDatedCsv(join(ROOT, 'src/data'), ROLE_BOARD_CONTENT_RE)
  if (!path) throw new Error('No src/data/role_board_content_*.csv found.')
  return path
}

/**
 * Every active board option per role, in chip order — so the render pass can
 * capture ALL of them.
 *
 * It only ever screenshotted each role's DEFAULT board. Options 2 and 3 were
 * never rendered, so the editorial pass this script exists to feed had no text
 * for two thirds of the boards, and no reviewer would have noticed the absence
 * — the report looked complete, one file per role.
 */
function variantIdsByRole(): Map<string, string[]> {
  const path = latestDatedCsv(join(ROOT, 'src/data'), ROLE_BOARD_VARIANTS_RE)
  if (!path) throw new Error('No src/data/role_board_variants_*.csv found.')
  const rows =
    Papa.parse<Record<string, string>>(readFileSync(path, 'utf8'), {
      header: true,
      skipEmptyLines: true,
    }).data ?? []
  const byRole = new Map<string, { id: string; order: number }[]>()
  for (const r of rows) {
    if (!r || !r.role_id || (r.status ?? 'active') !== 'active') continue
    if (!byRole.has(r.role_id)) byRole.set(r.role_id, [])
    byRole.get(r.role_id)!.push({ id: r.variant_id, order: Number(r.order) })
  }
  return new Map(
    [...byRole].map(([role, vs]) => [role, vs.sort((a, b) => a.order - b.order).map((v) => v.id)])
  )
}

function daysSince(iso: string, now: Date): number | null {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return Math.floor((now.getTime() - t) / 86_400_000)
}

async function main() {
  const baseUrlArg = process.argv.find((a) => a.startsWith('--base-url='))
  const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:5175'

  const csvPath = latestContentCsv()
  const rows = Papa.parse<ContentRow>(readFileSync(csvPath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  }).data.filter((r) => r && r.role_id && (r.status ?? 'active') === 'active')

  console.log(`Role-board content audit — ${csvPath.replace(ROOT + '/', '')}\n`)

  // 1. Freshness.
  const now = new Date()
  const stale = rows.filter((r) => {
    const age = daysSince(r.last_reviewed, now)
    return age === null || age > FRESHNESS_MAX_AGE_DAYS
  })
  if (stale.length === 0) {
    console.log(`✓ All ${rows.length} rows reviewed within ${FRESHNESS_MAX_AGE_DAYS} days.`)
  } else {
    console.log(`⚠ ${stale.length} row(s) past the ${FRESHNESS_MAX_AGE_DAYS}-day freshness window:`)
    for (const r of stale.slice(0, 20)) {
      console.log(
        `   ${r.role_id}/${r.variant_id}/${r.slot}[${r.slot_index}]  last_reviewed=${r.last_reviewed || '(none)'}`
      )
    }
    if (stale.length > 20) console.log(`   … and ${stale.length - 20} more`)
  }

  // 2. CTA cross-reference — reuses the CTA gate's own parser, not a new one.
  const ctaCsvPath = latestCtaCsv()
  const ctaRows = ctaCsvPath ? parseCtaRegistry(readFileSync(ctaCsvPath, 'utf8')) : []
  const ctaHrefs = new Set(ctaRows.map((r) => r.href))
  // Grid-card hrefs are gated exactly like CTAs (2026-08-09), so they belong in
  // this cross-reference too — otherwise the freshness report stays silent
  // about the larger half of the board's outbound links.
  const HREF_SLOTS = new Set(['cta_primary_href', 'cta_secondary_href', 'grid_card_href'])
  const boardHrefSlots = rows.filter((r) => HREF_SLOTS.has(r.slot))
  const unregistered = boardHrefSlots.filter((r) => !ctaHrefs.has(r.content))
  if (unregistered.length === 0) {
    console.log(`\n✓ Every board CTA href is registered in the CTA gate.`)
  } else {
    console.log(`\n⚠ ${unregistered.length} board CTA href(s) missing from the CTA registry:`)
    for (const r of unregistered) console.log(`   ${r.role_id}: ${r.content}`)
    console.log(`   Run: npm run audit:role-board-ctas -- for the authoritative check.`)
  }

  // 3. Render every role and capture the text a visitor would read.
  const stamp = now.toISOString().slice(0, 10)
  const outDir = join(ROOT, 'reports', `role-board-audit-${stamp}`)
  mkdirSync(outDir, { recursive: true })
  const variantsByRole = variantIdsByRole()
  const boardCount = ROLES.reduce((n, r) => n + (variantsByRole.get(r)?.length ?? 0), 0)
  console.log(`\nRendering ${boardCount} boards across ${ROLES.length} roles against ${baseUrl} …`)

  let browser
  try {
    browser = await chromium.launch()
  } catch (e) {
    console.error(`\n✗ Could not launch a browser: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }
  try {
    for (const role of ROLES) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 } })
      await ctx.addInitScript(
        ([p]) => {
          localStorage.setItem(
            'pqc-version-storage',
            JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
          )
          localStorage.setItem(
            'pqc-learning-persona',
            JSON.stringify({
              state: {
                selectedPersona: p,
                hasSeenPersonaPicker: true,
                selectedRegion: 'global',
                selectedIndustries: [],
                suppressSuggestion: true,
              },
              version: 10,
            })
          )
        },
        [role]
      )
      const page = await ctx.newPage()
      // One context per role (the persona lives in localStorage), one
      // navigation per board option. `?variant=` takes precedence over the
      // persisted choice, which is what makes each option addressable here.
      for (const variantId of variantsByRole.get(role) ?? []) {
        let reachable = true
        try {
          await page.goto(`${baseUrl}/?variant=${encodeURIComponent(variantId)}`, {
            waitUntil: 'networkidle',
            timeout: 15000,
          })
        } catch {
          reachable = false
        }
        if (!reachable) {
          console.error(`✗ ${baseUrl} is not reachable — start the dev server first (npm run dev).`)
          await ctx.close()
          await browser.close()
          process.exit(1)
        }
        await page.waitForTimeout(1200)
        const text = await page.locator('body').innerText()
        const outFile = join(outDir, `${role}-${variantId}.txt`)
        writeFileSync(outFile, text)
        console.log(`   wrote ${outFile.replace(ROOT + '/', '')}`)
      }
      await ctx.close()
    }
  } finally {
    await browser.close()
  }

  console.log(
    `\nCaptured. Read each file and apply the tone/language pass described in the ` +
      `audit-role-board-content skill — this script cannot judge that part.`
  )
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e)
  process.exit(1)
})
