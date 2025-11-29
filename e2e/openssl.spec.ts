import { test, expect } from '@playwright/test';

test.describe('OpenSSL Studio', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Navigate to OpenSSL Studio via the main menu if possible, or direct URL
        // Assuming there is a button on the home page or a nav link.
        // Based on App.tsx inspection (pending), we'll adjust.
        // For now, let's try finding a button with "OpenSSL" in the name.
        await page.getByRole('button', { name: /OpenSSL/ }).click();
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible();
    });

    test('generates RSA key', async ({ page }) => {
        // Ensure we are on Key Generation tab (default)
        await page.getByRole('button', { name: 'Key Generation' }).click();

        // Select RSA (default)
        // Click Run Command
        await page.getByRole('button', { name: 'Run Command' }).click();

        // Check logs for success
        await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible();

        // Switch to File Manager to verify file existence
        await page.getByRole('button', { name: 'File Manager' }).click();
        await expect(page.getByRole('cell', { name: /rsa-2048-/ })).toBeVisible();
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
