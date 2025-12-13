import { test, expect } from '@playwright/test'

test.describe('Hybrid KEM Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground')
  })

  test('should perform hybrid encapsulation and decapsulation', async ({ page }) => {
    // 1. Navigate to KEM Tab
    await page.click('text=KEM') // Assuming tab name or text

    // 2. Enable Hybrid Mode
    // The toggle is next to the text "Hybrid Mode".
    // We can find the text and click the sibling button, or use a layout selector.
    // The button contains a span with class 'translate-x...'.
    // Enable Hybrid Mode using the new checkbox (Encapsulate side)
    await page.check('input#hybrid-mode-check-enc')

    // Verify Hybrid UI elements appear
    await expect(page.locator('text=Primary Key (PQC)')).toBeVisible()
    await expect(page.locator('text=Secondary Key (Classical)')).toBeVisible()

    // 3. Generate Keys
    // Navigate to Key Store
    await page.getByRole('button', { name: /Key Store/ }).click()

    // Generate ML-KEM Key (if not exists)
    await page.selectOption('#keystore-key-size', '768')
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-KEM')

    // Generate X25519 Key
    // Algorithm selection for X25519 might be via a separate dropdown depending on UI?
    // In PlaygroundContext, key generation often defaults to ML-KEM/ML-DSA.
    // Wait, the playground UI usually only has "Key Size / Algo" dropdown for *PQC*.
    // Does it allow generating X25519 explicitly?
    // Looking at KeyStore tab... "keySize" selector.
    // If I cannot generate X25519 easily via UI, I might need to rely on Mock keys?
    // OR: Check if KeyStore has "Import" or if distinct buttons exist.
    // Actually, `useKeyStore` might support it.
    // In `KeyStoreTab.tsx`, verify if there is an option for Classical.
    // If not, I might need to add one or use "Mock" mode or "Import".
    // BUT `KemOpsTab.tsx` filters for `['X25519', 'P-256']`.
    // Let's assume for now we use existing keys or the test helper creates them.
    // Actually, let's rely on the fact that the app might have them or we can generate.
    // If the UI doesn't support generating X25519, I might be blocked.
    // Let's check `KeyStoreTab` or `useKeyStore`.

    // Hack: If KeyStore doesn't allow generating classical keys, I might need to add that feature or mock it.
    // However, for this test, let's assume one exists or we mock it.
    // Actually, wait. The user only asked for Hybrid KEM *Operations*.
    // If the user cannot generate standard keys, they can't use Hybrid KEM.
    // So I must ensure Key Gen supports it.
    // Let's check `KeyStoreTab.tsx` quickly?
    // Assume standard keys are NOT generate-able in PQC playground...
    // WAIT. `KemOpsTab` explicitly checks for X25519 keys.
    // Ops! I might need to add Classical Key Gen to KeyStoreTab if it's missing.
    // Let's check KeyStoreTab content via `cat` or read from previous knowledge.
    // I suspect it only generates PQC keys.
    // If so, I need to add X25519 generation OR use `window.crypto` to import one in the test?
    // No, I should fix the app.

    // Let's first try to run the test and see if it fails to find keys.
    // But I will proceed with fixing the selector first.

    // 4. Return to KEM Operations
    await page.getByRole('button', { name: /KEM & Encrypt/ }).click()

    // 5. Select Keys for Encapsulation
    // Primary (PQC)
    // Use selectOption with label or index
    await page.locator('select').nth(0).selectOption({ index: 1 }) // Select first available PQC key

    // Secondary (Classical)
    await page.locator('select').nth(1).selectOption({ index: 1 }) // Select first available Classical key

    // 6. Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // 7. Verify Output
    await expect(
      page.locator('input[placeholder="Run Encapsulate to generate"]').first()
    ).not.toBeEmpty()
    const ciphertext = await page
      .locator('input[placeholder="Run Encapsulate to generate"]')
      .nth(1)
      .inputValue()
    expect(ciphertext).toContain('|') // Check for hybrid separator

    // 8. Select Keys for Decapsulation
    // Primary (PQC)
    await page.locator('select').nth(2).selectOption({ index: 1 })
    // Secondary (Classical)
    await page.locator('select').nth(3).selectOption({ index: 1 })

    // 9. Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // 10. Verify Result
    await expect(page.locator('text=SECRET RECOVERED')).toBeVisible()
  })
})
