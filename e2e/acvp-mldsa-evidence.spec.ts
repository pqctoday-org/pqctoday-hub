import { test, expect, type Locator } from '@playwright/test'

// ML-DSA reference-sample rows (useAcvpSuite section 5d, sections/mldsaAcvp.ts)
// rendered in the real workbench on BOTH engines (dual mode). Asserts row
// semantics, not a row count: a NIST positive and a NIST negative case pass on
// C++ and Rust with the NIST evidence class, a product-authored negative passes
// without it, and unsupported upstream groups render as 'skip' — never pass.
//
// Nightly only (deliberately NOT in SMOKE_SPECS): dual mode loads both WASM
// engines, which is heavier than the smoke budget allows.
test.describe('ACVP workbench — ML-DSA reference samples (dual engine)', () => {
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

  test('positive, negative, product-authored and skip rows carry the right semantics', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

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
    await page.getByTestId('acvp-category-checkbox-ml_dsa').check()
    await page.getByTestId('acvp-run-selected').click()
    await expect(page.getByTestId('acvp-run-selected')).toHaveAttribute('aria-busy', 'false', {
      timeout: 120000,
    })

    const rows = page.getByTestId('acvp-result-row')
    const row = (algorithm: string, testCase: string): Locator =>
      rows.filter({ hasText: algorithm }).filter({ hasText: testCase })
    // Evidence class comes from the generated per-case records (manifest + registry).
    const evidenceBadge = (r: Locator) => r.getByTestId('case-evidence-badge').first()

    for (const engine of ['C++', 'Rust']) {
      // NIST positive + NIST negative (exact upstream tgId/tcId in the row).
      const pos = row(`ML-DSA-44 (${engine})`, 'NIST sigVer tg1/tc11')
      await expect(pos).toHaveCount(1)
      await expect(pos).toHaveAttribute('data-status', 'pass')
      await expect(pos).toContainText('expect valid')
      await expect(evidenceBadge(pos)).toHaveAttribute(
        'data-evidence',
        'nist-acvp-reference-sample'
      )

      const neg = row(`ML-DSA-44 (${engine})`, 'NIST sigVer tg1/tc5')
      await expect(neg).toHaveCount(1)
      await expect(neg).toHaveAttribute('data-status', 'pass')
      await expect(neg).toContainText('expect invalid (modified signature - z)')
      await expect(neg.locator('td').nth(4)).toHaveAttribute(
        'title',
        /C_Verify → CKR_SIGNATURE_INVALID \(expected CKR_SIGNATURE_INVALID\)/
      )

      // Product-authored negative: passes, but carries no NIST evidence class.
      // The ML-DSA-65 pair shown live at FIPS 'n' CHIPS (26 Oct 2026): tg3/tc43
      // verifies, tg3/tc35 (modified message) is refused with
      // CKR_SIGNATURE_INVALID — on both engines.
      const demoPos = row(`ML-DSA-65 (${engine})`, 'NIST sigVer tg3/tc43')
      await expect(demoPos).toHaveCount(1)
      await expect(demoPos).toHaveAttribute('data-status', 'pass')
      await expect(demoPos).toContainText('expect valid')
      const demoNeg = row(`ML-DSA-65 (${engine})`, 'NIST sigVer tg3/tc35')
      await expect(demoNeg).toHaveCount(1)
      await expect(demoNeg).toHaveAttribute('data-status', 'pass')
      await expect(demoNeg).toContainText('expect invalid (modified message)')
      await expect(demoNeg.locator('td').nth(4)).toHaveAttribute(
        'title',
        /C_Verify → CKR_SIGNATURE_INVALID \(expected CKR_SIGNATURE_INVALID\)/
      )

      const local = row(`ML-DSA-44 (${engine})`, 'product-authored negative · public-key bit flip')
      await expect(local).toHaveCount(1)
      await expect(local).toHaveAttribute('data-status', 'pass')
      await expect(evidenceBadge(local)).not.toHaveAttribute(
        'data-evidence',
        'nist-acvp-reference-sample'
      )

      // Honest skip: an upstream group PKCS#11 cannot express.
      const skip = row(
        `ML-DSA-44/65/87 (${engine})`,
        'HashML-DSA SigVer · SHA2-512/224, SHA2-512/256'
      )
      await expect(skip).toHaveCount(1)
      await expect(skip).toHaveAttribute('data-status', 'skip')
      await expect(skip.locator('td').nth(4)).toHaveAttribute('title', /^Skipped — PKCS#11 v3.2/)
    }

    // Nothing in the ML-DSA category may fail, on either engine.
    await expect(page.locator('[data-testid="acvp-result-row"][data-status="fail"]')).toHaveCount(0)
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([])
  })
})
