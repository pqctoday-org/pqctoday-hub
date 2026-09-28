import { test, expect, type Locator, type Page } from '@playwright/test'

// ML-KEM, SLH-DSA and ML-DSA depth rows (WS-D D1/D3/D2-6: sections/mlkemAcvp.ts,
// slhdsaAcvp.ts, mldsaDepth.ts) rendered in the real workbench on BOTH engines
// (dual mode). Asserts row semantics, not a row count: NIST positives and
// negatives with the NIST evidence class, product-authored rows without it, honest
// skips — and the two engine findings rendered as red rows on exactly the
// engine that has them (they are findings to report, not noise to filter).
//
// Nightly only (deliberately NOT in SMOKE_SPECS): dual mode + SLH-DSA
// deterministic signing for 12 parameter sets is far above the smoke budget.
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

  test('ML-KEM, SLH-DSA and ML-DSA depth rows carry the right semantics on both engines', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))
    await runCategories(page, ['ml_kem', 'slh_stateful', 'ml_dsa'])

    const rows = page.getByTestId('acvp-result-row')
    const row = (algorithm: string, testCase: string): Locator =>
      rows.filter({ hasText: algorithm }).filter({ hasText: testCase })
    /** One row by its stable per-case id (data-row-id) — no text ambiguity. */
    const byRowId = (p: Page, id: string): Locator =>
      p.locator(`[data-testid="acvp-result-row"][data-row-id="${id}"]`)
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

      // Invalid decapsulation key (NIST VAL, modified H): C++ rejects it; the
      // Rust engine accepts it — a recorded engine finding, rendered red.
      const badKey = row(`ML-KEM-512 (${engine})`, 'NIST VAL tg7/tc106 · modified H')
      await expect(badKey).toHaveCount(1)
      await expect(badKey).toHaveAttribute('data-status', engine === 'C++' ? 'pass' : 'fail')
      if (engine === 'Rust')
        await expect(details(badKey)).toHaveAttribute('title', /ACCEPTED a key NIST marks invalid/)

      // ── SLH-DSA ──
      // Addressed by row id, NOT by text: the evidence badge renders each
      // record's limitations, which quote the vector file's subset policy —
      // and that policy names all six upstream negative reasons, so a
      // hasText('invalid signature - too small') filter also matches this
      // parameter set's POSITIVE row (tc343). With .first() that silently
      // asserted the positive row instead (found 2026-09-25).
      // Both upstream 'too small' cases of this set are pinned, pure (tc347)
      // and pre-hash (tc355), including the byte length that reached the
      // engine: a 7856B (= full FIPS 205 length) signature here would mean the
      // case tests nothing, and must fail rather than pass.
      for (const tc of ['tg25-tc347', 'tg26-tc355']) {
        const tooSmall = byRowId(page, `slhdsa-sigver-nist-SLH-DSA-SHAKE-128s-${tc}-${engine}`)
        await expect(tooSmall).toHaveCount(1)
        await expect(tooSmall).toContainText('invalid signature - too small')
        await expect(tooSmall).toHaveAttribute('data-status', 'pass')
        await expect(details(tooSmall)).toHaveAttribute(
          'title',
          /C_Verify → CKR_SIGNATURE_LEN_RANGE \(expected CKR_SIGNATURE_LEN_RANGE\)/
        )
        await expect(details(tooSmall)).toHaveAttribute('title', /· sig 7855B ·/)
      }

      const det = row(
        `SLH-DSA-SHA2-128s (${engine})`,
        'SigGen deterministic · NIST sigGen tg19/tc161'
      )
      await expect(det).toHaveCount(1)
      await expect(det).toHaveAttribute('data-status', 'pass')

      // Valid NIST HashSLH-DSA signature: Rust accepts; C++ rejects (finding).
      // STALE as of 2026-09-25 and left as-is deliberately: the P3 combined
      // rebuild (hsm a22e6ca0, E1) fixed C++ HashSLH-DSA, so this row and the
      // red-row counts below now pin engine behaviour that no longer exists —
      // useAcvpSuite.slhdsaAcvp.nightly.test.ts already expects pass on both
      // engines. Reported for a decision rather than relaxed here.
      const pre = row(
        `SLH-DSA-SHA2-128f (${engine})`,
        'NIST sigVer tg2/tc25 · HashSLH-DSA/SHA2-256'
      )
      await expect(pre).toHaveCount(1)
      await expect(pre).toHaveAttribute('data-status', engine === 'C++' ? 'fail' : 'pass')

      const pkFlip = row(
        `SLH-DSA-SHAKE-256f (${engine})`,
        'product-authored negative · public-key bit flip'
      )
      await expect(pkFlip).toHaveAttribute('data-status', 'pass')
      await expect(evidenceBadge(pkFlip)).not.toHaveAttribute(
        'data-evidence',
        'nist-acvp-reference-sample'
      )

      const internal = row(`SLH-DSA (${engine})`, 'internal interface')
      await expect(internal).toHaveAttribute('data-status', 'skip')

      // ── ML-DSA depth (D2-6) ──
      const ctx0 = row(`ML-DSA-44 (${engine})`, 'NIST sigGen tg1/tc5 · pure · ctx 0B')
      await expect(ctx0).toHaveAttribute('data-status', 'pass')
      const ctx256 = row(`ML-DSA-44 (${engine})`, 'C_SignInit with a 256-byte context')
      await expect(ctx256).toHaveAttribute('data-status', 'pass')
    }

    // Exactly the recorded findings are red: 6 Rust ML-KEM key checks and 7
    // C++ HashSLH-DSA cases (5 sigVer positives + 2 deterministic sigGen).
    const failed = page.locator('[data-testid="acvp-result-row"][data-status="fail"]')
    await expect(failed).toHaveCount(13)
    await expect(failed.filter({ hasText: '(Rust)' })).toHaveCount(6)
    await expect(failed.filter({ hasText: 'HashSLH-DSA' })).toHaveCount(7)
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([])
  })
})
