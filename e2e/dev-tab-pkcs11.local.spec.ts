// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * PKCS#11 Developer tab — /playground/hsm?tab=developer
 * (dev-tabs-pkcs11-kmip plan G6, WS-J).
 *
 * Local-only per the 2026-07-01 directive (new suites start here; promote
 * to the full/smoke tier only once proven reliably green). Covers the core
 * flows the plan's WS-J section names: load, template switch, a real
 * green run, save→reload→load→run, detach/revert, and export.
 *
 * Every "run" assertion here is genuinely live — the same Pyodide +
 * softhsmv3-wasm + p11 shim seam proven in P1/P2/R1, not mocked.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

test('loads with the default template and a labeled Developer token slot', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')

  await expect(page.getByRole('button', { name: 'Encrypt + sign (PQ)' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
})

test('runs the default template and shows a real per-step pass', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  const okBadges = page.getByText('✓ ran')
  await expect(okBadges.first()).toBeVisible()
  expect(await okBadges.count()).toBeGreaterThan(0)
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('switching templates changes the visible step count', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
})

test('save → reload the page → load the saved pipeline → run green', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  const uniqueName = `e2e-save-${Date.now()}`
  await page.getByLabel('Pipeline name').fill(uniqueName)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(`Saved "${uniqueName}"`)).toBeVisible()

  await page.reload()
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: uniqueName, exact: true }).click()
  await expect(page.getByLabel('Pipeline name')).toHaveValue(uniqueName)

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
})

test('editing the generated code detaches the builder; Revert restores it', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  // Monaco only mounts once the Code tab is active, and the editor starts
  // read-only — typing does nothing, and the sync chip never flips to
  // "custom script", until this gate is explicitly unlocked (Builder/Code
  // split, v4.67.0; a real bug this session found live via the KMIP twin
  // of this test: without this click, Run would silently re-run the
  // unmodified template instead of the typed script, with no error).
  await page.getByRole('tab', { name: 'Code' }).click()
  await page.getByRole('button', { name: 'Edit as custom script' }).click()
  const editor = page.locator('.monaco-editor .view-lines').first()
  await editor.click()
  await page.keyboard.press('End')
  await page.keyboard.type('\n# e2e-edit-marker')

  // Renamed from "you edited the generated code" to the sync-status chip
  // ("● custom script") next to the Builder/Code switch. The bullet
  // distinguishes it from the unrelated "Edit as custom script" button
  // text, which also contains the substring "custom script".
  const detachBanner = page.getByText('● custom script')
  await expect(detachBanner).toBeVisible()
  // Renamed from "Revert to builder" to "Discard edits, resync".
  await page.getByRole('button', { name: 'Discard edits, resync' }).click()
  await expect(detachBanner).not.toBeVisible()
})

test('Export .py downloads a file carrying the provenance header', async ({ page }) => {
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \.py/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.py$/)
  const path = await download.path()
  const fs = await import('node:fs')
  const content = fs.readFileSync(path!, 'utf-8')
  expect(content).toContain('PKCS#11 v3.2 Developer tab')
  expect(content).toContain('import p11')
})

test('the guided lesson drives the real Developer tab end to end, including a live run', async ({
  page,
}) => {
  await page.goto('/playground/hsm')
  await page.getByRole('button', { name: /Lessons/i }).click()
  await page.getByRole('button', { name: /Build a PKCS#11 v3\.2 sequence/ }).click()

  // Step 1 (tourStep 0): no act — spotlights the real palette.
  await expect(page.getByText('The palette')).toBeVisible({ timeout: 30000 })

  // Step 2: act() clicks the real "Encrypt + sign (PQ)" template button —
  // lands on the Developer tab with it applied and a labeled token slot live.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Or start from a template')).toBeVisible()
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  // Step 3: no act — spotlights the Sign step's bound input.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText("Every step's inputs are bound")).toBeVisible()

  // Step 4: act() fires the real Run click — wait for the genuine
  // completion signal, not the tour's own step-advance timing.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Run it for real')).toBeVisible()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  // Step 5: no act — spotlights the real per-step result.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Read the result')).toBeVisible()

  // Step 6 (last): spotlights the export panel.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Take it to the sandbox')).toBeVisible()

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('Take it to the sandbox')).not.toBeVisible()
})

test('the guided lesson still works when started from the ACVP sub-tab, not just the default Standard one', async ({
  page,
}) => {
  // Regression guard for the 2026-08-31 merge's devSubTab reset: the lesson
  // callback does `handleTabChange('developer')` then `setDevSubTab('standard')`.
  // The test above always starts from a fresh page (devSubTab already
  // defaults to 'standard'), so it can't catch a regression here — the fix
  // only matters when the user is actually on ACVP/Conformance when they
  // open Lessons, since TabsContent unmounts the Standard workbench (and its
  // data-tour="pkcs-dev-*" targets) while a different sub-tab is active.
  await page.goto('/playground/hsm?tab=developer&dtab=acvp')
  await expect(page.getByRole('tab', { name: 'ACVP' })).toHaveAttribute('aria-selected', 'true', {
    timeout: 30000,
  })

  await page.getByRole('button', { name: /Lessons/i }).click()
  await page.getByRole('button', { name: /Build a PKCS#11 v3\.2 sequence/ }).click()

  // If the reset didn't happen, the palette selector would never resolve
  // (Standard unmounted) and this would time out instead of finding it.
  await expect(page.getByText('The palette')).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('tab', { name: 'Standard' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
})

test('Curious/Executive personas never see the ACVP/Conformance sub-tabs, even via a stale deep link', async ({
  page,
}) => {
  // Ports the pre-merge top-level-tab gating (ACVP/Conformance used to be
  // hidden entirely for curious/executive) down to the sub-tab level. Also
  // covers the legacy-URL path: a bookmarked pre-2026-08-31 `?tab=acvp` link
  // now resolves through `dtab=acvp`, so the persona guard has to catch it
  // there too, not just on a hand-written `?dtab=acvp`.
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona: 'curious',
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          experienceLevel: 'curious',
          viewAccess: 'preview',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  })

  // Legacy deep link — pre-merge bookmark straight to the old top-level tab.
  await page.goto('/playground/hsm?tab=acvp')
  await expect(page.getByRole('tab', { name: 'Build' })).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('tab', { name: 'ACVP' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Conformance' })).toHaveCount(0)

  // Land on Developer directly with the new sub-tab param — must fall back
  // to Standard rather than honoring the gated sub-tab.
  await page.goto('/playground/hsm?tab=developer&dtab=acvp')
  await expect(page.getByRole('button', { name: 'Encrypt + sign (PQ)' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByRole('tab', { name: 'ACVP' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Conformance' })).toHaveCount(0)
})

test('Monaco mounts with a real web worker, no console noise or page errors (G8)', async ({
  page,
}) => {
  const consoleMessages: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => consoleMessages.push(msg.text()))
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  // Monaco only mounts once the Code tab is active (Builder/Code split, v4.67.0).
  await page.getByRole('tab', { name: 'Code' }).click()
  const editor = page.locator('.monaco-editor .view-lines').first()
  await expect(editor).toBeVisible({ timeout: 10000 })
  // Give the worker a beat to (fail to) spin up before asserting silence.
  await page.waitForTimeout(1000)

  expect(consoleMessages.some((m) => /Could not create web worker/i.test(m))).toBe(false)
  expect(pageErrors).toEqual([])
})

test('Run works identically while the Code sub-view is active, not just Builder', async ({
  page,
}) => {
  // The Run button lives in the shared header outside either TabsContent
  // panel, so it should work regardless of which sub-view is showing — but
  // that had never actually been exercised: every other "runs green" test
  // in this file clicks Run while Builder (the default view) is active.
  // Real risk if this regresses: Run silently doing nothing, or re-running
  // stale state, while the visible Code tab shows no indication of failure.
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('tab', { name: 'Code' }).click()
  const editor = page.locator('.monaco-editor .view-lines').first()
  await expect(editor).toBeVisible({ timeout: 10000 })

  // The "ran in Xs" / "✓ ran" indicators live inside the Builder canvas
  // (the "Output bundle" box and per-step cards), which TabsContent
  // unmounts while Code is active — asserting on them here would fail even
  // on a genuinely successful run. The Run button itself lives in the
  // shared header outside either panel, so its own busy state is the one
  // signal visible from Code view: wait for it to leave "Running…".
  const runButton = page.getByRole('button', { name: /^Run$|^Running…$/ })
  await runButton.click()
  await expect(runButton).toHaveText('Run', { timeout: 20000 })

  // Switch back to Builder and confirm the SAME run's per-step results are
  // visible there too — one shared run state behind both views, not two
  // independent ones that could silently disagree.
  await page.getByRole('tab', { name: 'Builder' }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 5000 })
  const okBadges = page.getByText('✓ ran')
  await expect(okBadges.first()).toBeVisible()
  expect(await okBadges.count()).toBeGreaterThan(0)
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('runs green on the C++ engine (?engine=cpp) — real bug found+fixed in G9/W1', async ({
  page,
}) => {
  // Regression guard for a real bug: devSlot.ts used to treat
  // C_GetSlotList's `tokenPresent` parameter as "token initialized", which
  // the C++ engine reports true for EVERY slot the instant it exists (even
  // one that has never been through C_InitToken) — so the Developer tab's
  // own dedicated token slot could never be provisioned on this engine,
  // confirmed live in both dev and a real production build. Fixed by
  // checking CK_TOKEN_INFO's actual CKF_TOKEN_INITIALIZED flag instead.
  await page.goto('/playground/hsm?engine=cpp&tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/softhsmv3 · C\+\+/)).toBeVisible()

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran').first()).toBeVisible()
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('runs green on the Rust engine (?engine=rust) — the existing default lane', async ({
  page,
}) => {
  await page.goto('/playground/hsm?engine=rust&tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/softhsmv3 · Rust/)).toBeVisible()

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran').first()).toBeVisible()
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('HSS/LMS-H10 generates, signs, and verifies live (G9/W3a)', async ({ page }) => {
  // Real gap found+fixed live: p11/__init__.py hardcoded only
  // CKP_LMS_SHA256_M32_H5 as a module constant, so this palette entry's
  // generated code (p11.CKP_LMS_SHA256_M32_H10) raised AttributeError at
  // run time before the fix landed.
  //
  // H15/H20/H25 were tried and deliberately NOT shipped: a raw shim call
  // to generate_hss completes fast at those heights in isolation, but the
  // real generated-script path hangs indefinitely, reproduced on both
  // engines — the plan's own rule is that an untimed/unverified parameter
  // set stays out of the palette rather than shipping broken.
  await page.addInitScript(() => {
    const id = 'hss-lms-h10'
    const store = {
      [id]: {
        steps: [
          {
            id: 'g1',
            primId: id,
            op: 'generate',
            params: { keyLabel: { bind: 'literal', value: id } },
            status: 'idle',
            output: null,
          },
          {
            id: 's1',
            primId: id,
            op: 'sign',
            params: {
              privKey: { bind: 'key', step: 'g1', part: 'priv' },
              input: { bind: 'ref', step: '__input__' },
            },
            status: 'idle',
            output: null,
          },
          {
            id: 'v1',
            primId: id,
            op: 'verify',
            params: {
              pubKey: { bind: 'key', step: 'g1', part: 'pub' },
              input: { bind: 'ref', step: '__input__' },
              signature: { bind: 'ref', step: 's1' },
            },
            status: 'idle',
            output: null,
          },
        ],
        input: 'e2e H10 payload',
      },
    }
    localStorage.setItem('pqctoday-hub-pkcs11-pipelines-v1', JSON.stringify(store))
  })

  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: 'hss-lms-h10', exact: true }).click()

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(3)
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('a while-True loop genuinely dies at the 15s deadline via KeyboardInterrupt (G9/W4)', async ({
  page,
}) => {
  // Regression guard for the W4 true-timeout, root cause and all: the
  // watchdog worker MUST be pre-warmed (created + handshaken while the event
  // loop is free) — a worker created immediately before a blocking run never
  // starts, because worker startup is serviced by the parent's event loop
  // (proven identically on Chromium and WebKit during W4). Layer 2's
  // Promise.race can never catch this case (its setTimeout needs the event
  // loop too), so the KeyboardInterrupt below is proof of layer 1 alone.
  test.setTimeout(90000)
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  // Local dev/preview servers set COOP/COEP directly (vite.config.ts), so
  // the summary rail must report the preemptive lane, not the fallback.
  await expect(page.getByText(/preemptive kill/)).toBeVisible()

  // Monaco only mounts once the Code tab is active, and the editor starts
  // read-only until this gate is unlocked — see the twin fix on "editing
  // the generated code detaches..." above.
  await page.getByRole('tab', { name: 'Code' }).click()
  await page.getByRole('button', { name: 'Edit as custom script' }).click()
  const editor = page.locator('.monaco-editor .view-lines').first()
  await editor.click()
  await page.keyboard.press('Control+A')
  // delay: 35, not 15 — this exact script can't tolerate a single dropped
  // keystroke (found live: under load, 15ms once typed "while Tre: pass",
  // a NameError with nothing to do with the interrupt this test proves).
  await page.keyboard.type('while True: pass', { delay: 35 })
  // Renamed from "you edited the generated code" to the sync-status chip.
  await expect(page.getByText('● custom script')).toBeVisible()

  const t0 = Date.now()
  await page.getByRole('button', { name: /^Run$/ }).click()
  const errorBanner = page.locator('.bg-status-error\\/5.border-b.border-destructive\\/25')
  await expect(errorBanner).toBeVisible({ timeout: 25000 })
  const elapsed = Date.now() - t0
  expect(await errorBanner.textContent()).toMatch(/KeyboardInterrupt/)
  expect(elapsed).toBeGreaterThan(14000)
  expect(elapsed).toBeLessThan(20000)

  // The tab must be fully alive again: revert and run the default template
  // green. Renamed from "Revert to builder" to "Discard edits, resync".
  await page.getByRole('button', { name: 'Discard edits, resync' }).click()
  // Run results render in the Builder tab's step list, unmounted while
  // Code is active.
  await page.getByRole('tab', { name: 'Builder' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran').first()).toBeVisible()
})

test("the real PKCS#11 call log and key table show this tab's own run activity", async ({
  page,
}) => {
  // Regression guard: HsmContext's logging proxy already captures every
  // C_* call this tab's script makes, and the devSlot scan already
  // registers whatever it creates — the only thing this tab was missing
  // was rendering either. Proves both are actually reachable from here,
  // not just present in state nothing displays.
  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/ran in \d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  // 2026-09-02 redesign (design_handoff_kmip_pkcs11_playground D3c): the
  // Build tab no longer embeds its own log/key copies — ONE shared call log
  // and key inventory live on the Inspect tab, and the "N calls · K keys —
  // Inspect" chip on Build links straight there. Same regression guard,
  // through the real path a visitor takes.
  await page.locator('[data-tour="pkcs-inspect-chip"]').click()
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.getByText('PKCS#11 Call Log')).toBeVisible()
  // Origin filter — only the calls the Build suite made.
  await page.getByRole('button', { name: 'Build', exact: true }).click()
  // A real function name from the default template's own generate/encrypt
  // steps — not just the panel chrome.
  await expect(page.getByText(/C_GenerateKey|C_EncryptInit|C_SignInit/).first()).toBeVisible()

  // The key(s) the run just created, via the devSlot discovery scan.
  await page.getByRole('tab', { name: 'Keys', exact: true }).click()
  await expect(page.getByText(/AES-256-GCM key|ML-DSA-65/).first()).toBeVisible()
})
