import { test, expect } from '@playwright/test'

// PKCS#11 v3.3 (working draft) — the Learn track and the Build test bench in a
// real browser with the real Rust wasm engine (plan C9).
//
// What this proves on ANY engine: the deep links open the third Learn track
// and the "v3.3 draft" Build suite, the draft-status note is shown, one
// lesson runs end to end (steps the engine cannot run yet say "Not in this
// engine yet" instead of failing), and the known-answer table carries the
// vector source and commit with no failing row.
//
// [after engine update]: once the engine bundle with composite ML-DSA /
// ML-KEM is copied in, the same spec runs the composite steps and the 30
// known-answer checks as real crypto — the "no Fail" assertions then mean
// "every set passed or is declared unsupported".
//
// Local-only: `E2E_SERVER=dev npx playwright test --project=local
// e2e/pkcs11-v33.local.spec.ts` (check the port is free first).

test.describe('PKCS#11 v3.3 (working draft)', () => {
  test('Learn: the composite ML-KEM lesson runs and shows the two combiners differ', async ({
    page,
  }) => {
    await page.goto('/playground/hsm?tab=learn&ltrack=v33&lesson=v33-composite-mlkem')
    await expect(page.getByTestId('v33-draft-note')).toContainText(
      'unpublished OASIS working draft'
    )
    await expect(page.getByRole('heading', { name: 'Composite ML-KEM' })).toBeVisible({
      timeout: 15000,
    })
    await page.getByRole('button', { name: 'Run all' }).click()
    await expect(page.getByText(/Different secrets from the same inputs/)).toBeVisible({
      timeout: 60000,
    })
    // Every step ended: passed, or "not in this engine yet" — never failed.
    await expect(page.getByRole('button', { name: /^Run$/ })).toHaveCount(0, { timeout: 60000 })
    await expect(page.locator('li svg.text-destructive')).toHaveCount(0)
  })

  test('Build: the v3.3 bench runs the known-answer checks with their source', async ({ page }) => {
    await page.goto('/playground/hsm?tab=build&dtab=v33')
    const bench = page.getByTestId('v33-test-bench')
    await expect(bench).toBeVisible({ timeout: 15000 })
    await bench.getByRole('button', { name: /Run known-answer checks/ }).click()
    const table = page.getByRole('table', { name: 'Known-answer check results' })
    await expect(table).toBeVisible({ timeout: 120000 })
    await expect(table.getByText(/lamps-wg\/draft-composite-kem @ d77e754/)).toHaveCount(12)
    await expect(table.getByText(/lamps-wg\/draft-composite-sigs @ f0627ab/)).toHaveCount(18)
    await expect(table.getByText('Fail', { exact: true })).toHaveCount(0)
  })
})
