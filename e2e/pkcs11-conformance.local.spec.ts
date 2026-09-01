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
      // Conformance moved from its own top-level tab into a Developer
      // sub-tab (2026-08-31) — dtab=conformance selects it, same as
      // ?tab=conformance used to.
      await page.goto(`/playground/hsm?tab=developer&dtab=conformance&engine=${engine}`)

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

      // Mechanism Coverage (2026-08-31): deterministic PQC key generation
      // from CKA_SEED — real mechanisms neither Tier A/B nor the ACVP tab
      // exercises anywhere. This is the first thing to catch a regression
      // if the not-claimed assertion above ever loosens (e.g. if a future
      // engine build stops advertising these mechanisms, this loop fails
      // by name instead of silently vanishing into "some row somewhere").
      for (const mech of [
        'CKM_ML_DSA_KEY_PAIR_GEN',
        'CKM_ML_KEM_KEY_PAIR_GEN',
        'CKM_SLH_DSA_KEY_PAIR_GEN',
      ]) {
        const mechRows = rows.filter({ hasText: mech })
        const mechRowCount = await mechRows.count()
        expect(mechRowCount, `expected a Mechanism Coverage row for ${mech}`).toBeGreaterThan(0)
        for (let i = 0; i < mechRowCount; i++) {
          const row = mechRows.nth(i)
          const status = await row.getAttribute('data-status')
          const detail = await row.textContent()
          expect(status, `${mech} row: ${detail}`).toBe('pass')
        }
      }
    })
  }

  // The three tests above all navigate straight to ?dtab=conformance, so
  // Pipeline (the Developer tab's other sub-tab) is never even mounted —
  // they can't catch state left behind by a real user who visits Pipeline
  // first. Since all three Developer sub-tabs are TabsContent panels that
  // unmount when inactive (2026-08-31 merge), the real risk is Pipeline's
  // OWN internal Builder/Code view state (or its Monaco editor instance)
  // somehow interfering with Conformance once the user switches over.
  for (const pipelineView of ['Builder', 'Code'] as const) {
    test(`conformance still runs clean after visiting Pipeline in ${pipelineView} view first`, async ({
      page,
    }) => {
      await page.goto('/playground/hsm?tab=developer')
      await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

      if (pipelineView === 'Code') {
        await page.getByRole('tab', { name: 'Code' }).click()
        await expect(page.locator('.monaco-editor .view-lines').first()).toBeVisible({
          timeout: 10000,
        })
      }

      await page.getByRole('tab', { name: 'Conformance' }).click()
      const runButton = page.getByTestId('pkcs11-conformance-run-button')
      await expect(runButton).toBeVisible({ timeout: 15000 })
      await runButton.click()

      const summary = page.getByTestId('pkcs11-conformance-summary')
      await expect(summary).toBeVisible({ timeout: 120000 })
      const summaryText = (await summary.textContent())!.replace(/\s+/g, ' ').trim()
      expect(summaryText, summaryText).toMatch(/^\d+\/\d+ rows conformant$/)
      const notClaimedCount = await page
        .getByTestId('pkcs11-conformance-row')
        .locator('[data-status="not-claimed"]')
        .count()
      expect(notClaimedCount, 'no row should render as not-claimed').toBe(0)

      // Switching back to Pipeline must remount it clean (fresh default
      // template, Builder view) — not crash, and not get stuck showing
      // Conformance's own DOM.
      await page.getByRole('tab', { name: 'Pipeline' }).click()
      await expect(page.getByRole('button', { name: 'Encrypt + sign (PQ)' })).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByRole('tab', { name: 'Builder · 5 steps' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })
  }
})
