import { test, expect } from '@playwright/test'

test.describe('ASR ACVP Cryptographic Algorithm Verification', () => {
  test.setTimeout(180000) // WASM load + autoInit + ACVP exhaustive keys

  test.beforeEach(async ({ page }) => {
    // Suppress the WhatsNew alertdialog (fixed inset-0 overlay) that intercepts
    // pointer events and prevents clicking the ACVP tab button.
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

  test('validates ML-KEM and ML-DSA via direct ACVP execution trigger', async ({ page }) => {
    // Navigate to the playground sandbox route where ACVP testing mounts.
    // ACVP moved from its own top-level tab into a Developer sub-tab
    // (2026-08-31) — ?tab=developer&dtab=acvp selects both the top-level
    // Developer tab and its ACVP sub-tab on mount, same as ?tab=acvp used to.
    await page.goto('/playground/hsm?tab=developer&dtab=acvp')

    // Intercept console to debug WASM or autoInit failures
    page.on('console', (msg) => console.log('BROWSER:', msg.text()))

    // The URL already selects the ACVP sub-tab on mount; click it too as a
    // defensive re-assertion. Be specific: there are TWO buttons matching
    // "ACVP" — the role=tab sub-tab entry and the results-table category
    // badge text. Target the tab.
    const acvpTab = page.getByRole('tab', { name: 'ACVP' })
    await acvpTab.waitFor({ state: 'visible', timeout: 30000 })
    await acvpTab.click()

    // Make sure the component is loaded before dispatching events
    await page.waitForSelector('text="SoftHSMv3 FIPS Validation Mode (ACVP)"', { timeout: 30000 })

    // Advance HSM phase to 'session_open' via the e2e hook in HsmContext.
    // The runTests() guard at HsmAcvpTesting.tsx returns early unless the
    // session is open, so dispatching `e2e:trigger_acvp` would no-op without
    // this. Wait for the hook to register first.
    await page.waitForFunction(
      () =>
        typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
        'function',
      undefined,
      { timeout: 20000 }
    )
    const ok = await page.evaluate(async () => {
      const fn = (
        window as unknown as { __e2e_hsm_autoinit?: (engine?: string) => Promise<boolean> }
      ).__e2e_hsm_autoinit
      return fn ? await fn('rust') : false
    })
    expect(ok, 'HSM autoInit failed').toBeTruthy()

    // Action: Programmatic State Dispatch
    // We dispatch custom E2E event periodically until the results state changes
    let testsRunning = false
    for (let i = 0; i < 20; i++) {
      // dispatch event
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('e2e:trigger_acvp'))
      })

      // also try UI button just in case — "Execute ACVP Tests" renamed to
      // "Run All" when the category-picker sidebar was added (2026-08-31);
      // it still runs the full suite regardless of sidebar selection.
      const btn = page.getByRole('button', { name: /Run All/i })
      if (await btn.isEnabled()) {
        await btn.click({ force: true }).catch(() => {})
      }

      await page.waitForTimeout(3000)

      const isNotRunning = await page.locator('table').getByText('No results yet.').isVisible()
      if (!isNotRunning) {
        testsRunning = true
        break
      }
    }

    if (!testsRunning) {
      const html = await page.evaluate(() => document.body.innerHTML)
      console.log('ACVP TIMEOUT: TESTS NOT STARTED. DOM:', html.substring(0, 2000))
      throw new Error('ACVP Tests did not run! WASM must have hung or failed.')
    }
    expect(testsRunning).toBeTruthy()

    // Let the tests run (WASM boundary can take several ms/sec)
    // Both ML-KEM Decapsulate (KAT) and ML-DSA Verify (KAT) must pass.

    // Wait for the table to populate with pass/fail
    // No explicit wait needed since we already know `isNotRunning` is false which means results appeared!

    // The Execution Log should conclude.
    // 2026-07-08: measured 21.6s locally to reach this point (6 real WASM
    // liboqs calls, vector count unchanged since 2025-11-27, no code-level
    // delay) -- only ~8s of headroom under the old 30s cap, which reliably
    // tipped over on GitHub's shared CI runners. Widened to match this file's
    // other WASM checkpoints rather than re-guessing; investigate for a real
    // hang only if this is still red at 90s.
    const logSection = page.locator('div', { hasText: 'Validation Suite Completed' }).last()
    await expect(logSection).toBeVisible({ timeout: 90000 })

    // Validate that at least one ML-KEM and ML-DSA passed
    const mlkemRow = page.locator('tr', { hasText: 'ML-KEM-512' }).first()
    if ((await mlkemRow.count()) > 0) {
      await expect(mlkemRow).toContainText('pass')
    }

    const mldsaRow = page.locator('tr', { hasText: 'ML-DSA-44' }).first()
    if ((await mldsaRow.count()) > 0) {
      await expect(mldsaRow).toContainText('pass')
    }

    // Assert ZERO failures across the WHOLE results table — all ~34 test
    // categories (ML-KEM, ML-DSA, SLH-DSA, AES, HMAC, RSA-PSS, ECDSA
    // variants, EdDSA, X25519/X448, ChaCha20, KBKDF, XMSS, HSS/LMS, PreHash,
    // context binding, etc.), not just the two families spot-checked above.
    // Narrowing this to ML-KEM/ML-DSA only (the pre-2026-08-23 behavior) let
    // a regression in any of the other ~30 categories run in the browser and
    // pass the spec silently — this is the actual regression detector.
    //
    // 2026-08-23: re-verified (4 consecutive local runs against the
    // production build, engine=rust) that "XMSS(Rust) CKR_ARGUMENTS_BAD" and
    // "ECDSA P-521(Rust) CKR_BUFFER_TOO_SMALL" — the two Rust-engine WASM
    // bugs this spec used to hard-exclude — are BOTH now passing. The fix
    // most likely landed in 9c6f9aba9 (2026-08-02, "rebuild softhsmrustv3
    // engine (26 commits stale)") or 437510a92 (2026-08-14, PKCS#11 v3.2
    // conformance), both well after the exclusion comment was written
    // (74d975c8a, 2026-07-08). No exclusions remain; if a Rust-engine
    // regression reintroduces a known-red row, re-add it here BY NAME with
    // the CKR error and a tracking link, not by re-narrowing the filter
    // above to a subset of algorithms.
    const KNOWN_RED_ALGORITHMS: string[] = []

    const resultRows = page.locator('table tbody tr')
    const rowCount = await resultRows.count()
    // Sanity floor: catches the WASM engine silently running only a fraction
    // of the suite (e.g. an early throw that aborts the loop) even though
    // every row that DID run passed. 58 categories/variants ran as of
    // 2026-08-23; floor set well below that with headroom for legitimate
    // future skips (unsupported mechanism on a given build).
    expect(rowCount, 'ACVP results table looks incomplete').toBeGreaterThanOrEqual(40)

    const failingRows: string[] = []
    for (let i = 0; i < rowCount; i++) {
      const row = resultRows.nth(i)
      const rowText = (await row.innerText()).replace(/\s+/g, ' ').trim()
      if (KNOWN_RED_ALGORITHMS.some((algo) => rowText.startsWith(algo))) continue
      const failCell = row.locator('td', { hasText: /^fail$/i })
      if ((await failCell.count()) > 0) {
        failingRows.push(rowText)
      }
    }
    expect(failingRows, `Unexpected failing ACVP rows:\n${failingRows.join('\n')}`).toEqual([])
  })

  test('running a single category runs only that category, and a helper shared across two categories stays in scope', async ({
    page,
  }) => {
    // Regression guard for the 2026-08-31 category-selection sidebar: the 36
    // ACVP sections were split into 7 categories by wrapping each section's
    // existing code in `if (selectedCategories.has(id)) { ... }`. One helper,
    // extractMontgomeryPubKey, is called from BOTH the Classical Asymmetric
    // category (X25519/X448) and the KDF category (X9.63 KDF) — it had to be
    // hoisted out of any single category's guard so it stays in scope. This
    // test selects KDF ALONE (Classical Asymmetric unchecked) — if the hoist
    // regresses, X9.63 KDF throws a ReferenceError at runtime (TypeScript
    // would not catch this; the bug only manifests when the guard actually
    // executes with that specific category combination).
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto('/playground/hsm?tab=developer&dtab=acvp')
    const acvpTab = page.getByRole('tab', { name: 'ACVP' })
    await acvpTab.waitFor({ state: 'visible', timeout: 30000 })
    await acvpTab.click()
    await page.waitForSelector('text="SoftHSMv3 FIPS Validation Mode (ACVP)"', { timeout: 30000 })

    await page.waitForFunction(
      () =>
        typeof (window as unknown as { __e2e_hsm_autoinit?: unknown }).__e2e_hsm_autoinit ===
        'function',
      undefined,
      { timeout: 20000 }
    )
    const ok = await page.evaluate(async () => {
      const fn = (
        window as unknown as { __e2e_hsm_autoinit?: (engine?: string) => Promise<boolean> }
      ).__e2e_hsm_autoinit
      return fn ? await fn('rust') : false
    })
    expect(ok, 'HSM autoInit failed').toBeTruthy()

    // Select KDF only.
    await page.getByTestId('acvp-select-none').click()
    await page.getByTestId('acvp-category-checkbox-kdf').check()
    await page.getByTestId('acvp-run-selected').click()

    // Wait for the run to finish: the Run Selected button carries
    // aria-busy while loading, same attribute the original test's "Run All"
    // button uses.
    await expect(page.getByTestId('acvp-run-selected')).toHaveAttribute('aria-busy', 'false', {
      timeout: 60000,
    })

    const rows = page.getByTestId('acvp-result-row')
    const rowCount = await rows.count()
    expect(rowCount, 'KDF-only run produced no result rows').toBeGreaterThan(0)

    // Every row must be tagged 'kdf' — no other category's section executed.
    for (let i = 0; i < rowCount; i++) {
      await expect(rows.nth(i)).toHaveAttribute('data-category', 'kdf')
    }

    // No unhandled exception — this is the actual ReferenceError guard.
    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([])

    // X9.63 KDF (the section that calls the hoisted helper) actually ran and
    // its own row is present — not just "no crash", but "did its job".
    const x963Row = page.locator('[data-testid="acvp-result-row"]', { hasText: 'X9.63' })
    expect(await x963Row.count(), 'X9.63 KDF row missing from a KDF-only run').toBeGreaterThan(0)
    for (const row of await x963Row.all()) {
      await expect(row).not.toHaveAttribute('data-status', 'fail')
    }

    // The Execution Log is the log this feature actually shows a user —
    // check it's honest about what ran, not just that the table looks right.
    // No unrelated category's algorithm name should appear (proves the
    // category guard skipped that section's code entirely, not merely
    // hid its row from the table).
    const logText = await page.locator('div.font-mono.text-xs.text-success\\/80').innerText()
    expect(logText).toContain('X9.63')
    expect(logText).not.toContain('AES-GCM')
    expect(logText).not.toContain('ECDSA P-256')
    expect(logText).not.toContain('ML-KEM')
  })
})
