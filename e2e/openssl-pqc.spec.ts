import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - PQC Algorithms', () => {
    test.beforeEach(async ({ page }) => {
        // Capture browser logs
        page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))

        await page.goto('/')
        await page.getByRole('button', { name: /OpenSSL/ }).click()
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()
    })

    test('generates ML-DSA-44 key and signs data', async ({ page }) => {
        // 1. Generate Key
        await page.getByRole('button', { name: 'Key Generation' }).click()
        await page.selectOption('#key-algo-select', 'mldsa44')
        await page.getByRole('button', { name: 'Run Command' }).click()
        await expect(page.getByText(/File created: mldsa-44-/)).toBeVisible()

        // 2. Sign Data
        await page.getByRole('button', { name: 'Sign / Verify' }).click()

        // Ensure the key is selected (wait for populate)
        await page.waitForTimeout(1000)
        const keyOption = await page
            .locator('select')
            .filter({ hasText: 'Select a key file...' })
            .locator('option')
            .filter({ hasText: /mldsa-44-/ })
            .first()

        const keyValue = await keyOption.getAttribute('value')
        if (keyValue) {
            // Find the select element that contains this option
            const selectId = await keyOption.evaluate((el) => el.parentElement?.id);
            if (selectId) {
                await page.selectOption(`#${selectId}`, keyValue)
            } else {
                // Fallback if no ID
                await page.locator('select').filter({ hasText: 'Select a key file...' }).selectOption(keyValue);
            }
        }

        // Create test data if needed (the UI has a button for it)
        await page.getByRole('button', { name: 'Create Test Data File' }).click()

        // Run Sign Command
        await page.getByRole('button', { name: 'Run Command' }).click()
        await expect(page.getByText(/File created: .*\.sig/)).toBeVisible()
    })

    test('generates SLH-DSA-SHA2-128s key', async ({ page }) => {
        await page.getByRole('button', { name: 'Key Generation' }).click()
        await page.selectOption('#key-algo-select', 'slhdsa128s')
        await page.getByRole('button', { name: 'Run Command' }).click()
        await expect(page.getByText(/File created: slhdsa-128s-/)).toBeVisible()
    })

    test('generates ML-KEM-768 key', async ({ page }) => {
        await page.getByRole('button', { name: 'Key Generation' }).click()
        await page.selectOption('#key-algo-select', 'mlkem768')
        await page.getByRole('button', { name: 'Run Command' }).click()
        await expect(page.getByText(/File created: mlkem-768-/)).toBeVisible()
    })
})
