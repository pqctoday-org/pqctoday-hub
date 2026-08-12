// SPDX-License-Identifier: GPL-3.0-only
/**
 * Runs the unresolved-placeholder warning against the REAL generated output of
 * every business tool, and prints what each one flags.
 *
 * Why this exists as an e2e rather than a unit test: the placeholder rule has
 * been corrected three times in two days — bracketed citations read as blanks,
 * lowercase blanks missed entirely, bracketed priority labels read as blanks —
 * and every one of those was found by looking at a document a tool actually
 * produced, never by reading source. A source-level scan cannot do this job:
 * the tools' markdown is assembled at runtime, and scanning their source for
 * `[...]` mostly finds TypeScript index signatures (`[key]`, `[number]`).
 *
 * LOCAL TIER — `*.local.spec.ts` never runs in CI (see playwright.config.ts).
 * This is a command a maintainer runs when touching unresolvedPlaceholders.ts
 * or adding an artifact tool, not a gate. Run it with:
 *
 *   E2E_SERVER=dev npx playwright test --project=local e2e/placeholder-audit.local.spec.ts
 *
 * Reading the output: every token printed should be something a user is
 * genuinely expected to replace. A standards citation, a priority label, or a
 * heading appearing here is a false positive and a bug in the rule — that is
 * exactly what this is for.
 */
import { test, expect } from '@playwright/test'
import { BUSINESS_TOOLS } from '../src/components/BusinessCenter/businessToolsRegistry'

test.setTimeout(900_000)

/** Tools whose blanks are deliberate and expected in an unfilled template. */
const EXPECTED_BLANKS: Record<string, string[]> = {
  'board-pitch': ['date'],
  'policy-generator': ['Organization Name', 'Effective Date', 'Policy Owner', 'Approver'],
  'contract-clause': ['YEAR', 'LEVEL', 'FREQUENCY', 'FORMAT', 'PERIOD'],
}

test('every tool flags only genuine blanks', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-compliance-selection',
      JSON.stringify({ state: { myFrameworks: ['NIST'] }, version: 0 })
    )
  })

  const found: Record<string, string[]> = {}

  for (const tool of BUSINESS_TOOLS) {
    await page.goto(`/business/tools/${tool.id}`, { waitUntil: 'domcontentloaded' })
    const ack = page.getByRole('button', { name: /I Understand/i }).first()
    if (await ack.count()) await ack.click({ timeout: 3000 }).catch(() => {})
    // Several tools take 5s+ to assemble; sampling early reads as "no warning".
    await page.waitForTimeout(3500)

    const body = await page.evaluate(
      () => (document.querySelector('main') as HTMLElement)?.innerText || ''
    )
    const m = body.match(/unfilled placeholders?[^:]*:\s*([^\n.]+)/)
    if (!m) continue
    found[tool.id] = m[1]
      .replace(/\s*\+\d+ more\s*$/, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  console.log('PLACEHOLDER AUDIT\n' + JSON.stringify(found, null, 2))

  // Any tool warning that is NOT in the expected set is a regression: either a
  // new unfilled blank shipped in default text, or the rule started flagging
  // something it should not.
  const unexpected = Object.keys(found).filter((id) => !EXPECTED_BLANKS[id])
  expect(
    unexpected,
    `these tools warn about placeholders and are not in EXPECTED_BLANKS:\n${unexpected
      .map((id) => `  ${id}: ${found[id].join(', ')}`)
      .join('\n')}`
  ).toEqual([])

  for (const [id, expected] of Object.entries(EXPECTED_BLANKS)) {
    expect(found[id] ?? [], `${id} blanks changed`).toEqual(expected)
  }
})
