// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const tools = [
  ['roi-calculator', 'ROI Calculator'],
  ['cost-of-inaction', 'Cost of Inaction Analyzer'],
  ['risk-treatment-plan', 'Risk Heatmap & Treatment Plan'],
  ['compliance-timeline', 'Compliance Timeline Builder'],
  ['contract-clause', 'Contract Clause Generator'],
  ['stakeholder-comms', 'Stakeholder Comms Planner'],
  ['kpi-tracker', 'KPI Tracker Template'],
  ['deployment-playbook', 'Deployment Playbook'],
  ['hybrid-transition-planner', 'Hybrid Transition Planner'],
  ['mti-negotiator', 'MTI Negotiator'],
  ['management-tools-audit', 'Management Tools Audit'],
  ['crypto-cbom-builder', 'Crypto BOM (CBOM) Builder'],
  ['crypto-vulnerability-watch', 'Crypto Vulnerability Watch'],
  ['program-charter', 'Program Charter'],
  ['initial-scoping', 'Initial Scoping Assessment'],
  ['skills-team-plan', 'Skills & Team Plan'],
  ['refresh-cycle-alignment', 'Refresh-Cycle Alignment'],
  ['migration-verification', 'Migration Verification & Closure'],
] as const

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  for (const [id, query] of tools) {
    test(`${query} returns to its Business search at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const filter = id === 'mti-negotiator' ? '?audience=architect' : ''
      await page.goto(`/business/tools${filter}`)
      const search = page.getByLabel('Search business tools')
      await search.fill(query)
      const marker = `[data-business-result="${id}"]`
      const opener = page.locator(width === 390 ? `${marker} [data-business-open]` : marker)
      await expect(opener).toBeVisible()
      await opener.press('Enter')
      if (width === 390) {
        await page.getByRole('dialog').getByRole('link', { name: 'Open tool' }).press('Enter')
      }
      await expect(page).toHaveURL(new RegExp(`/business/tools/${id}$`))
      await page.reload()
      await page.getByRole('button', { name: 'All Tools' }).press('Enter')
      await expect(search).toHaveValue(query)
      await expect(opener).toBeFocused()
      const restored = new URL(page.url()).searchParams
      expect(restored.get('q')).toBe(query)
      if (filter) expect(restored.get('audience')).toBe('architect')
    })
  }
}

test('phone applies and clears a shared audience filter without losing the query', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/business/tools?audience=developer&q=Hybrid+Transition+Planner')
  await expect(page.getByText('Audience: developer')).toBeVisible()
  await expect(page.getByText('No tools match these filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear shared filters' }).press('Space')
  const search = page.getByLabel('Search business tools')
  await expect(search).toBeFocused()
  await expect(search).toHaveValue('Hybrid Transition Planner')
  await expect(page.locator('[data-business-result="hybrid-transition-planner"]')).toBeVisible()
})

for (const width of [1280, 390]) {
  test(`Command Center can find and run a planning tool, then return at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business')
    await page.getByRole('link', { name: /Browse all .* planning tools/i }).press('Enter')
    const search = page.getByLabel('Search business tools')
    await search.fill('Cost of Inaction')
    const marker = '[data-business-result="cost-of-inaction"]'
    const opener = page.locator(width === 390 ? `${marker} [data-business-open]` : marker)
    await opener.press('Enter')
    if (width === 390) {
      await page.getByRole('dialog').getByRole('link', { name: 'Open tool' }).press('Enter')
    }
    const probability = page.getByRole('slider', { name: /annual breach probability/i })
    await probability.press('Home')
    await expect(probability).toHaveValue('0')
    await expect(page.getByText(/expected breach loss is \$0 in both scenarios/i)).toBeVisible()
    await page.getByRole('button', { name: 'All Tools' }).press('Enter')
    await expect(search).toHaveValue('Cost of Inaction')
    await expect(opener).toBeFocused()
  })
}
