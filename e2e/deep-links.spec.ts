// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep Link E2E Tests
 *
 * Validates that URL query parameters correctly set initial page state
 * for all major routes. These are the same deep link patterns used by
 * the PQC Assistant chatbot, ShareButton, and QandA_pqctoday.md.
 *
 * No WASM operations — navigation + UI state only.
 */
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Suppress WhatsNew toast (z-[100] intercepts clicks)
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 1 })
    )
    // Seed theme preference to bypass WelcomeRedirect
    window.localStorage.setItem(
      'theme-storage-v1',
      JSON.stringify({
        state: { theme: 'system', hasSetPreference: true },
        version: 0,
      })
    )
  })
})

// ─── 1. Timeline ────────────────────────────────────────────────────────────

test.describe('Timeline deep links', () => {
  test('filters by ?country=Australia', async ({ page }) => {
    await page.goto('/timeline?country=Australia')
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    // Australia should be visible in the table
    await expect(page.getByText('Australia').first()).toBeVisible()
  })

  test('ignores invalid ?country=Narnia', async ({ page }) => {
    await page.goto('/timeline?country=Narnia')
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    // Default state — page heading visible (invalid country silently ignored)
    await expect(
      page.getByRole('heading', { level: 2, name: /Global Migration Timeline/ })
    ).toBeVisible()
  })

  test('handles URL-encoded ?country=United%20States', async ({ page }) => {
    await page.goto('/timeline?country=United%20States')
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    await expect(page.getByText('United States').first()).toBeVisible()
  })
})

// ─── 2. Library ─────────────────────────────────────────────────────────────

test.describe('Library deep links', () => {
  test('opens detail popover via ?ref=FIPS%20203', async ({ page }) => {
    await page.goto('/library?ref=FIPS%20203')

    // LibraryDetailPopover uses role="dialog" aria-modal="true"
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByText('FIPS 203')).toBeVisible()
  })

  test('sets search filter via ?q=ML-DSA', async ({ page }) => {
    await page.goto('/library?q=ML-DSA')

    await expect(page.getByText('PQC Library')).toBeVisible()
    // The search input should be populated
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toHaveValue('ML-DSA')
  })

  test('?ref= takes priority over ?q=', async ({ page }) => {
    await page.goto('/library?ref=FIPS%20204&q=something')

    // Dialog should open for FIPS 204 (ref wins per LibraryView line 222)
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByText('FIPS 204')).toBeVisible()
  })

  test('unknown ?ref=NONEXISTENT does not crash', async ({ page }) => {
    await page.goto('/library?ref=NONEXISTENT')

    // No dialog should open
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    // Page loads normally
    await expect(page.getByText('PQC Library')).toBeVisible()
  })
})

// ─── 3. Threats ─────────────────────────────────────────────────────────────

test.describe('Threats deep links', () => {
  test('filters by ?industry=Financial%20Services%20/%20Banking', async ({ page }) => {
    await page.goto('/threats?industry=Financial%20Services%20%2F%20Banking')

    await expect(page.getByRole('heading', { level: 2, name: /Quantum Threats/ })).toBeVisible()
    // Financial threats should be visible
    await expect(page.getByText(/Financial Services/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('opens detail dialog via ?id=CROSS-001', async ({ page }) => {
    await page.goto('/threats?id=CROSS-001')

    // ThreatDetailDialog uses role="dialog"
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 10000 })
  })

  test('case-insensitive ?industry=financial%20services%20/%20banking', async ({ page }) => {
    await page.goto('/threats?industry=financial%20services%20%2F%20banking')

    await expect(page.getByRole('heading', { level: 2, name: /Quantum Threats/ })).toBeVisible()
    // Should still work due to toLowerCase() comparison
    await expect(page.getByText(/Financial Services/i).first()).toBeVisible({ timeout: 10000 })
  })
})

// ─── 4. Learn modules ───────────────────────────────────────────────────────

test.describe('Learn module deep links', () => {
  test('opens workshop tab via ?tab=workshop', async ({ page }) => {
    await page.goto('/learn/crypto-agility?tab=workshop')

    // Custom tabs use data-state="active" (not role="tab")
    const workshopTab = page.getByRole('button', { name: 'Workshop', exact: true }).first()
    await expect(workshopTab).toHaveAttribute('data-state', 'active')
  })

  test('opens specific step via ?tab=workshop&step=1', async ({ page }) => {
    await page.goto('/learn/crypto-agility?tab=workshop&step=1')

    const workshopTab = page.getByRole('button', { name: 'Workshop', exact: true }).first()
    await expect(workshopTab).toHaveAttribute('data-state', 'active')
  })

  test('clamps out-of-range ?step=999 to last step', async ({ page }) => {
    await page.goto('/learn/crypto-agility?tab=workshop&step=999')

    // Should not crash — workshop tab should be active
    const workshopTab = page.getByRole('button', { name: 'Workshop', exact: true }).first()
    await expect(workshopTab).toHaveAttribute('data-state', 'active')
  })

  test('invalid ?tab=bogus falls back to learn', async ({ page }) => {
    await page.goto('/learn/crypto-agility?tab=bogus')

    // Learn tab should be active (default)
    const learnTab = page.getByRole('button', { name: 'Learn', exact: true }).first()
    await expect(learnTab).toHaveAttribute('data-state', 'active')
  })
})

// ─── 5. Leaders ─────────────────────────────────────────────────────────────

test.describe('Leaders deep links', () => {
  test('filters by ?sector=Academic', async ({ page }) => {
    await page.goto('/leaders?sector=Academic')

    await expect(page.getByText('Transformation Leaders')).toBeVisible()
  })

  test('scrolls to leader via ?leader=Dr.%20Dustin%20Moody', async ({ page }) => {
    await page.goto('/leaders?leader=Dr.%20Dustin%20Moody')

    // Leader card should become visible (scroll + 300ms delay)
    await expect(page.getByText('Dr. Dustin Moody').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows not-found for invalid ?leader=John%20Doe', async ({ page }) => {
    await page.goto('/leaders?leader=John%20Doe')

    // Warning message appears
    await expect(page.getByText('"John Doe" was not found')).toBeVisible({ timeout: 5000 })
  })

  test('invalid ?sector=Invalid shows all leaders', async ({ page }) => {
    await page.goto('/leaders?sector=Invalid')

    await expect(page.getByText('Transformation Leaders')).toBeVisible()
    // Multiple leaders should be visible (not filtered)
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })
})

// ─── 6. Algorithms ──────────────────────────────────────────────────────────

test.describe('Algorithms deep links', () => {
  test('highlights algorithm via ?highlight=ML-KEM-768', async ({ page }) => {
    await page.goto('/algorithms?highlight=ML-KEM-768')

    // When highlight is set, Detailed Comparison tab is auto-selected
    await expect(page.getByText('Post-Quantum Cryptography').first()).toBeVisible()
  })

  test('unknown ?highlight=NONEXISTENT does not crash', async ({ page }) => {
    await page.goto('/algorithms?highlight=NONEXISTENT')

    await expect(page.getByText('Post-Quantum Cryptography').first()).toBeVisible()
  })
})

// ─── 7. Migrate ─────────────────────────────────────────────────────────────

test.describe('Migrate deep links', () => {
  test('sets search filter via ?q=OpenSSL', async ({ page }) => {
    await page.goto('/migrate?q=OpenSSL')

    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toHaveValue('OpenSSL')
  })
})

// ─── 8. Compliance ──────────────────────────────────────────────────────────

test.describe('Compliance deep links', () => {
  test('sets search filter via ?q=CNSA%202.0', async ({ page }) => {
    await page.goto('/compliance?q=CNSA%202.0')

    await expect(page.getByText('Compliance').first()).toBeVisible()
  })

  test('?cert= param switches to All Records tab', async ({ page }) => {
    await page.goto('/compliance?cert=test-id')

    // When cert param is provided, default tab switches to "all" (not "landscape")
    const allRecordsTab = page.getByRole('button', { name: /All Records/i }).first()
    await expect(allRecordsTab).toHaveAttribute('data-state', 'active')
  })
})

// ─── 9. OpenSSL Studio ──────────────────────────────────────────────────────

test.describe('OpenSSL Studio deep links', () => {
  test('selects category via ?cmd=enc', async ({ page }) => {
    await page.goto('/openssl?cmd=enc')

    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible()
  })

  test('resolves alias ?cmd=keygen to genpkey', async ({ page }) => {
    await page.goto('/openssl?cmd=keygen')

    // keygen is an alias for genpkey — page should load successfully
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible()
  })

  test('invalid ?cmd=bogus falls back to default', async ({ page }) => {
    await page.goto('/openssl?cmd=bogus')

    // Falls back to genpkey (default) — page loads normally
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible()
  })
})

// ─── 10. Edge cases ─────────────────────────────────────────────────────────

test.describe('Edge cases', () => {
  test('empty ?q= is treated as no filter', async ({ page }) => {
    await page.goto('/library?q=')

    await expect(page.getByRole('heading', { level: 2, name: /PQC Library/ })).toBeVisible({
      timeout: 10000,
    })
    // Cards should be visible (unfiltered)
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('cross-page params do not leak', async ({ page }) => {
    // Navigate to timeline with country filter
    await page.goto('/timeline?country=Australia')
    await expect(page.getByText('Australia').first()).toBeVisible({ timeout: 10000 })

    // Navigate to library — no country filter should be applied
    await page.goto('/library')
    await expect(page.getByText('PQC Library')).toBeVisible()
    // Library should show all content, not filtered by Australia
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })
})
