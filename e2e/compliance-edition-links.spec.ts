// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { test, expect } from '@playwright/test'

/**
 * "Replaces an older edition" / "Replaced by a newer edition" on a Compliance
 * record, desktop side panel and phone sheet.
 *
 * The links come from `supersedes` rows in the latest concept cross-walk file.
 * Until a data revision ships such a row whose end is a Compliance record, there
 * is nothing to show and every test here skips with that reason; the first
 * revision that carries one switches them on. Nothing is faked: the spec reads the
 * same file the site is built from.
 */
const DATA_DIR = path.resolve(process.cwd(), 'src', 'data')

/** `concept_xwalks_11072026_r2.csv` -> sortable [year, month, day, revision]. */
function revisionKey(file: string, prefix: string): number[] | null {
  const m = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`).exec(file)
  return m ? [Number(m[3]), Number(m[1]), Number(m[2]), Number(m[4] ?? 0)] : null
}

function latestCsv(prefix: string): Record<string, string>[] {
  const files = fs
    .readdirSync(DATA_DIR)
    .map((f) => ({ f, key: revisionKey(f, prefix) }))
    .filter((x): x is { f: string; key: number[] } => x.key !== null)
    .sort((a, b) => {
      for (let i = 0; i < 4; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i]
      return 0
    })
  const latest = files.at(-1)
  if (!latest) return []
  const text = fs.readFileSync(path.join(DATA_DIR, latest.f), 'utf-8')
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data
}

interface Pair {
  frameworkId: string
  /** What the record's own page must say. */
  wording: string
}

function findPair(): Pair | null {
  // The cross-walk names a record by its id or by its label; both open the same record.
  const frameworkIdByName = new Map<string, string>()
  for (const r of latestCsv('compliance')) {
    if ((r['status'] ?? 'active') !== 'active') continue
    frameworkIdByName.set(r['id'], r['id'])
    if (r['label']) frameworkIdByName.set(r['label'], r['id'])
  }
  const rows = latestCsv('concept_xwalks').filter(
    (r) =>
      r['relationship_type'] === 'supersedes' &&
      !['deprecated', 'obsolete'].includes(r['status'] ?? '')
  )
  for (const r of rows) {
    const newer = frameworkIdByName.get(r['from_concept'])
    if (newer) return { frameworkId: newer, wording: 'Replaces an older edition' }
    const older = frameworkIdByName.get(r['to_concept'])
    if (older) return { frameworkId: older, wording: 'Replaced by a newer edition' }
  }
  return null
}

const pair = findPair()

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
})

test.describe('edition links on a Compliance record', () => {
  test.skip(!pair, 'no shipped supersedes row names a Compliance record yet')

  test('desktop side panel lists the edition link first, in full', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`/compliance?framework=${encodeURIComponent(pair!.frameworkId)}`)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByTestId('drawer-edition-link').first()).toHaveText(pair!.wording, {
      timeout: 25_000,
    })
  })

  test('phone sheet shows the same wording and does not scroll sideways at 390 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/compliance?framework=${encodeURIComponent(pair!.frameworkId)}`)
    const sheet = page.getByTestId('compliance-framework-detail-sheet')
    await expect(sheet.getByText(pair!.wording, { exact: true }).first()).toBeVisible({
      timeout: 25_000,
    })
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
