import { test, expect } from '@playwright/test';

test.describe('Timeline View', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Timeline is the default view, but let's click the nav to be sure
        await page.getByRole('button', { name: 'Timeline' }).click();
    });

    test('displays default timeline', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Global Migration Timeline' })).toBeVisible();
        // Check for at least one event
        await expect(page.locator('article').first()).toBeVisible();
    });

    test('switches country', async ({ page }) => {
        // Find the country selector
        // It might be a select or a custom dropdown. 
        // Based on TimelineView.tsx, it uses <CountrySelector>.
        // Let's assume it has a combobox role or similar.

        // Open the dropdown first
        await page.getByRole('button', { name: 'Select Region:' }).click();

        // Wait for dropdown to be visible
        await expect(page.getByRole('listbox')).toBeVisible();

        // Select the option
        await page.getByRole('option', { name: /United Kingdom/ }).click({ force: true });

        // Wait for dropdown to close (confirms selection logic ran)
        await expect(page.getByRole('listbox')).toBeHidden();

        // Verify the selector button now shows "United Kingdom"
        // Note: The button has aria-labelledby="country-selector-label", so its accessible name is "Select Region:".
        // We need to check the text content inside the button.
        await expect(page.getByRole('button', { name: 'Select Region:' })).toContainText('United Kingdom');

        // Verify content update
        // Check for a specific event title for UK
        await expect(page.getByText('Discovery & Initial Plan Complete')).toBeVisible();
    });
});

