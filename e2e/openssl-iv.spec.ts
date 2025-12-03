import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Encryption IV Support', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))
        await page.goto('/')
        await page.getByRole('button', { name: /OpenSSL/ }).click()
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()
    })

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            const logs = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts().catch(() => ['No terminal output found'])
            console.log(`TERMINAL OUTPUT for ${testInfo.title}:\n${logs.join('\n')}`)
        }
    })

    test('Encryption with Show Key & IV (-p)', async ({ page }) => {
        // 1. Create Data File
        await page.getByRole('button', { name: 'Sign / Verify' }).click()
        await page.getByRole('button', { name: 'Create Test Data File' }).click()
        await expect(page.getByText(/File created: data.txt/)).toBeVisible()

        // 2. Encrypt with -p
        await page.getByRole('button', { name: 'Encryption' }).click()
        await page.fill('#enc-pass-input', 'test')

        // Check "Show Derived Key & IV"
        await page.getByLabel('Show Derived Key & IV (-p)').check()

        await page.getByRole('button', { name: 'Run Command' }).click()

        // Verify output contains salt, key, and iv
        const logs = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts()
        const logText = logs.join('\n')
        expect(logText).toContain('salt=')
        expect(logText).toContain('key=')
        expect(logText).toContain('iv =')
        await expect(page.getByText(/File created: data.enc/)).toBeVisible()
    })

    test('Encryption with Custom IV', async ({ page }) => {
        // 1. Create Data File
        await page.getByRole('button', { name: 'Sign / Verify' }).click()
        await page.getByRole('button', { name: 'Create Test Data File' }).click()

        // 2. Encrypt with Custom IV
        await page.getByRole('button', { name: 'Encryption' }).click()
        await page.fill('#enc-pass-input', 'test')

        const customIV = '0102030405060708090a0b0c0d0e0f10' // 16 bytes for AES-128/256
        await page.fill('#enc-iv-input', customIV)

        // Also check -p to verify the IV was used
        await page.getByLabel('Show Derived Key & IV (-p)').check()

        await page.getByRole('button', { name: 'Run Command' }).click()

        // Verify output shows the custom IV
        const logs = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts()
        const logText = logs.join('\n')
        expect(logText.toLowerCase()).toContain(`iv =${customIV}`)
        await expect(page.getByText(/File created: data.enc/)).toBeVisible()
    })
})
