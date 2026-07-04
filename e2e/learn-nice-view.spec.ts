// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Learn hub — NICE / Workforce view.
 *
 * The /learn page was redesigned (commit 2add4c82): it now opens on a "My Path"
 * vs "Browse all" mode switch, and the NICE lens lives inside Browse as the
 * "Workforce view" toggle. The underlying NiceView component (CA sections, work
 * roles, NIST codes, Core-for badges, ?role= handling, persona auto-select) is
 * UNCHANGED — only how you reach it moved. The legacy `?view=nice` deep-link
 * still opens it directly (LearnRedesignView), which is the most robust reach
 * for these tests. The old "Stack"/"Cards" view-mode radios no longer exist;
 * the tests that exercised them are re-pointed at the redesign's equivalents.
 *
 * Covers: workforce lens rendering, CA section visibility, Work Role selection,
 * persona pre-selection, URL persistence (?view=nice / ?role=), and returning
 * to the catalog by toggling the lens off.
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

/** Open the NICE/Workforce lens directly via the legacy deep-link and wait for
 * the competency-area content to render (lazy chunk can take a few seconds). */
const openNiceView = async (page: Page) => {
  await page.goto('/learn?view=nice')
  await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Learn — NICE / Workforce view', () => {
  test('the Workforce lens shows all 8 CA sections', async ({ page }) => {
    await seedPersona(page, null)
    await openNiceView(page)

    // The lens toggle is in the pressed state when the lens is open.
    await expect(page.getByRole('button', { name: /Workforce view/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )

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
    // The 8 CA codes above are a complete proof the sections rendered; the
    // section-title text (e.g. "Cryptography") also exists but its first DOM
    // match is a responsive/hidden variant, so it isn't asserted for visibility.
  })

  test('selecting a Work Role shows the NIST code and "Core for" badge', async ({ page }) => {
    await seedPersona(page, null)
    await openNiceView(page)

    // Click "Security Architect" role chip (desktop chip strip, hidden on mobile)
    await page
      .getByRole('radio', { name: /Security Architect/ })
      .first()
      .click()

    // NIST Work Role code appears in the role description strip
    await expect(page.getByText('DD-WRL-001')).toBeVisible()

    // "Core for Security Architect" badge appears on at least one CA section
    await expect(page.getByText(/Core for Security Architect/).first()).toBeVisible()
  })

  test('deselecting a role by clicking it again returns to All Roles', async ({ page }) => {
    await seedPersona(page, null)
    await openNiceView(page)

    const architectChip = page.getByRole('radio', { name: /Security Architect/ }).first()
    await architectChip.click()
    await expect(page.getByText('DD-WRL-001')).toBeVisible()

    // Click again to deselect
    await architectChip.click()
    await expect(page.getByText('DD-WRL-001')).not.toBeVisible()
  })

  test('?view=nice deep-link opens the Workforce lens directly', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice')

    await expect(page.getByText('CA-CRYPTO').first()).toBeVisible({ timeout: 25000 })
    // The Workforce lens toggle is in "pressed" state
    await expect(page.getByRole('button', { name: /Workforce view/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('?view=nice&role=security-architect pre-selects Security Architect', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice&role=security-architect')

    // Role description strip with NIST code visible immediately
    await expect(page.getByText('DD-WRL-001')).toBeVisible({ timeout: 25000 })
  })

  test('?view=nice&role=risk-manager pre-selects Risk Manager', async ({ page }) => {
    await seedPersona(page, null)
    await page.goto('/learn?view=nice&role=risk-manager')

    await expect(page.getByText('OG-WRL-013')).toBeVisible({ timeout: 25000 })
  })

  test('architect persona auto-selects Security Architect role on the Workforce lens', async ({
    page,
  }) => {
    await seedPersona(page, 'architect')
    await openNiceView(page)

    // DD-WRL-001 is visible without any manual chip click
    await expect(page.getByText('DD-WRL-001')).toBeVisible()
  })

  test('developer persona auto-selects Security Developer', async ({ page }) => {
    await seedPersona(page, 'developer')
    await openNiceView(page)

    await expect(page.getByText('DD-WRL-003')).toBeVisible()
  })

  test('selecting a role updates ?role= in URL', async ({ page }) => {
    await seedPersona(page, null)
    await openNiceView(page)

    await page
      .getByRole('radio', { name: /Security Architect/ })
      .first()
      .click()
    await expect(page).toHaveURL(/role=security-architect/)
  })

  test('toggling the Workforce lens off returns to the module catalog', async ({ page }) => {
    // Replaces the old "NICE → Stack" test: the Stack/Cards view modes were
    // removed in the redesign; the equivalent is turning the lens off to return
    // to the normal Browse catalog grid.
    await seedPersona(page, null)
    await openNiceView(page)

    await page.getByRole('button', { name: /Workforce view/i }).click()

    // Lens is now off (aria-pressed false). The lens-only work-role radios are
    // gone (CA-CRYPTO text is NOT a reliable signal — it also appears as a
    // competency tag on catalog module cards), and the Browse catalog's search
    // filter is present.
    await expect(page.getByRole('button', { name: /Workforce view/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    await expect(page.getByRole('radio', { name: /Security Architect/ })).toHaveCount(0, {
      timeout: 8000,
    })
    await expect(page.getByRole('textbox', { name: /Search modules/i })).toBeVisible({
      timeout: 8000,
    })
  })

  test('switching to My Path leaves the Workforce lens', async ({ page }) => {
    // Replaces the old "NICE → Cards" test. The mode switch to My Path is the
    // redesign's way of leaving Browse (and its Workforce lens).
    await seedPersona(page, 'developer')
    await openNiceView(page)

    await page.getByRole('button', { name: /^My Path/ }).click()

    // My Path is now active; the CA competency-area content is gone.
    await expect(page.getByText('CA-CRYPTO')).toHaveCount(0, { timeout: 8000 })
  })

  test('module chips in CA sections are clickable and navigate to module', async ({ page }) => {
    await seedPersona(page, null)
    await openNiceView(page)

    // Click the first module chip in the Cryptography section
    // PQC 101 is in CA-CRYPTO at Awareness tier
    const pqc101Chip = page.getByRole('button', { name: /PQC 101/ }).first()
    await expect(pqc101Chip).toBeVisible()
    await pqc101Chip.click()

    // Should navigate to the module page
    await expect(page).toHaveURL(/\/learn\/pqc-101/)
  })
})
