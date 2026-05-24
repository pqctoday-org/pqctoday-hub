// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Learn hub — NICE Framework view.
 *
 * Covers: toggle rendering, CA section visibility, Work Role selection,
 * persona pre-selection, URL persistence (?view=nice / ?role=), and
 * clearing ?view= when switching away.
 */

type PersonaId = 'executive' | 'developer' | 'architect' | 'researcher' | 'ops' | 'curious'

const seedPersona = async (page: Page, persona: PersonaId | null) => {
  await page.addInitScript(
    ([p]) => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      if (p !== null) {
        localStorage.setItem(
          'pqc-learning-persona',
          JSON.stringify({
            state: {
              selectedPersona: p,
              selectedRegion: 'global',
              experienceLevel: p === 'curious' ? 'curious' : null,
              viewAccess: 'preview',
              hasSeenPersonaPicker: true,
              suppressSuggestion: true,
              niceTier: 'awareness',
              niceTierOverridden: false,
              curiousGuideDismissed: true,
            },
            version: 7,
          })
        )
      }
      localStorage.setItem(
        'pqc-learn-storage',
        JSON.stringify({
          state: { showEverything: false, phaseExpansion: {}, researcherSortOverride: null },
          version: 1,
        })
      )
    },
    [persona]
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for the Learn hub h1 to settle (lazy chunk may take a few seconds). */
const waitForLearnHub = (page: Page) =>
  expect(page.getByRole('heading', { level: 1, name: /Learning Workshops/i })).toBeVisible({
    timeout: 25000,
  })

/** Switch to NICE view via the toggle button. */
const switchToNiceView = async (page: Page) => {
  await page.getByRole('radio', { name: 'NICE' }).click()
  // At least one CA badge must be visible before assertions proceed
  await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 8000 })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Learn — NICE Framework view', () => {
  test('NICE toggle renders and all 8 CA sections are present', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')
    await waitForLearnHub(page)

    await switchToNiceView(page)

    // All 8 Competency Area codes visible
    for (const ca of [
      'CA-CRYPTO',
      'CA-SYSARCH',
      'CA-SECPROG',
      'CA-NETDEF',
      'CA-IDENT',
      'CA-DATASEC',
      'CA-RISK',
      'CA-GOVCOMP',
    ]) {
      await expect(page.getByText(ca).first()).toBeVisible()
    }

    // Section titles also visible
    await expect(page.getByText('Cryptography').first()).toBeVisible()
    await expect(page.getByText('Risk Management').first()).toBeVisible()
  })

  test('selecting a Work Role shows the NIST code and "Core for" badge', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')
    await waitForLearnHub(page)
    await switchToNiceView(page)

    // Click "Security Architect" role chip (desktop chip strip, hidden on mobile)
    await page
      .getByRole('radio', { name: /Security Architect/ })
      .first()
      .click()

    // NIST Work Role code appears in the role description strip
    await expect(page.getByText('SP-ARC-001')).toBeVisible()

    // "Core for Security Architect" badge appears on at least one CA section
    await expect(page.getByText(/Core for Security Architect/).first()).toBeVisible()
  })

  test('deselecting a role by clicking it again returns to All Roles', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')
    await waitForLearnHub(page)
    await switchToNiceView(page)

    const architectChip = page.getByRole('radio', { name: /Security Architect/ }).first()
    await architectChip.click()
    await expect(page.getByText('SP-ARC-001')).toBeVisible()

    // Click again to deselect
    await architectChip.click()
    await expect(page.getByText('SP-ARC-001')).not.toBeVisible()
  })

  test('?view=nice deep-link opens NICE view directly without clicking toggle', async ({
    page,
  }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice')

    await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })
    // NICE toggle is in "checked" state
    await expect(page.getByRole('radio', { name: 'NICE' })).toHaveAttribute('aria-checked', 'true')
  })

  test('?view=nice&role=security-architect pre-selects Security Architect', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice&role=security-architect')

    // Role description strip with NIST code visible immediately
    await expect(page.getByText('SP-ARC-001')).toBeVisible({ timeout: 25000 })
  })

  test('?view=nice&role=risk-manager pre-selects Risk Manager', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice&role=risk-manager')

    await expect(page.getByText('SP-RSK-001')).toBeVisible({ timeout: 25000 })
  })

  test('architect persona auto-selects Security Architect role on NICE view mount', async ({
    page,
  }) => {
    await seedPersona(page, 'architect')
    await page.goto('/learn')
    await waitForLearnHub(page)
    await switchToNiceView(page)

    // SP-ARC-001 is visible without any manual chip click
    await expect(page.getByText('SP-ARC-001')).toBeVisible()
  })

  test('developer persona auto-selects Security Developer', async ({ page }) => {
    await seedPersona(page, 'developer')
    await page.goto('/learn')
    await waitForLearnHub(page)
    await switchToNiceView(page)

    await expect(page.getByText('SP-ARC-002')).toBeVisible()
  })

  test('selecting a role updates ?role= in URL', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn')
    await waitForLearnHub(page)
    await switchToNiceView(page)

    await page
      .getByRole('radio', { name: /Security Architect/ })
      .first()
      .click()
    await expect(page).toHaveURL(/role=security-architect/)
  })

  test('switching from NICE to Stack clears ?view= from URL', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice')
    await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })

    await page.getByRole('radio', { name: 'Stack' }).click()

    await expect(page).not.toHaveURL(/view=nice/)
  })

  test('switching from NICE to Cards clears ?view= from URL', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice')
    await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })

    await page.getByRole('radio', { name: 'Cards' }).click()

    await expect(page).not.toHaveURL(/view=nice/)
    // Cards grid should appear
    await expect(page.locator('.grid').first()).toBeVisible({ timeout: 8000 })
  })

  test('module chips in CA sections are clickable and navigate to module', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice')
    await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })

    // Click the first module chip in the Cryptography section
    // PQC 101 is in CA-CRYPTO at Awareness tier
    const pqc101Chip = page.getByRole('button', { name: /PQC 101/ }).first()
    await expect(pqc101Chip).toBeVisible()
    await pqc101Chip.click()

    // Should navigate to the module page
    await expect(page).toHaveURL(/\/learn\/pqc-101/)
  })
})
