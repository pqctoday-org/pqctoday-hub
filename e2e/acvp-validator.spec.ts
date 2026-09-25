import { test, expect } from '@playwright/test'

test.describe('ASR ACVP Cryptographic Algorithm Verification', () => {
  test.setTimeout(360000) // WASM load + autoInit + the full workbench run (see the 180 s wait below)

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
    // 2026-09-24 (WS-D D1/D3/D2-6): the PQC depth sections added NIST
    // deterministic SLH-DSA signing for all 12 parameter sets (192s/256s take
    // 2.5-3.6 s each on the Rust engine) — the Rust-only suite measured 52.5 s
    // in Node. Widened to 180 s so shared CI runners keep real headroom.
    const logSection = page
      .locator('div', { hasText: 'Cryptographic Validation Workbench run completed' })
      .last()
    await expect(logSection).toBeVisible({ timeout: 180000 })

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
    // 2026-09-24 (WS-D D1-2): the Rust engine performs no FIPS 203 §7.2
    // (encapsulation-key modulus) or §7.3 (decapsulation-key hash) input
    // check — it accepts all six NIST ML-KEM VAL keys marked invalid
    // (C_CreateObject and the KEM operation both return CKR_OK). Engine
    // finding, reported for pqctoday-hsm; not a harness defect. Matched by
    // exact row identity, and asserted to STILL be red below so the entry is
    // removed when the engine is fixed.
    //
    // 2026-09-25 (gap-closure P1): WS-E (merged in P0) added NIST ACVP-Server
    // samples that the Rust engine fails. Each is a documented engine finding
    // with a curated open gap in src/data/validation/open-gaps.json, recorded
    // identically (83 Rust fails = the sum of the counts below) in
    // run-results/wasm-node-useAcvpSuite.json on the same wasm bytes
    // (softhsmrustv3_bg.wasm a4582ff0, hsm ac8b40fd0). Each entry matches the
    // row identity AND its observed failure mode, and must stay red exactly
    // `count` times — a change in either count or failure mode fails the spec.
    const KNOWN_RED_ROWS: { match: RegExp; why: string; count: number }[] = [
      {
        match:
          /ML-KEM-(512|768|1024) \(Rust\) (Decapsulation-key check \(FIPS 203 §7\.3\)|Encapsulation-key check \(FIPS 203 §7\.2\)) · NIST VAL tg\d+\/tc\d+ · (modified H|noisy linear system values too large) · expect rejected/,
        why: 'Rust engine: no FIPS 203 §7.2/§7.3 key check (open gap rust-mlkem-no-key-input-checks)',
        count: 6,
      },
      {
        match:
          /^Symmetric \/ AEAD AES-128-GCM \(Rust\) (Encrypt|Decrypt) · NIST AES-GCM tg(2|4)\/tc\d+ · IV 120b · .*CKR_MECHANISM_PARAM_INVALID/,
        why: 'Rust engine: AES-GCM IVs other than 96 bits refused (open gap rust-gcm-iv-96-only)',
        count: 30,
      },
      {
        match:
          /^Classical Asymmetric ECDSA P-224 \(Rust\) SigVer · NIST ECDSA sigVer tg\d+\/tc\d+ · P-224 · .*C_Verify → CKR_SIGNATURE_LEN_RANGE/,
        why: 'Rust engine: cannot verify P-224 ECDSA (open gap rust-ecdsa-p224-unsupported)',
        count: 28,
      },
      {
        match:
          /^Classical Asymmetric RSA-(4096 PKCS#1 v1\.5|2048 PSS) \(Rust\) SigVer · NIST RSA sigVer tg(13|25)\/tc\d+ · .*C_Verify → CKR_KEY_TYPE_INCONSISTENT/,
        why: 'Rust engine: public exponent > 2^33 - 1 (open gap rust-rsa-public-exponent-limit)',
        count: 12,
      },
      {
        match:
          /^Symmetric \/ AEAD AES-128-CBC \(Rust\) Invalid IV · product-authored probe · C_EncryptInit\(CKM_AES_CBC\) with a 15-byte IV .*observed CKR_ARGUMENTS_BAD/,
        why: 'Rust engine: wrong-length CBC IV answered with CKR_ARGUMENTS_BAD (open gap rust-cbc-iv-length-arguments-bad)',
        count: 1,
      },
      {
        match:
          /^KDF PBKDF2-HMAC-SHA2-224 \(Rust\) Derive · NIST PBKDF tg1\/tc\d+ · .*C_DeriveKey → CKR_ARGUMENTS_BAD/,
        why: 'Rust engine: PBKDF2 PRF limited to HMAC-SHA-256/384/512 (open gap rust-pbkdf2-prf-limited)',
        count: 5,
      },
      {
        match:
          /^Hashing & MAC KMAC-128 \(Rust\) MAC verify · NIST KMAC-128 MVT tg8\/tc799 · .*C_Verify → CKR_SIGNATURE_LEN_RANGE/,
        why: 'KMAC C_Verify ignores ulOutputLen (open gap kmac-verify-ignores-output-length)',
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
    expect(
      Object.fromEntries(KNOWN_RED_ROWS.map((k, i) => [k.why, knownRedSeen[i]])), // eslint-disable-line security/detect-object-injection
      'KNOWN_RED_ROWS entry is stale'
    ).toEqual(Object.fromEntries(KNOWN_RED_ROWS.map((k) => [k.why, k.count])))
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
