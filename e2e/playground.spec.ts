import { test, expect } from '@playwright/test';

test.describe('Playground', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Playground' }).click();
        await expect(page.getByRole('heading', { name: 'Interactive Playground', level: 2 })).toBeVisible();
    });

    test('generates ML-KEM keys', async ({ page }) => {
        // Navigate to Key Store tab
        await page.getByRole('button', { name: /Key Store/ }).click();

        // Select ML-KEM-768
        await page.selectOption('#keystore-key-size', '768');

        // Click Generate Keys
        await page.getByRole('button', { name: 'Generate Keys' }).click();

        // Check if keys are displayed in the table
        await expect(page.getByRole('table')).toContainText('ML-KEM');
        await expect(page.getByRole('table')).toContainText('Public Key');
    });

    test('generates ML-DSA keys', async ({ page }) => {
        // Navigate to Key Store tab
        await page.getByRole('button', { name: /Key Store/ }).click();

        // Select ML-DSA-65
        await page.selectOption('#keystore-key-size', '65');

        // Click Generate Keys
        await page.getByRole('button', { name: 'Generate Keys' }).click();

        // Check if keys are displayed
        await expect(page.getByRole('table')).toContainText('ML-DSA');
    });
});
