// SPDX-License-Identifier: AGPL-3.0-only
// WS-F (F-5): the ACVP-format import/response-export prototype, in a real
// browser against the real C++ and Rust WASM engines (part of SMOKE_SPECS; it loads
// both engines).
//
// Network check: from the moment the prompt file is chosen until both
// downloads complete, no request may carry vector data (URL or body), and no
// non-GET request may leave the page. Engine code (.js/.wasm) is fetched by
// GET from this origin and carries nothing from the file.
import { test, expect } from './fixtures/blockAnalytics'
import type { Request } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const FIXTURE = path.join(
  process.cwd(),
  'src/services/acvp/__fixtures__/nist-acvp-server/ML-DSA-sigVer-FIPS204/prompt.json'
)
const EXPECTED = path.join(
  process.cwd(),
  'src/services/acvp/__fixtures__/nist-acvp-server/ML-DSA-sigVer-FIPS204/expectedResults.json'
)

type VectorSet = { testGroups: Array<{ tgId: number; tests: Array<Record<string, unknown>> }> }
/** The vector-set object of a bare or `[{acvVersion}, {…}]`-framed ACVP document. */
const vectorSet = (doc: unknown): VectorSet => (Array.isArray(doc) ? doc[1] : doc) as VectorSet
/** "tgId/tcId" → testPassed, for every test of an ACVP document. */
const verdicts = (doc: unknown): Map<string, unknown> => {
  const out = new Map<string, unknown>()
  for (const g of vectorSet(doc).testGroups)
    for (const t of g.tests) out.set(`${g.tgId}/${String(t.tcId)}`, t.testPassed)
  return out
}

test.describe('ACVP-format prototype (local import → run → download)', () => {
  test.setTimeout(180000)

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
      } catch {
        // ignore
      }
    })
  })

  test('both engines answer every test of the NIST ML-DSA sigVer sample; no request carries vector data', async ({
    page,
  }) => {
    const promptText = readFileSync(FIXTURE, 'utf8')
    const prompt = JSON.parse(promptText) as {
      testGroups: Array<{ tests: Array<Record<string, unknown>> }>
    }
    // Distinctive hex snippets from keys, messages and signatures.
    const needles = prompt.testGroups
      .flatMap((g) => g.tests.slice(0, 2))
      .flatMap((t) => [t.pk, t.message, t.signature])
      .filter((v): v is string => typeof v === 'string' && v.length >= 64)
      .map((v) => v.slice(16, 64))

    await page.goto('/playground/hsm?tab=developer&dtab=acvp')
    const heading = page.getByRole('heading', { name: /ACVP-format prompt import/ })
    await heading.waitFor({ state: 'visible', timeout: 60000 })
    await expect(
      page.getByText('Import and response generation do not submit results to NIST')
    ).toBeVisible()

    const leaks: string[] = []
    const onRequest = (r: Request) => {
      const body = r.postData() ?? ''
      const url = r.url()
      if (r.method() !== 'GET') leaks.push(`${r.method()} ${url}`)
      for (const n of needles) {
        if (url.includes(n) || body.includes(n)) leaks.push(`vector data in ${r.method()} ${url}`)
      }
    }
    page.on('request', onRequest)

    await page.getByLabel('ACVP prompt file').setInputFiles(FIXTURE)
    await expect(page.getByTestId('acvp-io-loaded')).toContainText('180 executable here')

    // The extended plan answers every test, and every answer is NIST's own.
    const expected = verdicts(JSON.parse(readFileSync(EXPECTED, 'utf8')))
    expect(expected.size).toBe(180)
    for (const [engine, label] of [
      ['C++ engine', 'softhsmv3 C++ engine'],
      ['Rust engine', 'softhsmv3 Rust engine'],
    ] as const) {
      await page.getByRole('button', { name: engine, exact: true }).click()
      await page.getByRole('button', { name: /Run locally/ }).click()
      await expect(page.getByTestId('acvp-io-summary')).toContainText(
        `180 test cases on the ${label}: 180 answered · 0 unsupported · 0 error`,
        { timeout: 120000 }
      )
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Download response\.json/ }).click(),
      ])
      expect(download.suggestedFilename()).toBe('response.json')
      const saved = readFileSync(await download.path(), 'utf8')
      expect(verdicts(JSON.parse(saved))).toEqual(expected)
    }

    page.off('request', onRequest)
    expect(leaks).toEqual([])
    // Nothing from the file was persisted.
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }))
    for (const n of needles) expect(stored.includes(n)).toBe(false)
  })
})
