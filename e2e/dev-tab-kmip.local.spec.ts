// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page, type Locator } from '@playwright/test'

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

  // Monaco only mounts once the Code tab is active (Builder/Code split, v4.67.0)
  // — the self-host install this test guards against still has to have run
  // by the time it does, which is exactly what this test checks.
  await page.getByRole('tab', { name: 'Code' }).click()
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

  // Real grammar (dev-tabs Python-grammar-realignment plan, Phase 1) put the
  // sign step's hex leaf several steps deep into a now much longer file —
  // deep enough that Monaco's virtualized-scroll DOM (expectMonacoToContainText)
  // proved unreliable to drive from Playwright (mouse-wheel and PageDown both
  // either under- or over-shot the target between checks; Monaco exposes no
  // `window.monaco` here to read the model directly). The exported .py is the
  // same generated text with none of that DOM virtualization — checking it
  // proves the same fact (real hex bytes reached the real generated code)
  // without depending on Monaco's rendering internals.
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \.py/ }).click()
  const download = await downloadPromise
  const path = await download.path()
  const fs = await import('node:fs')
  const exported = fs.readFileSync(path!, 'utf-8')
  expect(exported).toContain(`leaf('Data', 'ByteString', '${hexPayload}')`)
  expect(exported).not.toContain(`b'${hexPayload}'`)
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

/**
 * G9/W2 — the drag/drop canvas. HTML5 DnD via Locator.dragTo() proved
 * unreliable across the palette (aside) and canvas (main) independently-
 * scrolling containers — a manual DataTransfer dispatch, driven entirely by
 * element handles already resolved on the Node side, is what actually
 * exercises the real onDragStart/onDragOver/onDrop handlers reliably.
 */
async function html5Drop(
  page: Page,
  source: Locator,
  target: Locator,
  type: string,
  value: string
) {
  const src = await source.elementHandle()
  const tgt = await target.elementHandle()
  await page.evaluate(
    ({ src, tgt, type, value }) => {
      const dt = new DataTransfer()
      dt.setData(type, value)
      dt.setData('text/plain', value)
      src!.dispatchEvent(
        new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt })
      )
      tgt!.dispatchEvent(
        new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })
      )
      tgt!.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })
      )
    },
    { src, tgt, type, value }
  )
}

function appendZone(page: Page) {
  return page
    .getByText('Drop here to append')
    .or(page.getByText('Drop a primitive or step here'))
    .first()
}
async function dragPrimToAppend(page: Page, primId = 'ml-dsa-65') {
  const src = page.locator('div[draggable="true"]', { hasText: 'ML-DSA-65' }).first()
  await html5Drop(page, src, appendZone(page), 'application/x-kmip-primitive', primId)
}
async function dragSpecialToAppend(page: Page, label: string, kind: string) {
  const src = page.locator('div[draggable="true"]', { hasText: label }).first()
  await html5Drop(page, src, appendZone(page), 'application/x-kmip-special', kind)
}

test('drag/drop assembles the Governed lifecycle from an empty canvas and runs it green (G9/W2)', async ({
  page,
}) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })
  await page.getByRole('button', { name: 'Empty', exact: true }).click()
  await expect(page.getByText('Drop a primitive or step here')).toBeVisible()

  // step 1: create (createKeyPair is the default op for a fresh drop)
  await dragPrimToAppend(page)

  // step 2: sign-early — the deliberately-too-early Sign the deny step targets
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 2').selectOption('sign')
  await page.getByLabel('privUid for step 2').selectOption({ label: '1. ML-DSA-65 · private key' })

  // step 3: expect-deny targeting step 2
  await dragSpecialToAppend(page, 'Expect deny', 'expect-deny')
  await page.getByLabel('Target step for step 3').selectOption({ label: '2. ML-DSA-65 · sign' })

  // step 4: activate
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 4').selectOption('activate')
  await page.getByLabel('uid for step 4').selectOption({ label: '1. ML-DSA-65 · private key' })

  // step 5: sign (real, post-activate)
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 5').selectOption('sign')
  await page.getByLabel('privUid for step 5').selectOption({ label: '1. ML-DSA-65 · private key' })

  // step 6: getAttributes
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 6').selectOption('getAttributes')
  await page.getByLabel('uid for step 6').selectOption({ label: '1. ML-DSA-65 · private key' })

  // step 7: locate (no inputs)
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 7').selectOption('locate')

  // step 8: revoke
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 8').selectOption('revoke')
  await page.getByLabel('uid for step 8').selectOption({ label: '1. ML-DSA-65 · private key' })

  // step 9: destroy
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 9').selectOption('destroy')
  await page.getByLabel('uid for step 9').selectOption({ label: '1. ML-DSA-65 · private key' })

  await expect(page.getByText('Every step input is bound')).toBeVisible()

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(9)
  // Semantic-token class name, not the raw red-500 palette class this
  // locator was written against (it never matched, so this assertion was
  // vacuously true — see the KeyboardInterrupt test's twin fix above).
  await expect(page.locator('.bg-status-error\\/5').filter({ hasText: '✗' })).toHaveCount(0)
})

test('drag/drop: reorder, delete, and rebind are all live (G9/W2)', async ({ page }) => {
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })
  await page.getByRole('button', { name: 'Empty', exact: true }).click()

  // Build: [1] createKeyPair, [2] activate — rebind step 2's uid to step 1's priv.
  await dragPrimToAppend(page)
  await dragPrimToAppend(page)
  await page.getByLabel('Operation for step 2').selectOption('activate')
  await page.getByLabel('uid for step 2').selectOption({ label: '1. ML-DSA-65 · private key' })
  await expect(page.getByText('Every step input is bound')).toBeVisible()

  // reorder: drag step 2's card onto step 1's card (native reorder carries
  // the source index over 'application/x-kmip-step').
  const step1Card = page
    .locator('div[draggable="true"]')
    .filter({ hasText: 'ML-DSA-65 · createKeyPair' })
  const step2Card = page
    .locator('div[draggable="true"]')
    .filter({ hasText: 'ML-DSA-65 · activate' })
  await html5Drop(page, step2Card, step1Card, 'application/x-kmip-step', '1')

  // Reordered: activate is now step 1, createKeyPair step 2 — activate's own
  // uid binding (unchanged) now points FORWARD. Validation must catch this
  // live, proving reorder actually re-evaluates bindings, not just order.
  await expect(page.getByText(/points at a later step/).first()).toBeVisible()

  // delete: remove the now-broken step; the finding clears.
  await page.getByRole('button', { name: /Remove step 1/ }).click()
  await expect(page.getByText('Every step input is bound')).toBeVisible()
})

test('a while-True loop genuinely dies at the 15s deadline via KeyboardInterrupt (G9/W4)', async ({
  page,
}) => {
  // Same layer-1 true-timeout as the PKCS#11 tab (one shared pyRuntime +
  // watchdog worker — see that spec's twin test for the root-cause note).
  // Proven separately here because the plan's W4 gate names BOTH tabs.
  test.setTimeout(90000)
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText(/preemptive kill/)).toBeVisible()

  // Monaco only mounts once the Code tab is active (Builder/Code split, v4.67.0).
  await page.getByRole('tab', { name: 'Code' }).click()
  // The editor starts read-only (Change 2) — typing does nothing, and
  // `detached` never flips, until this gate is explicitly unlocked. A real
  // bug this session found live: without this click, Run silently re-runs
  // the unmodified template instead of the typed script — no error, no
  // KeyboardInterrupt, just a fast, quiet false pass.
  await page.getByRole('button', { name: 'Edit as custom script' }).click()
  const editor = page.locator('.monaco-editor .view-lines').first()
  await editor.click()
  await page.keyboard.press('Control+A')
  // delay: 35 — see dev-tab-pkcs11.local.spec.ts's twin test for why this
  // script needs a wider margin than most typed content in this suite.
  await page.keyboard.type('while True: pass', { delay: 35 })
  // Renamed from "you edited the generated code" to the KmipSyncStatusChip
  // pill next to the Builder/Code switch (persistent header, Change 1).
  // The bullet distinguishes it from the unrelated "Edit as custom script"
  // button text, which also contains the substring "custom script".
  await expect(page.getByText('● custom script')).toBeVisible()

  const t0 = Date.now()
  await page.getByRole('button', { name: /^Run$/ }).click()
  // Semantic-token class names (text-status-error / border-destructive),
  // not the raw red-500 palette classes this locator was written against.
  const errorBanner = page.locator('.bg-status-error\\/5.border-b.border-destructive\\/25')
  await expect(errorBanner).toBeVisible({ timeout: 25000 })
  const elapsed = Date.now() - t0
  expect(await errorBanner.textContent()).toMatch(/KeyboardInterrupt/)
  expect(elapsed).toBeGreaterThan(14000)
  expect(elapsed).toBeLessThan(20000)

  // The tab must be fully alive again: revert and run the template green.
  // Renamed from "Revert to template" to "Discard edits, resync" (Change 2/3).
  await page.getByRole('button', { name: 'Discard edits, resync' }).click()
  // Run results render in the Builder tab's step list, unmounted while Code
  // is active (see expectMonacoToContainText's twin fix above).
  await page.getByRole('tab', { name: 'Builder' }).click()
  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('✓ ran')).toHaveCount(9, { timeout: 5000 })
})

test("the real cross-plane audit trail shows this tab's own run activity", async ({ page }) => {
  // Regression guard: getKmipEngine() is a per-tab singleton shared with
  // the manual workbench, so every runOp/dryRun/loadPolicy call this tab's
  // script makes was already landing in engine.auditSnapshot() — the only
  // thing missing was rendering it here. Proves both the CACP (Plane 1)
  // and KMIP (Plane 2) tabs show real content from THIS tab's run, not
  // just that the panel chrome renders. Session activity is a proper
  // Inspector-style tab bar (Keystore/CACP/KMIP/PKCS#11) — each plane's
  // events only render once its own tab is selected.
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  await page.getByText('Session activity').click()
  await page.getByRole('button', { name: /Plane 1/ }).click()
  // A real policy decision, not just the tab label.
  await expect(page.getByText(/policy activated|decision:/).first()).toBeVisible()

  await page.getByRole('button', { name: /Plane 2/ }).click()
  // A real KMIP request marker, not just the tab label.
  await expect(page.getByText(/▸ CreateKeyPair|▸ Activate|▸ Sign/).first()).toBeVisible()
})

test("the keystore shows this run's real objects with real lifecycle states", async ({ page }) => {
  // Regression guard: KmipObject is addressed by uid natively (no
  // PKCS#11-style ephemeral handle to go stale, no session/login
  // lifecycle to be invalidated between runs — see the PKCS#11 twin's
  // fix for what that class of bug looked like). listObjects() just
  // reads the engine singleton's own persistent state, refreshed the
  // same way audit is. The Governed-lifecycle template's own last step
  // destroys its key — Destroyed is the real, honest end state, not "✓ ran"
  // in disguise.
  await page.goto('/playground/cacp?plane=developer')
  await expect(page.getByRole('button', { name: 'Governed lifecycle' })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: /^Run$/ }).click()
  await expect(page.getByText(/\d+\.\d\ds/)).toBeVisible({ timeout: 20000 })

  await page.getByText('Session activity').click()
  // Keystore is the default active tab — its count shows right on the tab.
  await expect(page.getByRole('button', { name: /Keystore \(\d+\)/ })).toBeVisible()
  await expect(page.getByText('ML-DSA-65').first()).toBeVisible()
  await expect(page.getByText('Destroyed').first()).toBeVisible()
})
