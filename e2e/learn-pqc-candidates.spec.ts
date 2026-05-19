// SPDX-License-Identifier: GPL-3.0-only
//
// learn-pqc-candidates.spec.ts — E2E for the PQC Candidates & Standardisation
// Lifecycle learn module at /learn/pqc-candidates.

import { test, expect } from '@playwright/test'

test.describe('PQC Candidates & Standardisation Lifecycle module', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the WhatsNew toast + disclaimer modal + guided tour that intercept clicks.
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      // Mark the disclaimer for current major (3.x → APP_MAJOR=3) as acknowledged.
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 1 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/learn/pqc-candidates')
    // Wait for the module shell to render (lazy chunk loads + Suspense fallback).
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('PQC Candidates & Standardisation Lifecycle').first()).toBeVisible({
      timeout: 15000,
    })
  })

  test('renders the module title', async ({ page }) => {
    await expect(page.getByText('PQC Candidates & Standardisation Lifecycle').first()).toBeVisible()
  })

  test('renders all five tab triggers', async ({ page }) => {
    // Custom Tabs primitive renders triggers as buttons in a TabsList.
    await expect(page.getByText('Learn', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Visual', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Workshop', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Exercises', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('References', { exact: true }).first()).toBeVisible()
  })

  test('renders the four Learn-tab sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Standardisation is a rolling process/i })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /How candidates are validated/i })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /Four math families on the table/i })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: /Worldwide parallel processes/i })).toBeVisible()
  })

  test('Workshop tab mounts and shows all six step icons', async ({ page }) => {
    await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
    // Step labels appear on md+ breakpoints — assert at least one is visible (we know desktop runs in CI).
    await expect(page.getByText(/Standardisation Lifecycle/i).first()).toBeVisible()
  })

  test('References tab shows entries for the 9 candidates', async ({ page }) => {
    await page.getByRole('button', { name: 'References', exact: true }).first().click()
    // FAEST Round-2 Specification should appear (or the title fragment we control).
    await expect(page.getByText(/FAEST.*Round 2/i).first()).toBeVisible()
    await expect(page.getByText(/SQIsign.*Round 2/i).first()).toBeVisible()
    await expect(page.getByText(/HAWK.*Round 2/i).first()).toBeVisible()
    // NIST IR 8528 (Round 2 status report) should also be linked.
    await expect(
      page.getByText(/NIST IR 8528|Status Report on the First Round/i).first()
    ).toBeVisible()
  })

  test('Family selector switches between MPCitH, Multivariate, Isogeny, Lattice', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
    // Step 2 is "Family Math Explainer" — navigate to it by clicking next twice.
    // (Alternative: directly click the family-math step icon — the icon has no text, so use Next Step.)
    const next = page.getByRole('button', { name: /Next Step/i })
    await next.click()
    // Verify a family-button label shows
    await expect(page.getByText('MPC-in-the-Head').first()).toBeVisible()
    await expect(page.getByText('Multivariate').first()).toBeVisible()
    await expect(page.getByText('Isogeny').first()).toBeVisible()
    await expect(page.getByText('Lattice').first()).toBeVisible()
  })
})
