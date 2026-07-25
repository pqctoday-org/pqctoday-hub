// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * TPM Playground — shared-engine concurrency regression (2026-07-24).
 *
 * Root cause: every panel (Learn tab, Command Builder, Compliance Suite,
 * Attestation, EK explorers) drives ONE non-reentrant WASM TPM instance with
 * no reentrancy guard. Two logically-independent multi-command operations
 * whose individual commands interleave in the `await` gaps between them can
 * corrupt shared transient-object state — reproduced live by firing a
 * same-tick double-click on lesson T5 "Streaming"'s Run all: before the fix,
 * this caused duplicate CreatePrimary/SignSequenceStart calls and spurious
 * TPM_RC_OBJECT_MEMORY (0x902) / sequence-conflict (0x910) errors; the
 * user's original report showed a narrower variant (steps 1-5 clean, only
 * TPM2_VerifySequenceComplete failing with TPM_RC_SIGNATURE — a signature
 * computed over the wrong message after an unrelated command interleaved
 * mid-sequence).
 *
 * The fix (tpmBridge.ts's withTpmLock) makes every top-level operation
 * exclusive against the shared engine. This spec deliberately dispatches
 * the double-click via two synchronous native `.click()` calls in one JS
 * tick — bypassing the Issue B UI disabled-guard on purpose, so this proves
 * the underlying lock holds even for input the UI guard can't intercept in
 * time (fast repeated clicks, Enter-key repeats, assistive tech), not just
 * that the button visually disables.
 *
 * Venue: `*.local.spec.ts` — excluded from the CI Playwright run via
 * `testIgnore` in playwright.config.ts (directive 2026-07-01: new suites are
 * local-only). Run with `E2E_SERVER=dev playwright test --project=local
 * e2e/tpm-playground-concurrency.local.spec.ts`.
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

test('a same-tick double-click on Run all does not corrupt the streaming lesson', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/playground/tpm-playground')

  // TPM boot + V2.7 EK/AK provisioning (6 real ML-KEM/ML-DSA keygens) runs
  // on mount before any lesson can be selected.
  await expect(page.getByText(/WASM TPM INITIALIZED/i)).toBeVisible({ timeout: 30000 })

  const streamingNav = page.getByRole('button', { name: /Streaming — why pure ML-DSA/i })
  await streamingNav.waitFor({ timeout: 15000 })
  await streamingNav.click()

  const runAllBtn = page.getByRole('button', { name: /^Run all$/ })
  await runAllBtn.waitFor({ timeout: 10000 })

  // True re-entrant invocation: both click events dispatch in the same tick,
  // before React has a chance to re-render `disabled` from the first click's
  // async handler starting. Playwright's own `.click()` would serialize the
  // two via its own actionability wait, which wouldn't reproduce the race.
  await runAllBtn.evaluate((btn: HTMLButtonElement) => {
    btn.click()
    btn.click()
  })

  // Because both clicks land on the SAME `runAll` closure (bound before
  // either click, both from the one pre-click render), the second queued
  // invocation doesn't know the first already finished — it re-runs every
  // step from scratch once the lock frees up. So this settles as two full
  // sequential lesson runs, not one; wait for the LAST one's success text,
  // then a short buffer for trailing state updates.
  await expect(page.getByText('PQC: verify — ticket tag TPM_ST_MESSAGE_VERIFIED')).toBeVisible({
    timeout: 25000,
  })
  await page.waitForTimeout(3000)
  await expect(page.getByText(/Verified ✓.*MESSAGE_VERIFIED/).last()).toBeVisible()

  // Scope the corruption check to the STEPS panel specifically — the page
  // also renders a static command/return-code GLOSSARY that legitimately
  // documents what TPM_RC_SIGNATURE/TPM_RC_OBJECT_MEMORY mean (reference
  // text, not a triggered error), so a whole-page substring search would
  // false-positive on that documentation.
  const bodyText = await page.locator('body').innerText()
  const stepsStart = bodyText.indexOf('STEPS')
  expect(stepsStart, 'STEPS panel not found on page').toBeGreaterThan(-1)
  const compareStart = bodyText.indexOf('COMPARE', stepsStart)
  const stepsSection = bodyText.slice(
    stepsStart,
    compareStart > stepsStart ? compareStart : stepsStart + 6000
  )

  // Real thrown-error text (execOk in tpmLessons.ts) always pairs the RC
  // name with its parenthesized hex code, e.g. "TPM_RC_SIGNATURE
  // (0x000001db)" — distinct from the glossary's concatenated-no-parens
  // format, so this can't false-positive on that reference text even
  // without the section-scoping above.
  expect(stepsSection).not.toContain('TPM_RC_SIGNATURE (0x000001db)')
  expect(stepsSection).not.toContain('(0x00000902)')
  expect(stepsSection).not.toContain('(0x00000910)')

  // Issue C bonus check: flushAllTransient() now discovers real loaded
  // handles via GetCapability instead of blind-probing a range that was
  // wrong for this engine — the routine TPM_RC_HANDLE/TPM_RC_VALUE noise
  // from that wrong guess (visible in the user's original T3 screenshot)
  // should be gone entirely, not just non-fatal.
  expect(stepsSection).not.toContain('TPM_RC_HANDLE')
  expect(stepsSection).not.toContain('TPM_RC_VALUE')
})
