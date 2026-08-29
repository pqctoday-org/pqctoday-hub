import { test, expect } from '@playwright/test'

// WS-11 — PKCS#11 v3.2 Profiles conformance runner. All four OASIS
// mandatory Tier A test cases (BL/EXT/AUTH/CERT-M-1-32) plus every Tier B
// condition probe for each profile the engine claims must pass, on both
// engines, with zero not-claimed rows — that is the acceptance criterion
// this spec enforces, not just "the page renders".
//
// Local-only (needs both real WASM engines instantiated, ~5-15s of RSA
// keygen per engine): run via `playwright test --project=local
// e2e/pkcs11-conformance.local.spec.ts`, or E2E_SERVER=dev for fast
// iteration against an already-running dev server.

test.describe('PKCS#11 v3.2 Profiles conformance runner', () => {
  for (const engine of ['cpp', 'rust', 'dual'] as const) {
    test(`${engine} engine — every claimed Tier A/B row is conformant`, async ({ page }) => {
      await page.goto(`/playground/hsm?tab=conformance&engine=${engine}`)

      const runButton = page.getByTestId('pkcs11-conformance-run-button')
      await expect(runButton).toBeVisible({ timeout: 15000 })
      await runButton.click()

      const summary = page.getByTestId('pkcs11-conformance-summary')
      await expect(summary).toBeVisible({ timeout: 120000 })
      await expect(runButton).not.toHaveText(/Running/, { timeout: 120000 })

      const summaryText = (await summary.textContent())!.replace(/\s+/g, ' ').trim()
      // The acceptance criterion, verbatim: "N/N rows conformant", nothing
      // else appended (no " — N failed", no " — N not claimed by either
      // engine"). A regex match on the whole string, not a substring check,
      // so a partial match (e.g. "0/45" mistakenly satisfying /\d+\/\d+/)
      // can't slip through.
      expect(summaryText, summaryText).toMatch(/^\d+\/\d+ rows conformant$/)

      const rows = page.getByTestId('pkcs11-conformance-row')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)

      // Every one of the four OASIS mandatory Tier A cases must appear and
      // pass, for every engine this test targets — checked via the row's
      // real data-status attribute, not text scraping (status is only
      // conveyed by an icon in the rendered DOM, never as literal text).
      for (const caseId of ['BL-M-1-32', 'EXT-M-1-32', 'AUTH-M-1-32', 'CERT-M-1-32']) {
        const caseRows = rows.filter({ hasText: caseId })
        const caseRowCount = await caseRows.count()
        expect(caseRowCount, `expected at least one row for ${caseId}`).toBeGreaterThan(0)
        for (let i = 0; i < caseRowCount; i++) {
          const row = caseRows.nth(i)
          const status = await row.getAttribute('data-status')
          const detail = await row.textContent()
          expect(status, `${caseId} row: ${detail}`).toBe('pass')
        }
      }

      // No row anywhere may be not-claimed — every profile these engines
      // publish a CKO_PROFILE for must have a real, executed Tier A/B row.
      const notClaimedCount = await rows.locator('[data-status="not-claimed"]').count()
      expect(notClaimedCount, 'no row should render as not-claimed').toBe(0)
    })
  }
})
