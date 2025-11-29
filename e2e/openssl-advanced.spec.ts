import { test, expect } from '@playwright/test';

test.describe('OpenSSL Studio - Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
        // Capture browser logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        await page.goto('/');
        await page.getByRole('button', { name: /OpenSSL/ }).click();
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible();
    });

    test('generates CSR (Certificate Signing Request)', async ({ page }) => {
        // 1. Generate Key first
        await page.getByRole('button', { name: 'Key Generation' }).click();
        await page.getByRole('button', { name: 'Run Command' }).click();
        await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible();

        // 2. Go to CSR Tab
        await page.getByRole('button', { name: 'CSR' }).click();

        // 3. Select the generated key
        // Wait for the select to be populated with the new key
        await page.waitForTimeout(1000);
        const keyOption = await page.locator('#csr-key-select option').filter({ hasText: /rsa-2048-/ }).first();
        const keyValue = await keyOption.getAttribute('value');
        if (keyValue) {
            await page.selectOption('#csr-key-select', keyValue);
        }

        // 4. Run CSR Command
        await page.getByRole('button', { name: 'Run Command' }).click();

        // 5. Verify Success
        await expect(page.getByText(/File created: rsa-csr-/)).toBeVisible();
        await expect(page.getByText(/Can't open .*openssl.cnf/)).not.toBeVisible();
    });

    test('generates Self-Signed Certificate', async ({ page }) => {
        // 1. Generate Key
        await page.getByRole('button', { name: 'Key Generation' }).click();
        await page.getByRole('button', { name: 'Run Command' }).click();
        await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible();

        // 2. Go to Certificate Tab
        await page.getByRole('button', { name: 'Certificate' }).click();

        // 3. Ensure Key is Selected (wait for populate)
        await page.waitForTimeout(1000);

        // 4. Run Command (req -x509)
        await page.getByRole('button', { name: 'Run Command' }).click();

        // 5. Verify Success
        await expect(page.getByText(/File created: rsa-cert-/)).toBeVisible();
    });

    test('signs and verifies a file', async ({ page }) => {
        // 1. Generate Key
        await page.getByRole('button', { name: 'Key Generation' }).click();
        await page.getByRole('button', { name: 'Run Command' }).click();

        // 2. Go to Sign/Verify Tab
        await page.getByRole('button', { name: 'Sign / Verify' }).click();

        // 3. Create a test file to sign (if needed, or use existing key as data? usually we need a data file)
        // The UI might have a way to create a file, or we can use the key file itself as the data source for simplicity
        // Assuming the UI allows selecting a "File to Sign".

        // Let's check if we can switch to "Sign" mode
        // Assuming default is Sign

        // Run Sign Command
        await page.getByRole('button', { name: 'Run Command' }).click();
        await expect(page.getByText(/File created: .*\.sig/)).toBeVisible();

        // 4. Switch to Verify
        await page.getByLabel('Operation').selectOption('verify');

        // Run Verify Command
        await page.getByRole('button', { name: 'Run Command' }).click();
        await expect(page.getByText(/Verified OK/)).toBeVisible();
    });
});
