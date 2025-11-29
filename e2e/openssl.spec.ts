import { test, expect } from '@playwright/test';

test.describe('OpenSSL Studio', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /OpenSSL/ }).click();
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible();
    });

    test('generates RSA key', async ({ page }) => {
        // Ensure we are on Key Generation tab (default)
        await page.getByRole('button', { name: 'Key Generation' }).click();

        // Select RSA (default)
        // Click Run Command
        await page.getByRole('button', { name: 'Run Command' }).click();

        // Check logs for success (increase timeout for Firefox/CI)
        await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible({ timeout: 30000 });

        // Switch to File Manager to verify file existence
        const fileManagerBtn = page.locator('button').filter({ hasText: 'File Manager' });
        await expect(fileManagerBtn).toBeEnabled();
        await fileManagerBtn.click({ force: true });

        // Wait for view transition and table render
        await page.waitForTimeout(1000);

        // Check if button is active (has bg-primary/20)
        await expect(fileManagerBtn).toHaveClass(/bg-primary\/20/);

        // Check for table headers to ensure we are in the right view
        await expect(page.getByRole('columnheader', { name: 'Filename' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();

        // Check if file exists in the table
        // It should be in a cell
        await expect(page.getByRole('cell', { name: /rsa-2048-/ })).toBeVisible({ timeout: 10000 });
    });

    test('generates ML-DSA key', async ({ page }) => {
        // Ensure we are on Key Generation tab
        await page.getByRole('button', { name: 'Key Generation' }).click();

        // Select ML-DSA-44
        await page.selectOption('#key-algo-select', 'mldsa44');

        // Click Run Command
        await page.getByRole('button', { name: 'Run Command' }).click();

        // Check logs
        await expect(page.getByText(/File created: mldsa-44-/)).toBeVisible();
    });
});
