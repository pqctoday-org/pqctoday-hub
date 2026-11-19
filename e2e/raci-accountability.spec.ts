// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import type { Page } from '@playwright/test'
import { getViolations, injectAxe } from 'axe-playwright'

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

async function download(page: Page, format: '.md' | '.csv') {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: format, exact: true }).click()
  let content = ''
  for await (const chunk of await (await pending).createReadStream()) content += chunk.toString()
  return content
}

for (const width of [1280, 390]) {
  test(`RACI exports duplicate, missing and resolved ownership at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business/tools/raci-builder')
    const ciso = page.getByRole('button', { name: /Crypto Inventory — CISO:/ })
    const cto = page.getByRole('button', { name: /Crypto Inventory — CTO:/ })
    await expect(ciso).toHaveAccessibleName(/CISO: A/)
    await cto.click({ clickCount: 2 })
    await expect(page.getByText('Multiple Accountable assignments', { exact: true })).toBeVisible()
    expect(await download(page, '.md')).toMatch(
      /Crypto Inventory.*Conflicting accountable roles \(CISO, CTO\)/
    )

    await ciso.click()
    await cto.click()
    await expect(page.getByText('Missing Accountable assignment', { exact: true })).toBeVisible()
    expect(await download(page, '.csv')).toMatch(/Crypto Inventory[^\n]*Missing accountable role/)

    for (let clicks = 0; clicks < 4; clicks++) await cto.click()
    await expect(page.getByText('Missing Accountable assignment', { exact: true })).toHaveCount(0)
    expect(await download(page, '.md')).toMatch(/Crypto Inventory.*One accountable role \(CTO\)/)
  })

  test(`a disputed owner does not populate policy approvals at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/pqc-governance?tab=workshop&step=0')
    await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
    const cto = page.getByRole('button', { name: /Crypto Inventory — CTO:/ })
    await cto.click({ clickCount: 2 })
    await expect(page.getByText('Multiple Accountable assignments', { exact: true })).toBeVisible()
    const steps = page.getByRole('navigation', { name: 'Workshop steps', exact: true })
    await steps.getByRole('button', { name: /Policy Generator/ }).click()
    const owner = page.getByLabel('Policy Owner (role or name)', { exact: true })
    const approver = page.getByLabel('Approver / Sign-off', { exact: true })
    await expect(owner).toHaveValue('')
    await expect(approver).toHaveValue('')

    await steps.getByRole('button', { name: /RACI Matrix/ }).click()
    await page.getByRole('button', { name: /Crypto Inventory — CISO:/ }).click()
    await steps.getByRole('button', { name: /Policy Generator/ }).click()
    await expect(owner).toHaveValue('CTO')
    await expect(approver).toHaveValue('')

    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      `serious/critical WCAG 2 A/AA violations at ${width}px`
    ).toEqual([])
  })
}
