// SPDX-License-Identifier: GPL-3.0-only
// WS-J J-2 gap fill. The existing validation specs already cover a single-
// engine run (acvp-validator), dual-engine NIST positive/negative/skip rows
// (acvp-mldsa-evidence) and the ML-DSA prompt import → response.json download
// with a no-leak network check (acvp-io-prototype). This spec adds only what
// none of them asserts:
//   1. the §2.2 disclaimer, verbatim, on the workbench and both Algorithms
//      validation surfaces (plan A-4 / §10.1 #4);
//   2. report download: the published coverage matrix and release evidence
//      report agree with each other and with the numbers the page shows;
//   3. import/export of the ML-KEM prompt with the evidence.json sidecar —
//      bound to response.json by hash, carrying the disclaimers, with no
//      PQC Today metadata inside response.json (F-6);
//   4. offline: once the engine is loaded the whole import → run → download
//      works with the network switched off;
//   5. a wrong-revision prompt is refused in the browser, never run.
// Nightly full suite only (NOT in SMOKE_SPECS): 3–4 load a WASM engine.
import { test, expect, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { VALIDATION_DISCLAIMER } from '../src/data/validationDisclaimer'

const FIXTURES = path.join(process.cwd(), 'src/services/acvp/__fixtures__')
const KEM_PROMPT = path.join(FIXTURES, 'nist-acvp-server/ML-KEM-encapDecap-FIPS203/prompt.json')
const KEM_GOLDEN = path.join(FIXTURES, 'goldens/ML-KEM-encapDecap-FIPS203.response.json')

const canonical = (v: unknown): string =>
  v === null || typeof v !== 'object'
    ? JSON.stringify(v)
    : Array.isArray(v)
      ? `[${v.map(canonical).join(',')}]`
      : `{${Object.keys(v as object)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
          .join(',')}}`

interface Tests {
  testGroups: Array<{ tests: unknown[] }>
}
const countTests = (d: Tests) => d.testGroups.reduce((n, g) => n + g.tests.length, 0)

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

const openAcvpTab = async (page: Page) => {
  await page.goto('/playground/hsm?tab=developer&dtab=acvp')
  const tab = page.getByRole('tab', { name: 'Validation' })
  await tab.waitFor({ state: 'visible', timeout: 30000 })
  await tab.click()
}

test.describe('Validation evidence surfaces (release evidence, J-2)', () => {
  test.setTimeout(180000)

  test('the §2.2 disclaimer is visible verbatim on the workbench and both Algorithms validation surfaces', async ({
    page,
  }) => {
    await openAcvpTab(page)
    const wb = page.getByTestId('acvp-suite-workbench').getByTestId('validation-disclaimer')
    await expect(wb.first()).toBeVisible({ timeout: 30000 })
    await expect(wb.first()).toHaveText(VALIDATION_DISCLAIMER)

    await page.goto('/algorithms?tab=validation&section=kat')
    const kat = page.getByTestId('validation-disclaimer').first()
    await expect(kat).toBeVisible({ timeout: 30000 })
    await expect(kat).toHaveText(VALIDATION_DISCLAIMER)

    await page.goto('/algorithms?tab=validation&section=coverage')
    const view = page.getByTestId('coverage-matrix-view')
    await expect(view).toBeVisible({ timeout: 30000 })
    await expect(view.getByTestId('validation-disclaimer').first()).toHaveText(
      VALIDATION_DISCLAIMER
    )
  })

  test('report download: the published matrix, its exports and the release evidence report agree with the page', async ({
    page,
    request,
  }) => {
    await page.goto('/algorithms?tab=validation&section=coverage')
    const view = page.getByTestId('coverage-matrix-view')
    await expect(view).toBeVisible({ timeout: 30000 })

    const matrixResp = await request.get('/data/validation/coverage-matrix.json')
    expect(matrixResp.ok()).toBe(true)
    const matrix = (await matrixResp.json()) as {
      engines: Record<string, { label: string; mechanismCount: number }>
      totals: { byEngine: Record<string, { advertisedCells: number; unsupportedCells: number }> }
      openGaps: unknown[]
    }
    const reportResp = await request.get('/data/validation/release-evidence.json')
    expect(reportResp.ok()).toBe(true)
    const report = (await reportResp.json()) as {
      disclaimer: string
      coverage: { byEngine: Record<string, { advertisedCells: number; unsupportedCells: number }> }
      openGaps: { total: number }
      waivers: { entries: number; approvedEntries: number; statement: string }
      definitionOfDone: Array<{ n: number; status: string }>
    }

    // The page shows the published numbers — numerator/denominator are not
    // re-typed anywhere between the generated file and the screen.
    for (const [id, t] of Object.entries(matrix.totals.byEngine)) {
      const e = matrix.engines[id]
      await expect(view.getByRole('region', { name: `${e.label} totals` })).toContainText(
        `${e.mechanismCount} mechanisms · ${t.advertisedCells} advertised capability cells (denominator) · ${t.unsupportedCells} unsupported cells shown separately`
      )
      // …and the release report carries the same figures.
      expect(report.coverage.byEngine[id].advertisedCells).toBe(t.advertisedCells)
      expect(report.coverage.byEngine[id].unsupportedCells).toBe(t.unsupportedCells)
    }
    expect(report.openGaps.total).toBe(matrix.openGaps.length)
    expect(report.disclaimer).toBe(VALIDATION_DISCLAIMER)
    // Pending waivers are never presented as approvals; human checklist items never PASS.
    if (report.waivers.approvedEntries === 0)
      expect(report.waivers.statement).toMatch(/None is an approval/)
    for (const n of [3, 8, 9, 10])
      expect(report.definitionOfDone.find((d) => d.n === n)?.status).toBe('HUMAN-REQUIRED')

    // Every export link on the page resolves and carries the disclaimer.
    for (const ext of ['HTML', 'MD']) {
      const href = await view.getByRole('link', { name: ext, exact: true }).getAttribute('href')
      expect(href, `${ext} export link`).toBeTruthy()
      const r = await request.get(href!)
      expect(r.ok(), href!).toBe(true)
      expect(await r.text()).toContain(VALIDATION_DISCLAIMER)
    }
    const md = await request.get('/data/validation/release-evidence.md')
    expect(md.ok()).toBe(true)
    expect(await md.text()).toContain(VALIDATION_DISCLAIMER)
  })

  test('ML-KEM import → run → response.json + evidence.json; then the same run offline', async ({
    page,
    context,
  }) => {
    const prompt = JSON.parse(readFileSync(KEM_PROMPT, 'utf8')) as Tests
    const golden = JSON.parse(readFileSync(KEM_GOLDEN, 'utf8')) as Tests
    const total = countTests(prompt)
    const answered = countTests(golden)

    await openAcvpTab(page)
    await page
      .getByRole('heading', { name: /ACVP-format prompt import/ })
      .waitFor({ state: 'visible', timeout: 60000 })
    const importDisclaimer = (
      await page.getByTestId('acvp-io-disclaimer-import').innerText()
    ).trim()

    const runOnce = async () => {
      await page.getByLabel('ACVP prompt file').setInputFiles(KEM_PROMPT)
      await expect(page.getByTestId('acvp-io-loaded')).toContainText(`${total} test cases`)
      await page.getByRole('button', { name: 'C++ engine', exact: true }).click()
      await page.getByRole('button', { name: /Run locally/ }).click()
      await expect(page.getByTestId('acvp-io-summary')).toContainText(
        `${total} test cases on the softhsmv3 C++ engine: ${answered} answered · ${total - answered} unsupported · 0 error`,
        { timeout: 120000 }
      )
      const save = async (name: RegExp) => {
        const [dl] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name }).click(),
        ])
        return { name: dl.suggestedFilename(), bytes: readFileSync(await dl.path()) }
      }
      return {
        response: await save(/Download response\.json/),
        evidence: await save(/Download evidence\.json/),
      }
    }

    const online = await runOnce()
    expect(online.response.name).toBe('response.json')
    expect(online.evidence.name).toBe('evidence.json')
    const response = JSON.parse(online.response.bytes.toString('utf8')) as Record<string, unknown>
    expect(canonical(response)).toBe(canonical(golden))
    // F-6: the protocol response carries no PQC Today metadata.
    expect(online.response.bytes.toString('utf8')).not.toMatch(/pqc ?today|disclaimer|evidence/i)

    const evidence = JSON.parse(online.evidence.bytes.toString('utf8')) as {
      disclaimers: string[]
      evidenceClass: string
      response: { fileName: string; sha256: string }
      engine: { id: string }
      summary: { testCases: number; answered: number; unsupported: number; error: number }
      unsupported: Array<{ reason: string }>
    }
    expect(evidence.disclaimers).toEqual([VALIDATION_DISCLAIMER, importDisclaimer])
    expect(evidence.evidenceClass).toBe('nist-acvp-reference-sample')
    expect(evidence.engine.id).toBe('cpp')
    expect(evidence.summary).toEqual({
      testCases: total,
      answered,
      unsupported: total - answered,
      error: 0,
    })
    // The sidecar names the exact response bytes it describes.
    expect(evidence.response).toEqual({
      fileName: 'response.json',
      sha256: createHash('sha256').update(online.response.bytes).digest('hex'),
    })
    // Every unsupported group says why — nothing is silently dropped.
    expect(evidence.unsupported.length).toBeGreaterThan(0)
    for (const u of evidence.unsupported) expect(u.reason.length).toBeGreaterThan(20)

    // Offline: the engine is loaded; nothing else is needed from the network.
    await page.getByRole('button', { name: /Clear/ }).click()
    await context.setOffline(true)
    const nonGet: string[] = []
    page.on('request', (r) => {
      if (r.method() !== 'GET') nonGet.push(`${r.method()} ${r.url()}`)
    })
    const offline = await runOnce()
    await context.setOffline(false)
    expect(canonical(JSON.parse(offline.response.bytes.toString('utf8')))).toBe(canonical(golden))
    expect(offline.response.bytes.equals(online.response.bytes)).toBe(true)
    expect(nonGet).toEqual([])
  })

  test('a prompt with an unpinned revision is refused in the browser and cannot be run', async ({
    page,
  }) => {
    const prompt = JSON.parse(readFileSync(KEM_PROMPT, 'utf8')) as Record<string, unknown>
    prompt.revision = 'FIPS203-draft'
    await openAcvpTab(page)
    await page
      .getByRole('heading', { name: /ACVP-format prompt import/ })
      .waitFor({ state: 'visible', timeout: 60000 })
    await page.getByLabel('ACVP prompt file').setInputFiles({
      name: 'wrong-revision.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(prompt)),
    })
    const panel = page.getByTestId('acvp-io-panel')
    await expect(panel).toContainText('wrong-revision.json was rejected')
    await expect(panel).toContainText('$.revision')
    await expect(page.getByRole('button', { name: /Run locally/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Download response\.json/ })).toHaveCount(0)
  })
})
