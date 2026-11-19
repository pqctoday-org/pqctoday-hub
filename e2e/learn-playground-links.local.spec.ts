// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { TOOLS_BY_MODULE_ID, TOOL_TITLE_BY_ID } from '../src/data/moduleToolLinks'

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

for (const [module, tools] of TOOLS_BY_MODULE_ID) {
  test(`Learn shows each named Playground tool before completion for ${module}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const modulePath = `/learn/${module}`
    await page.goto(modulePath)
    const navigation = page.getByRole('navigation', { name: 'Playground tools for this module' })
    await expect(navigation).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Module complete — keep your momentum')).toHaveCount(0)
    for (const tool of tools) {
      const toolLink = navigation.getByRole('link', {
        name: TOOL_TITLE_BY_ID.get(tool),
        exact: true,
      })
      await expect(toolLink).toHaveAttribute('href', `/playground/${tool}`)
    }
    await navigation
      .getByRole('link', { name: TOOL_TITLE_BY_ID.get(tools[0]), exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/playground/${tools[0]}(?:[?#].*)?$`))
    const reciprocal = page.getByRole('link', { name: /^Learn with / })
    await expect(reciprocal).toHaveAttribute('href', new RegExp(`^${modulePath}(?:[?#].*)?$`))
    await reciprocal.click()
    await expect(page).toHaveURL(new RegExp(`${modulePath}(?:[?#].*)?$`))
    await expect(navigation).toBeVisible()
  })
}

const mobileSamples = [
  ['tls-basics', 'tls-simulator'],
  ['email-signing', 'email-signing'],
  ['api-security-jwt', 'api-security-jwt'],
  ['stateful-signatures', 'lms-hss'],
]
for (const [module, tool] of mobileSamples) {
  test(`Learn phone view keeps its guided workshop and names its tool for ${module}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/learn/${module}`)
    await expect(page.getByRole('tab', { name: 'Workshop', exact: true })).toBeVisible()
    const practice = page.getByRole('link', {
      name: `Practice on your phone ${TOOL_TITLE_BY_ID.get(tool)}`,
      exact: true,
    })
    await expect(practice).toBeVisible()
    await expect(practice).toHaveAttribute('href', `/playground/${tool}`)
    await practice.click()
    await expect(page).toHaveURL(new RegExp(`/playground/${tool}(?:[?#].*)?$`))
    const reciprocal = page.getByRole('link', { name: /^Learn with / })
    await expect(reciprocal).toHaveAttribute('href', new RegExp(`^/learn/${module}(?:[?#].*)?$`))
    await reciprocal.click()
    await expect(page).toHaveURL(new RegExp(`/learn/${module}(?:[?#].*)?$`))
    await expect(page.getByRole('tab', { name: 'Workshop', exact: true })).toBeVisible()
  })
}
