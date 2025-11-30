import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.pqctoday.com/';

test.describe('Production Smoke Tests', () => {
    test.setTimeout(120000); // Increase timeout to 2 minutes for production latency
    test.beforeEach(async ({ page }) => {
        // Capture any 404s for assets
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            if (status === 404 && (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.wasm'))) {
                console.error(`FAILED TO LOAD ASSET: ${url} (Status: ${status})`);
            }
        });

        await page.goto(PROD_URL);
        // Wait for the app to be ready (hydration)
        await page.waitForLoadState('networkidle');
    });

    test('Asset Integrity Check', async ({ page }) => {
        // Verify title to ensure we loaded the app
        await expect(page).toHaveTitle(/PQC Today/);

        // Check for critical bundles in the network (this relies on the page load triggering them)
        // We can't easily assert "all" assets without a manifest, but we can check that no console errors occurred
        // related to loading.

        // Check for console errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // Wait a bit for initial loads
        await page.waitForTimeout(5000);

        // Filter out non-critical errors if any (optional)
        const criticalErrors = consoleErrors.filter(err =>
            err.includes('Failed to load resource') ||
            err.includes('Importing a module script failed')
        );

        expect(criticalErrors, `Found critical console errors: ${criticalErrors.join('\n')}`).toHaveLength(0);
    });

    test('WASM Loading & Key Generation (Critical Flow)', async ({ page }) => {
        // Navigate to Playground
        // Try a more robust selector strategy and take a screenshot on failure
        try {
            const playgroundBtn = page.getByRole('button', { name: /Playground/ });
            await expect(playgroundBtn).toBeVisible({ timeout: 30000 });
            await playgroundBtn.click({ force: true });
        } catch (e) {
            console.log('Failed to find Playground button, taking screenshot...');
            await page.screenshot({ path: 'playground-fail.png', fullPage: true });
            throw e;
        }

        // Verify we are on the playground
        await expect(page.getByText('Cryptographic Playground')).toBeVisible();

        // Monitor for the specific WASM wrapper file we fixed
        // Monitor for the specific WASM wrapper file we fixed
        // const wasmRequestPromise = page.waitForResponse(response =>
        //     (response.url().includes('ml-kem-768.min.js') || response.url().includes('ml-kem-768.deno.js')) &&
        //     response.status() === 200
        //     , { timeout: 10000 }).catch(() => null);

        // Trigger Key Generation (ML-KEM-768 is default)
        await page.getByRole('button', { name: 'Generate Keys' }).first().click();

        // Wait for the WASM file to be requested (if it wasn't already cached/loaded)
        // Note: It might have loaded on navigation, so we might miss the event if we wait strictly after click.
        // But the real test is if the keys appear.

        // Wait for Output
        // Using the specific selector strategy we found reliable in previous tests
        const publicKeyOutput = page.locator('div').filter({ hasText: 'Public Key (Output)' }).locator('textarea').first();
        await expect(publicKeyOutput).not.toBeEmpty({ timeout: 15000 });

        const secretKeyOutput = page.locator('div').filter({ hasText: 'Secret Key (Output)' }).locator('textarea').first();
        await expect(secretKeyOutput).not.toBeEmpty();

        console.log('Key generation successful - WASM loaded correctly.');
    });

    test('Routing Check', async ({ page }) => {
        // Test direct navigation to a "tab" if possible, or just switching tabs
        // Since it's a SPA, we verify the URL updates or UI changes

        await page.getByRole('button', { name: /Timeline/ }).click();
        await expect(page.getByText('Global PQC Migration Timeline')).toBeVisible();

        await page.getByRole('button', { name: /Impacts/ }).click();
        await expect(page.getByText('Systemic Risk Analysis')).toBeVisible();
    });
});
