// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

test('draft, review and restore contract clauses at desktop and phone widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })

  const revisedPenalty =
    'If the named product version misses its agreed PQC test by the deadline, pause deployment, allow 60 days to remediate, then review documented costs with counsel.'
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await page.goto('/business/tools/contract-clause')
    await expect(
      page.getByText(/Not legal advice\./).first(),
      'show the legal review boundary before drafting'
    ).toBeVisible()

    const choose = async (label: string, option: RegExp) => {
      await page.getByRole('button', { name: label, exact: true }).click()
      await page.getByRole('option', { name: option }).click()
    }
    await choose('PQC Compliance Deadline Year', /^2030/)
    await choose('Required FIPS 140-3 Security Level', /^Level 3/)
    await page.getByRole('checkbox', { name: /CMVP Certificate Number/ }).check()
    await page.getByRole('checkbox', { name: /Validated Module Name and Version/ }).check()
    await choose('Delivery Frequency', /Per Major Release/)
    await choose('Required Format', /CycloneDX 1\.7/)
    await choose('Minimum Notice Period', /90 days/)
    await choose('Audit Frequency', /^Annual/)

    const penalty = page.getByRole('textbox', { name: 'Non-Compliance Penalty' })
    await penalty.fill(revisedPenalty)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(page.getByText(/Draft.*For Legal Review/)).toBeVisible()
    await expect(page.getByText(/2030/).last()).toBeVisible()
    await expect(page.getByText(revisedPenalty)).toBeVisible()
    await expect(page.getByText(/Consult legal counsel before incorporating/)).toBeVisible()

    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
      `${width}px: ${JSON.stringify(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })))}`
    ).toEqual([])

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(dimensions.content, `contract clause at ${width}px`).toBeLessThanOrEqual(
      dimensions.viewport
    )

    await page.reload()
    const restored = page.getByRole('textbox', { name: 'Non-Compliance Penalty' })
    await expect(restored).toHaveValue(revisedPenalty)
  }
})
