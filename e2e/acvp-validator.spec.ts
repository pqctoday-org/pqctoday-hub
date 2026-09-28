import { test, expect } from '@playwright/test'

test.describe('ASR ACVP Cryptographic Algorithm Verification', () => {
  test.setTimeout(420000) // WASM load + autoInit + the workbench run (see the 300 s wait below)

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

  test('validates KDF and ML-KEM via the direct ACVP execution trigger', async ({ page }) => {
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
    const acvpTab = page.getByRole('tab', { name: 'Validation' })
    await acvpTab.waitFor({ state: 'visible', timeout: 30000 })
    await acvpTab.click()

    // Make sure the component is loaded before dispatching events
    await page.waitForSelector('text="Cryptographic Validation Workbench"', { timeout: 30000 })

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
    // We dispatch custom E2E event periodically until the results state changes.
    //
    // 2026-09-27: a fixed, fast subset. The whole suite no longer fits a
    // browser budget. Measured on the production build (Chromium, Rust engine,
    // M5 Max): the full run had gone 18 minutes (1,592 rows, all passing) and
    // was still inside the SLH-DSA "s" sets; every category except slh_stateful
    // took 605 s for 2,991 rows. symmetric + hashing_mac + kdf + ml_kem took
    // 90 s locally but did NOT finish in 180 s on GitHub's runner (main CI
    // 23e4f3c38: 613 rows done, still in AES-KW Wycheproof) — the runner is
    // ~4-5x slower. So the browser check runs kdf + ml_kem (KDF alone is ~3 s
    // locally) and asserts zero unexpected failures over both. symmetric,
    // hashing_mac, classical, ml_dsa and slh_stateful are covered on BOTH
    // engines by the Node run (useAcvpSuite.runResults.local, gate:local) and
    // the nightly SLH-DSA suite. The "Run All" fallback click is gone: racing
    // the trigger, it would start the full suite.
    const E2E_CATEGORIES = ['kdf', 'ml_kem']
    let testsRunning = false
    for (let i = 0; i < 20; i++) {
      // dispatch event
      await page.evaluate((categories) => {
        window.dispatchEvent(new CustomEvent('e2e:trigger_acvp', { detail: { categories } }))
      }, E2E_CATEGORIES)

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
    // 2026-09-24 (WS-D D1/D3/D2-6): the PQC depth sections added NIST
    // deterministic SLH-DSA signing for all 12 parameter sets (192s/256s take
    // 2.5-3.6 s each on the Rust engine) — the Rust-only suite measured 52.5 s
    // in Node. Widened to 180 s so shared CI runners keep real headroom.
    // 2026-09-25: this wait is no longer the thing under pressure — the
    // 62-group suite CRASHED the renderer here (see the fix in
    // sections/mctFullAcvp.ts and hsm/acvp/useAcvpSuite.ts). With that fixed,
    // the full Rust-engine run measured 76.1 s in Chromium against the
    // production build (1085 rows), down from 173.8 s before the streamed
    // table stopped re-rendering every row on every result. 180 s stays.
    const logSection = page
      .locator('div', { hasText: 'Cryptographic Validation Workbench run completed' })
      .last()
    await expect(logSection).toBeVisible({ timeout: 300000 })

    // Validate that at least one ML-KEM and ML-DSA passed
    const mlkemRow = page.getByTestId('acvp-result-row').filter({ hasText: 'ML-KEM-512' }).first()
    if ((await mlkemRow.count()) > 0) {
      await expect(mlkemRow).toContainText('pass')
    }

    const mldsaRow = page.getByTestId('acvp-result-row').filter({ hasText: 'ML-DSA-44' }).first()
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
    //
    // 2026-09-24 (WS-D D1-2) through 2026-09-25 (gap-closure P1): this list
    // used to carry 7 entries (83 Rust-engine fails total) for documented
    // engine findings — no FIPS 203 §7.2/§7.3 ML-KEM key check, AES-GCM IVs
    // other than 96 bits, ECDSA P-224 unsupported, RSA exponent > 2^33-1, a
    // wrong-length CBC IV answered with the unlisted CKR_ARGUMENTS_BAD,
    // PBKDF2 PRF limited to HMAC-SHA-256/384/512, and KMAC C_Verify ignoring
    // ulOutputLen.
    //
    // ALL SEVEN ARE FIXED as of the P3 combined rebuild (2026-09-25, hsm
    // a22e6ca0838e0b7e0d9cbc6e2a14b4d4df3fdfeb — merge of the 6 ACVP
    // gap-closure engine-fix PRs #255/#257/#258/#259/#260, #256 superseded by
    // #262): E2 (ML-KEM key checks), E12 (AES-GCM IV), E13 (ECDSA P-224), E14
    // (RSA exponent), E18 (CBC IV code), E15 (PBKDF2 PRF), E16 (KMAC output
    // length). Confirmed against the rebuilt engine at the unit level — every
    // corresponding case flipped fail→pass in
    // src/data/validation/run-results/wasm-node-useAcvpSuite.json and the
    // dedicated *.local.test.ts suites (useAcvpSuite.classicalAcvp,
    // .mlkemAcvp, .pqcCoverage) were updated and re-verified the same way.
    // Per this file's own rule ("if one drops, the engine was fixed: narrow
    // or delete its KNOWN_RED_ROWS entry"), the list is now empty. If a
    // regression reintroduces a known-red row, re-add it here BY NAME with
    // the CKR error and a tracking link, not by re-narrowing the filter
    // above to a subset of algorithms.
    //
    // 2026-09-25 (browser-crash fix): the list is NOT empty again, and that is
    // not a regression in this spec — it is the first time this assertion has
    // ever actually been evaluated in a browser. The full run used to kill the
    // renderer (OOM at >3 GB inside the 100-iteration SHA MCT) long before
    // reaching line 197, so the three Rust-engine findings below — all three
    // already measured, triaged and recorded in src/data/validation/
    // open-gaps.json by the same session that added the cases — were invisible
    // here. Each entry's count is the count that gap file states verbatim, so
    // this list is a pin, not a waiver: if the engine is fixed the count drops
    // and the "KNOWN_RED_ROWS entry is stale" assertion below fails; if a
    // NEW row goes red it is not matched here and fails as an unexpected row.
    // The engine defects themselves are open and unpatched — nothing here
    // claims otherwise, and no case was removed, skipped or narrowed.
    // 2026-09-27 (bundles from hsm 1c5ed893, re-recorded run results): the
    // KBKDF (38, then 4) and Ed-ph context (8) entries are GONE — hsm #277 and
    // #290 fixed both engine defects and their open gaps are closed. What
    // remains is exactly the recorded failure set:
    // `category`: an entry is checked only when its category ran (see
    // E2E_CATEGORIES). Counts are for the Rust engine this spec initialises.
    const KNOWN_RED_ROWS: { category: string; match: RegExp; why: string; count: number }[] = [
      {
        category: 'classical',
        // open-gaps.json `rust-rsa-private-import-requires-cka-value` (accepted
        // limitation, maintainer decision): 18 of NIST's 20 KTS-IFC OAEP keys
        // have public exponents >= 2^33, which the Rust engine refuses by design.
        match: /RSA-OAEP \(Rust\).*public exponents >= 2\^33 are refused/,
        why: 'rust RSA public-exponent limit (18 NIST KTS-IFC keys, accepted limitation)',
        count: 18,
      },
      {
        // NIST PBKDF sample tg1/tc20: iterationCount 1. Both engines refuse
        // fewer than 1000 iterations (aligned since the P3 rebuild), so the row
        // stays red on both, deliberately kept in the suite (sections/kdfMacAcvp.ts).
        // This spec runs the Rust engine only, so one row (the C++ one is the
        // Node dual-engine run's).
        category: 'kdf',
        match: /PBKDF2-HMAC-SHA2-224 \((?:C\+\+|Rust)\).*iterations < 1000/,
        why: 'PBKDF2 minimum iterations (both engines refuse < 1000; row deliberately kept red)',
        count: 1,
      },
    ]
    const knownRedSeen = KNOWN_RED_ROWS.map(() => 0)

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
      const failCell = row.locator('td', { hasText: /^fail$/i })
      const failed = (await failCell.count()) > 0
      const knownIdx = KNOWN_RED_ROWS.findIndex((k) => k.match.test(rowText))
      if (knownIdx >= 0) {
        if (failed) knownRedSeen[knownIdx] += 1 // eslint-disable-line security/detect-object-injection
        continue
      }
      if (failed) {
        failingRows.push(rowText)
      }
    }
    expect(failingRows, `Unexpected failing ACVP rows:\n${failingRows.join('\n')}`).toEqual([])
    // Every known-red finding is still present at exactly its recorded count.
    // If one drops, the engine was fixed: narrow or delete its KNOWN_RED_ROWS
    // entry and close its open gap with the bundle commit as evidence.
    const ran = (k: { category: string }) => E2E_CATEGORIES.includes(k.category)
    expect(
      Object.fromEntries(
        KNOWN_RED_ROWS.map((k, i) => [k.why, knownRedSeen[i]]).filter((_, i) =>
          ran(KNOWN_RED_ROWS[i])
        )
      ),
      'KNOWN_RED_ROWS entry is stale'
    ).toEqual(Object.fromEntries(KNOWN_RED_ROWS.filter(ran).map((k) => [k.why, k.count])))
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
    const acvpTab = page.getByRole('tab', { name: 'Validation' })
    await acvpTab.waitFor({ state: 'visible', timeout: 30000 })
    await acvpTab.click()
    await page.waitForSelector('text="Cryptographic Validation Workbench"', { timeout: 30000 })

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
    const logText = await page.getByTestId('acvp-execution-log').innerText()
    expect(logText).toContain('X9.63')
    expect(logText).not.toContain('AES-GCM')
    expect(logText).not.toContain('ECDSA P-256')
    expect(logText).not.toContain('ML-KEM')
  })
})
