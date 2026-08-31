// TEMPORARY, UNCOMMITTED sanity check — NOT part of the regular suite.
// Confirms the "v2 selftest" card (V2SelftestCard, driving strongswan-v2.wasm
// via bridge-v2.ts) still works after tonight's v1-only rebuild. Its source
// (strongswan-wasm-v2-shims/) was deleted from pqctoday-hsm, but the compiled
// public/wasm/strongswan-v2.{js,wasm} artifacts were not touched — this just
// verifies that holds true at runtime, not only by comparing file hashes.

import { test, expect, type Page } from '@playwright/test'

const BASE = '/playground/vpn-sim'

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

test('v2 selftest card runs ML-DSA + ML-KEM selftest unaffected by the v1 rebuild', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await suppressWhatsNew(page)
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30_000 })

  const runBtn = page.getByRole('button', { name: /Run ML-DSA \+ ML-KEM selftest/i })
  await expect(runBtn).toBeVisible({ timeout: 30_000 })
  await expect(runBtn).toBeEnabled({ timeout: 15_000 })
  await runBtn.click()

  // Card renders numeric stat tiles (mlDsaSigLen / mlKemPub / mlKemCt /
  // mlKemSecret) once the selftest completes.
  await expect(page.getByText('ML-KEM pub')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('ML-KEM ct')).toBeVisible({ timeout: 5_000 })

  const body = await page.evaluate(() => document.body.innerText)
  expect(body).not.toMatch(/strongswan-v2\.(js|wasm).*404|Failed to fetch/i)
})
