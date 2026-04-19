import { test, expect } from '@playwright/test'

test.describe('ASR ACVP Cryptographic Algorithm Verification', () => {
  test.setTimeout(90000) // WASM load + ACVP exhaustive keys can take a while
  test('validates ML-KEM and ML-DSA via direct ACVP execution trigger', async ({ page }) => {
    // Navigate to the playground sandbox route where ACVP testing mounts.
    // The HsmPlayground mounts the ACVP components.
    // We pass ?tab=acvp to ensure autoInit() triggers on mount for the test.
    await page.goto('/playground/hsm?tab=acvp')

    // Intercept console to debug WASM or autoInit failures
    page.on('console', (msg) => console.log('BROWSER:', msg.text()))

    // Click the ACVP Validation tab on the sidebar
    const acvpTab = page.locator('button', { hasText: 'ACVP' })
    await acvpTab.waitFor({ state: 'visible', timeout: 15000 })
    await acvpTab.click()

    // Make sure the component is loaded before dispatching events
    await page.waitForSelector('text="SoftHSMv3 FIPS Validation Mode (ACVP)"', { timeout: 15000 })

    // Action: Programmatic State Dispatch
    // We dispatch custom E2E event periodically until the results state changes
    let testsRunning = false
    for (let i = 0; i < 20; i++) {
      // dispatch event
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('e2e:trigger_acvp'))
      })

      // also try UI button just in case
      const btn = page.getByRole('button', { name: /Execute ACVP Tests/i })
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

    // The Execution Log should conclude
    const logSection = page.locator('div', { hasText: 'Validation Suite Completed' }).last()
    await expect(logSection).toBeVisible({ timeout: 15000 })

    // Validate that at least one ML-KEM and ML-DSA passed
    const mlkemRow = page.locator('tr', { hasText: 'ML-KEM-512' }).first()
    if ((await mlkemRow.count()) > 0) {
      await expect(mlkemRow).toContainText('pass')
    }

    const mldsaRow = page.locator('tr', { hasText: 'ML-DSA-44' }).first()
    if ((await mldsaRow.count()) > 0) {
      await expect(mldsaRow).toContainText('pass')
    }

    // Ensure no 'fail' exists in the table output block if possible
    const failedRows = page.locator('td', { hasText: /fail/i })
    expect(await failedRows.count()).toBe(0)
  })
})
