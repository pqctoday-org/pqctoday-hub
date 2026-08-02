// SPDX-License-Identifier: GPL-3.0-only
/**
 * pqc101-keygen-overwrite.local.spec.ts
 *
 * Regression guard for the OpenSSL worker's "did this command produce a file?"
 * rule. PQC-101 workshop step 3 runs BOTH panes through
 * `genpkey ... -out private.key` — the same filename. The worker's persistent
 * VFS made the second run's output invisible (FILE_CREATED was suppressed on
 * name alone, ignoring that the bytes had been rewritten), so whichever pane
 * ran second reported "key file not produced". Reported 2026-08-02.
 *
 * Local tier: real openssl.wasm keygen, too slow/heavy for the CI gate.
 */
import { test, expect, type Page } from '@playwright/test'

test.setTimeout(240_000)

const STEP3 = '/learn/pqc-101?tab=workshop&step=2'
const WASM_TIMEOUT = 120_000

/** The two output panes, in DOM order: [classical, post-quantum]. */
function panes(page: Page) {
  return page.locator('pre')
}

async function expectBothPanesSucceeded(page: Page) {
  const classical = panes(page).nth(0)
  const pqc = panes(page).nth(1)

  await expect(classical).toContainText('Key generated successfully!', { timeout: WASM_TIMEOUT })
  await expect(pqc).toContainText('Key generated successfully!', { timeout: WASM_TIMEOUT })
  await expect(classical).not.toContainText('key file not produced')
  await expect(pqc).not.toContainText('key file not produced')

  // Each pane extracted ITS OWN public key — a shared-filename mix-up would
  // show the same PEM body twice. Ed25519's SPKI is ~44 bytes; ML-DSA-65's is
  // ~1.9 KB, so a swap is unmissable in the rendered text.
  const classicalPem = (await classical.textContent()) ?? ''
  const pqcPem = (await pqc.textContent()) ?? ''
  expect(classicalPem).toContain('-----BEGIN PUBLIC KEY-----')
  expect(pqcPem).toContain('-----BEGIN PUBLIC KEY-----')
  expect(pqcPem.length).toBeGreaterThan(classicalPem.length * 2)
}

test('second genpkey to the same -out filename still reports its key', async ({ page }) => {
  await page.goto(STEP3)

  // PQC first, sequentially — the second run is the one that used to fail.
  await page.getByRole('button', { name: /Generate ML-DSA-65/ }).click()
  await expect(panes(page).nth(1)).toContainText('Key generated successfully!', {
    timeout: WASM_TIMEOUT,
  })

  await page.getByRole('button', { name: /Generate Ed25519/ }).click()
  await expectBothPanesSucceeded(page)
})

test('Generate Both & Compare produces both key pairs', async ({ page }) => {
  await page.goto(STEP3)

  await page.getByRole('button', { name: /Generate Both/ }).click()
  await expectBothPanesSucceeded(page)

  // The size-comparison panel only renders once BOTH panes returned key bytes.
  await expect(page.getByText('Key Size Comparison')).toBeVisible({ timeout: WASM_TIMEOUT })
})
