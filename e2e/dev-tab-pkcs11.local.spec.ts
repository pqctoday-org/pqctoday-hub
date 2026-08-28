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
  await expect(page.locator('.bg-red-500\\/5').filter({ hasText: '✗' })).toHaveCount(0)
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

  const editor = page.locator('.monaco-editor .view-lines').first()
  await editor.click()
  await page.keyboard.press('End')
  await page.keyboard.type('\n# e2e-edit-marker')

  const detachBanner = page.getByText('you edited the generated code')
  await expect(detachBanner).toBeVisible()
  await page.getByRole('button', { name: 'Revert to builder' }).click()
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

test('Monaco mounts with a real web worker, no console noise or page errors (G8)', async ({
  page,
}) => {
  const consoleMessages: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => consoleMessages.push(msg.text()))
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto('/playground/hsm?tab=developer')
  await expect(page.getByText(/DevSequences · slot \d+/)).toBeVisible({ timeout: 30000 })
  const editor = page.locator('.monaco-editor .view-lines').first()
  await expect(editor).toBeVisible({ timeout: 10000 })
  // Give the worker a beat to (fail to) spin up before asserting silence.
  await page.waitForTimeout(1000)

  expect(consoleMessages.some((m) => /Could not create web worker/i.test(m))).toBe(false)
  expect(pageErrors).toEqual([])
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
  await expect(page.locator('.bg-red-500\\/5').filter({ hasText: '✗' })).toHaveCount(0)
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
  await expect(page.locator('.bg-red-500\\/5').filter({ hasText: '✗' })).toHaveCount(0)
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
  await expect(page.locator('.bg-red-500\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})
