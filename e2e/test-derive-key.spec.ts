import { test, expect } from '@playwright/test'
test('Check C_DeriveKey on WASM', async ({ page }) => {
  await page.goto('http://localhost:5173/learn/hsm-pqc')
  await page.evaluate(() => localStorage.setItem('pqc-disclaimer-seen', 'true'))
  await page.evaluate(() => localStorage.setItem('pqc-learning-persona', 'developer'))
  await page.evaluate(() =>
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { hasSeenToast: true }, version: 0 })
    )
  )
  await page.reload()

  const startWorkshopBtn = page
    .getByRole('button', { name: /Start Workshop|Open Sandbox|Begin Lab/i })
    .first()
  if (await startWorkshopBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await startWorkshopBtn.click()
  }

  // Wait for the WASM to initialize
  await expect(page.locator('body')).toContainText(/PKCS#11|SoftHSM|Live WASM|Sign /i, {
    timeout: 15000,
  })

  const result = await page.evaluate(async () => {
    // import the module loader from the window if it exists, but the easiest is the module cache
    // We can just rely on the fact that the UI has loaded it.
    // Wait, the UI doesn't expose `getSoftHSMRustModule` on the window object.
    // Let's manually fetch the wasm using standard fetch to just read the binary,
    // but even easier, the React state has it.
    // Actually, we can just trigger a function on window if we expose it, or just use dynamic import
    const mod = await import('/src/wasm/softhsm.ts')
    const wasm = await mod.getSoftHSMRustModule()
    return wasm._C_DeriveKey(0, 0, 0, 0, 0, 0)
  })
  console.log('DERIVE_RESULT=' + result.toString(16))
})
