import { test, expect } from './fixtures/blockAnalytics'
import type { Locator } from '@playwright/test'

// ML-DSA reference-sample rows (useAcvpSuite section 5d, sections/mldsaAcvp.ts)
// rendered in the real workbench on BOTH engines (dual mode). Asserts row
// semantics, not a row count: a NIST positive and a NIST negative case pass on
// C++ and Rust with the NIST evidence class, a product-authored negative passes
// without it, the SHA2-512/224 and SHA2-512/256 pre-hash cases run through the generic
// mechanism, and the one group the depth section cannot express renders as 'skip' — never pass.
//
// Runs in the smoke tier (SMOKE_SPECS in playwright.config.ts): dual mode loads
// both WASM engines, about 20 s on a Mac. Because it gates every push to main, its
// assertions track what the page really shows: when a case moves from skip to
// pass (as the SHA2-512/224 and SHA2-512/256 pre-hash cases did), update it here.
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
    const runSelected = page.getByTestId('acvp-run-selected')
    await runSelected.click()
    await expect(runSelected).toHaveAttribute('aria-busy', 'true', { timeout: 10000 })
    await expect(runSelected).toHaveAttribute('aria-busy', 'false', {
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

      // SHA2-512/224 and SHA2-512/256 pre-hash cases used to be an honest skip
      // (no hash-specific mechanism). They now run through the generic
      // CKM_HASH_ML_DSA with PH(M) supplied (single-part): the old skip row must be
      // gone, and each case must PASS with the mechanism named in its details.
      await expect(
        row(`ML-DSA-44/65/87 (${engine})`, 'HashML-DSA SigVer · SHA2-512/224, SHA2-512/256')
      ).toHaveCount(0)
      const sigVerShaT: [string, string, string][] = [
        ['ML-DSA-44', 'tg2/tc21', 'SHA2-512/256'],
        ['ML-DSA-44', 'tg2/tc23', 'SHA2-512/256'],
        ['ML-DSA-44', 'tg2/tc29', 'SHA2-512/224'],
        ['ML-DSA-65', 'tg4/tc50', 'SHA2-512/256'],
        ['ML-DSA-65', 'tg4/tc55', 'SHA2-512/256'],
        ['ML-DSA-65', 'tg4/tc58', 'SHA2-512/224'],
        ['ML-DSA-87', 'tg6/tc83', 'SHA2-512/256'],
        ['ML-DSA-87', 'tg6/tc90', 'SHA2-512/224'],
      ]
      // Each of these cases is verified by two sections (sigVer and sigVer depth), so a
      // case can show more than once: require at least one row and that EVERY row passes.
      for (const [ps, tc, hashAlg] of sigVerShaT) {
        const r = row(`${ps} (${engine})`, `NIST sigVer ${tc} · HashML-DSA/${hashAlg} ·`)
        const n = await r.count()
        expect(n, `${ps} ${tc} ${hashAlg} rows`).toBeGreaterThan(0)
        const generic =
          hashAlg === 'SHA2-512/224'
            ? /CKM_HASH_ML_DSA \(generic, hash = CKM_SHA512_224, PH\(M\) supplied\)/
            : /CKM_HASH_ML_DSA \(generic, hash = CKM_SHA512_256, PH\(M\) supplied\)/
        for (let i = 0; i < n; i++) {
          await expect(r.nth(i)).toHaveAttribute('data-status', 'pass')
          await expect(r.nth(i).locator('td').nth(4)).toHaveAttribute('title', generic)
        }
      }
      // A NIST positive and a NIST negative among them, with the expected CK_RV.
      const shaPos = row(`ML-DSA-44 (${engine})`, 'NIST sigVer tg2/tc21 ·').first()
      await expect(shaPos).toContainText('expect valid')
      await expect(shaPos.locator('td').nth(4)).toHaveAttribute(
        'title',
        /C_Verify → CKR_OK \(expected CKR_OK\)/
      )
      const shaNeg = row(`ML-DSA-44 (${engine})`, 'NIST sigVer tg2/tc29 ·').first()
      await expect(shaNeg).toContainText('expect invalid (modified signature - hint)')
      await expect(shaNeg.locator('td').nth(4)).toHaveAttribute(
        'title',
        /C_Verify → CKR_SIGNATURE_INVALID \(expected CKR_SIGNATURE_INVALID\)/
      )
      // The three SHA2-512/t sigGen cases that carry a NIST rnd run (optional test input).
      for (const [ps, tc] of [
        ['ML-DSA-44', 'tg14/tc205'],
        ['ML-DSA-65', 'tg16/tc239'],
        ['ML-DSA-87', 'tg18/tc268'],
      ]) {
        const g = row(`${ps} (${engine})`, `NIST sigGen ${tc} · pre-hash · hedged`)
        await expect(g, `${ps} ${tc}`).toHaveCount(1)
        await expect(g).toHaveAttribute('data-status', 'pass')
        await expect(g).toContainText('CKM_HASH_ML_DSA (generic')
      }

      // The one honest skip that remains in this category: the depth section cannot
      // inject NIST's rnd for the hedged 1-byte-context case (the same case DOES run
      // above, through the optional test input).
      const skip = row(
        `ML-DSA-65 (${engine})`,
        'NIST 1-byte-context case · sigGen tg16/tc239 (hedged, HashML-DSA/SHA2-512/256)'
      )
      await expect(skip).toHaveCount(1)
      await expect(skip).toHaveAttribute('data-status', 'skip')
      await expect(skip.locator('td').nth(4)).toHaveAttribute(
        'title',
        /^Skipped — the pinned ML-DSA-sigGen-FIPS204 sample has exactly one 1-byte-context case and it is hedged/
      )
    }

    // Nothing in the ML-DSA category may fail, on either engine.
    await expect(page.locator('[data-testid="acvp-result-row"][data-status="fail"]')).toHaveCount(0)
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([])
  })
})
