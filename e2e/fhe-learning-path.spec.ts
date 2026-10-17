// SPDX-License-Identifier: AGPL-3.0-only
/**
 * FHE foundations / advanced-custody journey at real browser layout sizes.
 * Unit coverage owns the path matrix; this spec guards the integrated path
 * switch, phone overflow and the interactive SVG/button accessibility seam.
 */
import { injectAxe, getViolations } from 'axe-playwright'
import { test, expect } from './fixtures/blockAnalytics'
import type { Page } from '@playwright/test'

type Persona = 'researcher' | 'curious'

async function seedPersona(page: Page, persona: Persona) {
  await page.addInitScript((selectedPersona) => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 999 }, version: 1 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona,
          hasSeenPersonaPicker: true,
          selectedRegion: 'global',
          experienceLevel: selectedPersona === 'curious' ? 'beginner' : 'expert',
          viewAccess: 'unlocked',
          suppressSuggestion: true,
          curiousGuideDismissed: true,
        },
        version: 11,
      })
    )
  }, persona)
}

test('researcher can opt into advanced custody on a phone without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedPersona(page, 'researcher')
  await page.goto('/learn/homomorphic-encryption?tab=workshop')

  const advancedPath = page.getByRole('button', { name: /^Advanced HSM custody ·/ })
  await expect(advancedPath).toBeVisible()
  await expect(page.getByRole('button', { name: /FHE foundations/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByRole('heading', { name: 'Step 1: FHE concepts lab' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Step 2: Advanced HSM custody lab/ })).toHaveCount(
    0
  )

  await advancedPath.click()
  await expect(advancedPath).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /^Step 2: Advanced HSM custody lab/ }).click()
  await expect(page.getByRole('button', { name: /CKKS single-HSM custody/ })).toBeVisible()
  await expect(page.getByText('What your choices mean')).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)

  await injectAxe(page)
  const violations = await getViolations(page, undefined, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual(
    []
  )
})

test('curious role stays in its general summary when given an advanced-path deep link', async ({
  page,
}) => {
  await seedPersona(page, 'curious')
  await page.goto('/learn/homomorphic-encryption?path=hsm-custody')

  await expect(page.getByRole('heading', { name: 'In Simple Terms' })).toBeVisible()
  await expect(page.getByText(/HSM custody material is intentionally left out/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Advanced HSM custody/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'All sections' })).toHaveCount(0)
})

test('references follow the selected path and no empty products tab is offered', async ({
  page,
}) => {
  await seedPersona(page, 'researcher')
  await page.goto('/learn/homomorphic-encryption?tab=references')

  await expect(page.getByRole('tab', { name: 'References' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.getByText('Cited in this module')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Tools & Products' })).toHaveCount(0)
  await expect(page.getByText(/practical CPAD security/)).toHaveCount(0)
  await expect(page.getByText('Threshold (Fully) Homomorphic Encryption')).toHaveCount(0)

  await page.getByRole('button', { name: /^Advanced HSM custody ·/ }).click()
  await expect(page.getByText(/practical CPAD security/)).toBeVisible()
  await expect(page.getByText('Threshold (Fully) Homomorphic Encryption')).toBeVisible()

  await injectAxe(page)
  const violations = await getViolations(page, undefined, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual(
    []
  )
})
