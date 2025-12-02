import { test, expect } from '@playwright/test';

test('capture library detail popover screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('link', { name: 'Library' }).click();
    // Click on the first library item to open the popover
    await page.locator('tbody tr').first().click();

    // Wait for popover to be visible
    const popover = page.getByRole('dialog');
    await expect(popover).toBeVisible();

    // Capture screenshot
    await popover.screenshot({ path: 'library-popover.png' });
});
