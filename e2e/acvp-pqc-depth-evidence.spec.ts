import { test, expect, type Locator, type Page } from '@playwright/test'

// ML-KEM and ML-DSA depth rows (WS-D D1/D2-6: sections/mlkemAcvp.ts,
// mldsaDepth.ts) rendered in the real workbench on BOTH engines (dual mode).
// Asserts row semantics, not a row count: NIST positives and negatives with the
// NIST evidence class, product-authored rows without it, honest skips, NIST-
// invalid keys rejected on both engines — and no red row at all, since every
// engine finding this spec used to pin is closed (see the end of the test).
//
// SLH-DSA is deliberately NOT run here (owner decision 2026-09-29): the
// slh_stateful category signs deterministically across 12 parameter sets in
// both engines, and on GitHub's runner (~4-5x slower than a Mac) that alone
// kept acvp-run-selected busy past the 360 s wait (e2e-nightly runs
// 36440325478, 36577854144). The workbench selects whole categories only, so
// there is no smaller SLH-DSA slice to keep. Full SLH-DSA coverage — sigVer
// "too small" negatives, deterministic sigGen, HashSLH-DSA (passing on BOTH
// engines since the hsm a22e6ca0 rebuild), product-authored negatives, the
// internal-interface skip — runs in
// src/components/Playground/hsm/acvp/useAcvpSuite.slhdsaAcvp.nightly.test.ts
// (.github/workflows/validation-nightly.yml).
//
// Nightly only (deliberately NOT in SMOKE_SPECS): dual mode is above the smoke
// budget.
test.describe('ACVP workbench — PQC depth rows (dual engine)', () => {
  test.setTimeout(420000)

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

  const runCategories = async (page: Page, categories: string[]) => {
    await page.goto('/playground/hsm?tab=developer&dtab=acvp')
    const acvpTab = page.getByRole('tab', { name: 'Validation' })
    await acvpTab.waitFor({ state: 'visible', timeout: 30000 })
    await acvpTab.click()
    await page.waitForFunction(
      () =>
        typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
        'function',
      undefined,
      { timeout: 30000 }
    )
    const ok = await page.evaluate(async () => {
      const fn = (
        window as unknown as { __e2e_hsm_autoinit?: (engine?: string) => Promise<boolean> }
      ).__e2e_hsm_autoinit
      return fn ? await fn('dual') : false
    })
    expect(ok, 'dual-engine HSM autoInit failed').toBeTruthy()
    await page.getByTestId('acvp-select-none').click()
    for (const c of categories) await page.getByTestId(`acvp-category-checkbox-${c}`).check()
    await page.getByTestId('acvp-run-selected').click()
    await expect(page.getByTestId('acvp-run-selected')).toHaveAttribute('aria-busy', 'false', {
      timeout: 360000,
    })
  }

  test('ML-KEM and ML-DSA depth rows carry the right semantics on both engines', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))
    await runCategories(page, ['ml_kem', 'ml_dsa'])

    const rows = page.getByTestId('acvp-result-row')
    const row = (algorithm: string, testCase: string): Locator =>
      rows.filter({ hasText: algorithm }).filter({ hasText: testCase })
    // Evidence class comes from the generated per-case records (manifest + registry).
    const evidenceBadge = (r: Locator) => r.getByTestId('case-evidence-badge').first()
    const details = (r: Locator) => r.locator('td').nth(4)

    for (const engine of ['C++', 'Rust']) {
      // ── ML-KEM ──
      const kg = row(`ML-KEM-512 (${engine})`, 'NIST keyGen tg1/tc1 · ek+dk')
      await expect(kg).toHaveCount(1)
      await expect(kg).toHaveAttribute('data-status', 'pass')
      await expect(evidenceBadge(kg)).toHaveAttribute('data-evidence', 'nist-acvp-reference-sample')

      const rej = row(
        `ML-KEM-512 (${engine})`,
        'NIST encapDecap VAL tg4/tc76 · modified ciphertext'
      )
      await expect(rej).toHaveCount(1)
      await expect(rej).toHaveAttribute('data-status', 'pass')
      await expect(details(rej)).toHaveAttribute('title', /equals NIST implicit-rejection value/)

      const local = row(`ML-KEM-512 (${engine})`, 'product-authored negative · ciphertext bit flip')
      await expect(local).toHaveCount(1)
      await expect(local).toHaveAttribute('data-status', 'pass')
      await expect(evidenceBadge(local)).not.toHaveAttribute(
        'data-evidence',
        'nist-acvp-reference-sample'
      )

      const buf = row(`ML-KEM-512 (${engine})`, 'C_EncapsulateKey with a 767-byte output buffer')
      await expect(buf).toHaveAttribute('data-status', 'pass')
      await expect(details(buf)).toHaveAttribute('title', /observed CKR_BUFFER_TOO_SMALL/)

      const encSkip = row(`ML-KEM-512/768/1024 (${engine})`, 'Encapsulation AFT')
      await expect(encSkip).toHaveAttribute('data-status', 'skip')

      // Invalid decapsulation key (NIST VAL, modified H): rejected on BOTH
      // engines. Rust used to accept it (finding E2) until the hsm a22e6ca0
      // rebuild enforced FIPS 203 §7.3 there too; this matches
      // useAcvpSuite.mlkemAcvp.local.test.ts ("the Rust engine now enforces
      // the FIPS 203 key checks too").
      const badKey = row(`ML-KEM-512 (${engine})`, 'NIST VAL tg7/tc106 · modified H')
      await expect(badKey).toHaveCount(1)
      await expect(badKey).toHaveAttribute('data-status', 'pass')
      await expect(details(badKey)).not.toHaveAttribute(
        'title',
        /ACCEPTED a key NIST marks invalid/
      )

      // ── ML-DSA depth (D2-6) ──
      const ctx0 = row(`ML-DSA-44 (${engine})`, 'NIST sigGen tg1/tc5 · pure · ctx 0B')
      await expect(ctx0).toHaveAttribute('data-status', 'pass')
      const ctx256 = row(`ML-DSA-44 (${engine})`, 'C_SignInit with a 256-byte context')
      await expect(ctx256).toHaveAttribute('data-status', 'pass')
    }

    // No row is red. The findings this spec used to pin — 6 Rust ML-KEM key
    // checks (E2) and 7 C++ HashSLH-DSA cases — were all closed by the hsm
    // a22e6ca0 rebuild; a red row here is a new regression, not a known one.
    const failed = page.locator('[data-testid="acvp-result-row"][data-status="fail"]')
    await expect(failed).toHaveCount(0)
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([])
  })
})
