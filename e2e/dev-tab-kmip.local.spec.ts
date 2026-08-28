// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * KMIP/CACP Developer tab — /playground/cacp?plane=developer
 * (dev-tabs-pkcs11-kmip plan G6, WS-J).
 *
 * Local-only per the 2026-07-01 directive. Sibling to
 * dev-tab-pkcs11.local.spec.ts — same core flows, KMIP-lane selectors.
 * The "Governed lifecycle" run is the highest-value assertion here: it
 * exercises the exact deniable-step codegen path a real bug was found and
 * fixed in during P3b (see kmipPipelineCodegen.test.ts for the unit-level
 * regression coverage of that same fix).
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

test('deep-links straight to the Developer plane and loads the default template', async ({
  page,
}) => {
  await page.goto('/playground/cacp?plane=developer')

  await expect(page.getByRole('tab', { name: /Developer/i })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 30000 }
  )
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible()
})

test('runs the Governed-lifecycle template and every step passes, including the deniable one', async ({
  page,
}) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  const okBadges = page.getByText('✓ ran')
  await expect(okBadges).toHaveCount(9, { timeout: 5000 })
  // Scoped to the step list, not the whole page: the generated Python shown
  // in the Monaco panel on the right also contains this exact string, in a
  // `# ── deny-early · Expect deny: sign-early ──` comment (found live once
  // G8's fix made Monaco actually render its content — see the dedicated
  // G8 regression test below).
  await expect(
    page.locator('[data-tour="kmip-dev-steps"]').getByText('Expect deny: sign-early')
  ).toBeVisible()
})

test('the ML-KEM round trip template runs and completes', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'ML-KEM round trip' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(5, { timeout: 5000 })
})

test('the Policy dry-run compare template shows two different real policy decisions', async ({
  page,
}) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'Policy dry-run compare' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(4, { timeout: 5000 })
})

test('save → reload the page → load the saved pipeline → run green', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  const uniqueName = `e2e-kmip-save-${Date.now()}`
  await page.getByLabel('Pipeline name').fill(uniqueName)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText(`Saved "${uniqueName}"`)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('tab', { name: /Developer/i })).toBeVisible({ timeout: 30000 })
  await page.getByRole('tab', { name: /Developer/i }).click()
  await page.getByRole('button', { name: uniqueName, exact: true }).click()
  await expect(page.getByLabel('Pipeline name')).toHaveValue(uniqueName)

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
})

test('Export .py downloads a file carrying the provenance header and pqctoday_kmip import', async ({
  page,
}) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \.py/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/\.py$/)
  const path = await download.path()
  const fs = await import('node:fs')
  const content = fs.readFileSync(path!, 'utf-8')
  expect(content).toContain('KMIP 3.0 + CACP Developer tab')
  expect(content).toContain('from pqctoday_kmip import KmipClient')
})

test('the guided lesson drives the real Developer tab end to end, including a live run and the expect-deny card', async ({
  page,
}) => {
  await page.goto('/playground/cacp')
  await page.getByRole('button', { name: /Lessons/i }).click()
  await page.getByRole('button', { name: /Build a governed KMIP sequence/ }).click()

  // Step 1 (tourStep 0): act() clicked the real "Governed lifecycle"
  // template button — lands on the Developer plane with it applied.
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText('Start from a template')).toBeVisible()

  // Step 2: no act, just narration over the real step list.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Four kinds of step')).toBeVisible()

  // Step 3: act() fires the real Run click — wait for the genuine
  // completion signal, not the tour's own step-advance timing.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('Run it for real')).toBeVisible()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  // Step 4 (last): spotlights the expect-deny card — the CACP teaching moment.
  await page.getByRole('button', { name: /^Next/ }).click()
  await expect(page.getByText('The refusal IS the lesson')).toBeVisible()
  // Scoped to the step list — the generated Python in the Monaco panel also
  // contains this exact string in a comment (see the note on the identical
  // scoping above, and the dedicated G8 regression test below).
  await expect(
    page.locator('[data-tour="kmip-dev-steps"]').getByText('Expect deny: sign-early')
  ).toBeVisible()

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('The refusal IS the lesson')).not.toBeVisible()
})

test('Monaco genuinely loads on a fresh session — this tab alone, no prior PKCS#11 tab visit (G8)', async ({
  page,
}) => {
  // Regression guard for a real bug found while verifying G8: Monaco's
  // self-host install (monacoSelfHost.ts) used to be wired ONLY from
  // PkcsPipelineBuilder.tsx's module top level, so a session that opened
  // this tab WITHOUT ever loading the PKCS#11 Developer tab first hit
  // Monaco's default CDN loader — CSP-blocked in this app — and the code
  // panel silently rendered zero lines. Both builders now call
  // installMonacoSelfHost() (idempotent) independently.
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  const viewLines = page.locator('.monaco-editor .view-lines').first()
  await expect(viewLines).toBeVisible({ timeout: 30000 })
  await expect(viewLines).toContainText('pqctoday_kmip')
  expect(pageErrors).toEqual([])
})

test('hex mode signs a genuinely binary (non-UTF-8) payload live — G9/W3b', async ({ page }) => {
  // Real capability found+fixed live: the shim's own doc comment claimed
  // the engine had no hex Data field for Sign/Encrypt and could only take
  // UTF-8 text — checked directly against the engine's Rust source
  // (wasm/src/lib.rs, spec_bytes(spec, "data", "text")) and that was
  // already wrong; `data` (hex) is preferred over `text` and always was.
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'hex', exact: true }).click()
  // ff/fe/80 are not valid UTF-8 lead bytes in this arrangement — genuinely
  // undecodable, not merely "looks like hex".
  const hexPayload = 'ff00fe0180deadbeef'
  await page.getByLabel('Message to sign').fill(hexPayload)

  const genCode = page.locator('.monaco-editor .view-lines').first()
  await expect(genCode).toContainText(`bytes.fromhex('${hexPayload}')`)

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.locator('[data-tour="kmip-dev-steps"]').getByText('✓ ran')).toHaveCount(9, {
    timeout: 5000,
  })
})

test('hex mode with invalid hex blocks Run with a clear error', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'hex', exact: true }).click()
  await page.getByLabel('Message to sign').fill('not-valid-hex!!')
  await expect(page.getByText(/Hex mode needs an even number of hex digits/).first()).toBeVisible()

  await page.getByRole('button', { name: /^Run$/ }).click()
  // The Run click surfaces the SAME message a second time, as the run-error
  // banner — both are legitimate (a proactive field hint, and confirmation
  // the click was actually blocked), so this asserts count 2, not .first().
  await expect(page.getByText(/Hex mode needs an even number of hex digits/)).toHaveCount(2)
  await expect(page.getByText(/\d+\.\d\ds/)).not.toBeVisible()
})
